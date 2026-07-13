// Сканирование SFTP-хранилища на предмет файлов логов и наполнение реестра
// equipment_log_files. Ничего не анализирует — только находит файлы и
// привязывает их к оборудованию по каталогу/расширениям/regex-шаблону имени.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import SftpClient from "npm:ssh2-sftp-client@10.0.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

type Storage = {
  id: string; name: string; host: string; port: number; username: string;
  auth_method: "password" | "key"; password: string | null; private_key: string | null;
  base_path: string; enabled: boolean;
};

type Equipment = {
  id: string; name: string; model: string | null; serial_number: string | null;
  log_storage_id: string | null; log_path: string | null;
  log_filename_pattern: string | null; log_extensions: string[] | null;
  log_max_age_days: number | null;
};

function expand(tpl: string, eq: Equipment): string {
  return tpl
    .replaceAll("{name}", eq.name)
    .replaceAll("{model}", eq.model ?? "")
    .replaceAll("{serial}", eq.serial_number ?? "");
}
function joinPath(a: string, b: string): string {
  if (!b) return a;
  if (b.startsWith("/")) return b;
  return (a.endsWith("/") ? a : a + "/") + b;
}
function globToRegex(glob: string): RegExp {
  const escaped = glob.replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*")
    .replace(/\?/g, ".");
  return new RegExp("^" + escaped + "$", "i");
}

async function connect(s: Storage): Promise<SftpClient> {
  const sftp = new SftpClient();
  await sftp.connect({
    host: s.host, port: s.port, username: s.username,
    ...(s.auth_method === "key" && s.private_key
      ? { privateKey: s.private_key }
      : { password: s.password ?? "" }),
    readyTimeout: 15000,
  });
  return sftp;
}

async function scanForEquipment(
  sftp: SftpClient, storage: Storage, eq: Equipment,
): Promise<{ found: number; upserted: number; error?: string }> {
  const exts = (eq.log_extensions ?? [".txt", ".log"]).map((e) => e.toLowerCase());
  const maxDays = eq.log_max_age_days ?? 30;
  const rawPath = (eq.log_path ?? "").trim();
  const pattern = (eq.log_filename_pattern ?? "").trim();
  const expandedPath = rawPath ? expand(rawPath, eq) : "";
  const target = expandedPath ? joinPath(storage.base_path, expandedPath) : storage.base_path;
  const re = pattern ? globToRegex(expand(pattern, eq)) : null;

  let entries: any[];
  try {
    entries = await sftp.list(target);
  } catch (e: any) {
    return { found: 0, upserted: 0, error: `Каталог ${target}: ${e?.message ?? e}` };
  }

  const cutoff = Date.now() - maxDays * 86_400_000;
  const files = entries
    .filter((f) => f.type === "-")
    .filter((f) => (re ? re.test(f.name) : true))
    .filter((f) => exts.length === 0 || exts.some((x) => f.name.toLowerCase().endsWith(x)))
    .filter((f) => (f.modifyTime ?? 0) >= cutoff);

  if (files.length === 0) return { found: 0, upserted: 0 };

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  const rows = files.map((f) => ({
    equipment_id: eq.id,
    storage_id: storage.id,
    filename: f.name,
    file_path: joinPath(target, f.name),
    size_bytes: f.size,
    file_mtime: new Date(f.modifyTime).toISOString(),
    status: "new",
    last_error: null,
  }));
  const { error } = await supabase
    .from("equipment_log_files")
    .upsert(rows, { onConflict: "equipment_id,file_path", ignoreDuplicates: false });
  if (error) return { found: files.length, upserted: 0, error: error.message };
  return { found: files.length, upserted: rows.length };
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  try {
    const body = await req.json().catch(() => ({}));
    const equipmentId: string | null = body.equipment_id ?? null;

    let q = supabase.from("equipment")
      .select("id,name,model,serial_number,log_storage_id,log_path,log_filename_pattern,log_extensions,log_max_age_days")
      .not("log_storage_id", "is", null);
    if (equipmentId) q = q.eq("id", equipmentId);
    const { data: equipment, error: eqErr } = await q;
    if (eqErr) throw eqErr;
    if (!equipment || equipment.length === 0) {
      return new Response(JSON.stringify({ ok: true, scanned: 0, message: "Нет оборудования с настроенным лог-хранилищем" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const byStorage = new Map<string, Equipment[]>();
    for (const e of equipment as Equipment[]) {
      if (!e.log_storage_id) continue;
      const arr = byStorage.get(e.log_storage_id) ?? [];
      arr.push(e); byStorage.set(e.log_storage_id, arr);
    }

    const { data: storages } = await supabase
      .from("backup_storage_connections").select("*")
      .in("id", Array.from(byStorage.keys())).eq("enabled", true);
    const storageMap = new Map((storages ?? []).map((s: any) => [s.id, s as Storage]));

    const results: any[] = [];
    for (const [sid, list] of byStorage) {
      const s = storageMap.get(sid);
      if (!s) {
        results.push({ storage_id: sid, error: "Хранилище отключено или удалено" });
        continue;
      }
      let sftp: SftpClient | null = null;
      try {
        sftp = await connect(s);
        for (const e of list) {
          const r = await scanForEquipment(sftp, s, e);
          results.push({ equipment_id: e.id, storage_id: sid, ...r });
        }
      } catch (e: any) {
        for (const eq of list) {
          results.push({ equipment_id: eq.id, storage_id: sid, error: `Подключение: ${e?.message ?? e}` });
        }
      } finally {
        try { if (sftp) await sftp.end(); } catch { /* ignore */ }
      }
    }

    return new Response(JSON.stringify({ ok: true, scanned: results.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: String(e?.message ?? e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
}