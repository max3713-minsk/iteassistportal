import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { CalendarPlus, MapPin, ListChecks } from "lucide-react";
import { format, eachDayOfInterval, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter } from "date-fns";
import {
  isTaskScheduledOnDate,
  buildHolidayMap,
  frequencyLabels,
  type HolidayEntry,
} from "@/lib/schedule-utils";
import { logAudit } from "@/lib/audit";
import type { Database } from "@/integrations/supabase/types";

type Frequency = Database["public"]["Enums"]["maintenance_frequency"];

const SCHEDULED_FREQUENCIES: Frequency[] = ["daily", "weekly", "monthly", "quarterly", "semi_annual"];

function getPeriod(frequency: Frequency, d: Date): { start: string; end: string } {
  const s = format(d, "yyyy-MM-dd");
  switch (frequency) {
    case "daily": return { start: s, end: s };
    case "weekly": return { start: format(startOfWeek(d, { weekStartsOn: 1 }), "yyyy-MM-dd"), end: format(endOfWeek(d, { weekStartsOn: 1 }), "yyyy-MM-dd") };
    case "monthly": return { start: format(startOfMonth(d), "yyyy-MM-dd"), end: format(endOfMonth(d), "yyyy-MM-dd") };
    case "quarterly": return { start: format(startOfQuarter(d), "yyyy-MM-dd"), end: format(endOfQuarter(d), "yyyy-MM-dd") };
    case "semi_annual": {
      const m = d.getMonth(), y = d.getFullYear();
      return m < 6 ? { start: `${y}-01-01`, end: `${y}-06-30` } : { start: `${y}-07-01`, end: `${y}-12-31` };
    }
    default: return { start: s, end: s };
  }
}

interface PlannedProtocol {
  siteId: string;
  siteName: string;
  frequency: Frequency;
  date: string;        // origin date that produced it
  start: string;
  end: string;
  key: string;         // dedup key
  exists?: boolean;
}

interface BatchCreateProtocolDialogProps {
  /** Если передан — диалог управляется снаружи и кнопка-триггер не рендерится. */
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
  /** Дата по умолчанию (yyyy-MM-dd) для предзаполнения. */
  initialDate?: string;
  /** Включать ли по умолчанию режим «Период» вместо «Дата». */
  initialMode?: "date" | "period";
  /** Не рендерить кнопку-триггер (если внешний контролируемый режим). */
  hideTrigger?: boolean;
}

export default function BatchCreateProtocolDialog(props: BatchCreateProtocolDialogProps = {}) {
  const { session } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = props.open ?? internalOpen;
  const setOpen = (v: boolean) => {
    if (props.onOpenChange) props.onOpenChange(v);
    else setInternalOpen(v);
  };

  const [mode, setMode] = useState<"date" | "period">(props.initialMode ?? "date");
  const [dateFrom, setDateFrom] = useState(props.initialDate ?? format(new Date(), "yyyy-MM-dd"));
  const [dateTo, setDateTo] = useState(props.initialDate ?? format(new Date(), "yyyy-MM-dd"));

  // При открытии диалога с initialDate — подставить дату.
  useEffect(() => {
    if (open && props.initialDate) {
      setDateFrom(props.initialDate);
      setDateTo(props.initialDate);
    }
  }, [open, props.initialDate]);
  const [selectedSites, setSelectedSites] = useState<Set<string>>(new Set());
  const [enabledFreqs, setEnabledFreqs] = useState<Set<Frequency>>(new Set(SCHEDULED_FREQUENCIES));
  const [matchRegulation, setMatchRegulation] = useState(true);
  const [markAllDone, setMarkAllDone] = useState(false);

  const { data: sites = [] } = useQuery({
    queryKey: ["sites-for-batch"],
    queryFn: async () => (await supabase.from("sites").select("id, name, organization_id").order("name")).data ?? [],
  });

  const { data: holidays = [] } = useQuery({
    queryKey: ["holidays-BY"],
    queryFn: async () => (await supabase.from("holidays").select("date, name, day_type").eq("country_code", "BY")).data ?? [],
  });
  const holidayMap = useMemo(() => buildHolidayMap(holidays as HolidayEntry[]), [holidays]);

  const { data: existing = [] } = useQuery({
    queryKey: ["existing-protocols-window", dateFrom, dateTo],
    queryFn: async () => {
      // Get all protocols whose periods overlap [dateFrom..dateTo]
      const lo = mode === "date" ? dateFrom : dateFrom;
      const hi = mode === "date" ? dateFrom : dateTo;
      const { data } = await supabase
        .from("maintenance_protocols")
        .select("site_id, frequency, period_start, period_end")
        .lte("period_start", hi)
        .gte("period_end", lo);
      return data ?? [];
    },
  });

  // Plan
  const plan: PlannedProtocol[] = useMemo(() => {
    if (selectedSites.size === 0) return [];
    const from = parseISO(dateFrom);
    const to = parseISO(mode === "date" ? dateFrom : dateTo);
    if (to < from) return [];
    const days = eachDayOfInterval({ start: from, end: to });
    const list: PlannedProtocol[] = [];
    const seen = new Set<string>();
    for (const siteId of selectedSites) {
      const siteName = sites.find((s: any) => s.id === siteId)?.name ?? "";
      for (const d of days) {
        for (const f of SCHEDULED_FREQUENCIES) {
          if (!enabledFreqs.has(f)) continue;
          if (matchRegulation && !isTaskScheduledOnDate(f, d, undefined, holidayMap)) continue;
          const p = getPeriod(f, d);
          const key = `${siteId}__${f}__${p.start}__${p.end}`;
          if (seen.has(key)) continue;
          seen.add(key);
          const exists = (existing as any[]).some(
            (e) => e.site_id === siteId && e.frequency === f && e.period_start === p.start && e.period_end === p.end,
          );
          list.push({ siteId, siteName, frequency: f, date: format(d, "yyyy-MM-dd"), start: p.start, end: p.end, key, exists });
        }
      }
    }
    return list;
  }, [selectedSites, dateFrom, dateTo, mode, enabledFreqs, matchRegulation, sites, holidayMap, existing]);

  const toCreate = plan.filter((p) => !p.exists);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (toCreate.length === 0) throw new Error("Нет протоколов к созданию");
      let createdCount = 0;
      let itemsCount = 0;
      const nowIso = new Date().toISOString();
      const uid = session?.user.id;

      // Cache equipment / tasks per site/frequency
      const eqCache = new Map<string, any[]>();
      const taskCache = new Map<Frequency, any[]>();

      for (const p of toCreate) {
        if (!eqCache.has(p.siteId)) {
          const { data } = await supabase
            .from("equipment")
            .select("id, name, model, serial_number, category_id, equipment_categories(name)")
            .eq("site_id", p.siteId);
          eqCache.set(p.siteId, data ?? []);
        }
        if (!taskCache.has(p.frequency)) {
          const { data } = await supabase
            .from("maintenance_tasks")
            .select("id, title, category_id, equipment_id, equipment_ids")
            .eq("frequency", p.frequency)
            .eq("is_active", true);
          taskCache.set(p.frequency, data ?? []);
        }

        const equipment = eqCache.get(p.siteId)!;
        const tasks = taskCache.get(p.frequency)!;

        const site = sites.find((s: any) => s.id === p.siteId);
        const { data: protocol, error: pErr } = await supabase
          .from("maintenance_protocols")
          .insert({
            site_id: p.siteId,
            customer_org_id: site?.organization_id ?? null,
            frequency: p.frequency,
            period_start: p.start,
            period_end: p.end,
            report_date: p.date,
            status: markAllDone ? "completed" : "in_progress",
            created_by: uid,
            completed_at: markAllDone ? nowIso : null,
            completed_by: markAllDone ? uid : null,
          })
          .select("id")
          .single();
        if (pErr || !protocol) continue;
        createdCount++;

        const items: any[] = [];
        for (const eq of equipment) {
          for (const t of tasks) {
            const ids = (t as any).equipment_ids as string[] | null;
            let match = true;
            if (ids && ids.length > 0) match = ids.includes(eq.id);
            else if ((t as any).equipment_id) match = (t as any).equipment_id === eq.id;
            else if (t.category_id) match = t.category_id === eq.category_id;
            if (match) {
              items.push({
                protocol_id: protocol.id,
                equipment_id: eq.id,
                task_id: t.id,
                status: markAllDone ? "done" : "pending",
                completed_by: markAllDone ? uid : null,
                completed_at: markAllDone ? nowIso : null,
                equipment_snapshot: {
                  name: eq.name,
                  model: eq.model,
                  serial_number: eq.serial_number,
                  category: eq.equipment_categories?.name ?? null,
                },
              });
            }
          }
        }
        if (items.length) {
          await supabase.from("protocol_items").insert(items);
          itemsCount += items.length;
        }
      }

      await logAudit({
        action: "Массовое создание протоколов",
        module: "protocols",
        details: `Создано: ${createdCount}, пунктов: ${itemsCount}`,
      });
      return { createdCount, itemsCount };
    },
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["protocols"] });
      qc.invalidateQueries({ queryKey: ["existing-protocols-window"] });
      toast({ title: "Протоколы созданы", description: `Создано: ${r.createdCount}, пунктов всего: ${r.itemsCount}` });
      setOpen(false);
    },
    onError: (e: any) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  });

  const toggleAllSites = (on: boolean) =>
    setSelectedSites(on ? new Set(sites.map((s: any) => s.id)) : new Set());

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!props.hideTrigger && (
        <DialogTrigger asChild>
          <Button variant="outline"><CalendarPlus className="h-4 w-4 mr-2" />Массовое создание</Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Массовое создание протоколов</DialogTitle>
          <DialogDescription>
            Выберите ЦОД и дату/период. По умолчанию создаются только те типы протоколов, которые попадают
            на выбранные даты по календарю регламентных работ (с учётом выходных и переносов РБ).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto pr-1">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Режим</Label>
              <div className="flex gap-2">
                <Button size="sm" variant={mode === "date" ? "default" : "outline"} onClick={() => setMode("date")}>Дата</Button>
                <Button size="sm" variant={mode === "period" ? "default" : "outline"} onClick={() => setMode("period")}>Период</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{mode === "date" ? "Дата" : "С"}</Label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            {mode === "period" && (
              <div className="space-y-2">
                <Label>По</Label>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            {/* Sites */}
            <Card>
              <CardContent className="pt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> ЦОД ({selectedSites.size}/{sites.length})
                  </h4>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => toggleAllSites(true)}>Все</Button>
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => toggleAllSites(false)}>Нет</Button>
                  </div>
                </div>
                <ScrollArea className="h-44">
                  <div className="space-y-1">
                    {sites.map((s: any) => (
                      <label key={s.id} className="flex items-center gap-2 text-sm p-1 rounded hover:bg-muted/50 cursor-pointer">
                        <Checkbox
                          checked={selectedSites.has(s.id)}
                          onCheckedChange={(v) => setSelectedSites((prev) => {
                            const n = new Set(prev);
                            if (v) n.add(s.id); else n.delete(s.id);
                            return n;
                          })}
                        />
                        <span>{s.name}</span>
                      </label>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Frequencies */}
            <Card>
              <CardContent className="pt-4 space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-1">
                  <ListChecks className="h-3.5 w-3.5" /> Типы протоколов
                </h4>
                <div className="space-y-1">
                  {SCHEDULED_FREQUENCIES.map((f) => (
                    <label key={f} className="flex items-center gap-2 text-sm p-1 rounded hover:bg-muted/50 cursor-pointer">
                      <Checkbox
                        checked={enabledFreqs.has(f)}
                        onCheckedChange={(v) => setEnabledFreqs((prev) => {
                          const n = new Set(prev);
                          if (v) n.add(f); else n.delete(f);
                          return n;
                        })}
                      />
                      <span>{frequencyLabels[f]}</span>
                    </label>
                  ))}
                </div>
                <div className="border-t pt-2 space-y-1">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={matchRegulation} onCheckedChange={(v) => setMatchRegulation(!!v)} />
                    <span>Соответствие регламенту (только запланированные на дату)</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={markAllDone} onCheckedChange={(v) => setMarkAllDone(!!v)} />
                    <span>Сразу отметить выполненными</span>
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview */}
          <Card className="bg-muted/30">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold">Предпросмотр</h4>
                <div className="flex gap-2">
                  <Badge variant="secondary">К созданию: {toCreate.length}</Badge>
                  <Badge variant="outline">Уже есть: {plan.length - toCreate.length}</Badge>
                </div>
              </div>
              <ScrollArea className="h-48">
                <div className="space-y-1 text-sm">
                  {plan.length === 0 && (
                    <p className="text-muted-foreground text-xs">Выберите ЦОД и параметры — здесь появится план создания.</p>
                  )}
                  {plan.map((p) => (
                    <div key={p.key} className={`flex items-center justify-between p-1.5 rounded ${p.exists ? "opacity-50" : "bg-background"}`}>
                      <div className="flex items-center gap-2">
                        <Badge variant={p.exists ? "outline" : "default"} className="text-[10px]">
                          {frequencyLabels[p.frequency]}
                        </Badge>
                        <span className="font-medium">{p.siteName}</span>
                        <span className="text-muted-foreground text-xs">
                          {p.start === p.end ? p.start : `${p.start} … ${p.end}`}
                        </span>
                      </div>
                      {p.exists && <span className="text-xs text-muted-foreground">пропустим</span>}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || toCreate.length === 0}>
            {createMutation.isPending ? "Создание..." : `Создать ${toCreate.length} протокол(ов)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}