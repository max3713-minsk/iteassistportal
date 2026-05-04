import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { NODE_INFO, NodeKind } from "./nodeTypes";
import { cn } from "@/lib/utils";

export type DeviceNodeData = {
  label: string;
  kind: NodeKind;
  subtitle?: string;
  status?: "ok" | "problem" | "down" | "unknown";
};

const statusRing: Record<NonNullable<DeviceNodeData["status"]>, string> = {
  ok: "ring-emerald-500/60 shadow-emerald-500/20",
  problem: "ring-amber-500/70 shadow-amber-500/30",
  down: "ring-destructive/70 shadow-destructive/40 animate-pulse",
  unknown: "ring-border shadow-none",
};

const statusDot: Record<NonNullable<DeviceNodeData["status"]>, string> = {
  ok: "bg-emerald-500",
  problem: "bg-amber-500 animate-pulse",
  down: "bg-destructive animate-pulse",
  unknown: "bg-muted-foreground/40",
};

function DeviceNodeBase({ data, selected }: NodeProps) {
  const d = data as unknown as DeviceNodeData;
  const info = NODE_INFO[d.kind] ?? NODE_INFO.generic;
  const Icon = info.icon;
  const status = d.status ?? "unknown";

  if (d.kind === "zone") {
    return (
      <div
        className={cn(
          "rounded-2xl border-2 border-dashed bg-muted/20 backdrop-blur-sm px-5 py-3 min-w-[260px] min-h-[160px] relative",
          selected ? "border-primary" : "border-border/60",
        )}
        style={{ width: 360, height: 220 }}
      >
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Icon className="h-3.5 w-3.5" />
          {d.label}
        </div>
        {d.subtitle && <div className="text-[11px] text-muted-foreground/70 mt-0.5">{d.subtitle}</div>}
        <Handle type="source" position={Position.Right} className="!bg-transparent !border-0" />
        <Handle type="target" position={Position.Left} className="!bg-transparent !border-0" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group relative rounded-xl border bg-card text-card-foreground shadow-sm transition-all px-3 py-2.5 min-w-[160px]",
        "ring-2 ring-offset-2 ring-offset-background shadow-lg",
        statusRing[status],
        selected && "border-primary",
      )}
    >
      {/* Status dot */}
      <span className={cn("absolute -top-1 -right-1 h-3 w-3 rounded-full ring-2 ring-background", statusDot[status])} />

      <div className="flex items-start gap-2.5">
        <div
          className="h-9 w-9 shrink-0 rounded-lg flex items-center justify-center"
          style={{ background: `hsl(${info.accent} / 0.15)`, color: `hsl(${info.accent})` }}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold leading-tight truncate">{d.label || info.label}</div>
          <div className="text-[11px] text-muted-foreground truncate">{d.subtitle ?? info.label}</div>
        </div>
      </div>

      <Handle type="target" position={Position.Top} className="!h-2 !w-2 !bg-primary !border-background" />
      <Handle type="source" position={Position.Bottom} className="!h-2 !w-2 !bg-primary !border-background" />
      <Handle type="target" position={Position.Left} id="l" className="!h-2 !w-2 !bg-primary !border-background" />
      <Handle type="source" position={Position.Right} id="r" className="!h-2 !w-2 !bg-primary !border-background" />
    </div>
  );
}

export const DeviceNode = memo(DeviceNodeBase);
