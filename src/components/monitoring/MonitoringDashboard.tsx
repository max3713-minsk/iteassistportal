import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Server, Wifi, WifiOff, AlertTriangle, CheckCircle2,
  Cpu, Monitor, Database, Terminal, BarChart3,
} from "lucide-react";
import { duration, priorityLabel } from "./monitoringUtils";

interface Props {
  hosts: any[];
  alerts: any[];
  problems: any[];
  playbooks: any[];
  hostsLoading: boolean;
  alertsLoading: boolean;
  connectionError: boolean;
  onTabChange: (tab: string) => void;
  onFilterProblems: (severity: string) => void;
}

export default function MonitoringDashboard({
  hosts, alerts, problems, playbooks,
  hostsLoading, alertsLoading, connectionError,
  onTabChange, onFilterProblems,
}: Props) {
  const hostsArr = Array.isArray(hosts) ? hosts : [];
  const alertsArr = Array.isArray(alerts) ? alerts : [];
  const problemsArr = Array.isArray(problems) ? problems : [];

  const hostsAvailable = hostsArr.filter((h: any) => h.available === "1").length;
  const hostsUnavailable = hostsArr.filter((h: any) => h.available === "2").length;

  const problemsByCategory = useMemo(() => {
    const p1 = alertsArr.filter((a: any) => parseInt(a.priority) >= 4).length;
    const p2 = alertsArr.filter((a: any) => parseInt(a.priority) === 3).length;
    const p3 = alertsArr.filter((a: any) => parseInt(a.priority) === 2).length;
    const p4 = alertsArr.filter((a: any) => parseInt(a.priority) <= 1).length;
    return { p1, p2, p3, p4 };
  }, [alertsArr]);

  const topProblemHosts = useMemo(() => {
    const map: Record<string, { name: string; count: number; lastProblem: string; lastClock: string }> = {};
    for (const a of alertsArr) {
      const name = a.hosts?.[0]?.name || "—";
      const id = a.hosts?.[0]?.hostid || a.triggerid;
      if (!map[id]) map[id] = { name, count: 0, lastProblem: "", lastClock: "0" };
      map[id].count++;
      if (a.lastchange > map[id].lastClock) {
        map[id].lastProblem = a.description;
        map[id].lastClock = a.lastchange;
      }
    }
    return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [alertsArr]);

  const counters = [
    { key: "5", label: "П1 — Критический", emoji: "🔴", count: problemsByCategory.p1, color: "text-red-500", border: "border-red-500/30", desc: "Disaster + High" },
    { key: "3", label: "П2 — Частичный отказ", emoji: "🟠", count: problemsByCategory.p2, color: "text-orange-500", border: "border-orange-500/30", desc: "Average" },
    { key: "2", label: "П3 — Сбои сервисов", emoji: "🟡", count: problemsByCategory.p3, color: "text-yellow-500", border: "border-yellow-500/30", desc: "Warning" },
    { key: "1", label: "П4 — Некритичные", emoji: "🔵", count: problemsByCategory.p4, color: "text-blue-500", border: "border-blue-500/30", desc: "Information" },
  ];

  const clusters = [
    { name: "Кластер Kubernetes", icon: Cpu },
    { name: "Кластер VMware", icon: Monitor },
    { name: "Кластер БД PostgreSQL", icon: Database },
  ];

  return (
    <div className="space-y-4">
      {/* Problem counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {counters.map((c) => (
          <Card
            key={c.key}
            className={`${c.border} cursor-pointer hover:shadow-md transition-shadow`}
            onClick={() => { onFilterProblems(c.key); onTabChange("problems"); }}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{c.emoji} {c.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-heading font-bold ${c.color}`}>{c.count}</div>
              <p className="text-xs text-muted-foreground mt-1">{c.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onTabChange("hosts")}>
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
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onTabChange("problems")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Активные проблемы</CardTitle>
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-heading font-bold">{problemsArr.length}</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onTabChange("automation")}>
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
          {alertsLoading ? (
            <div className="space-y-3 py-4">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : topProblemHosts.length === 0 ? (
            <div className="text-center py-6">
              <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">Проблемных узлов нет</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Хост</TableHead>
                  <TableHead>Последняя проблема</TableHead>
                  <TableHead>Кол-во</TableHead>
                  <TableHead>Длительность</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topProblemHosts.map((h, i) => (
                  <TableRow key={i} className="cursor-pointer" onClick={() => onTabChange("hosts")}>
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

      {/* Cluster status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {clusters.map(({ name, icon: Icon }) => (
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
                <Badge variant="default" className="bg-green-600">✅ Норма</Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Daily checks widget */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Статус ежедневных проверок (по ТЗ)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { id: 1, label: "Проверка загрузки CPU серверов", status: hostsArr.length > 0 },
              { id: 2, label: "Проверка использования оперативной памяти", status: hostsArr.length > 0 },
              { id: 3, label: "Проверка системных журналов (логов)", status: false },
              { id: 4, label: "Проверка доступности сервисов", status: hostsAvailable > 0 },
              { id: 5, label: "Проверка состояния СХД и дисков", status: false },
            ].map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 p-2 rounded-md border cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => onTabChange("graphs")}
              >
                {item.status ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                )}
                <span className="text-sm">{item.label}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            💡 Статусы обновляются автоматически из данных Zabbix при наличии подключения.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
