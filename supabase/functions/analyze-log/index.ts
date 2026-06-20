import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_CHARS = 60000; // ~60KB лога — отсекаем хвостом

function trimLog(text: string): string {
  if (text.length <= MAX_CHARS) return text;
  // оставим начало (5К) + хвост — обычно самое важное в конце
  return text.slice(0, 5000) + "\n…[обрезано]…\n" + text.slice(text.length - (MAX_CHARS - 5000));
}

const SYSTEM_PROMPT = `Ты — инженер технической поддержки ЦОД. Анализируешь лог-файл оборудования.
Верни строго JSON со схемой:
{
  "summary": "сводное резюме на русском (3-6 предложений): ключевые события, аномалии",
  "recommendations": ["рекомендация 1", "рекомендация 2"],
  "severity_counts": { "info": 0, "warning": 0, "error": 0, "critical": 0 },
  "entries": [
    { "ts": "опц. время если есть", "severity": "info|warning|error|critical", "original": "исходная строка", "translated": "перевод на русский, если иначе" }
  ]
}
Правила:
- Не более 80 самых важных entries (приоритет: critical → error → warning → info-аномалии). Рядовые INFO можно пропустить.
- severity выбирай ОДНО из: info, warning, error, critical.
- Если строка уже на русском — translated = original.
- Никаких markdown, только валидный JSON.`;

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await sb.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const text: string = body.text ?? "";
    const filename: string | undefined = body.filename;
    if (!text.trim()) {
      return new Response(JSON.stringify({ error: "text is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const trimmed = trimLog(text);
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Файл: ${filename ?? "unknown"}\n\n${trimmed}` },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (aiRes.status === 429) {
      return new Response(JSON.stringify({ error: "Превышен лимит запросов к ИИ. Попробуйте позже." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (aiRes.status === 402) {
      return new Response(JSON.stringify({ error: "Закончились кредиты ИИ. Пополните рабочее пространство." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!aiRes.ok) {
      const t = await aiRes.text();
      return new Response(JSON.stringify({ error: `AI error: ${aiRes.status} ${t.slice(0, 300)}` }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiRes.json();
    const raw = data?.choices?.[0]?.message?.content ?? "{}";
    let parsed: any = {};
    try { parsed = JSON.parse(raw); } catch {
      // Попытка вытащить JSON из markdown
      const m = raw.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : { summary: raw, entries: [], severity_counts: {}, recommendations: [] };
    }

    return new Response(JSON.stringify({ analysis: parsed, truncated: text.length > MAX_CHARS }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}
