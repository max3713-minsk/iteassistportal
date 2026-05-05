import { useState, useMemo } from "react";
import { invokeZabbix } from "@/lib/zabbix-invoke";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Link2Off, Plus, Server, Globe, Activity, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { logAudit } from "@/lib/audit";
import HostItemsView from "./HostItemsView";
import { priorityColor, priorityLabel } from "./monitoringUtils";
import DeviceHintsPanel from "./DeviceHintsPanel";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  zabbixHostId: string | null;
  hostName?: string;
}

interface ZabbixTemplate {
  templateid: string;
  host: string;
  name: string;
  description?: string;
}

interface HostDetail {
  hostid: string;
  host: string;
  name: string;
  status: string;
  available: string;
  interfaces?: { ip: string; dns?: string; port: string; type: string }[];
  groups?: { groupid: string; name: string }[];
  parentTemplates?: ZabbixTemplate[];
  triggers?: { triggerid: string; description: string; priority: string; value: string }[];
}

export default function HostDetailDialog({ open, onOpenChange, zabbixHostId, hostName }: Props) {
  const { toast } = useToast();
  const { isStaff } = useAuth();
  const qc = useQueryClient();
  const [tplSearch, setTplSearch] = useState("");

  const { data: detail, isLoading: detailLoading, refetch: refetchDetail } = useQuery({
    queryKey: ["zbx-host-detail", zabbixHostId],
    queryFn: async () => {
      const { data, error } = await invokeZabbix( {
        body: { action: "getHostDetail", params: { hostid: zabbixHostId } },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data?.result as HostDetail | null;
    },
    enabled: open && !!zabbixHostId,
  });

  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ["zbx-host-items", zabbixHostId],
    queryFn: async () => {
      const { data, error } = await invokeZabbix( {
        body: { action: "getItemsByHost", params: { hostid: zabbixHostId } },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data?.result ?? [];
    },
    enabled: open && !!zabbixHostId,
  });

  const { data: allTemplates = [] } = useQuery({
    queryKey: ["zbx-all-templates"],
    queryFn: async () => {
      const { data, error } = await invokeZabbix( {
        body: { action: "getTemplates" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return (data?.result ?? []) as ZabbixTemplate[];
    },
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  // Local host link (for item_aliases)
  const { data: localHost } = useQuery({
    queryKey: ["monitored-host-by-zbx", zabbixHostId],
    queryFn: async () => {
      if (!zabbixHostId) return null;
      const { data } = await supabase
        .from("monitored_hosts")
        .select("id, device_type")
        .eq("zabbix_host_id", zabbixHostId)
        .maybeSingle();
      return data;
    },
    enabled: !!zabbixHostId,
  });

  const linkedTemplateIds = useMemo(
    () => new Set(detail?.parentTemplates?.map((t) => t.templateid) ?? []),
    [detail]
  );

  const availableTemplates = useMemo(() => {
    const filtered = allTemplates.filter((t) => !linkedTemplateIds.has(t.templateid));
    if (!tplSearch.trim()) return filtered;
    const q = tplSearch.toLowerCase();
    return filtered.filter((t) =>
      t.name.toLowerCase().includes(q) || t.host.toLowerCase().includes(q)
    );
  }, [allTemplates, linkedTemplateIds, tplSearch]);

  const linkMutation = useMutation({
    mutationFn: async (templateid: string) => {
      const { data, error } = await invokeZabbix( {
        body: { action: "updateHostTemplates", params: { hostid: zabbixHostId, templateids: [templateid], mode: "link" } },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: async (_d, templateid) => {
      const tpl = allTemplates.find((t) => t.templateid === templateid);
      await logAudit({
        action: "Привязка шаблона Zabbix к хосту",
        module: "monitoring",
        details: `Хост: ${detail?.name} ← Шаблон: ${tpl?.name}`,
      });
      toast({ title: "Шаблон привязан" });
      refetchDetail();
      qc.invalidateQueries({ queryKey: ["zbx-host-items", zabbixHostId] });
    },
    onError: (e: Error) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  });

  const unlinkMutation = useMutation({
    mutationFn: async (templateid: string) => {
      const { data, error } = await invokeZabbix( {
        body: { action: "updateHostTemplates", params: { hostid: zabbixHostId, templateids: [templateid], mode: "unlink" } },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: async (_d, templateid) => {
      const tpl = detail?.parentTemplates?.find((t) => t.templateid === templateid);
      await logAudit({
        action: "Отвязка шаблона Zabbix от хоста",
        module: "monitoring",
        details: `Хост: ${detail?.name} ⊘ Шаблон: ${tpl?.name}`,
      });
      toast({ title: "Шаблон отвязан (с очисткой)" });
      refetchDetail();
      qc.invalidateQueries({ queryKey: ["zbx-host-items", zabbixHostId] });
    },
    onError: (e: Error) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  });

  if (!zabbixHostId) return null;

  const ifaceTypeLabel: Record<string, string> = { "1": "Agent", "2": "SNMP", "3": "IPMI", "4": "JMX" };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            {detail?.name || hostName || "Хост"}
            {detail && <Badge variant="outline">{detail.host}</Badge>}
          </DialogTitle>
          <DialogDescription>
            Управление шаблонами, просмотр метрик и триггеров
          </DialogDescription>
        </DialogHeader>

        {detailLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
            <TabsList>
              <TabsTrigger value="overview">Обзор</TabsTrigger>
              <TabsTrigger value="templates">
                Шаблоны
                <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px]">
                  {detail?.parentTemplates?.length ?? 0}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="items">
                Метрики
                <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px]">{items.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="triggers">
                Триггеры
                <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px]">
                  {detail?.triggers?.length ?? 0}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="hints">Подсказки</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="flex-1 overflow-auto space-y-3">
              <Card>
                <CardContent className="grid grid-cols-2 gap-4 py-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Имя в Zabbix</p>
                    <p className="font-mono">{detail?.host}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Видимое имя</p>
                    <p>{detail?.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Статус</p>
                    <Badge variant={detail?.status === "0" ? "default" : "outline"}>
                      {detail?.status === "0" ? "Включён" : "Отключён"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Группы</p>
                    <div className="flex gap-1 flex-wrap">
                      {detail?.groups?.map((g) => (
                        <Badge key={g.groupid} variant="outline" className="text-xs">{g.name}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="py-4">
                  <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                    <Globe className="h-3 w-3" /> Интерфейсы
                  </p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Тип</TableHead>
                        <TableHead>IP</TableHead>
                        <TableHead>DNS</TableHead>
                        <TableHead>Порт</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(detail?.interfaces ?? []).map((iface, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <Badge variant="secondary">{ifaceTypeLabel[iface.type] ?? iface.type}</Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{iface.ip || "—"}</TableCell>
                          <TableCell className="font-mono text-xs">{iface.dns || "—"}</TableCell>
                          <TableCell className="font-mono text-xs">{iface.port}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="templates" className="flex-1 overflow-hidden flex flex-col gap-3">
              <Card>
                <CardContent className="py-3">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Привязанные шаблоны</p>
                  {detail?.parentTemplates?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {detail.parentTemplates.map((tpl) => (
                        <Badge key={tpl.templateid} variant="default" className="gap-1.5 py-1 pr-1">
                          {tpl.name}
                          {isStaff && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-4 w-4 hover:bg-destructive/20"
                              onClick={() => unlinkMutation.mutate(tpl.templateid)}
                              disabled={unlinkMutation.isPending}
                            >
                              <Link2Off className="h-3 w-3" />
                            </Button>
                          )}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Нет привязанных шаблонов</p>
                  )}
                </CardContent>
              </Card>

              {isStaff && (
                <Card className="flex-1 overflow-hidden flex flex-col">
                  <CardContent className="py-3 flex-1 flex flex-col gap-2 min-h-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-muted-foreground">
                        Доступные шаблоны ({availableTemplates.length})
                      </p>
                      <div className="relative w-64">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                        <Input
                          placeholder="Поиск шаблона..."
                          value={tplSearch}
                          onChange={(e) => setTplSearch(e.target.value)}
                          className="h-8 pl-7 text-xs"
                        />
                      </div>
                    </div>
                    <ScrollArea className="flex-1 border rounded">
                      <Table>
                        <TableBody>
                          {availableTemplates.slice(0, 200).map((tpl) => (
                            <TableRow key={tpl.templateid}>
                              <TableCell className="py-2">
                                <div className="text-sm">{tpl.name}</div>
                                <div className="text-[10px] text-muted-foreground font-mono">{tpl.host}</div>
                              </TableCell>
                              <TableCell className="text-right py-2 w-24">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => linkMutation.mutate(tpl.templateid)}
                                  disabled={linkMutation.isPending}
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Привязать
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                          {availableTemplates.length > 200 && (
                            <TableRow>
                              <TableCell colSpan={2} className="text-center text-xs text-muted-foreground">
                                Показано первые 200 из {availableTemplates.length}. Уточните поиск.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="items" className="flex-1 overflow-auto">
              {itemsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <HostItemsView
                  hostId={localHost?.id || ""}
                  zabbixHostId={zabbixHostId}
                  items={items}
                />
              )}
            </TabsContent>

            <TabsContent value="triggers" className="flex-1 overflow-auto">
              {detail?.triggers?.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Описание</TableHead>
                      <TableHead className="w-32">Приоритет</TableHead>
                      <TableHead className="w-24">Состояние</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detail.triggers.map((tr) => (
                      <TableRow key={tr.triggerid}>
                        <TableCell className="text-sm">{tr.description}</TableCell>
                        <TableCell>
                          <Badge variant={priorityColor(tr.priority) as any}>
                            {priorityLabel(tr.priority)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {tr.value === "1" ? (
                            <Badge variant="destructive" className="gap-1">
                              <Activity className="h-3 w-3" />
                              Сработал
                            </Badge>
                          ) : (
                            <Badge variant="outline">OK</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center py-8 text-sm text-muted-foreground">Триггеры не найдены</p>
              )}
            </TabsContent>

            <TabsContent value="hints" className="flex-1 overflow-auto">
              <DeviceHintsPanel deviceType={(localHost as any)?.device_type} />
              {!localHost && (
                <p className="text-xs text-muted-foreground mt-3">
                  Хост не привязан к локальной записи — показаны общие подсказки.
                  Привяжите хост к оборудованию, чтобы получить подсказки по типу устройства.
                </p>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
