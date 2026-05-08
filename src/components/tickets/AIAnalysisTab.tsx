import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, RefreshCw, Loader2, Clock, AlertTriangle, CheckCircle2, GitCompare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Cause = { rank: number; cause: string; probability: string; rationale: string };
type Analysis = {
  probable_causes?: Cause[];
  first_steps?: string[];
  estimated_minutes?: number;
  escalation_needed?: boolean;
  escalation_reason?: string | null;
  similar_pattern?: string | null;
  error?: string;
  raw?: string;
  _cached?: boolean;
  _model?: string;
};

const PROB_STYLE: Record<string, { bar: string; badge: string }> = {
  "высокая": { bar: "bg-destructive", badge: "bg-destructive/15 text-destructive border-destructive/30" },
  "средняя": { bar: "bg-amber-500", badge: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30" },
  "низкая":  { bar: "bg-muted-foreground/40", badge: "bg-muted text-muted-foreground border-border" },
};

export function AIAnalysisTab({ ticketId }: { ticketId: string }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  const { data: cached, isLoading } = useQuery({
    queryKey: ["ticket-ai", ticketId],
    queryFn: async () => {
      const { data } = await supabase
        .from("ticket_ai_analyses" as any)
        .select("analysis, model, updated_at")
        .eq("ticket_id", ticketId).maybeSingle();
      return data as any;
    },
  });

  const runMutation = useMutation({
    mutationFn: async (force: boolean) => {
      const { data, error } = await supabase.functions.invoke("ai-incident-analyst", {
        body: { ticket_id: ticketId, force },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data as Analysis;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ticket-ai", ticketId] });
      toast({ title: "Анализ обновлён" });
    },
    onError: (e: any) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  });

  const analysis: Analysis | null = (cached?.analysis as any) ?? null;

  if (isLoading) return <div className="space-y-3 mt-4"><Skeleton className="h-24" /><Skeleton className="h-24" /></div>;

  if (!analysis) {
    return (
      <div className="mt-6 flex flex-col items-center justify-center py-12 text-center space-y-4">
        <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
          <Sparkles className="h-7 w-7 text-primary" />
        </div>
        <div>
          <p className="font-semibold">ИИ-анализ инцидента</p>
          <p className="text-sm text-muted-foreground max-w-md mt-1">
            Автоматический разбор похожих инцидентов, гипотезы причин и чеклист первых шагов.
          </p>
        </div>
        <Button onClick={() => runMutation.mutate(false)} disabled={runMutation.isPending} className="gap-2">
          {runMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {runMutation.isPending ? "ИИ анализирует инцидент..." : "Запустить анализ"}
        </Button>
      </div>
    );
  }

  if (analysis.error) {
    return (
      <div className="mt-4 space-y-3">
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <p className="font-semibold text-destructive">Ошибка разбора</p>
          <p className="text-muted-foreground mt-1">{analysis.error}</p>
          {analysis.raw && <pre className="mt-2 text-xs overflow-x-auto opacity-70">{analysis.raw.slice(0, 400)}</pre>}
        </div>
        <Button variant="outline" size="sm" onClick={() => runMutation.mutate(true)} disabled={runMutation.isPending} className="gap-2">
          <RefreshCw className={cn("h-4 w-4", runMutation.isPending && "animate-spin")} />Повторить
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-5 max-h-[60vh] overflow-y-auto pr-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {typeof analysis.estimated_minutes === "number" && (
            <Badge variant="outline" className="gap-1.5"><Clock className="h-3 w-3" />~{analysis.estimated_minutes} мин</Badge>
          )}
          {analysis.escalation_needed ? (
            <Badge className="gap-1.5 bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 border" variant="outline">
              <AlertTriangle className="h-3 w-3" />Требует эскалации
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1.5 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
              <CheckCircle2 className="h-3 w-3" />Эскалация не требуется
            </Badge>
          )}
          {analysis.similar_pattern && (
            <Badge variant="outline" className="gap-1.5"><GitCompare className="h-3 w-3" />Паттерн</Badge>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={() => runMutation.mutate(true)} disabled={runMutation.isPending} className="gap-1.5">
          <RefreshCw className={cn("h-3.5 w-3.5", runMutation.isPending && "animate-spin")} />Пересчитать
        </Button>
      </div>

      {analysis.escalation_reason && (
        <div className="text-xs text-muted-foreground bg-amber-500/5 border border-amber-500/20 rounded-md p-2">
          <strong className="text-amber-700 dark:text-amber-400">Причина эскалации:</strong> {analysis.escalation_reason}
        </div>
      )}
      {analysis.similar_pattern && (
        <div className="text-xs text-muted-foreground bg-muted/40 border rounded-md p-2">
          <strong className="text-foreground">Паттерн:</strong> {analysis.similar_pattern}
        </div>
      )}

      <div>
        <h4 className="text-sm font-semibold mb-2">Вероятные причины</h4>
        <div className="space-y-2">
          {(analysis.probable_causes ?? []).map((c, i) => {
            const style = PROB_STYLE[c.probability?.toLowerCase()] ?? PROB_STYLE["низкая"];
            return (
              <div key={i} className="relative rounded-lg border bg-card overflow-hidden">
                <div className={cn("absolute left-0 top-0 bottom-0 w-1", style.bar)} />
                <div className="p-3 pl-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-semibold text-muted-foreground">Причина #{c.rank}</div>
                    <Badge variant="outline" className={cn("text-xs", style.badge)}>{c.probability}</Badge>
                  </div>
                  <div className="font-medium text-sm mt-1">{c.cause}</div>
                  <div className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{c.rationale}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold mb-2">Первые шаги</h4>
        <div className="space-y-1.5">
          {(analysis.first_steps ?? []).map((s, i) => {
            const isChecked = !!checked[i];
            return (
              <button
                key={i}
                type="button"
                onClick={() => setChecked((p) => ({ ...p, [i]: !p[i] }))}
                className={cn(
                  "w-full text-left flex items-start gap-2.5 rounded-md border p-2.5 transition-all hover:bg-muted/50",
                  isChecked && "bg-emerald-500/5 border-emerald-500/30",
                )}
              >
                <div className={cn(
                  "h-4 w-4 mt-0.5 shrink-0 rounded border flex items-center justify-center",
                  isChecked ? "bg-emerald-500 border-emerald-500" : "border-input",
                )}>
                  {isChecked && <CheckCircle2 className="h-3 w-3 text-white" />}
                </div>
                <div className={cn("text-sm", isChecked && "line-through text-muted-foreground")}>
                  <span className="font-mono text-xs text-muted-foreground mr-1.5">{i + 1}.</span>{s}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {cached?.updated_at && (
        <p className="text-[10px] text-muted-foreground/70 text-right">
          Модель: {cached.model} · обновлено {new Date(cached.updated_at).toLocaleString("ru-RU")}
        </p>
      )}
    </div>
  );
}