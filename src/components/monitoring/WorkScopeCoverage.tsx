import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { BarChart3, ScrollText, CheckCircle2, XCircle, Search, ListChecks, Activity, ExternalLink } from "lucide-react";
import { Hand } from "lucide-react";
import { isLogAnalysisTask } from "@/lib/log-task-detect";
import { frequencyLabels, type FrequencyType } from "@/lib/schedule-utils";
import MetricGraphDialog from "@/components/monitoring/MetricGraphDialog";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface MetricBinding {
  hostid: string; host_name: string;
  itemid: string; item_key: string; item_name: string;
  units?: string; time_range?: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  frequency: FrequencyType;
  category_id: string | null;
  is_active: boolean;
  include_in_protocol: boolean;
  metric_bindings: MetricBinding[];
  manual_coverage: boolean;
  manual_coverage_note: string | null;
}

type Status = "metric" | "logs" | "manual" | "none";

function statusOf(t: Task): Status {
  if ((t.metric_bindings?.length ?? 0) > 0) return "metric";
  if (isLogAnalysisTask(t.title, t.description)) return "logs";
  if (t.manual_coverage) return "manual";
  return "none";
}

export default function WorkScopeCoverage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Status>("all");
  const [graphFor, setGraphFor] = useState<MetricBinding | null>(null);

  const { data: tasks = [] } = useQuery({
    queryKey: ["ws-coverage-tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_tasks")
        .select("id, title, description, frequency, category_id, is_active, include_in_protocol, metric_bindings, manual_coverage, manual_coverage_note")
        .eq("is_active", true)
        .order("title");
      if (error) throw error;
      return ((data ?? []) as any[]).map((t) => ({
        ...t,
        metric_bindings: Array.isArray(t.metric_bindings) ? t.metric_bindings : [],
        manual_coverage: !!t.manual_coverage,
        manual_coverage_note: t.manual_coverage_note ?? null,
      })) as Task[];
    },
  });

  const { data: cats = [] } = useQuery({
    queryKey: ["ws-coverage-cats"],
    queryFn: async () => {
      const { data } = await supabase.from("equipment_categories").select("id, name");
      return data ?? [];
    },
  });

  const stats = useMemo(() => {
    const total = tasks.length;
    let metric = 0, logs = 0, manual = 0;
    for (const t of tasks) {
      const s = statusOf(t);
      if (s === "metric") metric++;
      else if (s === "logs") logs++;
      else if (s === "manual") manual++;
    }
    const covered = metric + logs + manual;
    const percent = total ? Math.round((covered / total) * 100) : 0;
    return { total, metric, logs, manual, none: total - covered, percent };
  }, [tasks]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter((t) => {
      if (q && !t.title.toLowerCase().includes(q) && !(t.description ?? "").toLowerCase().includes(q)) return false;
      if (statusFilter !== "all" && statusOf(t) !== statusFilter) return false;
      return true;
    });
  }, [tasks, search, statusFilter]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-primary" />
            Покрытие состава работ: {stats.percent}%
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Пункт регламента считается покрытым, если к нему привязана хотя бы одна Zabbix-метрика или он подразумевает анализ логов
            (по ключевым словам «лог/журнал/log»). Управляйте привязками в разделе{" "}
            <Link to="/work-scope" className="underline">«Регламент работ»</Link>.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <Progress value={stats.percent} className="h-3" />
          <div className="grid grid-cols-5 gap-3 text-center">
            <Stat n={stats.metric} label="По метрикам" color="text-emerald-500" Icon={BarChart3} />
            <Stat n={stats.logs} label="По логам" color="text-sky-500" Icon={ScrollText} />
            <Stat n={stats.manual} label="Вручную" color="text-violet-500" Icon={Hand} />
            <Stat n={stats.none} label="Не покрыто" color="text-muted-foreground" Icon={XCircle} />
            <Stat n={stats.total} label="Всего работ" color="text-foreground" Icon={Activity} />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск по работе..." className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value="metric">По метрикам</SelectItem>
            <SelectItem value="logs">По логам</SelectItem>
            <SelectItem value="manual">Покрыто вручную</SelectItem>
            <SelectItem value="none">Не покрыто</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Работа</TableHead>
                <TableHead className="w-[140px]">Периодичность</TableHead>
                <TableHead className="w-[160px]">Категория</TableHead>
                <TableHead className="w-[120px]">Статус</TableHead>
                <TableHead>Привязанные метрики</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.slice(0, 300).map((t) => {
                const s = statusOf(t);
                const cat = cats.find((c: any) => c.id === t.category_id);
                return (
                  <TableRow key={t.id}>
                    <TableCell>
                      <p className="text-sm font-medium">{t.title}</p>
                      {t.description && <p className="text-xs text-muted-foreground line-clamp-1">{t.description}</p>}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{frequencyLabels[t.frequency]}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{(cat as any)?.name ?? "—"}</TableCell>
                    <TableCell>
                      {s === "metric" && (
                        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 gap-1 text-[10px]"><CheckCircle2 className="h-3 w-3" /> Покрыто</Badge>
                      )}
                      {s === "logs" && (
                        <Badge className="bg-sky-500/15 text-sky-600 dark:text-sky-400 gap-1 text-[10px]"><ScrollText className="h-3 w-3" /> Логи</Badge>
                      )}
                      {s === "manual" && (
                        <Badge className="bg-violet-500/15 text-violet-600 dark:text-violet-400 gap-1 text-[10px]" title={t.manual_coverage_note ?? "Покрыто вручную"}>
                          <Hand className="h-3 w-3" /> Вручную
                        </Badge>
                      )}
                      {s === "none" && (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground gap-1"><XCircle className="h-3 w-3" /> Нет</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {t.metric_bindings.length === 0 ? (
                          s === "manual" && t.manual_coverage_note
                            ? <span className="text-xs text-muted-foreground italic">{t.manual_coverage_note}</span>
                            : <span className="text-xs text-muted-foreground">—</span>
                        ) : t.metric_bindings.map((b, i) => (
                          <button
                            key={`${b.itemid}-${i}`}
                            type="button"
                            onClick={() => setGraphFor(b)}
                            className={cn(
                              "inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] hover:bg-primary/10 hover:border-primary/50 transition",
                              "border-border bg-muted/40",
                            )}
                            title={`${b.host_name} · ${b.item_key}`}
                          >
                            <BarChart3 className="h-3 w-3" />
                            <span className="truncate max-w-[180px]">{b.item_name}</span>
                          </button>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {filtered.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">Ничего не найдено</p>
          )}
          {filtered.length > 300 && (
            <p className="text-xs text-muted-foreground text-center pt-3">Показано 300 из {filtered.length}. Уточните фильтры.</p>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        <ExternalLink className="h-3 w-3 inline mr-1" />
        Логи можно просматривать и анализировать ИИ в разделе <Link to="/monitoring" className="underline">Мониторинг → «Логи и ИИ»</Link>.
      </p>

      {graphFor && (
        <MetricGraphDialog
          open={!!graphFor}
          onClose={() => setGraphFor(null)}
          metric={{
            itemid: graphFor.itemid,
            name: graphFor.item_name,
            key_: graphFor.item_key,
            units: graphFor.units,
            hostid: graphFor.hostid,
            hostName: graphFor.host_name,
            zabbixHostId: graphFor.hostid,
          }}
        />
      )}
    </div>
  );
}

function Stat({ n, label, color, Icon }: { n: number; label: string; color: string; Icon: any }) {
  return (
    <div>
      <p className={cn("text-2xl font-heading font-bold", color)}>
        <Icon className={cn("inline h-4 w-4 mr-1 -mt-1", color)} />
        {n}
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}