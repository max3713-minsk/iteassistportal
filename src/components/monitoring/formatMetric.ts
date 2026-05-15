/**
 * Унифицированное форматирование значений метрик Zabbix.
 * Поддерживает байты (B/KB/MB/GB/TB/PB), битрейт (bps/Kbps/Mbps/Gbps),
 * частоту (Hz/KHz/MHz/GHz), время (uptime, response time), проценты,
 * температуру и обычные числа.
 *
 * ВАЖНО: некоторые метрики Zabbix приходят в "сырых" единицах
 * (например `system.cpu.util` иногда возвращает доли в наносекундах),
 * поэтому процентные значения клампируются к диапазону 0–100.
 */

const BIN_BYTE_UNITS = ["B", "KB", "MB", "GB", "TB", "PB", "EB"];
const BIT_UNITS = ["bps", "Kbps", "Mbps", "Gbps", "Tbps"];
const SI_UNITS = ["", "K", "M", "G", "T", "P"];

function isPercentKey(key?: string, name?: string) {
  const s = `${key || ""} ${name || ""}`.toLowerCase();
  return /(\butil\b|pused|percent|%|загруж|использ|заполн)/.test(s);
}

function isByteUnit(u?: string) {
  if (!u) return false;
  const s = u.trim().toLowerCase();
  return s === "b" || s === "byte" || s === "bytes" || s === "байт" ||
         s === "kb" || s === "mb" || s === "gb" || s === "tb";
}

function isBitRate(u?: string) {
  if (!u) return false;
  const s = u.trim().toLowerCase();
  return s === "bps" || s === "bits/s" || s === "bit/s" || s === "b/s" ||
         s === "kbps" || s === "mbps" || s === "gbps";
}

function isHz(u?: string) {
  if (!u) return false;
  const s = u.trim().toLowerCase();
  return s === "hz" || s === "khz" || s === "mhz" || s === "ghz";
}

function isUptime(u?: string, key?: string) {
  if (u && u.trim().toLowerCase() === "uptime") return true;
  return /uptime|время.*работ/i.test(key || "");
}

function isSeconds(u?: string) {
  if (!u) return false;
  const s = u.trim().toLowerCase();
  return s === "s" || s === "sec" || s === "seconds" || s === "с";
}

function trim(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return "—";
  if (Math.abs(n) >= 100) return n.toFixed(0);
  if (Math.abs(n) >= 10) return n.toFixed(1);
  return n.toFixed(digits);
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes)) return "—";
  const sign = bytes < 0 ? "-" : "";
  let n = Math.abs(bytes);
  let i = 0;
  while (n >= 1024 && i < BIN_BYTE_UNITS.length - 1) { n /= 1024; i++; }
  return `${sign}${trim(n)} ${BIN_BYTE_UNITS[i]}`;
}

function formatBits(bps: number): string {
  if (!Number.isFinite(bps)) return "—";
  const sign = bps < 0 ? "-" : "";
  let n = Math.abs(bps);
  let i = 0;
  while (n >= 1000 && i < BIT_UNITS.length - 1) { n /= 1000; i++; }
  return `${sign}${trim(n)} ${BIT_UNITS[i]}`;
}

function formatSI(n: number, suffix: string): string {
  if (!Number.isFinite(n)) return "—";
  const sign = n < 0 ? "-" : "";
  let v = Math.abs(n);
  let i = 0;
  while (v >= 1000 && i < SI_UNITS.length - 1) { v /= 1000; i++; }
  return `${sign}${trim(v)} ${SI_UNITS[i]}${suffix}`;
}

function formatUptimeSeconds(s: number): string {
  if (!Number.isFinite(s) || s < 0) return "—";
  const sec = Math.floor(s);
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (d > 0) return `${d}д ${h}ч`;
  if (h > 0) return `${h}ч ${m}м`;
  if (m > 0) return `${m}м ${sec % 60}с`;
  return `${sec}с`;
}

function formatDurationSeconds(s: number): string {
  if (!Number.isFinite(s)) return "—";
  if (s < 1e-3) return `${(s * 1e6).toFixed(0)} мкс`;
  if (s < 1) return `${(s * 1000).toFixed(0)} мс`;
  if (s < 60) return `${trim(s)} с`;
  return formatUptimeSeconds(s);
}

export interface ZabbixLikeItem {
  lastvalue?: string | number | null;
  units?: string | null;
  key_?: string | null;
  name?: string | null;
  /** Unix-time строки от Zabbix (последнее обновление). */
  lastclock?: string | number | null;
}

/** Порог «свежести» метрики в секундах. Старее — считаем N/A. */
export const METRIC_STALE_SECONDS = 5 * 60;

/** Метрика считается «несвежей», если lastclock старше METRIC_STALE_SECONDS. */
export function isStale(item?: ZabbixLikeItem | null, maxAgeSec: number = METRIC_STALE_SECONDS): boolean {
  if (!item) return true;
  const ts = item.lastclock != null ? parseInt(String(item.lastclock)) : NaN;
  if (!Number.isFinite(ts) || ts <= 0) return true;
  return Date.now() / 1000 - ts > maxAgeSec;
}

/** Возвращает человекочитаемый возраст последнего значения, например «3 ч 12 м назад». */
export function ageLabel(item?: ZabbixLikeItem | null): string {
  const ts = item?.lastclock != null ? parseInt(String(item.lastclock)) : NaN;
  if (!Number.isFinite(ts) || ts <= 0) return "никогда";
  const diff = Math.max(0, Math.floor(Date.now() / 1000 - ts));
  if (diff < 60) return `${diff} с назад`;
  if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
  return `${Math.floor(diff / 86400)} дн назад`;
}

/**
 * Главная функция: получает Zabbix-подобный item и возвращает
 * красиво отформатированную строку с единицами измерения.
 */
export function formatItemValue(item?: ZabbixLikeItem | null): string {
  if (!item || item.lastvalue == null || item.lastvalue === "") return "—";
  const raw = typeof item.lastvalue === "number" ? item.lastvalue : parseFloat(String(item.lastvalue));
  if (Number.isNaN(raw)) return String(item.lastvalue).slice(0, 20);

  const u = (item.units || "").trim();
  const key = item.key_ || "";
  const name = item.name || "";

  // Процент: всегда 0–100, защищаем от мусорных значений
  if (u === "%" || isPercentKey(key, name)) {
    let v = raw;
    // Некоторые экспортёры дают долю 0..1
    if (v > 0 && v <= 1 && /\butil\b|fraction|ratio/i.test(key + name)) v *= 100;
    // Любое значение >100 или <0 для процента — аномалия, клампим
    if (v > 100) v = 100;
    if (v < 0) v = 0;
    return `${v.toFixed(1)} %`;
  }

  if (isUptime(u, key)) return formatUptimeSeconds(raw);
  if (isSeconds(u)) return formatDurationSeconds(raw);

  if (isByteUnit(u)) {
    // Если в Zabbix уже не "B", считаем что значение уже в этой единице
    const lc = u.toLowerCase();
    const mult = lc === "kb" ? 1024 : lc === "mb" ? 1024 ** 2 : lc === "gb" ? 1024 ** 3 : lc === "tb" ? 1024 ** 4 : 1;
    return formatBytes(raw * mult);
  }
  if (isBitRate(u)) {
    const lc = u.toLowerCase();
    const mult = lc === "kbps" ? 1e3 : lc === "mbps" ? 1e6 : lc === "gbps" ? 1e9 : 1;
    return formatBits(raw * mult);
  }
  if (isHz(u)) {
    const lc = u.toLowerCase();
    const mult = lc === "khz" ? 1e3 : lc === "mhz" ? 1e6 : lc === "ghz" ? 1e9 : 1;
    return formatSI(raw * mult, "Hz");
  }

  // Универсальный fallback — большое число с SI префиксом + единица как есть
  if (Math.abs(raw) >= 1000 && !u) return formatSI(raw, "");
  return `${trim(raw)}${u ? " " + u : ""}`;
}

/** Только числовое значение в процентах (0..100, с клампом). null если нет. */
export function toPercent(item?: ZabbixLikeItem | null): number | null {
  if (!item || item.lastvalue == null) return null;
  const raw = parseFloat(String(item.lastvalue));
  if (Number.isNaN(raw)) return null;
  let v = raw;
  if (v > 0 && v <= 1) v *= 100;
  if (v > 100) v = 100;
  if (v < 0) v = 0;
  return v;
}

/** Цвет для процента: >=90 — destructive, >=75 — warning, иначе ok. */
export function percentColor(v: number | null): string {
  if (v == null) return "text-muted-foreground";
  if (v >= 90) return "text-destructive";
  if (v >= 75) return "text-amber-500";
  return "text-emerald-500";
}

/** Форматирование одиночного числа (для графиков, экспорта). */
export function formatRaw(value: number | string, units?: string): string {
  return formatItemValue({ lastvalue: value, units });
}
