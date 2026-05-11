import * as React from "react";
import { cn } from "@/lib/utils";
import {
  AlertCircle, Clock, Loader2, Pause, CheckCircle2, XCircle,
  Circle, AlertTriangle, ShieldCheck, Wifi, WifiOff, type LucideIcon,
} from "lucide-react";

type Tone =
  | "open" | "progress" | "waiting" | "done" | "closed" | "overdue"
  | "pending" | "warning" | "critical" | "neutral" | "online" | "offline" | "info";

const TONE: Record<Tone, { bg: string; text: string; icon: LucideIcon }> = {
  open:     { bg: "bg-red-500/15 border-red-500/30",         text: "text-red-500",     icon: AlertCircle },
  overdue:  { bg: "bg-red-600/20 border-red-600/40",         text: "text-red-500",     icon: AlertTriangle },
  critical: { bg: "bg-red-600/20 border-red-600/40",         text: "text-red-500",     icon: AlertTriangle },
  progress: { bg: "bg-blue-500/15 border-blue-500/30",       text: "text-blue-400",    icon: Loader2 },
  waiting:  { bg: "bg-yellow-500/15 border-yellow-500/30",   text: "text-yellow-500",  icon: Pause },
  pending:  { bg: "bg-yellow-500/15 border-yellow-500/30",   text: "text-yellow-500",  icon: Clock },
  warning:  { bg: "bg-orange-500/15 border-orange-500/30",   text: "text-orange-500",  icon: AlertTriangle },
  done:     { bg: "bg-emerald-500/15 border-emerald-500/30", text: "text-emerald-500", icon: CheckCircle2 },
  closed:   { bg: "bg-muted/60 border-border",               text: "text-muted-foreground", icon: ShieldCheck },
  neutral:  { bg: "bg-muted/60 border-border",               text: "text-foreground/70", icon: Circle },
  online:   { bg: "bg-emerald-500/15 border-emerald-500/30", text: "text-emerald-500", icon: Wifi },
  offline:  { bg: "bg-red-500/15 border-red-500/30",         text: "text-red-500",     icon: WifiOff },
  info:     { bg: "bg-blue-500/15 border-blue-500/30",       text: "text-blue-400",    icon: Circle },
};

interface StatusPillProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone: Tone;
  label: string;
  icon?: LucideIcon;
  size?: "xs" | "sm" | "md";
  spin?: boolean;
}

/**
 * Unified status badge with semantic icons (not just colour).
 * Use everywhere a coloured chip would otherwise sit.
 */
export function StatusPill({ tone, label, icon, size = "sm", spin, className, ...rest }: StatusPillProps) {
  const t = TONE[tone];
  const Icon = icon ?? t.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-medium whitespace-nowrap",
        t.bg, t.text,
        size === "xs" && "px-1.5 py-0 text-[10px] gap-0.5",
        size === "sm" && "px-2 py-0.5 text-[11px]",
        size === "md" && "px-2.5 py-1 text-xs",
        className,
      )}
      {...rest}
    >
      <Icon className={cn("h-3 w-3", spin && "animate-spin")} />
      <span>{label}</span>
    </span>
  );
}