import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, Clock, CheckCircle2 } from "lucide-react";

interface Props {
  deadline: string | null | undefined;
  status: string;
  compact?: boolean;
}

/**
 * Live countdown timer to SLA deadline.
 * Color-coded urgency:
 * - green: > 50% of original window (we approximate via remaining)
 * - amber: < 30 min remaining
 * - red:   < 5 min remaining or expired
 */
export function SLATimer({ deadline, status, compact }: Props) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!deadline) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [deadline]);

  if (!deadline) return null;

  // Frozen states — don't tick
  const frozen = ["closed", "cancelled", "resolved"].includes(status);
  const target = new Date(deadline).getTime();
  const diffMs = target - now;
  const expired = diffMs <= 0;

  if (frozen) {
    return (
      <span className={cn("inline-flex items-center gap-1 text-xs", compact && "text-[11px]")}>
        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
        <span className="text-muted-foreground">SLA не активен</span>
      </span>
    );
  }

  const absMs = Math.abs(diffMs);
  const totalSec = Math.floor(absMs / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  let parts: string;
  if (days > 0) parts = `${days}д ${hours}ч ${minutes}м`;
  else if (hours > 0) parts = `${hours}ч ${minutes}м ${seconds.toString().padStart(2, "0")}с`;
  else parts = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  let tone: string;
  let Icon = Clock;
  if (expired) {
    tone = "text-destructive border-destructive/40 bg-destructive/10";
    Icon = AlertTriangle;
  } else if (diffMs < 10 * 60 * 1000) {
    tone = "text-destructive border-destructive/40 bg-destructive/10 animate-pulse";
  } else if (diffMs < 30 * 60 * 1000) {
    tone = "text-amber-600 dark:text-amber-400 border-amber-500/40 bg-amber-500/10";
  } else if (diffMs < 2 * 60 * 60 * 1000) {
    tone = "text-yellow-600 dark:text-yellow-400 border-yellow-500/40 bg-yellow-500/10";
  } else {
    tone = "text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/5";
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono tabular-nums",
        compact ? "text-[11px]" : "text-xs",
        tone,
      )}
      title={expired ? `SLA просрочен на ${parts}` : `Осталось ${parts}`}
    >
      <Icon className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {expired ? `−${parts}` : parts}
    </span>
  );
}
