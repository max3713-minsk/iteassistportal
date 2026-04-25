import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Codeword required (server-side only).
const CODEWORD = "derby3713";

// Tables to purge in safe order (children before parents).
const PURGE_TABLES = [
  "ticket_comments",
  "ticket_status_history",
  "tickets",
  "protocol_items",
  "maintenance_protocols",
  "maintenance_schedules",
  "maintenance_tasks",
  "automation_logs",
  "audit_logs",
  "notification_log",
  "notification_queue",
  "notification_subscriptions",
  "notification_channels",
  "notification_preferences",
  "user_dashboard_widgets",
  "user_favorite_metrics",
  "user_metric_preferences",
  "saved_graphs",
  "alert_thresholds",
  "item_aliases",
  "metric_translations",
  "monitoring_host_links",
  "monitored_hosts",
  "tz_coverage",
  "tz_requirements",
  "documents",
  "equipment",
  "equipment_categories",
  "sites",
  "contracts",
  "organizations",
  "zabbix_connections",
  "zabbix_settings",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await supabaseUser.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;
    const userEmail = (claimsData.claims.email as string) || null;

    const body = await req.json().catch(() => ({}));
    const codeword = String(body?.codeword || "");
    const password = String(body?.password || "");
    const confirm = String(body?.confirm || "");

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // log attempt regardless of outcome
    async function log(status: string, details: string) {
      await admin.from("system_kill_log").insert({
        triggered_by: userId,
        triggered_email: userEmail,
        status, details,
      });
    }

    if (codeword !== CODEWORD) {
      await log("rejected_codeword", "Wrong codeword");
      return new Response(JSON.stringify({ error: "Доступ запрещён" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (confirm !== "PURGE") {
      await log("rejected_confirm", "Missing confirm token");
      return new Response(JSON.stringify({ error: "Не подтверждено" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Re-verify password via signInWithPassword (no email exposure)
    if (!userEmail || !password) {
      await log("rejected_password", "No password/email");
      return new Response(JSON.stringify({ error: "Доступ запрещён" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const verify = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );
    const { error: signErr } = await verify.auth.signInWithPassword({
      email: userEmail, password,
    });
    if (signErr) {
      await log("rejected_password", signErr.message);
      return new Response(JSON.stringify({ error: "Неверный пароль" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await log("started", `Purging ${PURGE_TABLES.length} tables`);

    const results: Record<string, string> = {};
    for (const t of PURGE_TABLES) {
      try {
        // delete all rows. Filter on a column that exists (id) to avoid 'requires WHERE' errors.
        const { error } = await admin.from(t).delete().not("id", "is", null);
        results[t] = error ? `error: ${error.message}` : "ok";
      } catch (e) {
        results[t] = `exception: ${e instanceof Error ? e.message : String(e)}`;
      }
    }

    await log("completed", JSON.stringify(results));

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});