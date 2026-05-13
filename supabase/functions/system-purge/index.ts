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
    const { data: userData, error: userErr } = await supabaseUser.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;
    const userEmail = userData.user.email || null;

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

    // Require an approved factory_reset_request that this user owns.
    const requestId = String(body?.request_id || "");
    if (!requestId) {
      await log("rejected_no_request", "Missing request_id");
      return new Response(JSON.stringify({ error: "Требуется подтверждённая заявка на сброс" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: resetReq, error: reqErr } = await admin
      .from("factory_reset_requests")
      .select("id, requested_by, approved_by, status, expires_at")
      .eq("id", requestId)
      .maybeSingle();
    if (reqErr || !resetReq) {
      await log("rejected_request_missing", reqErr?.message || "not found");
      return new Response(JSON.stringify({ error: "Заявка на сброс не найдена" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (resetReq.requested_by !== userId) {
      await log("rejected_request_owner", "Not owner");
      return new Response(JSON.stringify({ error: "Сброс может выполнить только автор заявки" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (resetReq.status !== "approved") {
      await log("rejected_request_status", `status=${resetReq.status}`);
      return new Response(JSON.stringify({ error: "Заявка ещё не подтверждена вторым администратором" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!resetReq.approved_by || resetReq.approved_by === userId) {
      await log("rejected_same_admin", "Self-approval");
      return new Response(JSON.stringify({ error: "Подтверждение должно быть от другого администратора" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (new Date(resetReq.expires_at).getTime() < Date.now()) {
      await log("rejected_expired", "Expired");
      return new Response(JSON.stringify({ error: "Заявка просрочена. Создайте новую." }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
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

    await admin.from("factory_reset_requests")
      .update({ status: "executed", executed_at: new Date().toISOString() })
      .eq("id", requestId);

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});