import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Sync state holidays from Nager.Date for a given country and year.
 * Body: { country?: string ('BY'), year?: number, years?: number[] }
 * Manual workday transfers (day_type='workday') and manual entries are preserved.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
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

    // Check role: admin or engineer
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
    const allowed = (roles ?? []).some((r: any) => r.role === "admin" || r.role === "engineer");
    if (!allowed) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const country = (body.country || "BY").toUpperCase();
    const currentYear = new Date().getFullYear();
    const years: number[] = Array.isArray(body.years) && body.years.length
      ? body.years
      : body.year
        ? [body.year]
        : [currentYear, currentYear + 1];

    let inserted = 0;
    let updated = 0;
    const errors: string[] = [];

    for (const year of years) {
      const url = `https://date.nager.at/api/v3/PublicHolidays/${year}/${country}`;
      const resp = await fetch(url);
      if (!resp.ok) {
        errors.push(`Nager ${year}: HTTP ${resp.status}`);
        continue;
      }
      const list = await resp.json() as Array<{ date: string; localName: string; name: string }>;

      for (const h of list) {
        // Skip if a manual workday transfer exists for that date
        const { data: existing } = await supabase
          .from("holidays")
          .select("id, source, day_type")
          .eq("date", h.date)
          .maybeSingle();

        if (existing) {
          // Don't overwrite manual entries
          if (existing.source === "manual") continue;
          await supabase.from("holidays").update({
            name: h.localName || h.name,
            day_type: "holiday",
            source: "nager",
          }).eq("id", existing.id);
          updated++;
        } else {
          await supabase.from("holidays").insert({
            date: h.date,
            name: h.localName || h.name,
            day_type: "holiday",
            source: "nager",
            country_code: country,
            created_by: user.id,
          });
          inserted++;
        }
      }
    }

    return new Response(JSON.stringify({
      ok: true, country, years, inserted, updated, errors,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});