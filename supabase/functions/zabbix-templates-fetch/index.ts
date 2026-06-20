import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Fetches Zabbix templates from official + community GitHub repos and combines
// with the local portal library (zabbix_template_library table).
// Lightweight — uses GitHub Contents API (no auth needed for public repos, may be rate-limited).

const SOURCES = [
  { name: "official", url: "https://api.github.com/repos/zabbix/zabbix/contents/templates?ref=master" },
  { name: "community", url: "https://api.github.com/repos/zabbix/community-templates/contents/?ref=main" },
];

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const url = new URL(req.url);
    const source = url.searchParams.get("source") || "all"; // local | official | community | all
    const search = (url.searchParams.get("search") || "").toLowerCase();

    const results: Array<{
      id: string; name: string; source: string; category?: string;
      description?: string; source_url?: string;
    }> = [];

    // Local
    if (source === "local" || source === "all") {
      const { data: local } = await supabase.from("zabbix_template_library").select("*");
      (local || []).forEach((t: any) => results.push({
        id: t.id, name: t.name, source: "local", category: t.category,
        description: t.description, source_url: t.source_url,
      }));
    }

    // Remote sources
    for (const src of SOURCES) {
      if (source !== "all" && source !== src.name) continue;
      try {
        const r = await fetch(src.url, { headers: { Accept: "application/vnd.github+json" } });
        if (!r.ok) continue;
        const items = await r.json();
        if (Array.isArray(items)) {
          items
            .filter((it: any) => it.type === "dir" || /\.(yaml|yml|xml)$/i.test(it.name))
            .forEach((it: any) => results.push({
              id: `${src.name}:${it.path}`,
              name: it.name.replace(/\.(yaml|yml|xml)$/i, ""),
              source: src.name,
              source_url: it.html_url,
              description: it.path,
            }));
        }
      } catch (_) { /* skip on error */ }
    }

    const filtered = search
      ? results.filter((r) => r.name.toLowerCase().includes(search) || (r.description || "").toLowerCase().includes(search))
      : results;

    return new Response(JSON.stringify({ items: filtered, total: filtered.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: corsHeaders });
  }
}
