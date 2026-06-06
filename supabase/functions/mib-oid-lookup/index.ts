import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CACHE_TTL_DAYS = 30;

async function fetchWithTimeout(url: string, ms = 8000): Promise<Response | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": "ITEA-portal/1.0 (OID lookup)" },
    });
    return r;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/** Try oid-rep.orange-labs.fr (public MIB browser). */
async function lookupOrange(oid: string): Promise<{ name?: string; description?: string } | null> {
  const r = await fetchWithTimeout(`https://oid-rep.orange-labs.fr/get/${encodeURIComponent(oid)}`);
  if (!r || !r.ok) return null;
  const html = await r.text();
  // Page contains a table with "Name", "Description" rows.
  const nameM = html.match(/<b>\s*Name\s*<\/b>\s*<\/td>\s*<td[^>]*>([^<]+)</i);
  const descM = html.match(/<b>\s*Description\s*<\/b>\s*<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/i);
  const name = nameM ? stripTags(nameM[1]) : undefined;
  const description = descM ? stripTags(descM[1]).slice(0, 1000) : undefined;
  if (!name && !description) return null;
  return { name, description };
}

/** Fallback: Circitor MIB DB search. */
async function lookupCircitor(oid: string): Promise<{ name?: string; description?: string } | null> {
  const r = await fetchWithTimeout(`https://www.circitor.fr/Mibs/Html/SearchMib.php?oid=${encodeURIComponent(oid)}`);
  if (!r || !r.ok) return null;
  const html = await r.text();
  const nameM = html.match(/Object Name[^<]*<[^>]+>([^<]+)</i);
  const descM = html.match(/Description[^<]*<[^>]+>([\s\S]*?)<\/td>/i);
  const name = nameM ? stripTags(nameM[1]) : undefined;
  const description = descM ? stripTags(descM[1]).slice(0, 1000) : undefined;
  if (!name && !description) return null;
  return { name, description };
}

async function lookupOne(
  admin: ReturnType<typeof createClient>,
  oid: string,
  force: boolean,
): Promise<{ oid: string; name: string | null; description: string | null; source: string }> {
  if (!force) {
    const { data: cached } = await admin
      .from("mib_oid_cache")
      .select("oid, name, description, source, fetched_at")
      .eq("oid", oid)
      .maybeSingle();
    if (cached) {
      const ageDays = (Date.now() - new Date(cached.fetched_at as string).getTime()) / 86400000;
      if (ageDays < CACHE_TTL_DAYS) {
        return { oid, name: cached.name, description: cached.description, source: cached.source };
      }
    }
  }

  let result: { name?: string; description?: string } | null = null;
  let source = "not_found";
  result = await lookupOrange(oid);
  if (result) source = "oid-rep.orange-labs.fr";
  if (!result) {
    result = await lookupCircitor(oid);
    if (result) source = "circitor";
  }

  const row = {
    oid,
    name: result?.name ?? null,
    description: result?.description ?? null,
    source,
    fetched_at: new Date().toISOString(),
  };
  await admin.from("mib_oid_cache").upsert(row, { onConflict: "oid" });
  return row;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const body = await req.json().catch(() => ({}));
    const force = !!body.force;
    const oids: string[] = Array.isArray(body.oids)
      ? body.oids.filter((x: unknown) => typeof x === "string")
      : (typeof body.oid === "string" ? [body.oid] : []);

    if (!oids.length) {
      return new Response(JSON.stringify({ error: "oid or oids[] required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Limit to avoid abuse
    const limited = oids.slice(0, 25);
    const results = await Promise.all(limited.map((o) => lookupOne(admin, o.trim(), force)));

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});