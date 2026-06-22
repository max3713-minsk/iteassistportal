// Проверка наличия и целостности файла бэкапа в SFTP-хранилище
// (поверх классического tftp-root: tftpd-hpa обычно кладёт файлы в /srv/tftp,
// доступ по SSH/SFTP к той же директории).
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import SftpClient from "npm:ssh2-sftp-client@10.0.3";
import { createHash } from "node:crypto";
import { Buffer } from "node:buffer";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

type Storage = {
  id: string; name: string; host: string; port: number; username: string;
  auth_method: "password" | "key"; password: string | null; private_key: string | null;
  base_path: string; enabled: boolean;
};

type Equipment = {
  id: string; name: string; model: string | null; serial_number: string | null;
  backup_storage_id: string | null; backup_path: string | null;
  backup_extensions: string[] | null; backup_max_age_hours: number | null;
  backup_min_size_kb: number | null;
  backup_md5_source: "sidecar" | "stored" | "none" | null;
  backup_md5_expected: string | null;
  backup_filename_pattern: string | null;
};

type CheckResult = {
  status: "ok" | "stale" | "missing" | "checksum_mismatch" | "error";
  file_path?: string; file_size?: number; file_mtime?: string;
  md5_actual?: string; md5_expected?: string; message?: string;
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
  // Экранируем спецсимволы regex, кроме * и ?, затем переводим * → .*, ? → .
  const escaped = glob.replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*")
    .replace(/\?/g, ".");
  return new RegExp("^" + escaped + "$", "i");
}
function md5OfBuffer(buf: Buffer): string {
  return createHash("md5").update(buf).digest("hex");
}

async function connect(storage: Storage): Promise<SftpClient> {
  const sftp = new SftpClient();
  await sftp.connect({
    host: storage.host,
    port: storage.port,
    username: storage.username,
    ...(storage.auth_method === "key" && storage.private_key
      ? { privateKey: storage.private_key }
      : { password: storage.password ?? "" }),
    readyTimeout: 15000,
  });
  return sftp;
}

async function checkOne(sftp: SftpClient, storage: Storage, eq: Equipment): Promise<CheckResult> {
  const exts = (eq.backup_extensions ?? []).map((e) => e.toLowerCase());
  const maxAgeH = eq.backup_max_age_hours ?? 24;
  const minSizeKb = eq.backup_min_size_kb ?? 1;
  const rawPath = (eq.backup_path ?? "").trim();
  const pattern = (eq.backup_filename_pattern ?? "").trim();

  if (!rawPath && !pattern) {
    return { status: "error", message: "Не задан путь или шаблон имени файла" };
  }

  // Базовый каталог для поиска. Пустой путь / '/' = корень хранилища.
  const expandedPath = rawPath ? expand(rawPath, eq) : "";
  const target = expandedPath ? joinPath(storage.base_path, expandedPath) : storage.base_path;

  let filePath = target;
  let stat: { size: number; modifyTime: number } | null = null;

  // Режим поиска: glob по шаблону имени, либо каталог (path/), либо точный файл.
  const useGlob = !!pattern;
  const isDirHint = useGlob || !rawPath || target.endsWith("/");

  try {
    if (isDirHint) {
      const list = await sftp.list(target);
      const re = useGlob ? globToRegex(expand(pattern, eq)) : null;
      const matches = list
        .filter((f) => f.type === "-")
        .filter((f) => (re ? re.test(f.name) : true))
        .filter((f) => exts.length === 0 || exts.some((e) => f.name.toLowerCase().endsWith(e)))
        .sort((a, b) => b.modifyTime - a.modifyTime);
      if (matches.length === 0) {
        const why = useGlob
          ? `В каталоге ${target} нет файлов по шаблону "${expand(pattern, eq)}"`
          : `В каталоге ${target} нет файлов с подходящим расширением`;
        return { status: "missing", file_path: target, message: why };
      }
      const f = matches[0];
      filePath = joinPath(target, f.name);
      stat = { size: f.size, modifyTime: f.modifyTime };
    } else {
      const exists = await sftp.exists(target);
      if (!exists) return { status: "missing", file_path: target, message: "Файл не найден" };
      const s = await sftp.stat(target);
      stat = { size: s.size, modifyTime: s.modifyTime };
    }
  } catch (e: any) {
    return { status: "error", file_path: target, message: `Ошибка чтения каталога: ${e?.message ?? e}` };
  }

  const mtime = new Date(stat.modifyTime);
  const ageH = (Date.now() - stat.modifyTime) / 3600_000;
  if (ageH > maxAgeH) {
    return { status: "stale", file_path: filePath, file_size: stat.size, file_mtime: mtime.toISOString(),
      message: `Файл устарел: ${Math.round(ageH)} ч > ${maxAgeH} ч` };
  }
  if (stat.size < minSizeKb * 1024) {
    return { status: "error", file_path: filePath, file_size: stat.size, file_mtime: mtime.toISOString(),
      message: `Файл слишком маленький: ${stat.size} байт < ${minSizeKb} КБ` };
  }

  // Скачиваем и считаем md5 (ограничим 256 MB, чтобы не выжрать память edge-runtime)
  if (stat.size > 256 * 1024 * 1024) {
    return { status: "ok", file_path: filePath, file_size: stat.size, file_mtime: mtime.toISOString(),
      message: "Файл >256 МБ, md5 пропущен" };
  }
  const buf = (await sftp.get(filePath)) as Buffer;
  const md5 = md5OfBuffer(buf);

  let md5Expected: string | undefined;
  if (eq.backup_md5_source === "stored" && eq.backup_md5_expected) {
    md5Expected = eq.backup_md5_expected.trim().toLowerCase();
  } else if (eq.backup_md5_source !== "none") {
    // sidecar (default)
    try {
      const sideBuf = (await sftp.get(filePath + ".md5")) as Buffer;
      md5Expected = sideBuf.toString("utf-8").trim().split(/\s+/)[0].toLowerCase();
    } catch {
      // нет сайдкара — пропускаем сверку, считаем ok
    }
  }
  if (md5Expected && md5Expected !== md5) {
    return { status: "checksum_mismatch", file_path: filePath, file_size: stat.size, file_mtime: mtime.toISOString(),
      md5_actual: md5, md5_expected: md5Expected, message: "MD5 не совпадает с эталоном" };
  }
  return { status: "ok", file_path: filePath, file_size: stat.size, file_mtime: mtime.toISOString(),
    md5_actual: md5, md5_expected: md5Expected };
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  try {
    const body = await req.json().catch(() => ({}));
    const action: "test" | "check_equipment" | "check_all" =
      body.action ?? (body.storage_id && !body.equipment_id ? "test"
        : body.equipment_id ? "check_equipment" : "check_all");
    const triggeredBy: string = body.triggered_by ?? "manual";

    if (action === "test") {
      const { data: storage, error } = await supabase
        .from("backup_storage_connections").select("*").eq("id", body.storage_id).single();
      if (error || !storage) throw new Error("Хранилище не найдено");
      const s = storage as Storage;
      try {
        const sftp = await connect(s);
        const list = await sftp.list(s.base_path);
        await sftp.end();
        await supabase.from("backup_storage_connections").update({
          last_checked_at: new Date().toISOString(), last_status: "ok", last_error: null,
        }).eq("id", s.id);
        return new Response(JSON.stringify({ ok: true, entries: list.length }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch (e: any) {
        await supabase.from("backup_storage_connections").update({
          last_checked_at: new Date().toISOString(), last_status: "error", last_error: String(e?.message ?? e),
        }).eq("id", s.id);
        return new Response(JSON.stringify({ ok: false, error: String(e?.message ?? e) }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // Загружаем оборудование с привязкой
    const filter = action === "check_equipment" ? body.equipment_id : null;
  let q = supabase.from("equipment").select("id,name,model,serial_number,backup_storage_id,backup_path,backup_filename_pattern,backup_extensions,backup_max_age_hours,backup_min_size_kb,backup_md5_source,backup_md5_expected")
      .not("backup_storage_id", "is", null)
      .or("backup_path.not.is.null,backup_filename_pattern.not.is.null");
    if (filter) q = q.eq("id", filter);
    const { data: equipment, error: eqErr } = await q;
    if (eqErr) throw eqErr;
    if (!equipment || equipment.length === 0) {
      return new Response(JSON.stringify({ ok: true, checked: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Группируем по хранилищу
    const byStorage = new Map<string, Equipment[]>();
    for (const e of equipment as Equipment[]) {
      if (!e.backup_storage_id) continue;
      const arr = byStorage.get(e.backup_storage_id) ?? [];
      arr.push(e); byStorage.set(e.backup_storage_id, arr);
    }

    const { data: storages } = await supabase
      .from("backup_storage_connections").select("*")
      .in("id", Array.from(byStorage.keys())).eq("enabled", true);
    const storageMap = new Map((storages ?? []).map((s: any) => [s.id, s as Storage]));

    const results: any[] = [];
    for (const [storageId, list] of byStorage) {
      const s = storageMap.get(storageId);
      if (!s) {
        for (const e of list) {
          const row = { equipment_id: e.id, storage_id: storageId, status: "error",
            message: "Хранилище отключено или удалено", triggered_by: triggeredBy };
          await supabase.from("equipment_backup_checks").insert(row);
          results.push(row);
        }
        continue;
      }
      let sftp: SftpClient | null = null;
      try {
        sftp = await connect(s);
        for (const e of list) {
          const r = await checkOne(sftp, s, e);
          const row = { equipment_id: e.id, storage_id: storageId, triggered_by: triggeredBy, ...r };
          await supabase.from("equipment_backup_checks").insert(row);
          results.push(row);
        }
      } catch (e: any) {
        for (const eq of list) {
          const row = { equipment_id: eq.id, storage_id: storageId, status: "error",
            message: `Подключение к хранилищу не удалось: ${e?.message ?? e}`, triggered_by: triggeredBy };
          await supabase.from("equipment_backup_checks").insert(row);
          results.push(row);
        }
      } finally {
        try { if (sftp) await sftp.end(); } catch { /* ignore */ }
      }
    }

    return new Response(JSON.stringify({ ok: true, checked: results.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: String(e?.message ?? e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
}
