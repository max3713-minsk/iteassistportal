import { useState, useMemo } from "react";
import { invokeZabbix } from "@/lib/zabbix-invoke";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, AlertCircle, Clock, Check, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { logAudit } from "@/lib/audit";
import { priorityColor, priorityLabel, duration } from "./monitoringUtils";

interface Props {
  isZabbixConfigured: boolean;
  onClickEvent?: (event: unknown) => void;
  compact?: boolean;
}

interface ZbxEvent {
  eventid: string;
  name: string;
  clock: string;
  severity: string;
  value: string;
  acknowledged: string;
  hosts?: { hostid: string; name: string }[];
}

export default function RecentEventsFeed({ isZabbixConfigured, onClickEvent, compact = false }: Props) {
  const { toast } = useToast();
  const { hasRole, isStaff } = useAuth();
  const isAdmin = hasRole("admin");
  const qc = useQueryClient();
  const [actualOnly, setActualOnly] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Use getProblems = current problems (matches Zabbix "Current problems" view)
  const { data: activeEvents = [], isLoading: loadingActive } = useQuery({
    queryKey: ["zabbix", "getProblems"],
    queryFn: async () => {
      const { data, error } = await invokeZabbix( {
        body: { action: "getProblems" },
      });
      if (error) throw error;
      return ((data?.result as any[]) || []).map((p: any) => ({
        eventid: p.eventid,
        name: p.name,
        clock: p.clock,
        severity: p.severity,
        value: "1",
        acknowledged: p.acknowledged,
        hosts: p.hosts,
      })) as ZbxEvent[];
    },
    enabled: isZabbixConfigured,
    refetchInterval: 30000,
    retry: 1,
  });

  const { data: closedEvents = [], isLoading: loadingClosed } = useQuery({
    queryKey: ["zabbix", "getClosedEvents"],
    queryFn: async () => {
      const { data, error } = await invokeZabbix( {
        body: { action: "getClosedEvents" },
      });
      if (error) throw error;
      return (data?.result as ZbxEvent[]) || [];
    },
    enabled: isZabbixConfigured && !actualOnly,
    refetchInterval: 60000,
    retry: 1,
  });

  /**
   * "Actual" alert lifecycle (custom rule):
   * - Active in Zabbix → always shown.
   * - Acknowledged + linked to a still-open ticket → kept in "actual" view.
   *   The link is recorded in audit_logs (action="Привязка алерта к заявке", entity_id=eventid, details="ticket=<uuid>;eventid=<id>").
   * - Acknowledged + ticket closed/resolved/cancelled → drop from "actual".
   */
  const { data: alertTicketLinks = {} } = useQuery({
    queryKey: ["alert-ticket-links"],
    queryFn: async () => {
      const { data: links } = await supabase
        .from("audit_logs")
        .select("entity_id, details")
        .eq("module", "monitoring")
        .eq("action", "Привязка алерта к заявке")
        .order("created_at", { ascending: false })
        .limit(500);

      const map: Record<string, { ticketId: string; status?: string }> = {};
      const ticketIds = new Set<string>();
      (links || []).forEach((l) => {
        const eid = l.entity_id;
        const m = (l.details || "").match(/ticket=([0-9a-f-]+)/i);
        if (eid && m) {
          map[eid] = { ticketId: m[1] };
          ticketIds.add(m[1]);
        }
      });
      if (ticketIds.size > 0) {
        const { data: tickets } = await supabase
          .from("tickets")
          .select("id, status")
          .in("id", [...ticketIds]);
        (tickets || []).forEach((t) => {
          for (const eid of Object.keys(map)) {
            if (map[eid].ticketId === t.id) map[eid].status = t.status;
          }
        });
      }
      return map;
    },
    enabled: isZabbixConfigured,
    refetchInterval: 30000,
  });

  const events = useMemo(() => {
    if (actualOnly) {
      // Keep all active events. If acknowledged AND linked ticket is closed/resolved/cancelled → hide.
      return activeEvents.filter((e) => {
        if (e.acknowledged !== "1") return true;
        const link = alertTicketLinks[e.eventid];
        if (!link) return true; // ack but no ticket → still actual per legacy behavior
        const closedStatuses = new Set(["resolved", "closed", "cancelled"]);
        return !closedStatuses.has(link.status || "");
      });
    }
    const map = new Map<string, ZbxEvent>();
    [...activeEvents, ...closedEvents].forEach((e) => map.set(e.eventid, e));
    return [...map.values()].sort((a, b) => parseInt(b.clock) - parseInt(a.clock));
  }, [activeEvents, closedEvents, actualOnly, alertTicketLinks]);

  const isLoading = loadingActive || (!actualOnly && loadingClosed);
  const limit = compact ? 8 : 30;
  const visibleEvents = events.slice(0, limit);

  const ackMutation = useMutation({
    mutationFn: async (eventids: string[]) => {
      const { data, error } = await invokeZabbix( {
        body: { action: "massAcknowledge", params: { eventids, message: "Подтверждено через портал ITEA", close: false } },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: async (_d, eventids) => {
      await logAudit({ action: "Подтверждение алертов", module: "monitoring", details: `${eventids.length} событий` });
      toast({ title: `Подтверждено: ${eventids.length}` });
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: ["zabbix", "getRecentEvents"] });
      qc.invalidateQueries({ queryKey: ["zabbix", "getProblems"] });
    },
    onError: (e: Error) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  });

  const closeMutation = useMutation({
    mutationFn: async (eventids: string[]) => {
      const { data, error } = await invokeZabbix( {
        body: { action: "massAcknowledge", params: { eventids, message: "Закрыто через портал ITEA", close: true } },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: async (_d, eventids) => {
      await logAudit({ action: "Закрытие алертов", module: "monitoring", details: `${eventids.length} событий` });
      toast({ title: `Закрыто: ${eventids.length}` });
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: ["zabbix", "getRecentEvents"] });
      qc.invalidateQueries({ queryKey: ["zabbix", "getClosedEvents"] });
      qc.invalidateQueries({ queryKey: ["zabbix", "getProblems"] });
    },
    onError: (e: Error) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  });

  const toggleSelect = (eventid: string) => {
    const next = new Set(selected);
    if (next.has(eventid)) next.delete(eventid);
    else next.add(eventid);
    setSelected(next);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 widget-drag-handle cursor-move">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Последние алерты
            <Badge variant="outline" className="text-[10px]">{events.length}</Badge>
          </CardTitle>
          <div className="flex items-center gap-2" onMouseDown={(e) => e.stopPropagation()}>
            <Label htmlFor="actual-only" className="text-xs cursor-pointer select-none">
              Только актуальные
            </Label>
            <Switch
              id="actual-only"
              checked={actualOnly}
              onCheckedChange={setActualOnly}
              className="scale-75"
            />
          </div>
        </div>
        {isStaff && selected.size > 0 && (
          <div className="flex gap-2 pt-2" onMouseDown={(e) => e.stopPropagation()}>
            <Button
              size="sm"
              variant="outline"
              onClick={() => ackMutation.mutate([...selected])}
              disabled={ackMutation.isPending}
              className="h-7 text-xs"
            >
              {ackMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Check className="h-3 w-3 mr-1" />}
              Подтвердить ({selected.size})
            </Button>
            {isAdmin && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => closeMutation.mutate([...selected])}
                disabled={closeMutation.isPending}
                className="h-7 text-xs"
              >
                {closeMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <X className="h-3 w-3 mr-1" />}
                Закрыть ({selected.size})
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())} className="h-7 text-xs">
              Снять
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-1 overflow-auto" onMouseDown={(e) => e.stopPropagation()}>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : visibleEvents.length === 0 ? (
          <div className="text-center py-6">
            <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">
              {actualOnly ? "Свежих алертов нет" : "События не найдены"}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {visibleEvents.map((ev) => {
              const isResolved = ev.value === "0";
              const isAck = ev.acknowledged === "1";
              return (
                <div
                  key={ev.eventid}
                  className={`flex items-start gap-2 p-2 rounded hover:bg-muted/40 transition-colors border-l-2 ${isResolved ? "opacity-60" : ""}`}
                  style={{
                    borderLeftColor: isResolved
                      ? "hsl(var(--success))"
                      : parseInt(ev.severity) >= 4 ? "hsl(var(--destructive))"
                      : parseInt(ev.severity) === 3 ? "hsl(38 92% 50%)"
                      : parseInt(ev.severity) === 2 ? "hsl(48 96% 53%)"
                      : "hsl(var(--muted-foreground))",
                  }}
                >
                  {isStaff && !isResolved && (
                    <Checkbox
                      checked={selected.has(ev.eventid)}
                      onCheckedChange={() => toggleSelect(ev.eventid)}
                      className="mt-0.5"
                    />
                  )}
                  <div
                    className="flex items-start gap-2 flex-1 min-w-0 cursor-pointer"
                    onClick={() => onClickEvent?.(ev)}
                  >
                    {isResolved ? (
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5 text-green-500" />
                    ) : (
                      <AlertCircle className={`h-4 w-4 flex-shrink-0 mt-0.5 ${parseInt(ev.severity) >= 4 ? "text-destructive" : "text-amber-500"}`} />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{ev.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {ev.hosts?.[0]?.name || "—"} • {new Date(parseInt(ev.clock) * 1000).toLocaleTimeString("ru-RU")}
                        {isAck && <span className="ml-1 text-green-600">• подтверждено</span>}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={priorityColor(ev.severity) as "default"} className="text-[10px]">
                        {priorityLabel(ev.severity)}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">{duration(ev.clock)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
