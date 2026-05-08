import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HealthResult, HEALTH_GRADE_CONFIG } from "@/lib/health-score";
import { cn } from "@/lib/utils";

export function HealthIndicator({ result, compact = false }: { result: HealthResult; compact?: boolean }) {
  const cfg = HEALTH_GRADE_CONFIG[result.grade];
  const filled = Math.round(result.score / 20); // 0..5
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("inline-flex items-center gap-2 cursor-help select-none", compact && "gap-1.5")}>
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  className={cn("h-2 w-2 rounded-full", i < filled ? "" : "bg-muted")}
                  style={i < filled ? { background: cfg.color } : undefined}
                />
              ))}
            </div>
            <span className="text-xs font-mono tabular-nums w-7 text-right" style={{ color: cfg.color }}>{result.score}</span>
            {!compact && <span className="text-xs text-muted-foreground">{cfg.label}</span>}
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="font-semibold mb-1.5" style={{ color: cfg.color }}>
            {cfg.label} · {result.score}/100
          </div>
          {result.factors.length === 0 ? (
            <div className="text-xs text-muted-foreground">Все показатели в норме</div>
          ) : (
            <ul className="space-y-1">
              {result.factors.map((f, i) => (
                <li key={i} className="text-xs flex justify-between gap-3">
                  <span>
                    <span className="font-medium">{f.name}</span>
                    <span className="text-muted-foreground"> — {f.description}</span>
                  </span>
                  <span className="text-destructive font-mono">{f.impact}</span>
                </li>
              ))}
            </ul>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}