export function formatMetricValue(value: string | undefined, units: string | undefined): string {
  if (value === undefined || value === null || value === "") return "—";
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  if (units === "s" || units === "sec") {
    const sec = num;
    if (sec < 60) return `${sec.toFixed(0)}с`;
    if (sec < 3600) return `${Math.floor(sec / 60)}м ${(sec % 60).toFixed(0)}с`;
    if (sec < 86400) return `${Math.floor(sec / 3600)}ч ${Math.floor((sec % 3600) / 60)}м`;
    return `${Math.floor(sec / 86400)}д`;
  }
  if (units === "B") {
    if (num < 1024) return `${num.toFixed(0)} B`;
    if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
    if (num < 1024 * 1024 * 1024) return `${(num / (1024 * 1024)).toFixed(1)} MB`;
    return `${(num / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }
  if (units === "%") return `${num.toFixed(1)}%`;
  if (units === "bps") return `${(num / 1000).toFixed(0)} Kbps`;
  return `${num.toFixed(2)} ${units || ""}`.trim();
}

export function getMetricAge(lastclock: string | undefined): string {
  if (!lastclock) return "—";
  const ts = parseInt(lastclock) * 1000;
  if (isNaN(ts)) return "—";
  const diff = Date.now() - ts;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}с`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}м`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}ч`;
  const days = Math.floor(hours / 24);
  return `${days}д`;
}
