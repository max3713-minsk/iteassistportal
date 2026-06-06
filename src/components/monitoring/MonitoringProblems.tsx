import { useState, useMemo } from "react";
import { invokeZabbix } from "@/lib/zabbix-invoke";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, CheckCircle2, MessageSquarePlus, Check, X, Loader2, Trash2, Eye, BellOff, Bell } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { logAudit } from "@/lib/audit";
import { priorityColor, priorityLabel, priorityToIncident, duration } from "./monitoringUtils";
import { ProblemFlagBadge } from "./ProblemFlagBadge";
import { invokeZabbix as invokeZbx } from "@/lib/zabbix-invoke";

interface Props {
  problems: any[];
  alerts: any[];
  problemsLoading: boolean;
  alertsLoading: boolean;
  isStaff: boolean;
  onCreateTicket: (problem: any) => void;
  onAcknowledge: (eventid: string) => void;
  initialPriorityFilter?: string;
}

export default function MonitoringProblems({
  problems, alerts, problemsLoading, alertsLoading,
  isStaff, onCreateTicket, onAcknowledge, initialPriorityFilter,
}: Props) {
  const { toast } = useToast();
  const { hasRole, user } = useAuth();
  const isAdmin = hasRole("admin");
  const qc = useQueryClient();
  const [priorityFilter, setPriorityFilter] = useState(initialPriorityFilter || "all");
  const [hostFilter, setHostFilter] = useState("");
  const [viewMode, setViewMode] = useState<"active" | "history" | "disabled">("active");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showDismissed, setShowDismissed] = useState(false);

  const { data: disabledTriggers = [], isLoading: disabledLoading, refetch: refetchDisabled } = useQuery({
    queryKey: ["zabbix", "getDisabledTriggers"],
    queryFn: async () => {
      const { data } = await invokeZbx({ body: { action: "getDisabledTriggers" } });
      const list = (data as any)?.result ?? (data as any)?.data ?? [];
      return Array.isArray(list) ? list : [];
    },
    enabled: viewMode === "disabled",
    staleTime: 30000,
  });

  const enableTriggerMutation = useMutation({
    mutationFn: async (triggerid: string) => {
      const { data, error } = await invokeZabbix({
        body: { action: "setTriggerStatus", params: { triggerids: [triggerid], disabled: false } },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: async (_d, triggerid) => {
      await logAudit({ action: "Включение триггера Zabbix", module: "monitoring", details: `triggerid=${triggerid}` });
      toast({ title: "Триггер снова включён" });
      qc.invalidateQueries({ queryKey: ["zabbix", "getDisabledTriggers"] });
      qc.invalidateQueries({ queryKey: ["zabbix", "getProblems"] });
      qc.invalidateQueries({ queryKey: ["zabbix", "getAlerts"] });
      refetchDisabled();
    },
    onError: (e: Error) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  });

  const problemsArr = Array.isArray(problems) ? problems : [];
  const alertsArr = Array.isArray(alerts) ? alerts : [];

  const { data: dismissed = [] } = useQuery({
    queryKey: ["dismissed-alerts", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from("dismissed_alerts").select("eventid").eq("user_id", user.id);
      return (data || []).map((r: any) => r.eventid as string);
    },
    enabled: !!user?.id,
  });
  const dismissedSet = useMemo(() => new Set(dismissed), [dismissed]);

  const filteredProblems = useMemo(() => {
    let list = problemsArr;
    if (!showDismissed) list = list.filter((p: any) => !dismissedSet.has(p.eventid));
    if (priorityFilter !== "all") {
      list = list.filter((p: any) => p.severity === priorityFilter);
    }
    if (hostFilter) {
      const q = hostFilter.toLowerCase();
      list = list.filter((p: any) => (p.name || "").toLowerCase().includes(q));
    }
    return list;
  }, [problemsArr, priorityFilter, hostFilter, dismissedSet, showDismissed]);

  const filteredAlerts = useMemo(() => {
    let list = alertsArr;
    if (priorityFilter !== "all") {
      list = list.filter((a: any) => a.priority === priorityFilter);
    }
    if (hostFilter) {
      const q = hostFilter.toLowerCase();
      list = list.filter((a: any) =>
        (a.description || "").toLowerCase().includes(q) ||
        (a.hosts?.[0]?.name || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [alertsArr, priorityFilter, hostFilter]);

  const closeMutation = useMutation({
    mutationFn: async (eventid: string) => {
      const { data, error } = await invokeZabbix( {
        body: { action: "closeEvent", params: { eventids: [eventid] } },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: async (data: any, eventid) => {
      await logAudit({ action: "Закрытие события Zabbix", module: "monitoring", details: `eventid=${eventid}` });
      if (data?.partial) {
        toast({ title: "Событие подтверждено", description: data.message, duration: 7000 });
      } else {
        toast({ title: "Событие закрыто" });
      }
      qc.invalidateQueries({ queryKey: ["zabbix", "getProblems"] });
    },
    onError: (e: Error) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  });

  const disableTriggerMutation = useMutation({
    mutationFn: async (triggerid: string) => {
      const { data, error } = await invokeZabbix({
        body: { action: "setTriggerStatus", params: { triggerids: [triggerid], disabled: true } },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: async (_data, triggerid) => {
      await logAudit({
        action: "Отключение триггера Zabbix",
        module: "monitoring",
        details: `triggerid=${triggerid}`,
      });
      toast({ title: "Триггер отключён в Zabbix" });
      qc.invalidateQueries({ queryKey: ["zabbix", "getProblems"] });
      qc.invalidateQueries({ queryKey: ["zabbix", "getAlerts"] });
    },
    onError: (e: Error) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  });

  const toggleSel = (id: string) => setSelected((s) => {
    const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n;
  });
  const clearSel = () => setSelected(new Set());

  const massAck = useMutation({
    mutationFn: async (close: boolean) => {
      const eventids = Array.from(selected);
      if (!eventids.length) return;
      const { data, error } = await invokeZabbix({
        body: { action: "massAcknowledge", params: { eventids, close } },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      await logAudit({
        action: close ? "Массовое закрытие алертов Zabbix" : "Массовое подтверждение алертов",
        module: "monitoring",
        details: `count=${eventids.length}`,
      });
    },
    onSuccess: () => {
      toast({ title: "Готово", description: `Обработано: ${selected.size}` });
      clearSel();
      qc.invalidateQueries({ queryKey: ["zabbix", "getProblems"] });
    },
    onError: (e: Error) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  });

  const dismissMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      const rows = Array.from(selected).map((eventid) => ({ user_id: user.id, eventid }));
      const { error } = await supabase.from("dismissed_alerts").upsert(rows, { onConflict: "user_id,eventid" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Скрыто из списка" });
      clearSel();
      qc.invalidateQueries({ queryKey: ["dismissed-alerts", user?.id] });
    },
    onError: (e: Error) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  });

  const undismissAll = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      const { error } = await supabase.from("dismissed_alerts").delete().eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Скрытые возвращены" });
      qc.invalidateQueries({ queryKey: ["dismissed-alerts", user?.id] });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap items-center">
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
          <TabsList>
            <TabsTrigger value="active">Активные проблемы</TabsTrigger>
            <TabsTrigger value="history">Активные триггеры</TabsTrigger>
            {isStaff && (
              <TabsTrigger value="disabled">
                <BellOff className="h-3.5 w-3.5 mr-1" /> Отключённые
              </TabsTrigger>
            )}
          </TabsList>
        </Tabs>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
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
          <Input
            placeholder="Фильтр по хосту / описанию..."
            value={hostFilter}
            onChange={(e) => setHostFilter(e.target.value)}
            className="pl-9"
          />
        </div>
        {dismissed.length > 0 && viewMode === "active" && (
          <Button size="sm" variant="ghost" onClick={() => setShowDismissed((v) => !v)}>
            <Eye className="h-4 w-4 mr-1" />
            {showDismissed ? "Скрыть удалённые" : `Показать скрытые (${dismissed.length})`}
          </Button>
        )}
        {showDismissed && dismissed.length > 0 && (
          <Button size="sm" variant="outline" onClick={() => undismissAll.mutate()}>
            Вернуть все
          </Button>
        )}
      </div>

      {isStaff && selected.size > 0 && viewMode === "active" && (
        <div className="sticky top-2 z-10 flex items-center gap-2 rounded-md border bg-background/95 backdrop-blur p-2 shadow-sm">
          <span className="text-sm font-medium px-2">Выбрано: {selected.size}</span>
          <Button size="sm" variant="outline" onClick={() => massAck.mutate(false)} disabled={massAck.isPending}>
            <Check className="h-4 w-4 mr-1" />Подтвердить
          </Button>
          {isAdmin && (
            <Button size="sm" variant="outline" onClick={() => massAck.mutate(true)} disabled={massAck.isPending}>
              <X className="h-4 w-4 mr-1" />Закрыть в Zabbix
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => dismissMutation.mutate()} disabled={dismissMutation.isPending}>
            <Trash2 className="h-4 w-4 mr-1" />Убрать из списка
          </Button>
          <Button size="sm" variant="ghost" onClick={clearSel}>Снять выделение</Button>
        </div>
      )}

      {viewMode === "active" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Активные проблемы ({filteredProblems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {problemsLoading ? (
              <div className="space-y-3 py-4">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : filteredProblems.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-2" />
                <p className="text-muted-foreground">Активных проблем нет</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    {isStaff && (
                      <TableHead className="w-8">
                        <Checkbox
                          checked={filteredProblems.length > 0 && filteredProblems.every((p: any) => selected.has(p.eventid))}
                          onCheckedChange={(c) => {
                            if (c) setSelected(new Set(filteredProblems.map((p: any) => p.eventid)));
                            else clearSel();
                          }}
                        />
                      </TableHead>
                    )}
                    <TableHead>Категория</TableHead>
                    <TableHead>Описание</TableHead>
                    <TableHead>Серьёзность</TableHead>
                    <TableHead>Метка</TableHead>
                    <TableHead>Время</TableHead>
                    <TableHead>Длительность</TableHead>
                    <TableHead>Подтверждено</TableHead>
                    {isStaff && <TableHead className="text-right">Действия</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProblems.map((p: any) => {
                    const incident = priorityToIncident(p.severity);
                    const isAcknowledged = p.acknowledged === "1" || (p.acknowledges && p.acknowledges.length > 0);
                    const isDismissed = dismissedSet.has(p.eventid);
                    return (
                      <TableRow key={p.eventid} className={isDismissed ? "opacity-50" : undefined}>
                        {isStaff && (
                          <TableCell>
                            <Checkbox
                              checked={selected.has(p.eventid)}
                              onCheckedChange={() => toggleSel(p.eventid)}
                            />
                          </TableCell>
                        )}
                        <TableCell>
                          <span className={`text-xs font-medium ${incident.color}`}>{incident.label}</span>
                        </TableCell>
                        <TableCell className="max-w-[300px]">{p.name}</TableCell>
                        <TableCell>
                          <Badge variant={priorityColor(p.severity) as any}>{priorityLabel(p.severity)}</Badge>
                        </TableCell>
                        <TableCell>
                          <ProblemFlagBadge
                            eventid={p.eventid}
                            triggerid={p.objectid}
                            host={p.hosts?.[0]?.name || null}
                            canEdit={isStaff}
                          />
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(parseInt(p.clock) * 1000).toLocaleString("ru-RU")}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{duration(p.clock)}</TableCell>
                        <TableCell>
                          {isAcknowledged ? (
                            <Badge variant="outline" className="text-green-600">
                              <Check className="h-3 w-3 mr-1" />Да
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">Нет</span>
                          )}
                        </TableCell>
                        {isStaff && (
                          <TableCell className="text-right space-x-1">
                            {!isAcknowledged && (
                              <Button size="sm" variant="ghost" title="Подтвердить" onClick={() => onAcknowledge(p.eventid)}>
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" title="Создать заявку" onClick={() => onCreateTicket(p)}>
                              <MessageSquarePlus className="h-4 w-4" />
                            </Button>
                            {isAdmin && (
                              <Button
                                size="sm"
                                variant="ghost"
                                title="Закрыть событие (admin)"
                                onClick={() => closeMutation.mutate(p.eventid)}
                                disabled={closeMutation.isPending}
                                className="text-destructive hover:text-destructive"
                              >
                                {closeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                              </Button>
                            )}
                            {isAdmin && p.objectid && (
                              <Button
                                size="sm"
                                variant="ghost"
                                title="Отключить триггер в Zabbix (admin)"
                                onClick={() => {
                                  if (window.confirm(`Отключить триггер «${p.name}» в Zabbix? Он перестанет генерировать события до повторного включения.`)) {
                                    disableTriggerMutation.mutate(p.objectid);
                                  }
                                }}
                                disabled={disableTriggerMutation.isPending}
                                className="text-orange-500 hover:text-orange-500"
                              >
                                <BellOff className="h-4 w-4" />
                              </Button>
                            )}
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
      )}
      {viewMode === "history" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Активные триггеры ({filteredAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alertsLoading ? (
              <div className="space-y-3 py-4">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : filteredAlerts.length === 0 ? (
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
                    <TableHead>Метка</TableHead>
                    <TableHead>Время изменения</TableHead>
                    <TableHead>Длительность</TableHead>
                    {isStaff && <TableHead className="text-right">Действия</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAlerts.map((a: any) => (
                    <TableRow key={a.triggerid}>
                      <TableCell className="font-medium">{a.hosts?.[0]?.name || "—"}</TableCell>
                      <TableCell className="max-w-[300px]">{a.description}</TableCell>
                      <TableCell>
                        <Badge variant={priorityColor(a.priority) as any}>{priorityLabel(a.priority)}</Badge>
                      </TableCell>
                      <TableCell>
                        <ProblemFlagBadge
                          triggerid={a.triggerid}
                          host={a.hosts?.[0]?.name || null}
                          canEdit={isStaff}
                        />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(parseInt(a.lastchange) * 1000).toLocaleString("ru-RU")}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{duration(a.lastchange)}</TableCell>
                      {isStaff && (
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" title="Создать заявку" onClick={() => onCreateTicket(a)}>
                            <MessageSquarePlus className="h-4 w-4" />
                          </Button>
                          {isAdmin && (
                            <Button
                              size="sm"
                              variant="ghost"
                              title="Отключить триггер в Zabbix (admin)"
                              onClick={() => {
                                if (window.confirm(`Отключить триггер «${a.description}» в Zabbix?`)) {
                                  disableTriggerMutation.mutate(a.triggerid);
                                }
                              }}
                              disabled={disableTriggerMutation.isPending}
                              className="text-orange-500 hover:text-orange-500"
                            >
                              <BellOff className="h-4 w-4" />
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
      )}
      {viewMode === "disabled" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Отключённые триггеры ({disabledTriggers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {disabledLoading ? (
              <div className="space-y-3 py-4">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : disabledTriggers.length === 0 ? (
              <div className="text-center py-8">
                <BellOff className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Отключённых триггеров нет</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Хост</TableHead>
                    <TableHead>Описание</TableHead>
                    <TableHead>Приоритет</TableHead>
                    <TableHead>Метка</TableHead>
                    {isStaff && <TableHead className="text-right">Действия</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {disabledTriggers.map((t: any) => (
                    <TableRow key={t.triggerid} className="opacity-80">
                      <TableCell className="font-medium">{t.hosts?.[0]?.name || "—"}</TableCell>
                      <TableCell className="max-w-[400px]">{t.description}</TableCell>
                      <TableCell>
                        <Badge variant={priorityColor(t.priority) as any}>{priorityLabel(t.priority)}</Badge>
                      </TableCell>
                      <TableCell>
                        <ProblemFlagBadge
                          triggerid={t.triggerid}
                          host={t.hosts?.[0]?.name || null}
                          canEdit={isStaff}
                        />
                      </TableCell>
                      {isStaff && (
                        <TableCell className="text-right">
                          {isAdmin && (
                            <Button
                              size="sm"
                              variant="ghost"
                              title="Включить триггер в Zabbix"
                              onClick={() => {
                                if (window.confirm(`Включить триггер «${t.description}» обратно?`)) {
                                  enableTriggerMutation.mutate(t.triggerid);
                                }
                              }}
                              disabled={enableTriggerMutation.isPending}
                              className="text-emerald-600 hover:text-emerald-600"
                            >
                              <Bell className="h-4 w-4" />
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
      )}
    </div>
  );
}
