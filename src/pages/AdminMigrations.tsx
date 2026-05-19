import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { Database, Play, RefreshCw, FileCode, AlertTriangle } from "lucide-react";

// Bundle all migration files as raw text at build time
const MIGRATION_FILES = import.meta.glob("/supabase/migrations/*.sql", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

type TableRow = { table_name: string; columns_count: number; total_size: string };

export default function AdminMigrations() {
  const { hasRole, loading } = useAuth();
  const [tables, setTables] = useState<TableRow[] | null>(null);
  const [loadingTables, setLoadingTables] = useState(false);
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
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [],
  );

  useEffect(() => {
    void checkStatus();
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
        body: { sql: sqlToRun },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult({
        ok: true,
        text: `Успех (${data?.duration_ms ?? 0} мс)\n${JSON.stringify(data, null, 2)}`,
      });
      toast({ title: "Миграция выполнена" });
      void checkStatus();
    } catch (e: any) {
      setResult({ ok: false, text: e.message ?? String(e) });
      toast({ title: "Ошибка миграции", description: e.message ?? String(e), variant: "destructive" });
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
            <Database className="h-6 w-6" /> Миграции БД
          </h1>
          <p className="text-sm text-muted-foreground">
            Управление схемой базы данных. Только для администраторов.
          </p>
        </div>
      </div>

      <Card className="border-destructive/40">
        <CardContent className="pt-4 flex gap-2 text-sm">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <span>
            Запросы выполняются с правами <code>service_role</code> и могут необратимо изменить
            данные. Перед запуском сделайте резервную копию.
          </span>
        </CardContent>
      </Card>

      {/* Tables status */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Статус БД</CardTitle>
          <Button size="sm" variant="outline" onClick={checkStatus} disabled={loadingTables}>
            <RefreshCw className={`h-4 w-4 ${loadingTables ? "animate-spin" : ""}`} />
            Проверить
          </Button>
        </CardHeader>
        <CardContent>
          {tables === null ? (
            <p className="text-sm text-muted-foreground">Нажмите «Проверить»…</p>
          ) : tables.length === 0 ? (
            <p className="text-sm text-muted-foreground">Таблиц нет.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tables.map((t) => (
                <Badge key={t.table_name} variant="secondary" className="font-mono text-xs">
                  {t.table_name}{" "}
                  <span className="ml-1 text-muted-foreground">
                    · {t.columns_count} кол · {t.total_size}
                  </span>
                </Badge>
              ))}
              <span className="text-xs text-muted-foreground self-center ml-2">
                Всего: {tables.length}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual SQL */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Выполнить SQL-миграцию</CardTitle>
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
          </CardTitle>
        </CardHeader>
        <CardContent>
          {files.length === 0 ? (
            <p className="text-sm text-muted-foreground">Файлы не найдены.</p>
          ) : (
            <div className="divide-y border rounded-md max-h-[480px] overflow-y-auto">
              {files.map((f) => (
                <div key={f.path} className="flex items-center gap-3 p-2.5">
                  <FileCode className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-mono truncate">{f.name}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {(f.size / 1024).toFixed(1)} КБ
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSql(f.content)}
                  >
                    Открыть
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => runMigration(f.content, f.name)}
                    disabled={running}
                  >
                    Применить
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}