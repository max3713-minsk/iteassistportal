import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { Database, Play, RefreshCw, FileCode, AlertTriangle, Info, CheckCircle2, BookOpen, Table2 } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TABLE_DICTIONARY, describeTable, extractAffectedTables } from "@/lib/tableDictionary";

// Bundle all migration files as raw text at build time
const MIGRATION_FILES = import.meta.glob("/supabase/migrations/*.sql", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

type TableRow = { table_name: string; columns_count: number; total_size: string };
type AppliedRow = {
  filename: string;
  checksum: string | null;
  applied_at: string;
  applied_by: string | null;
  duration_ms: number | null;
  note: string | null;
};

export default function AdminMigrations() {
  const { hasRole, loading } = useAuth();
  const [tables, setTables] = useState<TableRow[] | null>(null);
  const [loadingTables, setLoadingTables] = useState(false);
  const [applied, setApplied] = useState<AppliedRow[]>([]);
  const [sql, setSql] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const files = useMemo(
    () =>
      Object.entries(MIGRATION_FILES)
        .map(([path, content]) => ({
          path,
          name: path.split("/").pop() ?? path,
          content,
          size: content.length,
          tables: extractAffectedTables(content),
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [],
  );

  const appliedMap = useMemo(() => {
    const m = new Map<string, AppliedRow>();
    applied.forEach((a) => m.set(a.filename, a));
    return m;
  }, [applied]);

  const groupedTables = useMemo(() => {
    const groups = new Map<string, { name: string; meta: typeof TABLE_DICTIONARY[string]; size?: string; cols?: number }[]>();
    const sizeMap = new Map<string, { size: string; cols: number }>();
    (tables ?? []).forEach((t) => sizeMap.set(t.table_name, { size: t.total_size, cols: t.columns_count }));
    const allNames = new Set<string>([
      ...Object.keys(TABLE_DICTIONARY),
      ...(tables ?? []).map((t) => t.table_name),
    ]);
    allNames.forEach((name) => {
      const meta = describeTable(name);
      const s = sizeMap.get(name);
      const arr = groups.get(meta.group) ?? [];
      arr.push({ name, meta, size: s?.size, cols: s?.cols });
      groups.set(meta.group, arr);
    });
    return Array.from(groups.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([group, items]) => ({
        group,
        items: items.sort((a, b) => a.meta.title.localeCompare(b.meta.title)),
      }));
  }, [tables]);

  useEffect(() => {
    void checkStatus();
    void loadApplied();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return null;
  if (!hasRole("admin")) return <Navigate to="/" replace />;

  async function checkStatus() {
    setLoadingTables(true);
    try {
      const { data, error } = await supabase.rpc("get_tables_list");
      if (error) throw error;
      setTables((data ?? []) as TableRow[]);
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message ?? String(e), variant: "destructive" });
    } finally {
      setLoadingTables(false);
    }
  }

  async function loadApplied() {
    try {
      const { data, error } = await supabase
        .from("applied_migrations")
        .select("*")
        .order("applied_at", { ascending: false });
      if (error) throw error;
      setApplied((data ?? []) as AppliedRow[]);
    } catch {
      // silent (table may not exist on first run)
    }
  }

  async function runMigration(sqlToRun: string, label?: string) {
    if (!sqlToRun.trim()) {
      toast({ title: "SQL пустой", variant: "destructive" });
      return;
    }
    if (!confirm(`Выполнить миграцию${label ? ` "${label}"` : ""}? Это необратимо.`)) return;
    setRunning(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("run-migration", {
        body: { sql: sqlToRun, migration_name: label ?? null },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult({
        ok: true,
        text: `Успех (${data?.duration_ms ?? 0} мс)\n${JSON.stringify(data, null, 2)}`,
      });
      toast({ title: "Миграция выполнена" });
      void checkStatus();
      void loadApplied();
    } catch (e: any) {
      setResult({ ok: false, text: e.message ?? String(e) });
      toast({ title: "Ошибка миграции", description: e.message ?? String(e), variant: "destructive" });
    } finally {
      setRunning(false);
    }
  }

  return (
    <TooltipProvider delayDuration={150}><div className="container mx-auto p-6 space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
            <Database className="h-6 w-6" /> Миграции БД
          </h1>
          <p className="text-sm text-muted-foreground">
            Управление структурой базы данных портала. Только для администраторов.
          </p>
        </div>
      </div>

      {/* Friendly help */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-4">
          <Accordion type="single" collapsible defaultValue="help">
            <AccordionItem value="help" className="border-0">
              <AccordionTrigger className="hover:no-underline py-2">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <BookOpen className="h-4 w-4 text-primary" /> Что такое БД и миграции — кратко
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-sm space-y-2 text-muted-foreground">
                <p><strong className="text-foreground">База данных (PostgreSQL)</strong> — это место, где портал хранит все данные: организации, ЦОД, оборудование, протоколы ТО, пользователей, журналы. Данные разложены по <strong className="text-foreground">таблицам</strong> (см. ниже «Содержимое БД»).</p>
                <p><strong className="text-foreground">Миграция</strong> — это SQL-скрипт, изменяющий <em>структуру</em> БД (добавляет таблицу, столбец, политику доступа, функцию). Файлы миграций живут в репозитории в папке <code className="bg-muted px-1 rounded">supabase/migrations/</code> и применяются по очереди.</p>
                <p>Здесь можно:</p>
                <ul className="list-disc ml-5 space-y-1">
                  <li>Посмотреть, какие миграции уже применены (зелёная галочка) и какие новые есть в репозитории.</li>
                  <li>Применить любую миграцию вручную (повторное применение безопасно — «уже существует» пропускается).</li>
                  <li>Выполнить произвольный SQL-запрос (только для опытных).</li>
                </ul>
                <p className="text-xs">⚠️ Перед нестандартными операциями делайте резервную копию через «Подключения → Резервное копирование».</p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardContent className="pt-4 flex gap-2 text-sm">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <span>
            Запросы выполняются с правами <code>service_role</code> и могут необратимо изменить
            данные. Перед запуском сделайте резервную копию.
          </span>
        </CardContent>
      </Card>

      {/* Database contents */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Table2 className="h-4 w-4" /> Содержимое БД
            <span className="text-xs text-muted-foreground font-normal">— что хранится в каждой таблице</span>
          </CardTitle>
          <Button size="sm" variant="outline" onClick={checkStatus} disabled={loadingTables}>
            <RefreshCw className={`h-4 w-4 ${loadingTables ? "animate-spin" : ""}`} />
            Проверить
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {groupedTables.map(({ group, items }) => (
              <div key={group}>
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">{group}</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                  {items.map((it) => {
                    const exists = it.size !== undefined;
                    return (
                      <div
                        key={it.name}
                        className={`flex items-start gap-2 text-xs p-2 rounded border ${
                          exists ? "bg-card border-border" : "bg-muted/30 border-dashed border-muted-foreground/30 opacity-60"
                        }`}
                      >
                        <Database className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${exists ? "text-primary" : "text-muted-foreground"}`} />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-foreground flex items-center gap-1.5">
                            {it.meta.title}
                            <code className="text-[10px] font-mono text-muted-foreground">{it.name}</code>
                            {!exists && <Badge variant="outline" className="text-[9px] h-4">нет в БД</Badge>}
                          </div>
                          <div className="text-muted-foreground text-[11px] mt-0.5">{it.meta.description}</div>
                          {exists && (
                            <div className="text-[10px] text-muted-foreground mt-0.5">
                              {it.cols} кол · {it.size}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Manual SQL */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            Выполнить произвольную SQL-миграцию
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs">
                Вставьте SQL (CREATE TABLE, ALTER TABLE, CREATE POLICY и т.п.). Объекты, которые уже существуют, будут автоматически пропущены.
              </TooltipContent>
            </Tooltip>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            placeholder="-- Вставьте SQL миграции"
            className="font-mono text-xs min-h-[240px]"
          />
          <div className="flex gap-2">
            <Button onClick={() => runMigration(sql)} disabled={running || !sql.trim()}>
              <Play className="h-4 w-4" />
              {running ? "Выполняется…" : "Выполнить миграцию"}
            </Button>
            <Button variant="ghost" onClick={() => setSql("")} disabled={running}>
              Очистить
            </Button>
          </div>
          {result && (
            <pre
              className={`text-xs p-3 rounded border whitespace-pre-wrap font-mono ${
                result.ok
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                  : "bg-destructive/10 border-destructive/30 text-destructive"
              }`}
            >
              {result.text}
            </pre>
          )}
        </CardContent>
      </Card>

      {/* Bundled migration files */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileCode className="h-4 w-4" /> Миграции из репозитория ({files.length})
            <Badge variant="secondary" className="text-[10px]">
              Применено: {appliedMap.size}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {files.length === 0 ? (
            <p className="text-sm text-muted-foreground">Файлы не найдены.</p>
          ) : (
            <div className="divide-y border rounded-md max-h-[480px] overflow-y-auto">
              {files.map((f) => {
                const log = appliedMap.get(f.name);
                return (
                  <div key={f.path} className="flex items-start gap-3 p-2.5">
                    {log ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        </TooltipTrigger>
                        <TooltipContent className="text-xs">
                          Применено {new Date(log.applied_at).toLocaleString("ru-RU")}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <FileCode className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-mono truncate">{f.name}</div>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-2 flex-wrap mt-0.5">
                        <span>{(f.size / 1024).toFixed(1)} КБ</span>
                        {f.tables.length > 0 && (
                          <>
                            <span>·</span>
                            <span>Затрагивает:</span>
                            {f.tables.slice(0, 5).map((t) => {
                              const meta = describeTable(t);
                              return (
                                <Tooltip key={t}>
                                  <TooltipTrigger asChild>
                                    <Badge variant="outline" className="text-[9px] font-mono cursor-help">
                                      {t}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent className="text-xs">
                                    <div className="font-semibold">{meta.title}</div>
                                    <div className="text-muted-foreground">{meta.description}</div>
                                  </TooltipContent>
                                </Tooltip>
                              );
                            })}
                            {f.tables.length > 5 && (
                              <span className="text-muted-foreground">+{f.tables.length - 5}</span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setSql(f.content)}>
                      Открыть
                    </Button>
                    <Button
                      size="sm"
                      variant={log ? "ghost" : "default"}
                      onClick={() => runMigration(f.content, f.name)}
                      disabled={running}
                    >
                      {log ? "Повторно" : "Применить"}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div></TooltipProvider>
  );
}