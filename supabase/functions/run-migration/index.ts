import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import postgres from "https://deno.land/x/postgresjs@v3.4.4/mod.js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const dbUrl = Deno.env.get("SUPABASE_DB_URL")!;

    // Verify caller is admin
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return json({ error: "Не авторизован" }, 401);
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: isAdmin, error: roleErr } = await admin.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    if (roleErr || !isAdmin) {
      return json({ error: "Доступ запрещён: требуется роль admin" }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const sql = String(body?.sql ?? "").trim();
    if (!sql) return json({ error: "SQL пустой" }, 400);
    if (sql.length > 500_000) return json({ error: "SQL слишком большой (>500KB)" }, 400);

    const sqlClient = postgres(dbUrl, { max: 1, prepare: false, idle_timeout: 5 });
    const started = Date.now();
    try {
      // Execute as a single unprepared statement so DDL + multiple statements work
      const result = await sqlClient.unsafe(sql);
      const duration = Date.now() - started;
      return json({
        ok: true,
        duration_ms: duration,
        rows_affected: Array.isArray(result) ? result.length : 0,
        preview: Array.isArray(result) ? result.slice(0, 20) : null,
      });
    } finally {
      await sqlClient.end({ timeout: 1 });
    }
  } catch (e) {
    console.error("run-migration error:", e);
    return json({ error: e?.message ?? String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}