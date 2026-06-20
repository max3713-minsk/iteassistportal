import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import postgres from "https://deno.land/x/postgresjs@v3.4.4/mod.js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export default async function handler(req: Request): Promise<Response> {
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
    const action = String(body?.action ?? "run");

    // List applied migrations
    if (action === "list") {
      const admin2 = createClient(supabaseUrl, serviceKey);
      const { data, error } = await admin2
        .from("applied_migrations")
        .select("*")
        .order("applied_at", { ascending: false });
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true, items: data ?? [] });
    }

    const sql = String(body?.sql ?? "").trim();
    const ignoreExisting = body?.ignore_existing !== false; // default true
    const migrationName: string | null = body?.migration_name ?? null;
    const note: string | null = body?.note ?? null;
    if (!sql) return json({ error: "SQL пустой" }, 400);
    if (sql.length > 500_000) return json({ error: "SQL слишком большой (>500KB)" }, 400);

    // Compute SHA-256 of the SQL for traceability
    const encoder = new TextEncoder();
    const hashBuf = await crypto.subtle.digest("SHA-256", encoder.encode(sql));
    const checksum = Array.from(new Uint8Array(hashBuf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const sqlClient = postgres(dbUrl, { max: 1, prepare: false, idle_timeout: 5 });
    const started = Date.now();
    // Codes considered "already exists" — safe to skip when re-running migrations
    const SKIP_CODES = new Set(["42710", "42P07", "42701", "42P06", "42723", "42P16"]);
    try {
      let outcome: any;
      try {
        const result = await sqlClient.unsafe(sql);
        outcome = {
          ok: true,
          duration_ms: Date.now() - started,
          rows_affected: Array.isArray(result) ? result.length : 0,
          preview: Array.isArray(result) ? result.slice(0, 20) : null,
        };
      } catch (e: any) {
        if (!ignoreExisting || !SKIP_CODES.has(e?.code)) throw e;
        // Retry statement-by-statement, skipping "already exists" errors
        const statements = splitSql(sql);
        const skipped: { idx: number; code: string; message: string }[] = [];
        let executed = 0;
        for (let i = 0; i < statements.length; i++) {
          const stmt = statements[i].trim();
          if (!stmt) continue;
          try {
            await sqlClient.unsafe(stmt);
            executed++;
          } catch (err: any) {
            if (SKIP_CODES.has(err?.code)) {
              skipped.push({ idx: i, code: err.code, message: err.message });
            } else {
              throw new Error(`Statement #${i + 1} failed (${err?.code}): ${err?.message}\n--\n${stmt.slice(0, 400)}`);
            }
          }
        }
        outcome = {
          ok: true,
          duration_ms: Date.now() - started,
          executed,
          skipped_count: skipped.length,
          skipped,
          note: "Часть операторов пропущена (объекты уже существуют).",
        };
      }

      // Record into applied_migrations if a filename was provided
      if (migrationName) {
        try {
          await sqlClient`
            INSERT INTO public.applied_migrations (filename, checksum, applied_by, duration_ms, note)
            VALUES (${migrationName}, ${checksum}, ${userData.user.id}, ${outcome.duration_ms}, ${note ?? outcome.note ?? null})
            ON CONFLICT (filename) DO UPDATE
              SET checksum = EXCLUDED.checksum,
                  applied_at = now(),
                  applied_by = EXCLUDED.applied_by,
                  duration_ms = EXCLUDED.duration_ms,
                  note = EXCLUDED.note
          `;
        } catch (logErr) {
          console.warn("Failed to record applied_migrations:", logErr);
        }
      }

      return json({ ...outcome, checksum, migration_name: migrationName });
    } finally {
      await sqlClient.end({ timeout: 1 });
    }
  } catch (e) {
    console.error("run-migration error:", e);
    return json({ error: e?.message ?? String(e) }, 500);
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Naive SQL splitter that respects single quotes, double quotes, line comments,
// block comments, and dollar-quoted strings ($$...$$, $tag$...$tag$).
function splitSql(sql: string): string[] {
  const out: string[] = [];
  let buf = "";
  let i = 0;
  const n = sql.length;
  let inSingle = false;
  let inDouble = false;
  let inLine = false;
  let inBlock = 0;
  let dollarTag: string | null = null;

  while (i < n) {
    const c = sql[i];
    const c2 = sql[i + 1];

    if (dollarTag) {
      buf += c;
      if (c === "$") {
        const end = sql.indexOf("$", i + 1);
        if (end !== -1) {
          const tag = sql.slice(i, end + 1);
          if (tag === dollarTag) {
            buf += sql.slice(i + 1, end + 1);
            i = end + 1;
            dollarTag = null;
            continue;
          }
        }
      }
      i++;
      continue;
    }
    if (inLine) {
      buf += c;
      if (c === "\n") inLine = false;
      i++;
      continue;
    }
    if (inBlock) {
      buf += c;
      if (c === "*" && c2 === "/") { buf += c2; i += 2; inBlock--; continue; }
      if (c === "/" && c2 === "*") { buf += c2; i += 2; inBlock++; continue; }
      i++;
      continue;
    }
    if (inSingle) {
      buf += c;
      if (c === "'" && c2 === "'") { buf += c2; i += 2; continue; }
      if (c === "'") inSingle = false;
      i++;
      continue;
    }
    if (inDouble) {
      buf += c;
      if (c === '"') inDouble = false;
      i++;
      continue;
    }
    if (c === "-" && c2 === "-") { buf += c + c2; i += 2; inLine = true; continue; }
    if (c === "/" && c2 === "*") { buf += c + c2; i += 2; inBlock = 1; continue; }
    if (c === "'") { buf += c; inSingle = true; i++; continue; }
    if (c === '"') { buf += c; inDouble = true; i++; continue; }
    if (c === "$") {
      const m = /^\$[A-Za-z_]*\$/.exec(sql.slice(i));
      if (m) {
        dollarTag = m[0];
        buf += dollarTag;
        i += dollarTag.length;
        continue;
      }
    }
    if (c === ";") {
      out.push(buf);
      buf = "";
      i++;
      continue;
    }
    buf += c;
    i++;
  }
  if (buf.trim()) out.push(buf);
  return out;
}