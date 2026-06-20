import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FREQ_FOLDER: Record<string, string> = {
  daily: "Ежедневные",
  weekly: "Еженедельные",
  monthly: "Ежемесячные",
  quarterly: "Квартальные",
  semi_annual: "Полугодовые",
  on_request: "ПоЗаявке",
};

function sanitize(s: string): string {
  return (s || "—").replace(/[\/\\:*?"<>|]/g, "_").trim().slice(0, 100) || "—";
}

async function seafileMkdirRecursive(baseUrl: string, token: string, repoId: string, fullPath: string) {
  // Build incremental paths and call mkdir for each level (ignore "already exists")
  const parts = fullPath.split("/").filter(Boolean);
  let cur = "";
  for (const part of parts) {
    cur += "/" + part;
    const url = `${baseUrl}/api2/repos/${repoId}/dir/?p=${encodeURIComponent(cur)}`;
    const form = new FormData();
    form.append("operation", "mkdir");
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Token ${token}` },
      body: form,
    });
    // 201 created, 200 ok; 400/409 if exists — ignore
    if (!res.ok && res.status !== 400 && res.status !== 409) {
      const text = await res.text();
      throw new Error(`mkdir ${cur} failed [${res.status}]: ${text}`);
    }
    try { await res.text(); } catch { /* drain */ }
  }
}

async function seafileUpload(baseUrl: string, token: string, repoId: string, parentDir: string, name: string, blob: Blob) {
  const linkRes = await fetch(`${baseUrl}/api2/repos/${repoId}/upload-link/?p=${encodeURIComponent(parentDir)}`, {
    headers: { Authorization: `Token ${token}` },
  });
  if (!linkRes.ok) throw new Error(`upload-link ${linkRes.status}`);
  const uploadUrl = (await linkRes.json() as string).replace(/^"|"$/g, "");

  const fd = new FormData();
  fd.append("file", blob, name);
  fd.append("parent_dir", parentDir);
  fd.append("replace", "1");
  const upRes = await fetch(uploadUrl + "?ret-json=1", {
    method: "POST",
    headers: { Authorization: `Token ${token}` },
    body: fd,
  });
  if (!upRes.ok) {
    const t = await upRes.text();
    throw new Error(`upload ${name} [${upRes.status}]: ${t}`);
  }
  await upRes.json().catch(() => null);
}

function b64ToBlob(b64: string, type: string): Blob {
  const pure = b64.includes(",") ? b64.split(",")[1] : b64;
  const bin = atob(pure);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type });
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const body = await req.json() as {
      protocol_id: string;
      docx_base64: string;
      graphs?: { name: string; pngBase64: string }[];
    };
    if (!body.protocol_id || !body.docx_base64) {
      return new Response(JSON.stringify({ error: "protocol_id and docx_base64 required" }), { status: 400, headers: corsHeaders });
    }

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: setting } = await admin
      .from("integration_settings").select("config, enabled").eq("key", "seafile").maybeSingle();
    if (!setting?.enabled) {
      return new Response(JSON.stringify({ error: "Seafile интеграция отключена" }), { status: 400, headers: corsHeaders });
    }
    const cfg = setting.config as Record<string, any>;
    const baseUrl = (cfg.base_url || "").replace(/\/$/, "");
    const token = cfg.token as string;
    const repoId = cfg.repo_id as string;
    if (!baseUrl || !token || !repoId) {
      return new Response(JSON.stringify({ error: "Seafile не настроен полностью (base_url, token, repo_id)" }), { status: 400, headers: corsHeaders });
    }

    const { data: protocol, error: pErr } = await admin
      .from("maintenance_protocols")
      .select("id, frequency, period_start, period_end, status, notes, completed_at, sites(name, organization)")
      .eq("id", body.protocol_id)
      .maybeSingle();
    if (pErr || !protocol) {
      return new Response(JSON.stringify({ error: "Протокол не найден" }), { status: 404, headers: corsHeaders });
    }

    const { data: items } = await admin
      .from("protocol_items")
      .select("status, notes, completed_at, equipment(name, model), maintenance_tasks(title)")
      .eq("protocol_id", body.protocol_id);

    const site = (protocol as any).sites;
    const orgName = sanitize(site?.organization || "Без_организации");
    const siteName = sanitize(site?.name || "Без_площадки");
    const year = (protocol.period_start || "").slice(0, 4) || String(new Date().getFullYear());
    const freqFolder = sanitize(FREQ_FOLDER[protocol.frequency] || protocol.frequency);
    const periodFolder = sanitize(`${protocol.period_start}..${protocol.period_end}_${siteName}`);

    const folderPath = `/Протоколы/${orgName}/${year}/${freqFolder}/${periodFolder}`;

    await seafileMkdirRecursive(baseUrl, token, repoId, folderPath);

    const uploaded: string[] = [];

    // DOCX
    const docxBlob = b64ToBlob(body.docx_base64, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    const docxName = `protocol_${protocol.period_start}.docx`;
    await seafileUpload(baseUrl, token, repoId, folderPath, docxName, docxBlob);
    uploaded.push(docxName);

    // Graphs
    if (body.graphs && body.graphs.length > 0) {
      const graphsDir = `${folderPath}/graphs`;
      await seafileMkdirRecursive(baseUrl, token, repoId, graphsDir);
      for (let i = 0; i < body.graphs.length; i++) {
        const g = body.graphs[i];
        const safeName = sanitize(g.name) + `_${i + 1}.png`;
        const pngBlob = b64ToBlob(g.pngBase64, "image/png");
        await seafileUpload(baseUrl, token, repoId, graphsDir, safeName, pngBlob);
        uploaded.push(`graphs/${safeName}`);
      }
    }

    // summary.json
    const summary = {
      protocol_id: protocol.id,
      organization: site?.organization ?? null,
      site: site?.name ?? null,
      frequency: protocol.frequency,
      frequency_label: FREQ_FOLDER[protocol.frequency] ?? protocol.frequency,
      period_start: protocol.period_start,
      period_end: protocol.period_end,
      status: protocol.status,
      completed_at: protocol.completed_at,
      notes: protocol.notes,
      items_total: items?.length ?? 0,
      items_completed: items?.filter((i: any) => i.status === "completed").length ?? 0,
      items: (items || []).map((i: any) => ({
        equipment: i.equipment?.name ?? null,
        model: i.equipment?.model ?? null,
        task: i.maintenance_tasks?.title ?? null,
        status: i.status,
        notes: i.notes,
        completed_at: i.completed_at,
      })),
      exported_at: new Date().toISOString(),
      exported_by: user.id,
    };
    const summaryBlob = new Blob([JSON.stringify(summary, null, 2)], { type: "application/json" });
    await seafileUpload(baseUrl, token, repoId, folderPath, "summary.json", summaryBlob);
    uploaded.push("summary.json");

    const viewUrl = `${baseUrl}/library/${repoId}/${encodeURIComponent(folderPath.replace(/^\//, ""))}`;
    return new Response(JSON.stringify({ ok: true, folder: folderPath, uploaded, viewUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("protocol-export-seafile error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: corsHeaders });
  }
}
