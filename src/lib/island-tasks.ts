/**
 * Global "Dynamic Island" task registry.
 *
 * Lets any module register a long-running operation (Seafile batch upload,
 * export, sync, …) so that progress stays visible in the top island even
 * after the user navigates away from the page that started it.
 *
 * Usage:
 *   const id = startIslandTask({ label: "Отправка в Seafile", kind: "seafile", total: 12 });
 *   updateIslandTask(id, { done: 3, message: "site-1.docx" });
 *   finishIslandTask(id, { status: "success", message: "12/12 готово" });
 */

import { useSyncExternalStore } from "react";

export type IslandTaskKind =
  | "seafile"
  | "export"
  | "sync"
  | "import"
  | "generic";

export type IslandTaskStatus = "running" | "success" | "error";

export interface IslandTask {
  id: string;
  label: string;
  kind: IslandTaskKind;
  /** 0..total. If total is null → indeterminate. */
  done: number;
  total: number | null;
  status: IslandTaskStatus;
  message?: string;
  startedAt: number;
  /** Optional click target. */
  href?: string;
}

const AUTO_DISMISS_MS = 6000;
let tasks: IslandTask[] = [];
const listeners = new Set<() => void>();

function emit() {
  // new reference so useSyncExternalStore detects change
  tasks = [...tasks];
  listeners.forEach((l) => l());
}

export function getIslandTasks(): IslandTask[] {
  return tasks;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

export function useIslandTasks(): IslandTask[] {
  return useSyncExternalStore(subscribe, getIslandTasks, getIslandTasks);
}

export function startIslandTask(opts: {
  label: string;
  kind?: IslandTaskKind;
  total?: number | null;
  href?: string;
  message?: string;
}): string {
  const id = `t_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  tasks.push({
    id,
    label: opts.label,
    kind: opts.kind ?? "generic",
    done: 0,
    total: opts.total ?? null,
    status: "running",
    message: opts.message,
    href: opts.href,
    startedAt: Date.now(),
  });
  emit();
  return id;
}

export function updateIslandTask(
  id: string,
  patch: Partial<Pick<IslandTask, "done" | "total" | "label" | "message" | "href">>,
) {
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) return;
  tasks[idx] = { ...tasks[idx], ...patch };
  emit();
}

export function finishIslandTask(
  id: string,
  result: { status: IslandTaskStatus; message?: string },
) {
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) return;
  tasks[idx] = { ...tasks[idx], status: result.status, message: result.message ?? tasks[idx].message };
  if (tasks[idx].total != null) {
    tasks[idx].done = tasks[idx].total ?? tasks[idx].done;
  }
  emit();
  window.setTimeout(() => {
    tasks = tasks.filter((t) => t.id !== id);
    emit();
  }, AUTO_DISMISS_MS);
}

export function dismissIslandTask(id: string) {
  tasks = tasks.filter((t) => t.id !== id);
  emit();
}