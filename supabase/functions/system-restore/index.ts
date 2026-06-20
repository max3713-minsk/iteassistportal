import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Restore order: parents before children.
const RESTORE_ORDER = [
  "organizations",
  "sites",
  "equipment_categories",
  "equipment",
  "contracts",
  "zabbix_connections",
  "monitored_hosts",
  "monitoring_host_links",
  "tickets",
  "ticket_comments",
  "ticket_status_history",
  "maintenance_tasks",
  "maintenance_schedules",
  "maintenance_protocols",
  "protocol_items",
  "protocol_templates",
  "documents",
  "infrastructure_maps",
  "audit_logs",
  "support_schemes",
  "support_scheme_lines",
  "alert_thresholds",
  "item_aliases",
  "metric_translations",
  "tz_requirements",
  "tz_coverage",
  "holidays",
];

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supaUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } },
    );
    const { data: u } = await supaUser.auth.getUser();
    if (!u?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: roleRow } = await admin
      .from("user_roles").select("role").eq("user_id", u.user.id).eq("role", "admin").maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Только администратор" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const payload = body?.payload;
    const mode: "merge" | "replace" = body?.mode === "replace" ? "replace" : "merge";
    if (!payload?.tables || typeof payload.tables !== "object") {
      return new Response(JSON.stringify({ error: "Неверный формат файла" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: Record<string, { inserted: number; errors: string[] }> = {};

    if (mode === "replace") {
      // Delete in reverse order
      for (const t of [...RESTORE_ORDER].reverse()) {
        if (!payload.tables[t]) continue;
        await admin.from(t).delete().not("id", "is", null);
      }
    }

    for (const t of RESTORE_ORDER) {
      const rows = payload.tables[t];
      if (!Array.isArray(rows) || rows.length === 0) continue;
      const r = { inserted: 0, errors: [] as string[] };
      // Chunk to keep payloads manageable
      const CHUNK = 200;
      for (let i = 0; i < rows.length; i += CHUNK) {
        const slice = rows.slice(i, i + CHUNK);
        const { error } = await admin.from(t).upsert(slice, { onConflict: "id", ignoreDuplicates: false });
        if (error) {
          r.errors.push(error.message);
        } else {
          r.inserted += slice.length;
        }
      }
      results[t] = r;
    }

    await admin.from("audit_logs").insert({
      user_id: u.user.id,
      user_name: u.user.email,
      module: "system",
      action: `Восстановление из резервной копии (${mode})`,
      details: JSON.stringify({ tables: Object.keys(results).length }),
    });

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}
