import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, CheckCircle2, MessageSquarePlus, Check, X, Loader2 } from "lucide-react";
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
  const { hasRole } = useAuth();
  const isAdmin = hasRole("admin");
  const qc = useQueryClient();
  const [priorityFilter, setPriorityFilter] = useState(initialPriorityFilter || "all");
  const [hostFilter, setHostFilter] = useState("");
  const [viewMode, setViewMode] = useState<"active" | "history">("active");

  const problemsArr = Array.isArray(problems) ? problems : [];
  const alertsArr = Array.isArray(alerts) ? alerts : [];

  const filteredProblems = useMemo(() => {
    let list = problemsArr;
    if (priorityFilter !== "all") {
      list = list.filter((p: any) => p.severity === priorityFilter);
    }
    if (hostFilter) {
      const q = hostFilter.toLowerCase();
      list = list.filter((p: any) => (p.name || "").toLowerCase().includes(q));
    }
    return list;
  }, [problemsArr, priorityFilter, hostFilter]);

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
      const { data, error } = await supabase.functions.invoke("zabbix-proxy", {
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
      </div>

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
