import { useState } from "react";
import { invokeZabbix } from "@/lib/zabbix-invoke";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { logAudit } from "@/lib/audit";
import { Terminal, Play, Loader2, CheckCircle2, XCircle, Clock, RefreshCw, Ban } from "lucide-react";
import DeviceHintsPanel from "./DeviceHintsPanel";

interface Props {
  hosts: any[];
  scripts: any[];
  isZabbixConfigured: boolean;
}

export default function MonitoringAutomation({ hosts, scripts, isZabbixConfigured }: Props) {
  const { toast } = useToast();
  const { isStaff } = useAuth();
  const queryClient = useQueryClient();

  const [runDialog, setRunDialog] = useState<{ scriptid: string; name: string; description?: string } | null>(null);
  const [selectedHost, setSelectedHost] = useState("");
  const [resultDialog, setResultDialog] = useState<{ output: string; status: string } | null>(null);

  const hostsArr = Array.isArray(hosts) ? hosts : [];
  const zabbixScripts = Array.isArray(scripts) ? scripts : [];

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

  const handleSync = () => {
    queryClient.invalidateQueries({ queryKey: ["zabbix", "getScripts"] });
    toast({ title: "Синхронизация скриптов с Zabbix..." });
  };

  const cancelMutation = useMutation({
    mutationFn: async (logId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      const { error } = await supabase.from("automation_logs").update({
        status: "cancelled",
        cancel_requested: true,
        cancelled_at: new Date().toISOString(),
        cancelled_by: session?.user?.id ?? null,
        result: "Отменено пользователем через портал. Скрипт уже отправлен в Zabbix и не может быть отозван — статус помечен локально.",
      }).eq("id", logId);
      if (error) throw error;
      await logAudit({ action: "Отмена скрипта Zabbix", module: "monitoring", entityId: logId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation-logs"] });
      toast({ title: "Запись помечена как отменённая" });
    },
    onError: (e: Error) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  });

  // Подтягиваем device_type для выбранного хоста (если он есть в monitored_hosts)
  const { data: selectedHostDevice } = useQuery({
    queryKey: ["monitored-host-device", selectedHost],
    queryFn: async () => {
      if (!selectedHost) return null;
      const { data } = await supabase
        .from("monitored_hosts")
        .select("device_type")
        .eq("zabbix_host_id", selectedHost)
        .maybeSingle();
      return data;
    },
    enabled: !!selectedHost && !!runDialog,
  });

  const executeMutation = useMutation({
    mutationFn: async ({ scriptid, hostid, scriptName, hostName }: {
      scriptid: string; hostid: string; scriptName: string; hostName: string;
    }) => {
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

      const { data, error } = await invokeZabbix( {
        body: { action: "executeScript", params: { scriptid, hostid } },
      });
      if (error) throw error;

      const result = data?.result;
      const status = data?.error ? "error" : "success";
      const output = result?.value || data?.error?.message || JSON.stringify(data);

      if (logEntry?.id) {
        await supabase.from("automation_logs")
          .update({ result: output, status })
          .eq("id", logEntry.id);
      }

      await logAudit({
        action: "Запуск скрипта Zabbix",
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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Terminal className="h-4 w-4" />
                Скрипты Zabbix
              </CardTitle>
              <CardDescription>
                Реальные скрипты, настроенные на сервере Zabbix (Administration → Scripts)
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleSync}>
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              Синхронизация
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!isZabbixConfigured ? (
            <p className="text-center py-8 text-sm text-muted-foreground">
              Подключите Zabbix в разделе «Настройка»
            </p>
          ) : zabbixScripts.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <Terminal className="h-10 w-10 mx-auto text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                В Zabbix не настроены пользовательские скрипты
              </p>
              <p className="text-xs text-muted-foreground">
                Добавьте скрипты в Zabbix UI: Administration → Scripts, затем нажмите «Синхронизация»
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Имя скрипта</TableHead>
                  <TableHead>Описание</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Группы</TableHead>
                  {isStaff && <TableHead className="text-right">Действие</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {zabbixScripts.map((s: any) => (
                  <TableRow key={s.scriptid}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-[300px]">
                      {s.description || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {s.type === "0" ? "Script" : s.type === "1" ? "IPMI" : s.type === "2" ? "SSH" : s.type === "5" ? "Webhook" : `T${s.type}`}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {s.groups?.length > 0 ? s.groups.map((g: any) => g.name).join(", ") : "Все"}
                    </TableCell>
                    {isStaff && (
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setRunDialog({ scriptid: s.scriptid, name: s.name, description: s.description })}
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
          )}
        </CardContent>
      </Card>

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
                  {isStaff && <TableHead className="text-right">Действие</TableHead>}
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
                      ) : log.status === "cancelled" ? (
                        <Badge variant="outline">
                          <Ban className="h-3 w-3 mr-1" />Отменено
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />Выполняется
                        </Badge>
                      )}
                    </TableCell>
                    {isStaff && (
                      <TableCell className="text-right">
                        {log.status === "running" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => cancelMutation.mutate(log.id)}
                            disabled={cancelMutation.isPending}
                            title="Пометить как отменённую (Zabbix API не умеет прерывать уже запущенный скрипт)"
                          >
                            <Ban className="h-3.5 w-3.5 mr-1" />Отменить
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!runDialog} onOpenChange={() => setRunDialog(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Запуск: {runDialog?.name}</DialogTitle>
            <DialogDescription>{runDialog?.description || "Скрипт Zabbix"}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              {selectedHost && !selectedHostDevice && (
                <p className="text-xs text-muted-foreground">
                  Хост не привязан к локальной CMDB — подсказки будут общие.
                </p>
              )}
            </div>
            <div className="border rounded-md p-3 bg-muted/20">
              <DeviceHintsPanel
                deviceType={selectedHostDevice?.device_type}
                compact
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRunDialog(null)}>Отмена</Button>
            <Button
              onClick={() => {
                if (!selectedHost || !runDialog) return;
                const host = hostsArr.find((h: any) => h.hostid === selectedHost);
                executeMutation.mutate({
                  scriptid: runDialog.scriptid,
                  hostid: selectedHost,
                  scriptName: runDialog.name,
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
