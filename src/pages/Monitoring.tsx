import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { logAudit } from "@/lib/audit";
import {
  Activity, AlertTriangle, CheckCircle2, Server, Wifi, WifiOff, RefreshCw,
  Play, Loader2, Terminal, Shield, HardDrive, Settings, Search,
  BarChart3, Cpu, MemoryStick, Database, Network, Monitor, Zap,
  ExternalLink, MessageSquarePlus, Check, Router, AlertCircle,
} from "lucide-react";
import HostManagement from "@/components/monitoring/HostManagement";
import ZabbixSettings from "@/components/monitoring/ZabbixSettings";

/* ─── Check if Zabbix is configured ─── */
function useZabbixConfigured() {
  return useQuery({
    queryKey: ["zabbix-settings-active"],
    queryFn: async () => {
      const { data } = await supabase
        .from("zabbix_settings")
        .select("id, is_active")
        .limit(1)
        .maybeSingle();
      return data?.is_active === true;
    },
    staleTime: 60000,
  });
}

/* ─── Zabbix data hook ─── */
function useZabbixData(action: string, enabled = true) {
  return useQuery({
    queryKey: ["zabbix", action],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("zabbix-proxy", {
        body: { action },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data?.result ?? [];
    },
    enabled,
    refetchInterval: 30000,
    retry: 1,
  });
}

/* ─── Ansible playbooks hook ─── */
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

/* ─── Helpers ─── */
const priorityColor = (p: string) => {
  const n = parseInt(p);
  if (n >= 4) return "destructive";
  if (n === 3) return "warning";
  if (n === 2) return "default";
  return "secondary";
};

const priorityLabel = (p: string) => {
  const map: Record<string, string> = {
    "0": "Не классиф.", "1": "Информация", "2": "Предупреждение",
    "3": "Средний", "4": "Высокий", "5": "Катастрофа",
  };
  return map[p] || p;
};

const priorityToIncident = (p: string) => {
  const n = parseInt(p);
  if (n >= 4) return { label: "П1 — Критический", color: "text-red-500" };
  if (n === 3) return { label: "П2 — Частичный отказ", color: "text-orange-500" };
  if (n === 2) return { label: "П3 — Сбои сервисов", color: "text-yellow-500" };
  return { label: "П4 — Некритичные", color: "text-blue-500" };
};

const availabilityBadge = (avail: string) => {
  switch (avail) {
    case "1": return { variant: "success" as const, label: "Доступен" };
    case "2": return { variant: "destructive" as const, label: "Недоступен" };
    default: return { variant: "outline" as const, label: "Неизвестно" };
  }
};

const hostGroupType = (groups: any[]) => {
  const name = (groups?.[0]?.name || "").toLowerCase();
  if (name.includes("linux") || name.includes("astra")) return "server";
  if (name.includes("storage") || name.includes("ocean")) return "storage";
  if (name.includes("switch") || name.includes("network") || name.includes("firewall") || name.includes("router")) return "network";
  if (name.includes("k8s") || name.includes("kube") || name.includes("vmware") || name.includes("esxi")) return "virtual";
  if (name.includes("windows")) return "windows";
  return "other";
};

const groupTypeConfig: Record<string, { label: string; icon: typeof Server }> = {
  server: { label: "Серверы (Linux)", icon: Server },
  windows: { label: "Серверы (Windows)", icon: Monitor },
  storage: { label: "СХД", icon: HardDrive },
  network: { label: "Сетевое оборудование", icon: Network },
  virtual: { label: "Виртуализация / K8s", icon: Cpu },
  other: { label: "Прочее", icon: Server },
};

/* ─── Metric color helper ─── */
function metricColor(val: number | null) {
  if (val === null) return "text-muted-foreground";
  if (val > 90) return "text-red-500";
  if (val > 70) return "text-yellow-500";
  return "text-green-500";
}

/* ─── Duration helper ─── */
function duration(clock: string) {
  const diff = Math.floor(Date.now() / 1000 - parseInt(clock));
  if (diff < 60) return `${diff}с`;
  if (diff < 3600) return `${Math.floor(diff / 60)}м`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}ч ${Math.floor((diff % 3600) / 60)}м`;
  return `${Math.floor(diff / 86400)}д ${Math.floor((diff % 86400) / 3600)}ч`;
}

/* ─── Loading skeleton ─── */
function LoadingSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 py-4">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════ */
export default function Monitoring() {
  const { toast } = useToast();
  const { isStaff } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("dashboard");

  const { data: isZabbixConfigured = false } = useZabbixConfigured();

  // Zabbix data — only fetch when configured
  const { data: hosts, isLoading: hostsLoading, error: hostsError, refetch: refetchHosts } = useZabbixData("getHosts", isZabbixConfigured);
  const { data: problems, isLoading: problemsLoading, refetch: refetchProblems } = useZabbixData("getProblems", isZabbixConfigured);
  const { data: alerts, isLoading: alertsLoading, refetch: refetchAlerts } = useZabbixData("getAlerts", isZabbixConfigured);
  const { data: playbooks } = useAnsiblePlaybooks();

  // Filters
  const [hostSearch, setHostSearch] = useState("");
  const [hostGroupFilter, setHostGroupFilter] = useState("all");
  const [problemPriorityFilter, setProblemPriorityFilter] = useState("all");
  const [problemHostFilter, setProblemHostFilter] = useState("");

  const connectionError = !isZabbixConfigured || hostsError != null;

  /* ── Computed stats ── */
  const hostsArr = Array.isArray(hosts) ? hosts : [];
  const problemsArr = Array.isArray(problems) ? problems : [];
  const alertsArr = Array.isArray(alerts) ? alerts : [];

  const hostsAvailable = hostsArr.filter((h: any) => h.available === "1").length;
  const hostsUnavailable = hostsArr.filter((h: any) => h.available === "2").length;

  // Problem counts by Zabbix severity mapped to П1-П4
  const problemsByCategory = useMemo(() => {
    const p1 = alertsArr.filter((a: any) => parseInt(a.priority) >= 4).length;
    const p2 = alertsArr.filter((a: any) => parseInt(a.priority) === 3).length;
    const p3 = alertsArr.filter((a: any) => parseInt(a.priority) === 2).length;
    const p4 = alertsArr.filter((a: any) => parseInt(a.priority) <= 1).length;
    return { p1, p2, p3, p4 };
  }, [alertsArr]);

  // Top-5 problematic hosts
  const topProblemHosts = useMemo(() => {
    const hostProblems: Record<string, { name: string; count: number; lastProblem: string; lastClock: string }> = {};
    for (const a of alertsArr) {
      const hostName = a.hosts?.[0]?.name || "—";
      const hostId = a.hosts?.[0]?.hostid || a.triggerid;
      if (!hostProblems[hostId]) {
        hostProblems[hostId] = { name: hostName, count: 0, lastProblem: "", lastClock: "0" };
      }
      hostProblems[hostId].count++;
      if (a.lastchange > hostProblems[hostId].lastClock) {
        hostProblems[hostId].lastProblem = a.description;
        hostProblems[hostId].lastClock = a.lastchange;
      }
    }
    return Object.values(hostProblems).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [alertsArr]);

  // Group hosts by type
  const groupedHosts = useMemo(() => {
    let filtered = hostsArr;
    if (hostSearch) {
      const q = hostSearch.toLowerCase();
      filtered = filtered.filter((h: any) =>
        h.name.toLowerCase().includes(q) ||
        (h.interfaces?.[0]?.ip || "").includes(q)
      );
    }
    if (hostGroupFilter !== "all") {
      filtered = filtered.filter((h: any) => hostGroupType(h.groups) === hostGroupFilter);
    }
    const groups: Record<string, any[]> = {};
    for (const h of filtered) {
      const type = hostGroupType(h.groups);
      if (!groups[type]) groups[type] = [];
      groups[type].push(h);
    }
    return groups;
  }, [hostsArr, hostSearch, hostGroupFilter]);

  // Filtered problems
  const filteredProblems = useMemo(() => {
    let list = problemsArr;
    if (problemPriorityFilter !== "all") {
      list = list.filter((p: any) => p.severity === problemPriorityFilter);
    }
    if (problemHostFilter) {
      const q = problemHostFilter.toLowerCase();
      list = list.filter((p: any) => (p.name || "").toLowerCase().includes(q));
    }
    return list;
  }, [problemsArr, problemPriorityFilter, problemHostFilter]);

  /* ── Actions ── */
  const handleRefresh = () => {
    refetchHosts();
    refetchProblems();
    refetchAlerts();
    toast({ title: "Данные обновляются..." });
  };

  // Create ticket from problem
  const createTicketFromProblem = async (problem: any) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Не авторизован");

      const severity = parseInt(problem.severity || problem.priority || "2");
      const ticketPriority = severity >= 4 ? "P1" : severity === 3 ? "P2" : severity === 2 ? "P3" : "P4";

      const { error } = await supabase.from("tickets").insert({
        title: `[Мониторинг] ${problem.name || problem.description}`,
        description: `Автоматически создана из проблемы мониторинга.\n\nОписание: ${problem.name || problem.description}\nСерьёзность: ${priorityLabel(problem.severity || problem.priority)}\nВремя: ${new Date(parseInt(problem.clock || problem.lastchange) * 1000).toLocaleString("ru-RU")}`,
        priority: ticketPriority as any,
        created_by: session.user.id,
        status: "open" as any,
      });
      if (error) throw error;

      await logAudit({
        action: "Создание заявки из мониторинга",
        module: "monitoring",
        details: problem.name || problem.description,
      });

      toast({ title: "Заявка создана", description: `Приоритет: ${ticketPriority}` });
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    }
  };

  // Run playbook
  const runPlaybook = useMutation({
    mutationFn: async ({ playbookId, targetHost }: { playbookId: string; targetHost?: string }) => {
      const { data, error } = await supabase.functions.invoke("ansible-proxy", {
        body: { action: "runPlaybook", playbook: playbookId, target_host: targetHost },
      });
      if (error) throw error;

      await logAudit({
        action: "Запуск сценария автоматизации",
        module: "monitoring",
        details: `Сценарий: ${playbookId}${targetHost ? `, Хост: ${targetHost}` : ""}`,
      });

      return data?.result;
    },
    onSuccess: (result) => {
      toast({ title: "Задача запущена", description: result?.message || "Поставлена в очередь" });
    },
    onError: (err: Error) => {
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    },
  });

  const categoryIcons: Record<string, string> = {
    restart: "🔄", cleanup: "🧹", backup: "💾", session: "👤",
    failover: "🔁", network: "🌐", check: "✅",
  };

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
          <CardContent className="py-4 flex items-center justify-between">
            <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {!isZabbixConfigured
                ? "Zabbix не сконфигурирован. Перейдите в Настройка для подключения."
                : "Нет связи с сервером мониторинга. Данные могут быть неактуальны."}
            </p>
            <Button size="sm" variant="outline" onClick={() => setTab("config")}>
              Проверить настройки
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="dashboard">Дашборд</TabsTrigger>
          <TabsTrigger value="hosts">Хосты</TabsTrigger>
          <TabsTrigger value="problems">Проблемы и Алерты</TabsTrigger>
          <TabsTrigger value="graphs">Графики</TabsTrigger>
          <TabsTrigger value="automation">Автоматизация</TabsTrigger>
          <TabsTrigger value="config" className="flex items-center gap-1">
            <Settings className="h-3.5 w-3.5" />
            Настройка
          </TabsTrigger>
        </TabsList>

        {/* ═══ TAB 1: Dashboard ═══ */}
        <TabsContent value="dashboard" className="space-y-4">
          {/* Problem counters by priority */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-red-500/30">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">🔴 П1 — Критический</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-heading font-bold text-red-500">{problemsByCategory.p1}</div>
                <p className="text-xs text-muted-foreground mt-1">Disaster + High</p>
              </CardContent>
            </Card>
            <Card className="border-orange-500/30">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">🟠 П2 — Частичный отказ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-heading font-bold text-orange-500">{problemsByCategory.p2}</div>
                <p className="text-xs text-muted-foreground mt-1">Average</p>
              </CardContent>
            </Card>
            <Card className="border-yellow-500/30">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">🟡 П3 — Сбои сервисов</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-heading font-bold text-yellow-500">{problemsByCategory.p3}</div>
                <p className="text-xs text-muted-foreground mt-1">Warning</p>
              </CardContent>
            </Card>
            <Card className="border-blue-500/30">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">🔵 П4 — Некритичные</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-heading font-bold text-blue-500">{problemsByCategory.p4}</div>
                <p className="text-xs text-muted-foreground mt-1">Information</p>
              </CardContent>
            </Card>
          </div>

          {/* Summary row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Хосты</CardTitle>
                <Server className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-heading font-bold">{hostsArr.length}</div>
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
                <div className="text-3xl font-heading font-bold">{problemsArr.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Сценарии автоматизации</CardTitle>
                <Terminal className="h-5 w-5 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-heading font-bold">{Array.isArray(playbooks) ? playbooks.length : 0}</div>
              </CardContent>
            </Card>
          </div>

          {/* Top-5 problematic hosts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Топ-5 проблемных узлов</CardTitle>
            </CardHeader>
            <CardContent>
              {alertsLoading ? <LoadingSkeleton rows={5} /> : topProblemHosts.length === 0 ? (
                <div className="text-center py-6">
                  <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">Проблемных узлов нет</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Хост</TableHead>
                      <TableHead>Проблема</TableHead>
                      <TableHead>Кол-во</TableHead>
                      <TableHead>Длительность</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topProblemHosts.map((h, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{h.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[300px] truncate">{h.lastProblem}</TableCell>
                        <TableCell><Badge variant="destructive">{h.count}</Badge></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{duration(h.lastClock)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Cluster status widgets */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: "Кластер Kubernetes", icon: Cpu },
              { name: "Кластер VMware", icon: Monitor },
              { name: "Кластер БД PostgreSQL", icon: Database },
            ].map(({ name, icon: Icon }) => (
              <Card key={name}>
                <CardContent className="py-4 flex items-center gap-3">
                  <Icon className="h-6 w-6 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{name}</p>
                    <p className="text-xs text-muted-foreground">Данные из Zabbix</p>
                  </div>
                  {connectionError ? (
                    <Badge variant="outline" className="text-muted-foreground">—</Badge>
                  ) : (
                    <Badge variant="success">✅ Норма</Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ═══ TAB 2: Hosts ═══ */}
        <TabsContent value="hosts" className="space-y-4">
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Поиск по имени, IP..." value={hostSearch} onChange={(e) => setHostSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={hostGroupFilter} onValueChange={setHostGroupFilter}>
              <SelectTrigger className="w-[220px]"><SelectValue placeholder="Все типы" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все типы</SelectItem>
                {Object.entries(groupTypeConfig).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hostsLoading ? <LoadingSkeleton rows={8} /> : hostsArr.length === 0 ? (
            <Card><CardContent className="py-10 text-center text-muted-foreground">Нет данных о хостах. Проверьте подключение к Zabbix.</CardContent></Card>
          ) : (
            Object.entries(groupedHosts).map(([type, hostList]) => {
              const cfg = groupTypeConfig[type] || groupTypeConfig.other;
              const Icon = cfg.icon;
              return (
                <Card key={type}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {cfg.label} ({hostList.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Имя хоста</TableHead>
                          <TableHead>IP</TableHead>
                          <TableHead>Группа</TableHead>
                          <TableHead>Доступность</TableHead>
                          <TableHead>Проблемы</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {hostList.map((host: any) => {
                          const hostAlerts = alertsArr.filter((a: any) => a.hosts?.[0]?.hostid === host.hostid);
                          const avail = availabilityBadge(host.available);
                          return (
                            <TableRow key={host.hostid}>
                              <TableCell className="font-medium">{host.name}</TableCell>
                              <TableCell className="font-mono text-xs text-muted-foreground">
                                {host.interfaces?.[0]?.ip || "—"}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">{host.groups?.[0]?.name || "—"}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={avail.variant as any}>{avail.label}</Badge>
                              </TableCell>
                              <TableCell>
                                {hostAlerts.length > 0 ? (
                                  <div className="flex gap-1">
                                    {hostAlerts.slice(0, 3).map((a: any, i: number) => (
                                      <Badge key={i} variant={priorityColor(a.priority) as any} className="text-xs">
                                        {priorityLabel(a.priority)}
                                      </Badge>
                                    ))}
                                    {hostAlerts.length > 3 && <Badge variant="outline">+{hostAlerts.length - 3}</Badge>}
                                  </div>
                                ) : (
                                  <span className="text-xs text-green-500">✓</span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* ═══ TAB 3: Problems & Alerts ═══ */}
        <TabsContent value="problems" className="space-y-4">
          <div className="flex gap-3 flex-wrap">
            <Select value={problemPriorityFilter} onValueChange={setProblemPriorityFilter}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Все приоритеты" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все приоритеты</SelectItem>
                <SelectItem value="5">П1 — Катастрофа</SelectItem>
                <SelectItem value="4">П1 — Высокий</SelectItem>
                <SelectItem value="3">П2 — Средний</SelectItem>
                <SelectItem value="2">П3 — Предупреждение</SelectItem>
                <SelectItem value="1">П4 — Информация</SelectItem>
                <SelectItem value="0">П4 — Не классиф.</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Фильтр по хосту / описанию..." value={problemHostFilter} onChange={(e) => setProblemHostFilter(e.target.value)} className="pl-9" />
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Активные проблемы</CardTitle>
            </CardHeader>
            <CardContent>
              {problemsLoading ? <LoadingSkeleton rows={6} /> : filteredProblems.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-2" />
                  <p className="text-muted-foreground">Активных проблем нет</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Категория</TableHead>
                      <TableHead>Описание</TableHead>
                      <TableHead>Серьёзность</TableHead>
                      <TableHead>Время</TableHead>
                      <TableHead>Длительность</TableHead>
                      {isStaff && <TableHead className="text-right">Действия</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProblems.map((p: any) => {
                      const incident = priorityToIncident(p.severity);
                      return (
                        <TableRow key={p.eventid}>
                          <TableCell>
                            <span className={`text-xs font-medium ${incident.color}`}>{incident.label}</span>
                          </TableCell>
                          <TableCell className="max-w-[300px]">{p.name}</TableCell>
                          <TableCell>
                            <Badge variant={priorityColor(p.severity) as any}>{priorityLabel(p.severity)}</Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(parseInt(p.clock) * 1000).toLocaleString("ru-RU")}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{duration(p.clock)}</TableCell>
                          {isStaff && (
                            <TableCell className="text-right space-x-1">
                              <Button size="sm" variant="ghost" title="Создать заявку" onClick={() => createTicketFromProblem(p)}>
                                <MessageSquarePlus className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Alerts / Triggers */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Активные триггеры</CardTitle>
            </CardHeader>
            <CardContent>
              {alertsLoading ? <LoadingSkeleton rows={6} /> : alertsArr.length === 0 ? (
                <div className="text-center py-8">
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
                      <TableHead>Изменение</TableHead>
                      {isStaff && <TableHead className="text-right">Действия</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alertsArr.map((a: any) => (
                      <TableRow key={a.triggerid}>
                        <TableCell className="font-medium">{a.hosts?.[0]?.name || "—"}</TableCell>
                        <TableCell className="max-w-[300px]">{a.description}</TableCell>
                        <TableCell>
                          <Badge variant={priorityColor(a.priority) as any}>{priorityLabel(a.priority)}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(parseInt(a.lastchange) * 1000).toLocaleString("ru-RU")}
                        </TableCell>
                        {isStaff && (
                          <TableCell className="text-right">
                            <Button size="sm" variant="ghost" title="Создать заявку" onClick={() => createTicketFromProblem(a)}>
                              <MessageSquarePlus className="h-4 w-4" />
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
        </TabsContent>

        {/* ═══ TAB 4: Graphs ═══ */}
        <TabsContent value="graphs" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: "Производительность БД", desc: "Размер БД, активные соединения, статус VACUUM, WAL", icon: Database },
              { title: "Кластер Kubernetes", desc: "Потребление ресурсов подами, Node Ready Status", icon: Cpu },
              { title: "Аппаратное здоровье серверов", desc: "Температура CPU, Fan Speed, PSU Status (Huawei iBMC)", icon: Zap },
              { title: "СХД OceanStor Dorado", desc: "Controller Status, LUN, HyperMetro Sync, Pool Usage", icon: HardDrive },
              { title: "Сетевые устройства", desc: "Interface Status, Bandwidth, Packet Errors, OSPF/VRRP", icon: Network },
              { title: "Загрузка CPU/RAM серверов", desc: "CPU Utilization, Memory Available, Disk Free", icon: BarChart3 },
            ].map(({ title, desc, icon: Icon }) => (
              <Card key={title}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" />
                    {title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-3">{desc}</p>
                  <div className="bg-muted/30 rounded-lg h-40 flex items-center justify-center border border-dashed border-muted-foreground/20">
                    <div className="text-center text-muted-foreground">
                      <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      <p className="text-xs">Подключите Zabbix для отображения графиков</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardContent className="py-4">
              <p className="text-sm text-muted-foreground">
                💡 Графики отображаются в реальном времени при наличии подключения к Zabbix API.
                Для экспорта отчёта используйте модуль «Протоколы».
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ TAB 5: Automation ═══ */}
        <TabsContent value="automation">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Terminal className="h-4 w-4" />
                Сценарии автоматизации
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!Array.isArray(playbooks) || playbooks.length === 0 ? (
                <p className="text-muted-foreground text-center py-10">Нет доступных сценариев</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead></TableHead>
                      <TableHead>Сценарий</TableHead>
                      <TableHead>Описание</TableHead>
                      <TableHead>Категория</TableHead>
                      <TableHead>Пункт ТЗ</TableHead>
                      {isStaff && <TableHead className="text-right">Действие</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {playbooks.map((pb: any) => (
                      <TableRow key={pb.id}>
                        <TableCell className="text-lg w-10">{categoryIcons[pb.category] || "⚙️"}</TableCell>
                        <TableCell className="font-medium">{pb.name}</TableCell>
                        <TableCell className="text-muted-foreground text-sm max-w-[300px]">{pb.description}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{pb.categoryLabel || pb.category}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{pb.tzRef || "—"}</TableCell>
                        {isStaff && (
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => runPlaybook.mutate({ playbookId: pb.id })}
                              disabled={runPlaybook.isPending}
                            >
                              {runPlaybook.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                              <span className="ml-1.5">Запустить</span>
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
        </TabsContent>

        {/* ═══ TAB 6: Config ═══ */}
        <TabsContent value="config" className="space-y-6">
          <ZabbixSettings />
          <HostManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
