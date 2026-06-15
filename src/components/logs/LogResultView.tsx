import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export type LogSeverity = "info" | "warning" | "error" | "critical" | "debug";

export interface LogEntry {
  ts?: string;
  severity: LogSeverity;
  original: string;
  translated?: string;
}

export interface LogAnalysis {
  summary?: string;
  recommendations?: string[];
  severity_counts?: Partial<Record<LogSeverity, number>>;
  entries?: LogEntry[];
}

const sevClass: Record<string, string> = {
  critical: "bg-destructive text-destructive-foreground",
  error: "bg-red-500 text-white",
  warning: "bg-amber-500 text-black",
  info: "bg-sky-500 text-white",
  debug: "bg-muted text-foreground",
};

export function LogResultView({ analysis }: { analysis: LogAnalysis }) {
  const counts = analysis.severity_counts ?? {};
  const entries = analysis.entries ?? [];
  return (
    <div className="space-y-4">
      {analysis.summary && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Резюме</p>
          <p className="text-sm whitespace-pre-wrap">{analysis.summary}</p>
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        {(["critical", "error", "warning", "info", "debug"] as LogSeverity[]).map((s) =>
          (counts[s] ?? 0) > 0 ? (
            <Badge key={s} className={`text-[10px] ${sevClass[s]}`}>
              {counts[s]} {s.toUpperCase()}
            </Badge>
          ) : null,
        )}
      </div>
      {analysis.recommendations && analysis.recommendations.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Рекомендации</p>
          <ul className="list-disc pl-5 text-sm space-y-1">
            {analysis.recommendations.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </div>
      )}
      {entries.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Записи ({entries.length})</p>
          <ScrollArea className="h-64 rounded-md border">
            <ul className="divide-y">
              {entries.map((e, i) => (
                <li key={i} className="px-3 py-2 text-xs">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Badge className={`text-[9px] ${sevClass[e.severity] ?? sevClass.info}`}>
                      {e.severity.toUpperCase()}
                    </Badge>
                    {e.ts && <span className="text-muted-foreground">{e.ts}</span>}
                  </div>
                  <p className="font-mono break-all whitespace-pre-wrap">{e.original}</p>
                  {e.translated && e.translated !== e.original && (
                    <p className="text-muted-foreground mt-0.5">{e.translated}</p>
                  )}
                </li>
              ))}
            </ul>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

export default LogResultView;