import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FREQ_RU: Record<string, string> = {
  daily: "Ежедневные",
  weekly: "Еженедельные",
  monthly: "Ежемесячные",
  quarterly: "Квартальные",
  semi_annual: "Полугодовые",
  on_request: "ПоЗаявке",
};

const DEFAULT_FOLDERS: Record<string, string> = {
  protocol: "Протоколы/{org}/{year}/{month_ru}/{frequency_ru}/{period}",
  graph: "Графики/{org}/{year}-{month}",
  report: "Отчёты/{org}/{year}-{month}",
  document: "Документы/{org}/{category}",
  map: "Схемы/{org}",
  audit: "Аудит/{year}-{month}",
  ticket: "Обращения/{org}/{year}-{month}",
};
const DEFAULT_FILENAME = "{date}_{name}_{user}";

const MONTHS_RU = [
  "01_Январь","02_Февраль","03_Март","04_Апрель","05_Май","06_Июнь",
  "07_Июль","08_Август","09_Сентябрь","10_Октябрь","11_Ноябрь","12_Декабрь",
];

function sanitize(s: string): string {
  return String(s ?? "—").replace(/[\/\\:*?"<>|]/g, "_").trim().slice(0, 120) || "—";
}
function sanitizePath(s: string): string {
  return s.split("/").map((p) => sanitize(p)).filter(Boolean).join("/");
}
function pad(n: number) { return n.toString().padStart(2, "0"); }

function substitute(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => sanitize(vars[k] ?? "—"));
}

function b64ToBlob(b64: string, type: string): Uint8Array {
  const pure = b64.includes(",") ? b64.split(",")[1] : b64;
  const bin = atob(pure);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function dirExists(baseUrl: string, token: string, repoId: string, path: string): Promise<boolean> {
  const url = `${baseUrl}/api2/repos/${repoId}/dir/?p=${encodeURIComponent(path)}`;
  try {
    const res = await fetch(url, { headers: { Authorization: `Token ${token}` } });
    return res.ok;
  } catch {
    return false;
  }
}

async function mkdirRecursive(baseUrl: string, token: string, repoId: string, fullPath: string) {
  const parts = fullPath.split("/").filter(Boolean);
  let cur = "";
  for (const part of parts) {
    cur += "/" + part;
    if (await dirExists(baseUrl, token, repoId, cur)) continue;
    const url = `${baseUrl}/api2/repos/${repoId}/dir/?p=${encodeURIComponent(cur)}`;
    const form = new FormData();
    form.append("operation", "mkdir");
    const res = await fetch(url, { method: "POST", headers: { Authorization: `Token ${token}` }, body: form });
    if (!res.ok && res.status !== 400 && res.status !== 409) {
      const text = await res.text();
      throw new Error(`mkdir ${cur} failed [${res.status}]: ${text}`);
    }
    try { await res.text(); } catch { /* ignore */ }
  }
}

async function upload(baseUrl: string, token: string, repoId: string, parentDir: string, name: string, bytes: Uint8Array, mime: string) {
  const linkRes = await fetch(`${baseUrl}/api2/repos/${repoId}/upload-link/?p=${encodeURIComponent(parentDir)}`, {
    headers: { Authorization: `Token ${token}` },
  });
  if (!linkRes.ok) throw new Error(`upload-link ${linkRes.status}`);
  const uploadUrl = (await linkRes.json() as string).replace(/^"|"$/g, "");
  const fd = new FormData();
  fd.append("file", new Blob([bytes], { type: mime }), name);
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

export default async function handler(req: Request) {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const body = await req.json() as {
      kind: string;
      blob_base64: string;
      filename: string;
      mime?: string;
      meta?: Record<string, string | number | null | undefined>;
      dry_run?: boolean;
    };
    if (!body.kind || (!body.dry_run && !body.blob_base64) || !body.filename) {
      return new Response(JSON.stringify({ error: "kind, filename and blob_base64 required" }), { status: 400, headers: corsHeaders });
    }

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: setting } = await admin
      .from("integration_settings").select("config, enabled").eq("key", "seafile").maybeSingle();
    if (!setting?.enabled) {
      return new Response(JSON.stringify({ error: "Seafile интеграция отключена" }), { status: 400, headers: corsHeaders });
    }
    const cfg = (setting.config || {}) as Record<string, any>;
    const baseUrl = (cfg.base_url || "").replace(/\/$/, "");
    const token = cfg.token as string;
    const repoId = cfg.repo_id as string;
    if (!baseUrl || !token || !repoId) {
      return new Response(JSON.stringify({ error: "Seafile не настроен (base_url, token, repo_id)" }), { status: 400, headers: corsHeaders });
    }
    const root = (cfg.root || "/").replace(/\/+$/, "") || "";
    const folders = { ...DEFAULT_FOLDERS, ...(cfg.folders || {}) };
    const filenamePattern: string = cfg.filename_pattern || DEFAULT_FILENAME;

    const { data: profile } = await admin.from("profiles").select("full_name").eq("user_id", user.id).maybeSingle();
    const userLogin = (user.email || "").split("@")[0] || user.id.slice(0, 8);
    const userName = profile?.full_name || userLogin;

    const now = new Date();
    const meta = body.meta || {};
    const dateStr = String(meta.date || `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`);
    const timeStr = `${pad(now.getHours())}${pad(now.getMinutes())}`;
    const vars: Record<string, string> = {
      org: String(meta.org ?? "Без_организации"),
      year: String(meta.year ?? dateStr.slice(0, 4)),
      month: String(meta.month ?? dateStr.slice(5, 7)),
      month_ru: (() => {
        const m = parseInt(String(meta.month ?? dateStr.slice(5, 7)), 10);
        return Number.isFinite(m) && m >= 1 && m <= 12 ? MONTHS_RU[m - 1] : "—";
      })(),
      date: dateStr,
      time: timeStr,
      frequency: String(meta.frequency ?? ""),
      frequency_ru: FREQ_RU[String(meta.frequency ?? "")] || String(meta.frequency_ru ?? meta.frequency ?? ""),
      period: String(meta.period ?? dateStr),
      category: String(meta.category ?? ""),
      name: String(meta.name ?? body.filename.replace(/\.[^.]+$/, "")),
      user: userLogin,
      user_name: userName,
    };

    const template = folders[body.kind] || DEFAULT_FOLDERS[body.kind] || "Прочее/{org}";
    const folderPath = "/" + sanitizePath(`${root.replace(/^\//, "")}/${substitute(template, vars)}`);

    const ext = body.filename.includes(".") ? body.filename.split(".").pop()! : "bin";
    const baseName = body.filename.replace(/\.[^.]+$/, "");
    const fnameVars = { ...vars, name: baseName, date: `${dateStr}_${timeStr}` };
    const finalName = sanitize(substitute(filenamePattern, fnameVars)) + "." + ext;

    if (body.dry_run) {
      return new Response(JSON.stringify({ ok: true, folder: folderPath, filename: finalName, dry_run: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await mkdirRecursive(baseUrl, token, repoId, folderPath);

    const bytes = b64ToBlob(body.blob_base64, body.mime || "application/octet-stream");
    await upload(baseUrl, token, repoId, folderPath, finalName, bytes, body.mime || "application/octet-stream");

    try {
      await admin.from("audit_logs").insert({
        user_id: user.id,
        user_name: userName,
        organization: String(meta.org || "") || null,
        module: "seafile",
        action: `Выгружено в Seafile: ${body.kind}`,
        details: `${folderPath}/${finalName}`,
      });
    } catch { /* ignore audit failures */ }

    const viewUrl = `${baseUrl}/library/${repoId}/${encodeURIComponent(folderPath.replace(/^\//, ""))}`;
    return new Response(JSON.stringify({ ok: true, folder: folderPath, filename: finalName, viewUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("seafile-upload-typed error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: corsHeaders });
  }
}
