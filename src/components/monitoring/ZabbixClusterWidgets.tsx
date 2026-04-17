import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Layers, Wifi, WifiOff, AlertTriangle, CheckCircle2, GripHorizontal,
} from "lucide-react";

interface ZbxHost {
  hostid: string;
  name: string;
  available?: string;
  groups?: { groupid: string; name: string }[];
}

interface ZbxProblem {
  eventid: string;
  severity?: string;
  hosts?: { hostid: string; name: string }[];
}

interface Props {
  hosts: ZbxHost[];
  problems: ZbxProblem[];
  onClickGroup?: (groupName: string) => void;
}

interface ClusterStats {
  name: string;
  hostCount: number;
  available: number;
  unavailable: number;
  unknown: number;
  problems: number;
  critical: number;
  health: number; // 0-100
}

/**
 * Aggregates hosts into "clusters" grouped by Zabbix host group.
 * Skips noisy/system groups, keeps groups with ≥1 host.
 */
const SYSTEM_GROUPS = new Set([
  "Templates",
  "Discovered hosts",
  "Zabbix servers",
]);

export default function ZabbixClusterWidgets({ hosts, problems, onClickGroup }: Props) {
  const clusters = useMemo<ClusterStats[]>(() => {
    const map = new Map<string, ClusterStats>();

    for (const host of hosts) {
      const groups = host.groups || [];
      for (const g of groups) {
        if (SYSTEM_GROUPS.has(g.name)) continue;
        if (!map.has(g.name)) {
          map.set(g.name, {
            name: g.name,
            hostCount: 0,
            available: 0,
            unavailable: 0,
            unknown: 0,
            problems: 0,
            critical: 0,
            health: 100,
          });
        }
        const c = map.get(g.name)!;
        c.hostCount++;
        if (host.available === "1") c.available++;
        else if (host.available === "2") c.unavailable++;
        else c.unknown++;
      }
    }

    // Count problems per group
    for (const p of problems) {
      const sev = parseInt(p.severity || "0");
      const phosts = p.hosts || [];
      const groupsTouched = new Set<string>();
      for (const ph of phosts) {
        const host = hosts.find((h) => h.hostid === ph.hostid);
        if (!host) continue;
        for (const g of host.groups || []) {
          if (SYSTEM_GROUPS.has(g.name)) continue;
          if (!map.has(g.name)) continue;
          if (groupsTouched.has(g.name)) continue;
          groupsTouched.add(g.name);
          const c = map.get(g.name)!;
          c.problems++;
          if (sev >= 4) c.critical++;
        }
      }
    }

    // Compute simple health score: -10% per unavailable host, -5% per problem, -15% per critical
    for (const c of map.values()) {
      const penalty =
        c.unavailable * 10 + c.problems * 5 + c.critical * 10;
      c.health = Math.max(0, 100 - penalty);
    }

    return [...map.values()]
      .filter((c) => c.hostCount > 0)
      .sort((a, b) => a.health - b.health || b.hostCount - a.hostCount);
  }, [hosts, problems]);

  if (clusters.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="widget-drag-handle cursor-move pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <GripHorizontal className="h-4 w-4 text-muted-foreground" />
            <Layers className="h-4 w-4 text-primary" />
            Состояние кластеров
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-6 text-sm text-muted-foreground">
          Нет данных о группах хостов из Zabbix
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="widget-drag-handle cursor-move pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <GripHorizontal className="h-4 w-4 text-muted-foreground" />
          <Layers className="h-4 w-4 text-primary" />
          Состояние кластеров
          <Badge variant="outline" className="text-[10px] ml-1">
            {clusters.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent
        className="flex-1 overflow-auto space-y-2"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {clusters.map((c) => {
          const healthColor =
            c.health >= 90
              ? "bg-emerald-500"
              : c.health >= 70
                ? "bg-amber-500"
                : c.health >= 40
                  ? "bg-orange-500"
                  : "bg-destructive";
          const statusBadge =
            c.critical > 0 ? (
              <Badge variant="destructive" className="text-[10px]">
                <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                Критично
              </Badge>
            ) : c.problems > 0 ? (
              <Badge variant="default" className="text-[10px] bg-amber-500">
                Проблемы
              </Badge>
            ) : c.unavailable > 0 ? (
              <Badge variant="default" className="text-[10px] bg-orange-500">
                Деградация
              </Badge>
            ) : (
              <Badge variant="default" className="text-[10px] bg-emerald-600">
                <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                Норма
              </Badge>
            );

          return (
            <div
              key={c.name}
              className="border rounded-md p-2.5 hover:bg-muted/40 transition-colors cursor-pointer"
              onClick={() => onClickGroup?.(c.name)}
              title={onClickGroup ? "Открыть хосты этой группы" : undefined}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <p className="text-sm font-medium truncate flex-1">{c.name}</p>
                {statusBadge}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-1.5">
                <span title="Хостов">{c.hostCount} хостов</span>
                <span className="flex items-center gap-1 text-emerald-600">
                  <Wifi className="h-3 w-3" />
                  {c.available}
                </span>
                {c.unavailable > 0 && (
                  <span className="flex items-center gap-1 text-destructive">
                    <WifiOff className="h-3 w-3" />
                    {c.unavailable}
                  </span>
                )}
                {c.problems > 0 && (
                  <span className="flex items-center gap-1 text-amber-600">
                    <AlertTriangle className="h-3 w-3" />
                    {c.problems}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Progress
                  value={c.health}
                  className="h-1.5 flex-1"
                  indicatorClassName={healthColor}
                />
                <span className="text-[10px] tabular-nums text-muted-foreground w-9 text-right">
                  {c.health}%
                </span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
