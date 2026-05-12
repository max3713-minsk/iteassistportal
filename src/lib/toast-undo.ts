import { toast } from "sonner";

/**
 * Schedules a "destructive" action with an undo window.
 * The action only executes after `delayMs` unless the user clicks Undo.
 *
 * Useful for: closing a ticket, deleting a row, archiving — anything reversible
 * via a short window without yet writing to the database.
 */
export function toastWithUndo(opts: {
  message: string;
  description?: string;
  delayMs?: number;
  onCommit: () => void | Promise<void>;
  onUndo?: () => void;
}) {
  const delay = opts.delayMs ?? 5000;
  let cancelled = false;

  const timer = setTimeout(async () => {
    if (cancelled) return;
    try {
      await opts.onCommit();
    } catch (e: any) {
      toast.error("Не удалось выполнить действие", { description: e?.message });
    }
  }, delay);

  toast(opts.message, {
    description: opts.description,
    duration: delay,
    action: {
      label: "Отменить",
      onClick: () => {
        cancelled = true;
        clearTimeout(timer);
        opts.onUndo?.();
        toast.success("Действие отменено");
      },
    },
  });
}

/**
 * Same as toastWithUndo but commits immediately and lets the caller register
 * a rollback. Use when you need the UI to reflect the change instantly.
 */
export function toastWithRollback(opts: {
  message: string;
  description?: string;
  delayMs?: number;
  onRollback: () => void | Promise<void>;
}) {
  const delay = opts.delayMs ?? 5000;
  toast(opts.message, {
    description: opts.description,
    duration: delay,
    action: {
      label: "Отменить",
      onClick: async () => {
        try {
          await opts.onRollback();
          toast.success("Действие отменено");
        } catch (e: any) {
          toast.error("Откат не удался", { description: e?.message });
        }
      },
    },
  });
}