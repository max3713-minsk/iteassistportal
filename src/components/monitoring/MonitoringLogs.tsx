import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Sparkles, FileText, Search, ScrollText, CloudOff, RefreshCw, HardDrive, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { isLogAnalysisTask } from "@/lib/log-task-detect";
import LogAnalysisDialog from "@/components/logs/LogAnalysisDialog";
import { LogResultView, type LogAnalysis } from "@/components/logs/LogResultView";
import { useToast } from "@/hooks/use-toast";

/**
 * Monitoring → tab "Логи".
 * - Слева: всё оборудование. Можно включить фильтр «только с логами в регламенте» —
 *   тогда показываются устройства, к категории которых привязаны пункты анализа логов.
 * - Справа: история equipment_logs для выбранного оборудования
 *   + кнопка «Загрузить и проанализировать» открывает LogAnalysisDialog.
 */
export default function MonitoringLogs() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [onlyWithLogTasks, setOnlyWithLogTasks] = useState(false);
  const [selectedEq, setSelectedEq] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [dlgOpen, setDlgOpen] = useState(false);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  // Всё оборудование.
  const { data: equipmentList = [] } = useQuery({
    queryKey: ["logs-all-equipment"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("equipment")
        .select("id, name, model, category, category_id, site_id")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  // Все активные задачи регламента — потом фильтруем по ключевым словам логов.
  const { data: allTasks = [] } = useQuery({
    queryKey: ["logs-all-tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_tasks")
        .select("id, title, description, category_id, is_active")
        .eq("is_active", true);
      if (error) throw error;
      return (data ?? []) as { id: string; title: string; description: string | null; category_id: string | null }[];
    },
  });

  const logTasks = useMemo(
    () => (allTasks as any[]).filter((t) => isLogAnalysisTask(t.title, t.description)),
    [allTasks],
  );

  type EqAggr = {
    id: string; name: string; model: string | null; category: string | null; category_id: string | null;
    tasks: { id: string; title: string; description: string | null }[];
  };

  const eqList: EqAggr[] = useMemo(() => {
    const out: EqAggr[] = (equipmentList as any[]).map((e) => {
      // Совпавшие задачи логов: либо без category_id (общие), либо привязанные к той же категории.
      const matched = logTasks.filter((t) => !t.category_id || t.category_id === e.category_id);
      return { id: e.id, name: e.name, model: e.model, category: e.category, category_id: e.category_id, tasks: matched };
    });
    const q = search.trim().toLowerCase();
    return out
      .filter((e) => !onlyWithLogTasks || e.tasks.length > 0)
      .filter((e) => !q || e.name.toLowerCase().includes(q) || (e.model ?? "").toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [equipmentList, logTasks, onlyWithLogTasks, search]);

  // Глобальный fallback-список задач (если у оборудования вообще нет совпавших, чтобы можно было выбрать).
  const taskOptions = useMemo(() => {
    const eq = eqList.find((e) => e.id === selectedEq);
    if (eq && eq.tasks.length > 0) return eq.tasks;
    return logTasks;
  }, [eqList, selectedEq, logTasks]);

  // История логов для выбранного оборудования.
  const { data: logs = [], refetch } = useQuery({
    queryKey: ["equipment-logs", selectedEq],
    queryFn: async () => {
      if (!selectedEq) return [];
      const { data, error } = await supabase
        .from("equipment_logs")
        .select("id, filename, source, analysis, size_bytes, created_at, protocol_item_id")
        .eq("equipment_id", selectedEq)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!selectedEq,
  });

  const selectedEqObj = eqList.find((e) => e.id === selectedEq) ?? null;

  // Реестр файлов на SFTP для выбранного оборудования
  const { data: sftpFiles = [], refetch: refetchFiles } = useQuery({
    queryKey: ["equipment-log-files", selectedEq],
    queryFn: async () => {
      if (!selectedEq) return [];
      const { data, error } = await supabase
        .from("equipment_log_files" as any)
        .select("id, filename, file_path, size_bytes, file_mtime, status, analyzed_log_id, last_error")
        .eq("equipment_id", selectedEq)
        .order("file_mtime", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as any[];
    },
    enabled: !!selectedEq,
  });

  const scanMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("log-storage-scan", {
        body: { equipment_id: selectedEq },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      const r = data?.results?.[0];
      if (r?.error) toast({ title: "Сканирование с ошибкой", description: r.error, variant: "destructive" });
      else toast({ title: "Сканирование завершено", description: `Найдено: ${r?.found ?? 0}` });
      qc.invalidateQueries({ queryKey: ["equipment-log-files", selectedEq] });
    },
    onError: (e: any) => toast({ title: "Ошибка сканирования", description: e.message, variant: "destructive" }),
  });

  async function analyzeFromSftp(fileRow: any) {
    if (!selectedEq) return;
    setAnalyzingId(fileRow.id);
    try {
      const fetched = await supabase.functions.invoke("log-storage-scan", {
        body: { action: "fetch_file", file_id: fileRow.id },
      });
      if (fetched.error) throw fetched.error;
      const { text, filename, size_bytes } = (fetched.data ?? {}) as any;
      if (!text) throw new Error("Не удалось прочитать файл");
      const analyzed = await supabase.functions.invoke("analyze-log", { body: { text, filename } });
      if (analyzed.error) throw analyzed.error;
      const analysis = (analyzed.data as any)?.analysis;
      const { data: inserted, error: insErr } = await supabase.from("equipment_logs").insert({
        equipment_id: selectedEq,
        source: "sftp",
        filename,
        raw_text: text.slice(0, 200_000),
        size_bytes,
        analysis,
      } as any).select("id").single();
      if (insErr) throw insErr;
      await supabase.from("equipment_log_files" as any)
        .update({ status: "analyzed", analyzed_log_id: inserted.id, last_error: null })
        .eq("id", fileRow.id);
      toast({ title: "Файл проанализирован", description: filename });
      qc.invalidateQueries({ queryKey: ["equipment-logs", selectedEq] });
      qc.invalidateQueries({ queryKey: ["equipment-log-files", selectedEq] });
    } catch (e: any) {
      await supabase.from("equipment_log_files" as any)
        .update({ last_error: e.message?.slice(0, 500) ?? String(e) })
        .eq("id", fileRow.id);
      toast({ title: "Ошибка анализа", description: e.message ?? String(e), variant: "destructive" });
    } finally {
      setAnalyzingId(null);
    }
  }

  function fmtSize(b: number | null): string {
    if (!b) return "—";
    if (b < 1024) return `${b} Б`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} КБ`;
    return `${(b / 1024 / 1024).toFixed(2)} МБ`;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4">
      <div className="lg:col-span-2 rounded-md border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        Здесь анализируются файлы логов, выгруженные с сетевого оборудования вручную. События серверов с установленным агентом смотрите в карточке агента.
      </div>
      {/* Sidebar: оборудование с пунктами «анализ логов» */}
      <Card className="self-start">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ScrollText className="h-4 w-4 text-primary" />
            Оборудование
          </CardTitle>
          <div className="relative mt-2">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по имени / модели"
              className="pl-7 h-8 text-sm"
            />
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Switch id="only-log" checked={onlyWithLogTasks} onCheckedChange={setOnlyWithLogTasks} />
            <Label htmlFor="only-log" className="text-xs cursor-pointer">
              Только с задачами по логам ({logTasks.length})
            </Label>
          </div>
        </CardHeader>
        <CardContent className="px-2">
          <ScrollArea className="h-[520px]">
            {eqList.length === 0 ? (
              <p className="text-sm text-muted-foreground px-3 py-6 text-center">
                Нет оборудования. Снимите фильтр или добавьте устройства.
              </p>
            ) : (
              <ul className="space-y-1">
                {eqList.map((e) => {
                  const active = e.id === selectedEq;
                  return (
                    <li key={e.id}>
                      <button
                        type="button"
                        onClick={() => { setSelectedEq(e.id); setSelectedTask(e.tasks[0]?.id ?? logTasks[0]?.id ?? null); }}
                        className={`w-full text-left rounded-md px-3 py-2 transition-colors ${
                          active ? "bg-primary/10 border border-primary/40" : "hover:bg-muted/60"
                        }`}
                      >
                        <p className="text-sm font-medium truncate">{e.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{e.model ?? "—"} · {e.category ?? "—"}</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {e.tasks.length === 0 ? (
                            <Badge variant="outline" className="text-[10px] text-muted-foreground">нет лог-задач в регламенте</Badge>
                          ) : (<>
                            {e.tasks.slice(0, 2).map((t) => (
                              <Badge key={t.id} variant="outline" className="text-[10px]">{t.title}</Badge>
                            ))}
                            {e.tasks.length > 2 && <Badge variant="outline" className="text-[10px]">+{e.tasks.length - 2}</Badge>}
                          </>)}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Main panel */}
      <div className="space-y-4">
        {!selectedEqObj ? (
          <Card>
            <CardContent className="py-16 text-center text-sm text-muted-foreground">
              <ScrollText className="h-10 w-10 mx-auto mb-3 opacity-30" />
              Выберите оборудование слева, чтобы загрузить логи и посмотреть историю анализа.
              <p className="mt-2 text-xs">Загрузите файл лога с оборудования — ИИ проанализирует его и выделит ошибки. Результат привязывается к пункту регламента.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="text-base">{selectedEqObj.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">{selectedEqObj.model ?? "—"}</p>
                  </div>
                  <Button size="sm" onClick={() => setDlgOpen(true)}>
                    <Sparkles className="h-4 w-4 mr-1.5" /> Загрузить и проанализировать
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-2 sm:grid-cols-[1fr_auto] items-end">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Пункт регламента</p>
                    <Select value={selectedTask ?? ""} onValueChange={setSelectedTask}>
                      <SelectTrigger><SelectValue placeholder={taskOptions.length ? "Выберите пункт" : "Нет лог-задач — будет загружен без привязки"} /></SelectTrigger>
                      <SelectContent>
                        {taskOptions.map((t) => (
                          <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Загрузите файл лога с оборудования — ИИ проанализирует его и выделит ошибки. Результат привязывается к пункту регламента. Можно выгрузить лог и без привязки.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-primary" /> Файлы на SFTP ({sftpFiles.length})
                  </CardTitle>
                  <Button size="sm" variant="outline"
                    onClick={() => scanMutation.mutate()}
                    disabled={scanMutation.isPending}>
                    {scanMutation.isPending
                      ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                      : <RefreshCw className="h-4 w-4 mr-1.5" />}
                    Сканировать
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {sftpFiles.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    Реестр пуст. Настройте хранилище логов на карточке оборудования и запустите сканирование.
                  </div>
                ) : (
                  <div className="space-y-1">
                    {sftpFiles.map((f: any) => (
                      <div key={f.id} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{f.filename}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {f.file_mtime ? format(new Date(f.file_mtime), "dd.MM.yyyy HH:mm") : "—"} · {fmtSize(f.size_bytes)}
                            {f.last_error ? ` · ошибка: ${f.last_error}` : ""}
                          </p>
                        </div>
                        {f.status === "analyzed" && <Badge variant="outline" className="text-[10px]">проанализирован</Badge>}
                        {f.status === "new" && <Badge className="bg-blue-500 text-white text-[10px]">новый</Badge>}
                        <Button size="sm" variant="ghost"
                          onClick={() => analyzeFromSftp(f)}
                          disabled={analyzingId === f.id}>
                          {analyzingId === f.id
                            ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                            : <Sparkles className="h-3.5 w-3.5 mr-1" />}
                          Анализ
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" /> История анализов ({logs.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {logs.length === 0 ? (
                  <div className="py-10 text-center text-sm text-muted-foreground">
                    <CloudOff className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    Ещё нет загруженных логов для этого оборудования.
                  </div>
                ) : (
                  <Accordion type="single" collapsible className="w-full">
                    {logs.map((l: any) => {
                      const a = (l.analysis ?? {}) as LogAnalysis;
                      const c = a.severity_counts ?? {};
                      return (
                        <AccordionItem key={l.id} value={l.id}>
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex-1 min-w-0 flex items-center gap-3 text-left">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate">{l.filename ?? "лог"}</p>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(l.created_at), "dd.MM.yyyy HH:mm")} · {l.source} · {((l.size_bytes ?? 0) / 1024).toFixed(1)} КБ
                                </p>
                              </div>
                              <div className="flex gap-1 shrink-0">
                                {(c.critical ?? 0) > 0 && <Badge className="bg-destructive text-destructive-foreground text-[10px]">{c.critical} CRIT</Badge>}
                                {(c.error ?? 0) > 0 && <Badge className="bg-red-500 text-white text-[10px]">{c.error} ERR</Badge>}
                                {(c.warning ?? 0) > 0 && <Badge className="bg-amber-500 text-black text-[10px]">{c.warning} WARN</Badge>}
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <LogResultView analysis={a} />
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                )}
              </CardContent>
            </Card>
          </>
        )}

        <LogAnalysisDialog
          open={dlgOpen}
          onOpenChange={(v) => { setDlgOpen(v); if (!v) refetch(); }}
          equipmentId={selectedEq}
          protocolItemId={null}
          protocolId={null}
          equipmentName={selectedEqObj?.name}
          taskTitle={taskOptions.find((t) => t.id === selectedTask)?.title}
        />
      </div>
    </div>
  );
}