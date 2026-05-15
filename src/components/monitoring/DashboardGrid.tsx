import { useEffect, useMemo, useState } from "react";
import { Responsive, WidthProvider, Layout, Layouts } from "react-grid-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Server, Wifi, WifiOff, AlertTriangle,
  Terminal, FileText, RotateCcw, Lock, Unlock, Activity,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import RecentEventsFeed from "./RecentEventsFeed";
import ZabbixClusterWidgets from "./ZabbixClusterWidgets";
import FavoriteMetricsWidget from "./FavoriteMetricsWidget";

const ResponsiveGridLayout = WidthProvider(Responsive);

interface Props {
  hosts: { hostid?: string; name?: string; available?: string; groups?: { groupid: string; name: string }[] }[];
  alerts: { priority?: string }[];
  problems: { eventid: string; severity?: string; hosts?: { hostid: string; name: string }[] }[];
  playbooks: unknown[];
  connectionError: boolean;
  onTabChange: (tab: string) => void;
  onFilterProblems: (severity: string) => void;
  graphs: { graphid: string; name: string; hosts?: { hostid: string }[] }[];
}

const DEFAULT_LAYOUT: Layout[] = [
  { i: "p1", x: 0, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
  { i: "p2", x: 3, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
  { i: "p3", x: 6, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
  { i: "p4", x: 9, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
  { i: "hosts", x: 0, y: 2, w: 3, h: 2, minW: 2, minH: 2 },
  { i: "problems", x: 3, y: 2, w: 3, h: 2, minW: 2, minH: 2 },
  { i: "automation", x: 6, y: 2, w: 3, h: 2, minW: 2, minH: 2 },
  { i: "tz", x: 9, y: 2, w: 3, h: 2, minW: 2, minH: 2 },
  { i: "alerts", x: 0, y: 4, w: 7, h: 7, minW: 4, minH: 4 },
  { i: "clusters", x: 7, y: 4, w: 5, h: 7, minW: 3, minH: 4 },
  { i: "topProblems", x: 0, y: 11, w: 6, h: 5, minW: 3, minH: 3 },
  { i: "availability", x: 6, y: 11, w: 6, h: 5, minW: 3, minH: 3 },
  { i: "favoriteMetrics", x: 0, y: 16, w: 12, h: 5, minW: 4, minH: 3 },
];

const STORAGE_KEY = "monitoring-dashboard-layout-v2";

export default function DashboardGrid({
  hosts, alerts, problems, playbooks,
  connectionError, onTabChange, onFilterProblems,
}: Props) {
  const { user } = useAuth();
  const [layouts, setLayouts] = useState<Layouts>({ lg: DEFAULT_LAYOUT });
  const [locked, setLocked] = useState(true);

  const hostsArr = Array.isArray(hosts) ? hosts : [];
  const alertsArr = Array.isArray(alerts) ? alerts : [];
  const problemsArr = Array.isArray(problems) ? problems : [];
  const hostsAvailable = hostsArr.filter((h) => h.available === "1").length;
  const hostsUnavailable = hostsArr.filter((h) => h.available === "2").length;
  const hostsUnknown = hostsArr.length - hostsAvailable - hostsUnavailable;
  const availabilityPercent = hostsArr.length
    ? Math.round((hostsAvailable / hostsArr.length) * 100)
    : 0;

  const counters = useMemo(() => ({
    p1: alertsArr.filter((a) => parseInt(a.priority || "0") >= 4).length,
    p2: alertsArr.filter((a) => parseInt(a.priority || "0") === 3).length,
    p3: alertsArr.filter((a) => parseInt(a.priority || "0") === 2).length,
    p4: alertsArr.filter((a) => parseInt(a.priority || "0") <= 1).length,
  }), [alertsArr]);

  // Top-N hosts with most active problems
  const topProblemHosts = useMemo(() => {
    const counts = new Map<string, { name: string; count: number; maxSev: number }>();
    for (const p of problemsArr) {
      const sev = parseInt(p.severity || "0");
      for (const h of p.hosts || []) {
        const key = h.hostid || h.name;
        if (!key) continue;
        const cur = counts.get(key) || { name: h.name, count: 0, maxSev: 0 };
        cur.count++;
        cur.maxSev = Math.max(cur.maxSev, sev);
        counts.set(key, cur);
      }
    }
    return [...counts.values()]
      .sort((a, b) => b.maxSev - a.maxSev || b.count - a.count)
      .slice(0, 8);
  }, [problemsArr]);

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

  // Load saved layout
  useEffect(() => {
    if (!user) return;
    const key = `${STORAGE_KEY}-${user.id}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try { setLayouts(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }, [user]);

  const onLayoutChange = (_l: Layout[], all: Layouts) => {
    setLayouts(all);
    if (user) {
      localStorage.setItem(`${STORAGE_KEY}-${user.id}`, JSON.stringify(all));
    }
  };

  const resetLayout = () => {
    setLayouts({ lg: DEFAULT_LAYOUT });
    if (user) localStorage.removeItem(`${STORAGE_KEY}-${user.id}`);
  };

  const counterCards = [
    { key: "p1", filterKey: "5", label: "П1 — Критический", emoji: "🔴", count: counters.p1, color: "text-destructive", border: "border-destructive/30", desc: "Disaster + High" },
    { key: "p2", filterKey: "3", label: "П2 — Частичный отказ", emoji: "🟠", count: counters.p2, color: "text-orange-500", border: "border-orange-500/30", desc: "Average" },
    { key: "p3", filterKey: "2", label: "П3 — Сбои сервисов", emoji: "🟡", count: counters.p3, color: "text-yellow-500", border: "border-yellow-500/30", desc: "Warning" },
    { key: "p4", filterKey: "1", label: "П4 — Некритичные", emoji: "🔵", count: counters.p4, color: "text-blue-500", border: "border-blue-500/30", desc: "Information" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => setLocked(!locked)}>
          {locked ? <Lock className="h-3.5 w-3.5 mr-1" /> : <Unlock className="h-3.5 w-3.5 mr-1" />}
          {locked ? "Разблокировать" : "Заблокировать"} компоновку
        </Button>
        <Button variant="ghost" size="sm" onClick={resetLayout}>
          <RotateCcw className="h-3.5 w-3.5 mr-1" />
          Сбросить
        </Button>
      </div>

      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={60}
        margin={[12, 12]}
        onLayoutChange={onLayoutChange}
        isDraggable={!locked}
        isResizable={!locked}
        draggableHandle=".widget-drag-handle"
      >
        {counterCards.map((c) => (
          <div key={c.key}>
            <Card
              className={`${c.border} cursor-pointer hover:shadow-md transition-shadow h-full widget-drag-handle`}
              onClick={() => { if (locked) { onFilterProblems(c.filterKey); onTabChange("problems"); } }}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{c.emoji} {c.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-heading font-bold ${c.color}`}>{c.count}</div>
                <p className="text-xs text-muted-foreground mt-1">{c.desc}</p>
              </CardContent>
            </Card>
          </div>
        ))}

        <div key="hosts">
          <Card className="cursor-pointer hover:shadow-md transition-shadow h-full widget-drag-handle" onClick={() => locked && onTabChange("hosts")}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Хосты</CardTitle>
              <Server className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-heading font-bold">{hostsArr.length}</div>
              <div className="flex gap-3 mt-1 text-xs">
                <span className="text-emerald-600 flex items-center gap-1"><Wifi className="h-3 w-3" />{hostsAvailable}</span>
                <span className="text-destructive flex items-center gap-1"><WifiOff className="h-3 w-3" />{hostsUnavailable}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div key="problems">
          <Card className="cursor-pointer hover:shadow-md transition-shadow h-full widget-drag-handle" onClick={() => locked && onTabChange("problems")}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Активные проблемы</CardTitle>
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-heading font-bold">{problemsArr.length}</div>
            </CardContent>
          </Card>
        </div>

        <div key="automation">
          <Card className="cursor-pointer hover:shadow-md transition-shadow h-full widget-drag-handle" onClick={() => locked && onTabChange("automation")}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Автоматизация</CardTitle>
              <Terminal className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-heading font-bold">{Array.isArray(playbooks) ? playbooks.length : 0}</div>
            </CardContent>
          </Card>
        </div>

        <div key="tz">
          <Card className="cursor-pointer hover:shadow-md transition-shadow h-full widget-drag-handle" onClick={() => locked && onTabChange("tz")}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Покрытие регламента</CardTitle>
              <FileText className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-heading font-bold">{tzStats?.percent ?? 0}%</div>
              <Progress value={tzStats?.percent ?? 0} className="h-1.5 mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {tzStats?.covered ?? 0} из {tzStats?.total ?? 0}
              </p>
            </CardContent>
          </Card>
        </div>

        <div key="alerts">
          <RecentEventsFeed isZabbixConfigured={!connectionError} compact={false} />
        </div>

        <div key="clusters">
          <ZabbixClusterWidgets
            hosts={hostsArr as any}
            problems={problemsArr}
            onClickGroup={() => onTabChange("hosts")}
          />
        </div>

        <div key="topProblems">
          <Card className="h-full flex flex-col">
            <CardHeader className="widget-drag-handle cursor-move pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Топ хостов с проблемами
                <Badge variant="outline" className="text-[10px] ml-1">
                  {topProblemHosts.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto" onMouseDown={(e) => e.stopPropagation()}>
              {topProblemHosts.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  Проблемных хостов нет ✅
                </div>
              ) : (
                <div className="space-y-1.5">
                  {topProblemHosts.map((h, i) => {
                    const sevColor =
                      h.maxSev >= 4 ? "text-destructive"
                      : h.maxSev === 3 ? "text-orange-500"
                      : h.maxSev === 2 ? "text-yellow-500"
                      : "text-blue-500";
                    return (
                      <div
                        key={h.name + i}
                        className="flex items-center gap-3 p-2 rounded border hover:bg-muted/40 cursor-pointer"
                        onClick={() => onTabChange("hosts")}
                      >
                        <span className="text-xs font-mono text-muted-foreground w-6">#{i + 1}</span>
                        <Server className={`h-4 w-4 ${sevColor}`} />
                        <p className="text-sm font-medium flex-1 truncate">{h.name}</p>
                        <Badge variant="destructive" className="text-[10px]">
                          {h.count} проб.
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div key="availability">
          <Card className="h-full flex flex-col">
            <CardHeader className="widget-drag-handle cursor-move pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Доступность инфраструктуры
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center space-y-4" onMouseDown={(e) => e.stopPropagation()}>
              <div className="text-center">
                <div className={`text-5xl font-heading font-bold ${
                  availabilityPercent >= 95 ? "text-emerald-600"
                  : availabilityPercent >= 80 ? "text-amber-500"
                  : "text-destructive"
                }`}>
                  {availabilityPercent}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">хостов в сети</p>
              </div>
              <Progress
                value={availabilityPercent}
                className="h-2"
                indicatorClassName={
                  availabilityPercent >= 95 ? "bg-emerald-500"
                  : availabilityPercent >= 80 ? "bg-amber-500"
                  : "bg-destructive"
                }
              />
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded border p-2">
                  <Wifi className="h-4 w-4 mx-auto text-emerald-600 mb-1" />
                  <div className="font-bold text-emerald-600">{hostsAvailable}</div>
                  <div className="text-muted-foreground">в сети</div>
                </div>
                <div className="rounded border p-2">
                  <WifiOff className="h-4 w-4 mx-auto text-destructive mb-1" />
                  <div className="font-bold text-destructive">{hostsUnavailable}</div>
                  <div className="text-muted-foreground">недоступны</div>
                </div>
                <div className="rounded border p-2">
                  <Server className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                  <div className="font-bold">{hostsUnknown}</div>
                  <div className="text-muted-foreground">неизв.</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div key="favoriteMetrics">
          <FavoriteMetricsWidget />
        </div>

      </ResponsiveGridLayout>
    </div>
  );
}
