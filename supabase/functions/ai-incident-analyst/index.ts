// AI-аналитик инцидентов. Использует Lovable AI Gateway (LOVABLE_API_KEY).
// Ключ ANTHROPIC_API_KEY не требуется.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } },
    );
    const { data: u } = await userClient.auth.getUser();
    if (!u?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Только staff
    const { data: roleRow } = await admin
      .from("user_roles").select("role").eq("user_id", u.user.id)
      .in("role", ["admin", "engineer"]).maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Только инженеры и админы" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const ticketId = body?.ticket_id;
    const force = body?.force === true;
    if (!ticketId || typeof ticketId !== "string") {
      return new Response(JSON.stringify({ error: "ticket_id обязателен" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Кеш
    if (!force) {
      const { data: cached } = await admin
        .from("ticket_ai_analyses").select("analysis,model,updated_at")
        .eq("ticket_id", ticketId).maybeSingle();
      if (cached) {
        return new Response(JSON.stringify({ ...cached.analysis, _cached: true, _model: cached.model }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const { data: ticket } = await admin
      .from("tickets")
      .select("*, equipment:equipment_id(name, model, status), sites:site_id(name)")
      .eq("id", ticketId).single();
    if (!ticket) {
      return new Response(JSON.stringify({ error: "Заявка не найдена" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: similar } = await admin
      .from("tickets")
      .select("title, description, status, resolved_at, incident_category")
      .eq("product_code", ticket.product_code)
      .eq("request_type", "incident")
      .neq("id", ticketId)
      .in("status", ["resolved", "closed"])
      .order("created_at", { ascending: false }).limit(5);

    const { data: lastProtocol } = await admin
      .from("maintenance_protocols")
      .select("period_start, status, notes")
      .eq("site_id", ticket.site_id)
      .order("created_at", { ascending: false }).limit(1).maybeSingle();

    const prompt = `Ты — опытный инженер по сопровождению ИТ-инфраструктуры энергетического предприятия.

Поступила заявка:
- Заголовок: ${ticket.title}
- Описание: ${ticket.description || "не указано"}
- Продукт: ${ticket.product_code || "—"} (${ticket.subcategory || ""})
- Категория инцидента: ${ticket.incident_category || "—"}
- Оборудование: ${ticket.equipment?.name || "не указано"} ${ticket.equipment?.model || ""}, статус: ${ticket.equipment?.status || "—"}
- ЦОД: ${ticket.sites?.name || "—"}
- Последний протокол ТО: ${lastProtocol ? `${lastProtocol.period_start}, статус: ${lastProtocol.status}` : "нет данных"}

Похожие закрытые инциденты:
${(similar || []).map(t => `- "${t.title}": ${(t.description || "—").slice(0, 120)}`).join("\n") || "нет похожих"}

Дай структурированный анализ строго в JSON без markdown-обёртки:
{
  "probable_causes": [
    {"rank":1,"cause":"...","probability":"высокая|средняя|низкая","rationale":"..."},
    {"rank":2,"cause":"...","probability":"...","rationale":"..."},
    {"rank":3,"cause":"...","probability":"...","rationale":"..."}
  ],
  "first_steps": ["шаг 1","шаг 2","шаг 3","шаг 4","шаг 5"],
  "estimated_minutes": 30,
  "escalation_needed": false,
  "escalation_reason": null,
  "similar_pattern": "краткое описание паттерна или null"
}`;

    const model = "google/gemini-2.5-flash";
    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "Отвечай ТОЛЬКО валидным JSON без markdown." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (aiResp.status === 429) {
      return new Response(JSON.stringify({ error: "Превышен лимит запросов AI. Попробуйте позже." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (aiResp.status === 402) {
      return new Response(JSON.stringify({ error: "Закончился AI-кредит. Пополните в Lovable." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!aiResp.ok) {
      const txt = await aiResp.text();
      return new Response(JSON.stringify({ error: "AI gateway error", detail: txt.slice(0, 500) }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiResp.json();
    const text = aiJson?.choices?.[0]?.message?.content || "{}";
    let analysis: any;
    try {
      const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
      analysis = JSON.parse(cleaned);
    } catch {
      analysis = { error: "Не удалось разобрать ответ AI", raw: text };
    }

    await admin.from("ticket_ai_analyses").upsert({
      ticket_id: ticketId,
      analysis,
      model,
      updated_at: new Date().toISOString(),
    }, { onConflict: "ticket_id" });

    return new Response(JSON.stringify({ ...analysis, _cached: false, _model: model }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}
