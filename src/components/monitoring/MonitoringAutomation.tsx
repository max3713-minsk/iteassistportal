import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { logAudit } from "@/lib/audit";
import { Terminal, Play, Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";

interface Props {
  hosts: any[];
  scripts: any[];
  isZabbixConfigured: boolean;
}

const presetScripts = [
  { id: "restart_scada", name: "restart_scada_services", label: "Перезапуск сервисов SCADA", desc: "Перезапуск SCADA-сервисов на целевом хосте", category: "restart", tzRef: "п.144 ТЗ" },
  { id: "clean_temp", name: "clean_temp_logs", label: "Очистка временных файлов", desc: "Очистка /tmp, логов старше 30 дней", category: "cleanup", tzRef: "п.144 ТЗ" },
  { id: "backup_db", name: "backup_db", label: "Резервное копирование БД", desc: "Внеплановый pg_dump основной базы", category: "backup", tzRef: "п.144 ТЗ" },
  { id: "clear_rdp", name: "clear_rdp_sessions", label: "Сброс RDP-сессий", desc: "Закрытие зависших терминальных сессий", category: "session", tzRef: "п.144 ТЗ" },
  { id: "test_failover", name: "test_hypermetro_failover", label: "Тест HyperMetro Failover", desc: "Тестовое переключение активного контроллера", category: "failover", tzRef: "п.144 ТЗ" },
];

const categoryIcons: Record<string, string> = {
  restart: "🔄", cleanup: "🧹", backup: "💾", session: "👤",
  failover: "🔁", network: "🌐", check: "✅",
};

export default function MonitoringAutomation({ hosts, scripts, isZabbixConfigured }: Props) {
  const { toast } = useToast();
  const { isStaff } = useAuth();
  const queryClient = useQueryClient();

  const [runDialog, setRunDialog] = useState<{ script: typeof presetScripts[0]; zabbixScript?: any } | null>(null);
  const [selectedHost, setSelectedHost] = useState("");
  const [resultDialog, setResultDialog] = useState<{ output: string; status: string } | null>(null);

  const hostsArr = Array.isArray(hosts) ? hosts : [];
  const zabbixScripts = Array.isArray(scripts) ? scripts : [];

  // Fetch automation logs
  const { data: logs } = useQuery({
    queryKey: ["automation-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automation_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  const executeMutation = useMutation({
    mutationFn: async ({ scriptid, hostid, scriptName, hostName }: {
      scriptid: string; hostid: string; scriptName: string; hostName: string;
    }) => {
      // Log start
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Не авторизован");

      const { data: logEntry } = await supabase.from("automation_logs").insert({
        user_id: session.user.id,
        script_id: scriptid,
        script_name: scriptName,
        host_id: hostid,
        host_name: hostName,
        status: "running",
      }).select().single();

      // Execute via Zabbix
      const { data, error } = await supabase.functions.invoke("zabbix-proxy", {
        body: { action: "executeScript", params: { scriptid, hostid } },
      });
      if (error) throw error;

      const result = data?.result;
      const status = data?.error ? "error" : "success";
      const output = result?.value || data?.error?.message || JSON.stringify(data);

      // Update log
      if (logEntry?.id) {
        await supabase.from("automation_logs")
          .update({ result: output, status })
          .eq("id", logEntry.id);
      }

      await logAudit({
        action: "Запуск скрипта автоматизации",
        module: "monitoring",
        details: `Скрипт: ${scriptName}, Хост: ${hostName}, Результат: ${status}`,
      });

      return { output, status };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["automation-logs"] });
      setResultDialog(result);
      setRunDialog(null);
    },
    onError: (err: Error) => {
      toast({ title: "Ошибка выполнения", description: err.message, variant: "destructive" });
    },
  });

  const allScripts = [
    ...presetScripts,
    ...zabbixScripts
      .filter((s: any) => !presetScripts.some(ps => ps.name === s.name))
      .map((s: any) => ({
        id: s.scriptid,
        name: s.name,
        label: s.name,
        desc: s.description || "Скрипт из Zabbix",
        category: "check",
        tzRef: "—",
        zabbixId: s.scriptid,
      })),
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Terminal className="h-4 w-4" />
            Сценарии автоматизации
          </CardTitle>
          <CardDescription>
            Запуск предустановленных сценариев из Zabbix на целевых хостах
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>Сценарий</TableHead>
                <TableHead>Описание</TableHead>
                <TableHead>Пункт ТЗ</TableHead>
                {isStaff && <TableHead className="text-right">Действие</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {allScripts.map((script) => (
                <TableRow key={script.id}>
                  <TableCell className="text-lg">{categoryIcons[script.category] || "⚙️"}</TableCell>
                  <TableCell className="font-medium">{script.label}</TableCell>
                  <TableCell className="text-muted-foreground text-sm max-w-[300px]">{script.desc}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{script.tzRef || "—"}</TableCell>
                  {isStaff && (
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setRunDialog({ script })}
                        disabled={!isZabbixConfigured}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Запустить
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Execution logs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Журнал выполнения
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!logs || logs.length === 0 ? (
            <p className="text-center py-6 text-muted-foreground text-sm">Нет записей</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата</TableHead>
                  <TableHead>Скрипт</TableHead>
                  <TableHead>Хост</TableHead>
                  <TableHead>Статус</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleString("ru-RU")}
                    </TableCell>
                    <TableCell className="font-medium text-sm">{log.script_name}</TableCell>
                    <TableCell className="text-sm">{log.host_name || "—"}</TableCell>
                    <TableCell>
                      {log.status === "success" ? (
                        <Badge variant="default" className="bg-green-600">
                          <CheckCircle2 className="h-3 w-3 mr-1" />Успех
                        </Badge>
                      ) : log.status === "error" ? (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" />Ошибка
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />Выполняется
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Run dialog */}
      <Dialog open={!!runDialog} onOpenChange={() => setRunDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Запуск: {runDialog?.script.label}</DialogTitle>
            <DialogDescription>{runDialog?.script.desc}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Целевой хост</label>
              <Select value={selectedHost} onValueChange={setSelectedHost}>
                <SelectTrigger><SelectValue placeholder="Выберите хост" /></SelectTrigger>
                <SelectContent>
                  {hostsArr.map((h: any) => (
                    <SelectItem key={h.hostid} value={h.hostid}>{h.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRunDialog(null)}>Отмена</Button>
            <Button
              onClick={() => {
                if (!selectedHost || !runDialog) return;
                const host = hostsArr.find((h: any) => h.hostid === selectedHost);
                executeMutation.mutate({
                  scriptid: runDialog.script.id,
                  hostid: selectedHost,
                  scriptName: runDialog.script.label,
                  hostName: host?.name || selectedHost,
                });
              }}
              disabled={!selectedHost || executeMutation.isPending}
            >
              {executeMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Выполняется...</>
              ) : (
                <><Play className="h-4 w-4 mr-2" />Выполнить</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Result dialog */}
      <Dialog open={!!resultDialog} onOpenChange={() => setResultDialog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {resultDialog?.status === "success" ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              Результат выполнения
            </DialogTitle>
          </DialogHeader>
          <pre className="text-xs bg-muted p-4 rounded-md overflow-auto max-h-[400px] whitespace-pre-wrap font-mono">
            {resultDialog?.output || "Нет вывода"}
          </pre>
        </DialogContent>
      </Dialog>
    </div>
  );
}
