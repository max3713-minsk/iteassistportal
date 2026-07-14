// Регистрация агента AP Agent. POST /functions/v1/agent-register
// Принимает данные хоста, создаёт/обновляет запись в agent_registrations и
// возвращает токен для последующей аутентификации (X-Agent-Token).
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function randomToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function randomAgentId(): string {
  return "agent_" + crypto.randomUUID().replace(/-/g, "").slice(0, 16);
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    const agentId: string = body.agent_id || randomAgentId();

    const payload = {
      agent_id: agentId,
      hostname: body.hostname ?? null,
      os_type: body.os_type ?? null,
      os_version: body.os_version ?? null,
      arch: body.arch ?? null,
      serial_number: body.serial_number ?? null,
      ip_addresses: body.ip_addresses ?? [],
      mac_addresses: body.mac_addresses ?? [],
      cpu_model: body.cpu_model ?? null,
      cpu_cores: body.cpu_cores ?? null,
      ram_total_mb: body.ram_total_mb ?? null,
      agent_version: body.agent_version ?? null,
      last_seen_at: new Date().toISOString(),
      auto_registered: true,
    };

    // Try update existing
    const { data: existing } = await supabase
      .from("agent_registrations")
      .select("id, token")
      .eq("agent_id", agentId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("agent_registrations")
        .update(payload)
        .eq("agent_id", agentId);
      if (error) throw error;
      return new Response(
        JSON.stringify({ agent_id: agentId, token: existing.token, registered: false }),
        { headers: { ...corsHeaders, "content-type": "application/json" } },
      );
    }

    const token = randomToken();
    const { error } = await supabase
      .from("agent_registrations")
      .insert({ ...payload, token, registered_at: new Date().toISOString() });
    if (error) throw error;

    return new Response(
      JSON.stringify({ agent_id: agentId, token, registered: true }),
      { headers: { ...corsHeaders, "content-type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }
}