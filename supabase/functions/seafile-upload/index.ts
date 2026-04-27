import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
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

    const form = await req.formData();
    const file = form.get("file") as File | null;
    const subdir = (form.get("subdir") as string) || "/";
    if (!file) return new Response(JSON.stringify({ error: "file required" }), { status: 400, headers: corsHeaders });

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: setting } = await admin
      .from("integration_settings").select("config, enabled").eq("key", "seafile").maybeSingle();
    if (!setting?.enabled) return new Response(JSON.stringify({ error: "Seafile disabled" }), { status: 400, headers: corsHeaders });
    const cfg = setting.config as Record<string, any>;
    const baseUrl = (cfg.base_url || "").replace(/\/$/, "");
    const token = cfg.token as string;
    const repoId = cfg.repo_id as string;
    if (!baseUrl || !token || !repoId) {
      return new Response(JSON.stringify({ error: "Seafile not fully configured (base_url, token, repo_id)" }), { status: 400, headers: corsHeaders });
    }

    // 1. get upload-link
    const linkRes = await fetch(`${baseUrl}/api2/repos/${repoId}/upload-link/?p=${encodeURIComponent(subdir)}`, {
      headers: { Authorization: `Token ${token}` },
    });
    if (!linkRes.ok) {
      return new Response(JSON.stringify({ error: `Seafile link error ${linkRes.status}` }), { status: 502, headers: corsHeaders });
    }
    const uploadUrl = (await linkRes.json() as string).replace(/^"|"$/g, "");

    // 2. upload
    const uploadForm = new FormData();
    uploadForm.append("file", file, file.name);
    uploadForm.append("parent_dir", subdir);
    const upRes = await fetch(uploadUrl + "?ret-json=1", {
      method: "POST",
      headers: { Authorization: `Token ${token}` },
      body: uploadForm,
    });
    if (!upRes.ok) {
      const text = await upRes.text();
      return new Response(JSON.stringify({ error: `Seafile upload ${upRes.status}: ${text}` }), { status: 502, headers: corsHeaders });
    }
    const result = await upRes.json();
    return new Response(JSON.stringify({ ok: true, file: result?.[0] || result, viewUrl: `${baseUrl}/library/${repoId}/${encodeURIComponent(subdir)}` }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: corsHeaders });
  }
});