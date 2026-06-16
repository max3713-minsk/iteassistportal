/** Возвращает true, если задача регламента подразумевает проверку резервной копии. */
export function isBackupTask(title?: string | null, description?: string | null): boolean {
  const t = `${title ?? ""} ${description ?? ""}`.toLowerCase();
  if (!t.trim()) return false;
  return /(бэкап|бекап|резерв\w*\s*копи|резерв\w*\s*сохран|\bbackup\w*\b|\bdump\b|\barchive\b)/i.test(t);
}