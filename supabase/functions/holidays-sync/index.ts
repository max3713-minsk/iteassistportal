import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export default async function handler(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { country, years } = await req.json();
    if (!country || !years || !Array.isArray(years)) {
      throw new Error("Неверные параметры: ожидается { country, years: [] }");
    }

    const holidays = [];
    for (const year of years) {
      const url = `https://date.nager.at/api/v3/PublicHolidays/${year}/${country}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Ошибка API: ${res.status} для ${year}`);
      const data = await res.json();
      for (const h of data) {
        holidays.push({
          date: h.date,
          name: h.name,
          country_code: country,
          day_type: h.type === "Public" ? "holiday" : "workday",
          source: "nager.date",
        });
      }
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let inserted = 0, updated = 0;
    for (const h of holidays) {
      const { data: existing, error: findErr } = await supabase
        .from("holidays")
        .select("id")
        .eq("date", h.date)
        .eq("country_code", country)
        .maybeSingle();
      if (findErr) throw findErr;

      if (existing) {
        const { error: upErr } = await supabase
          .from("holidays")
          .update({ name: h.name, day_type: h.day_type, source: h.source })
          .eq("id", existing.id);
        if (upErr) throw upErr;
        updated++;
      } else {
        const { error: insErr } = await supabase.from("holidays").insert(h);
        if (insErr) throw insErr;
        inserted++;
      }
    }

    return new Response(JSON.stringify({ success: true, inserted, updated }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Sync holidays error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}
