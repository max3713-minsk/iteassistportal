/** Возвращает true, если задача регламента подразумевает анализ логов. */
export function isLogAnalysisTask(title?: string | null, description?: string | null): boolean {
  const t = `${title ?? ""} ${description ?? ""}`.toLowerCase();
  if (!t.trim()) return false;
  return /(\bлог\w*\b|\bжурнал\w*\b|\blogs?\b|\blog[-_ ]?file\w*\b|syslog|journal)/i.test(t);
}