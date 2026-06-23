// Приём метрик от агента. POST /functions/v1/agent-ingest
// Заголовок X-Agent-Token обязателен. Сохраняет метрики и обновляет last_seen_at.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  const token = req.headers.get("X-Agent-Token") || req.headers.get("x-agent-token");
  if (!token) {
    return new Response(JSON.stringify({ error: "Missing X-Agent-Token" }), {
      status: 401,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: agent, error: authErr } = await supabase
      .from("agent_registrations")
      .select("id, agent_id, is_active")
      .eq("token", token)
      .maybeSingle();

    if (authErr || !agent || !agent.is_active) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const now = new Date().toISOString();

    const metric = {
      agent_id: agent.agent_id,
      collected_at: body.collected_at ?? now,
      cpu_usage_percent: body.cpu_usage_percent ?? null,
      ram_used_mb: body.ram_used_mb ?? null,
      ram_total_mb: body.ram_total_mb ?? null,
      disk_metrics: body.disk_metrics ?? null,
      network_metrics: body.network_metrics ?? null,
      temperatures: body.temperatures ?? null,
      services: body.services ?? null,
      uptime_seconds: body.uptime_seconds ?? null,
      load_avg: body.load_avg ?? null,
    };

    const { error: insErr } = await supabase.from("agent_metrics").insert(metric);
    if (insErr) throw insErr;

    await supabase
      .from("agent_registrations")
      .update({ last_seen_at: now })
      .eq("agent_id", agent.agent_id);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }
}