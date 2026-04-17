import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, ArrowLeft, BarChart3, AlertTriangle, Clock, Database, Settings2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import HostItemsView from "./HostItemsView";
import HostDetailDialog from "./HostDetailDialog";
import {
  hostGroupType, groupTypeConfig, availabilityBadge,
  priorityColor, priorityLabel, duration,
} from "./monitoringUtils";

interface Props {
  hosts: any[];
  alerts: any[];
  items: any[];
  hostsLoading: boolean;
  onCreateTicket: (problem: any) => void;
  isStaff: boolean;
}

export default function MonitoringHosts({ hosts, alerts, items, hostsLoading, onCreateTicket, isStaff }: Props) {
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");
  const [selectedHost, setSelectedHost] = useState<any>(null);
  const [detailHost, setDetailHost] = useState<{ id: string; name: string } | null>(null);

  const hostsArr = Array.isArray(hosts) ? hosts : [];
  const alertsArr = Array.isArray(alerts) ? alerts : [];
  const itemsArr = Array.isArray(items) ? items : [];

  const groupedHosts = useMemo(() => {
    let filtered = hostsArr;
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((h: any) =>
        h.name.toLowerCase().includes(q) ||
        (h.interfaces?.[0]?.ip || "").includes(q)
      );
    }
    if (groupFilter !== "all") {
      filtered = filtered.filter((h: any) => hostGroupType(h.groups) === groupFilter);
    }
    const groups: Record<string, any[]> = {};
    for (const h of filtered) {
      const type = hostGroupType(h.groups);
      if (!groups[type]) groups[type] = [];
      groups[type].push(h);
    }
    return groups;
  }, [hostsArr, search, groupFilter]);

  // Get items for selected host
  const hostItems = useMemo(() => {
    if (!selectedHost) return [];
    return itemsArr.filter((item: any) =>
      item.hosts?.some((h: any) => h.hostid === selectedHost.hostid)
    );
  }, [selectedHost, itemsArr]);

  const hostAlerts = useMemo(() => {
    if (!selectedHost) return [];
    return alertsArr.filter((a: any) => a.hosts?.[0]?.hostid === selectedHost.hostid);
  }, [selectedHost, alertsArr]);

  // Extract key metrics
  const getMetric = (key: string) => {
    const item = hostItems.find((i: any) =>
      i.key_.toLowerCase().includes(key.toLowerCase())
    );
    return item ? { value: item.lastvalue, units: item.units, name: item.name } : null;
  };

  if (selectedHost) {
    const avail = availabilityBadge(selectedHost.available);
    const cpuMetric = getMetric("cpu.util") || getMetric("system.cpu");
    const memMetric = getMetric("vm.memory.util") || getMetric("mem.util");
    const diskMetric = getMetric("vfs.fs.pused") || getMetric("disk");
    const uptimeMetric = getMetric("system.uptime");

    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setSelectedHost(null)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Назад к списку
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                {selectedHost.name}
                <Badge variant={avail.variant as any}>{avail.label}</Badge>
              </CardTitle>
              <span className="text-sm text-muted-foreground font-mono">
                {selectedHost.interfaces?.[0]?.ip || "—"}
              </span>
            </div>
          </CardHeader>
        </Card>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Обзор</TabsTrigger>
            <TabsTrigger value="problems">Проблемы ({hostAlerts.length})</TabsTrigger>
            <TabsTrigger value="latest">Последние данные</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "CPU", metric: cpuMetric, unit: "%" },
                { label: "Память", metric: memMetric, unit: "%" },
                { label: "Диск", metric: diskMetric, unit: "%" },
                { label: "Uptime", metric: uptimeMetric, unit: "" },
              ].map(({ label, metric, unit }) => (
                <Card key={label}>
                  <CardContent className="py-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">{label}</p>
                    <p className="text-2xl font-heading font-bold">
                      {metric ? `${parseFloat(metric.value).toFixed(1)}${unit || metric.units}` : "—"}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Группы хоста</CardTitle>
              </CardHeader>
              <CardContent className="flex gap-2 flex-wrap">
                {selectedHost.groups?.map((g: any) => (
                  <Badge key={g.groupid} variant="outline">{g.name}</Badge>
                )) || <span className="text-muted-foreground text-sm">—</span>}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-4">
                <div className="bg-muted/30 rounded-lg h-48 flex items-center justify-center border border-dashed border-muted-foreground/20">
                  <div className="text-center text-muted-foreground">
                    <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-xs">Графики CPU, памяти и сети для данного хоста</p>
                    <p className="text-xs">Доступно при прямом подключении к Zabbix</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="problems">
            {hostAlerts.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Нет активных проблем для этого хоста
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Описание</TableHead>
                        <TableHead>Приоритет</TableHead>
                        <TableHead>Время</TableHead>
                        {isStaff && <TableHead className="text-right">Действия</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {hostAlerts.map((a: any) => (
                        <TableRow key={a.triggerid}>
                          <TableCell>{a.description}</TableCell>
                          <TableCell>
                            <Badge variant={priorityColor(a.priority) as any}>{priorityLabel(a.priority)}</Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {duration(a.lastchange)}
                          </TableCell>
                          {isStaff && (
                            <TableCell className="text-right">
                              <Button size="sm" variant="ghost" onClick={() => onCreateTicket(a)}>
                                Создать заявку
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="latest">
            <HostItemsViewWrapper
              zabbixHostId={selectedHost.hostid}
              items={hostItems}
            />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Поиск по имени, IP..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={groupFilter} onValueChange={setGroupFilter}>
          <SelectTrigger className="w-[220px]"><SelectValue placeholder="Все типы" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все типы</SelectItem>
            {Object.entries(groupTypeConfig).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hostsLoading ? (
        <div className="space-y-3 py-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      ) : hostsArr.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Нет данных о хостах. Проверьте подключение к Zabbix.
          </CardContent>
        </Card>
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
                      <TableHead className="w-32 text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hostList.map((host: any) => {
                      const hAlerts = alertsArr.filter((a: any) => a.hosts?.[0]?.hostid === host.hostid);
                      const avail = availabilityBadge(host.available);
                      return (
                        <TableRow
                          key={host.hostid}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setSelectedHost(host)}
                        >
                          <TableCell className="font-medium text-primary underline-offset-2 hover:underline">
                            {host.name}
                          </TableCell>
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
                            {hAlerts.length > 0 ? (
                              <div className="flex gap-1">
                                {hAlerts.slice(0, 3).map((a: any, i: number) => (
                                  <Badge key={i} variant={priorityColor(a.priority) as any} className="text-xs">
                                    {priorityLabel(a.priority)}
                                  </Badge>
                                ))}
                                {hAlerts.length > 3 && <Badge variant="outline">+{hAlerts.length - 3}</Badge>}
                              </div>
                            ) : (
                              <span className="text-xs text-green-500">✓</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDetailHost({ id: host.hostid, name: host.name })}
                            >
                              <Settings2 className="h-3.5 w-3.5 mr-1" />
                              Подробнее
                            </Button>
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

      <HostDetailDialog
        open={!!detailHost}
        onOpenChange={(o) => !o && setDetailHost(null)}
        zabbixHostId={detailHost?.id ?? null}
        hostName={detailHost?.name}
      />
    </div>
  );
}

function HostItemsViewWrapper({ zabbixHostId, items }: { zabbixHostId: string; items: any[] }) {
  const { data: localHost } = useQuery({
    queryKey: ["monitored-host-by-zbx", zabbixHostId],
    queryFn: async () => {
      const { data } = await supabase
        .from("monitored_hosts")
        .select("id")
        .eq("zabbix_host_id", zabbixHostId)
        .maybeSingle();
      return data;
    },
    enabled: !!zabbixHostId,
  });
  return <HostItemsView hostId={localHost?.id || ""} zabbixHostId={zabbixHostId} items={items} />;
}
