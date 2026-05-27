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
import { Search, CheckCircle2, MessageSquarePlus, Check, X, Loader2, Trash2, Eye } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { logAudit } from "@/lib/audit";
import { priorityColor, priorityLabel, priorityToIncident, duration } from "./monitoringUtils";

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
  const [viewMode, setViewMode] = useState<"active" | "history">("active");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showDismissed, setShowDismissed] = useState(false);

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

      {viewMode === "active" ? (
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
      ) : (
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
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(parseInt(a.lastchange) * 1000).toLocaleString("ru-RU")}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{duration(a.lastchange)}</TableCell>
                      {isStaff && (
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" title="Создать заявку" onClick={() => onCreateTicket(a)}>
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
      )}
    </div>
  );
}
