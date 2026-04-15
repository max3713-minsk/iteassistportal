import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  Activity, AlertTriangle, CheckCircle2, Server, Wifi, WifiOff, RefreshCw,
  Play, Loader2, Terminal, Shield, HardDrive,
} from "lucide-react";

/* ─── Zabbix hooks ─── */
function useZabbixData(action: string, enabled = true) {
  return useQuery({
    queryKey: ["zabbix", action],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("zabbix-proxy", {
        body: { action },
      });
      if (error) throw error;
      return data?.result ?? [];
    },
    enabled,
    refetchInterval: 30000, // auto-refresh every 30s
    retry: 1,
  });
}

/* ─── Ansible hooks ─── */
function useAnsiblePlaybooks() {
  return useQuery({
    queryKey: ["ansible", "playbooks"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("ansible-proxy", {
        body: { action: "listPlaybooks" },
      });
      if (error) throw error;
      return data?.result ?? [];
    },
    retry: 1,
  });
}

export default function Monitoring() {
  const { toast } = useToast();
  const { isStaff } = useAuth();
  const [tab, setTab] = useState("hosts");

  const { data: hosts, isLoading: hostsLoading, error: hostsError, refetch: refetchHosts } = useZabbixData("getHosts");
  const { data: problems, isLoading: problemsLoading, refetch: refetchProblems } = useZabbixData("getProblems");
  const { data: alerts, isLoading: alertsLoading, refetch: refetchAlerts } = useZabbixData("getAlerts");
  const { data: playbooks } = useAnsiblePlaybooks();

  const runPlaybook = useMutation({
    mutationFn: async (playbookId: string) => {
      const { data, error } = await supabase.functions.invoke("ansible-proxy", {
        body: { action: "runPlaybook", playbook: playbookId },
      });
      if (error) throw error;
      return data?.result;
    },
    onSuccess: (result) => {
      toast({ title: "Задача запущена", description: result?.message || "Playbook поставлен в очередь" });
    },
    onError: (err: Error) => {
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    },
  });

  const handleRefresh = () => {
    refetchHosts();
    refetchProblems();
    refetchAlerts();
  };

  const availabilityColor = (avail: string) => {
    switch (avail) {
      case "1": return "success";
      case "2": return "destructive";
      default: return "outline";
    }
  };
  const availabilityLabel = (avail: string) => {
    switch (avail) {
      case "1": return "Доступен";
      case "2": return "Недоступен";
      default: return "Неизвестно";
    }
  };

  const priorityColor = (p: string) => {
    const n = parseInt(p);
    if (n >= 4) return "destructive";
    if (n === 3) return "warning";
    if (n === 2) return "default";
    return "secondary";
  };
  const priorityLabel = (p: string) => {
    const labels: Record<string, string> = {
      "0": "Не классиф.",
      "1": "Информация",
      "2": "Предупреждение",
      "3": "Средний",
      "4": "Высокий",
      "5": "Катастрофа",
    };
    return labels[p] || p;
  };

  const categoryLabel: Record<string, string> = {
    daily: "Ежедневный",
    weekly: "Еженедельный",
    monthly: "Ежемесячный",
  };

  const hostsAvailable = Array.isArray(hosts) ? hosts.filter((h: any) => h.available === "1").length : 0;
  const hostsUnavailable = Array.isArray(hosts) ? hosts.filter((h: any) => h.available === "2").length : 0;
  const totalHosts = Array.isArray(hosts) ? hosts.length : 0;
  const totalProblems = Array.isArray(problems) ? problems.length : 0;
  const criticalAlerts = Array.isArray(alerts) ? alerts.filter((a: any) => parseInt(a.priority) >= 4).length : 0;

  const connectionError = hostsError != null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary" />
          Мониторинг и автоматизация
        </h1>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Обновить
        </Button>
      </div>

      {connectionError && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="py-4">
            <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Не удалось подключиться к серверу мониторинга. Убедитесь, что Zabbix сервер доступен по адресу, указанному в настройках.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Хосты</CardTitle>
            <Server className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-heading font-bold">{totalHosts}</div>
            <div className="flex gap-3 mt-1 text-xs">
              <span className="text-green-600 flex items-center gap-1"><Wifi className="h-3 w-3" />{hostsAvailable}</span>
              <span className="text-red-500 flex items-center gap-1"><WifiOff className="h-3 w-3" />{hostsUnavailable}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Активные проблемы</CardTitle>
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-heading font-bold">{totalProblems}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Критические алерты</CardTitle>
            <Shield className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-heading font-bold text-destructive">{criticalAlerts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Автоматизация</CardTitle>
            <Terminal className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-heading font-bold">{Array.isArray(playbooks) ? playbooks.length : 0}</div>
            <p className="text-xs text-muted-foreground mt-1">доступных сценариев</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="hosts">Хосты</TabsTrigger>
          <TabsTrigger value="problems">Проблемы</TabsTrigger>
          <TabsTrigger value="alerts">Алерты</TabsTrigger>
          <TabsTrigger value="automation">Автоматизация</TabsTrigger>
        </TabsList>

        {/* Hosts */}
        <TabsContent value="hosts">
          <Card>
            <CardContent className="pt-6">
              {hostsLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : !Array.isArray(hosts) || hosts.length === 0 ? (
                <p className="text-center py-10 text-muted-foreground">Нет данных о хостах. Проверьте подключение к Zabbix.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Имя</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead>Группа</TableHead>
                      <TableHead>Статус</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hosts.map((host: any) => (
                      <TableRow key={host.hostid}>
                        <TableCell className="font-medium">{host.name}</TableCell>
                        <TableCell className="text-muted-foreground font-mono text-xs">
                          {host.interfaces?.[0]?.ip || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {host.groups?.[0]?.name || "—"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={availabilityColor(host.available) as any}>
                            {availabilityLabel(host.available)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Problems */}
        <TabsContent value="problems">
          <Card>
            <CardContent className="pt-6">
              {problemsLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : !Array.isArray(problems) || problems.length === 0 ? (
                <div className="text-center py-10">
                  <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-2" />
                  <p className="text-muted-foreground">Активных проблем нет</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Описание</TableHead>
                      <TableHead>Серьёзность</TableHead>
                      <TableHead>Время</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {problems.map((p: any) => (
                      <TableRow key={p.eventid}>
                        <TableCell className="font-mono text-xs">{p.eventid}</TableCell>
                        <TableCell>{p.name}</TableCell>
                        <TableCell>
                          <Badge variant={priorityColor(p.severity) as any}>
                            {priorityLabel(p.severity)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(parseInt(p.clock) * 1000).toLocaleString("ru-RU")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts */}
        <TabsContent value="alerts">
          <Card>
            <CardContent className="pt-6">
              {alertsLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : !Array.isArray(alerts) || alerts.length === 0 ? (
                <div className="text-center py-10">
                  <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-2" />
                  <p className="text-muted-foreground">Активных алертов нет</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Хост</TableHead>
                      <TableHead>Описание</TableHead>
                      <TableHead>Приоритет</TableHead>
                      <TableHead>Последнее изменение</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alerts.map((a: any) => (
                      <TableRow key={a.triggerid}>
                        <TableCell className="font-medium">{a.hosts?.[0]?.name || "—"}</TableCell>
                        <TableCell>{a.description}</TableCell>
                        <TableCell>
                          <Badge variant={priorityColor(a.priority) as any}>
                            {priorityLabel(a.priority)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(parseInt(a.lastchange) * 1000).toLocaleString("ru-RU")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Automation */}
        <TabsContent value="automation">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Terminal className="h-4 w-4" />
                Сценарии автоматизации (Ansible)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!Array.isArray(playbooks) || playbooks.length === 0 ? (
                <p className="text-muted-foreground text-center py-10">Нет доступных сценариев</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Сценарий</TableHead>
                      <TableHead>Описание</TableHead>
                      <TableHead>Категория</TableHead>
                      <TableHead className="text-right">Действие</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {playbooks.map((pb: any) => (
                      <TableRow key={pb.id}>
                        <TableCell className="font-medium">{pb.name}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{pb.description}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{categoryLabel[pb.category] || pb.category}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {isStaff && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => runPlaybook.mutate(pb.id)}
                              disabled={runPlaybook.isPending}
                            >
                              {runPlaybook.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                              <span className="ml-1.5">Запустить</span>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
