import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Server, Wifi, WifiOff, AlertTriangle,
  Cpu, Monitor, Database, Terminal, FileText,
} from "lucide-react";
import RecentEventsFeed from "./RecentEventsFeed";
import FavoriteGraphs from "./FavoriteGraphs";

interface Props {
  hosts: { hostid?: string; name?: string; available?: string; groups?: { name: string }[] }[];
  alerts: { priority?: string; severity?: string; hosts?: { hostid: string; name: string }[]; description?: string; lastchange?: string; triggerid?: string }[];
  problems: unknown[];
  playbooks: unknown[];
  hostsLoading: boolean;
  alertsLoading: boolean;
  connectionError: boolean;
  onTabChange: (tab: string) => void;
  onFilterProblems: (severity: string) => void;
  graphs: { graphid: string; name: string; hosts?: { hostid: string }[] }[];
}

export default function MonitoringDashboard({
  hosts, alerts, problems, playbooks,
  hostsLoading, alertsLoading, connectionError,
  onTabChange, onFilterProblems, graphs,
}: Props) {
  const hostsArr = Array.isArray(hosts) ? hosts : [];
  const alertsArr = Array.isArray(alerts) ? alerts : [];
  const problemsArr = Array.isArray(problems) ? problems : [];

  const hostsAvailable = hostsArr.filter((h) => h.available === "1").length;
  const hostsUnavailable = hostsArr.filter((h) => h.available === "2").length;

  const problemsByCategory = useMemo(() => {
    const p1 = alertsArr.filter((a) => parseInt(a.priority || "0") >= 4).length;
    const p2 = alertsArr.filter((a) => parseInt(a.priority || "0") === 3).length;
    const p3 = alertsArr.filter((a) => parseInt(a.priority || "0") === 2).length;
    const p4 = alertsArr.filter((a) => parseInt(a.priority || "0") <= 1).length;
    return { p1, p2, p3, p4 };
  }, [alertsArr]);

  // TZ coverage stats
  const { data: tzStats } = useQuery({
    queryKey: ["tz-coverage-stats"],
    queryFn: async () => {
      const [reqsRes, covRes] = await Promise.all([
        supabase.from("tz_requirements").select("id"),
        supabase.from("tz_coverage").select("requirement_id, status"),
      ]);
      const total = reqsRes.data?.length || 0;
      const covered = new Set<string>();
      const partial = new Set<string>();
      (covRes.data || []).forEach((c) => {
        if (c.status === "covered") covered.add(c.requirement_id);
        else if (c.status === "partial") partial.add(c.requirement_id);
      });
      const percent = total > 0 ? Math.round(((covered.size + partial.size * 0.5) / total) * 100) : 0;
      return { total, covered: covered.size, partial: partial.size, percent };
    },
    refetchInterval: 60000,
  });

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
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Автоматизация</CardTitle>
            <Terminal className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-heading font-bold">{Array.isArray(playbooks) ? playbooks.length : 0}</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onTabChange("tz")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Покрытие регламента</CardTitle>
            <FileText className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-heading font-bold">{tzStats?.percent ?? 0}%</div>
            <Progress value={tzStats?.percent ?? 0} className="h-1.5 mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {tzStats?.covered ?? 0} из {tzStats?.total ?? 0} пунктов
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent alerts feed (replaced top-5) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RecentEventsFeed isZabbixConfigured={!connectionError} />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Состояние кластеров</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {clusters.map(({ name, icon: Icon }) => (
              <div key={name} className="flex items-center gap-3 p-2 rounded border">
                <Icon className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm flex-1">{name}</p>
                {connectionError ? (
                  <Badge variant="outline" className="text-muted-foreground">—</Badge>
                ) : (
                  <Badge variant="default" className="bg-green-600">✅ Норма</Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Favorite graphs */}
      <FavoriteGraphs hosts={hostsArr as { hostid: string; name: string }[]} graphs={graphs} />

      {hostsLoading && (
        <div className="space-y-2">
          <Skeleton className="h-6 w-full" />
        </div>
      )}
    </div>
  );
}
