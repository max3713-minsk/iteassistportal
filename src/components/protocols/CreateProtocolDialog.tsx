import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, ListChecks, Server } from "lucide-react";
import { format, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type Frequency = Database["public"]["Enums"]["maintenance_frequency"];

const frequencyOptions: { value: Frequency; label: string }[] = [
  { value: "daily", label: "Ежедневные" },
  { value: "weekly", label: "Еженедельные" },
  { value: "monthly", label: "Ежемесячные" },
  { value: "quarterly", label: "Ежеквартальные" },
  { value: "semi_annual", label: "Полугодовые" },
  { value: "on_request", label: "По запросу" },
];

function getPeriod(frequency: Frequency, dateStr: string): { start: string; end: string } {
  const d = new Date(dateStr);
  switch (frequency) {
    case "daily":
      return { start: dateStr, end: dateStr };
    case "weekly":
      return { start: format(startOfWeek(d, { weekStartsOn: 1 }), "yyyy-MM-dd"), end: format(endOfWeek(d, { weekStartsOn: 1 }), "yyyy-MM-dd") };
    case "monthly":
      return { start: format(startOfMonth(d), "yyyy-MM-dd"), end: format(endOfMonth(d), "yyyy-MM-dd") };
    case "quarterly":
      return { start: format(startOfQuarter(d), "yyyy-MM-dd"), end: format(endOfQuarter(d), "yyyy-MM-dd") };
    case "semi_annual": {
      const month = d.getMonth();
      const year = d.getFullYear();
      if (month < 6) return { start: `${year}-01-01`, end: `${year}-06-30` };
      return { start: `${year}-07-01`, end: `${year}-12-31` };
    }
    case "on_request":
    default:
      return { start: dateStr, end: dateStr };
  }
}

interface Props {
  defaultDate?: string;
}

export default function CreateProtocolDialog({ defaultDate }: Props) {
  const { session } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [siteId, setSiteId] = useState("");
  const [contractId, setContractId] = useState<string>("");
  const [frequency, setFrequency] = useState<Frequency>("daily");
  const [date, setDate] = useState(defaultDate || format(new Date(), "yyyy-MM-dd"));
  const [notes, setNotes] = useState("");
  const [customMode, setCustomMode] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<Set<string>>(new Set());

  const { data: sites = [] } = useQuery({
    queryKey: ["sites"],
    queryFn: async () => {
      const { data } = await supabase.from("sites").select("id, name, organization_id").order("name");
      return data ?? [];
    },
  });

  const selectedSite = sites.find((s) => s.id === siteId);

  const { data: contracts = [] } = useQuery({
    queryKey: ["contracts-for-site", selectedSite?.organization_id],
    queryFn: async () => {
      if (!selectedSite?.organization_id) return [];
      const { data } = await supabase
        .from("contracts")
        .select("id, contract_number, title, start_date, end_date, is_active")
        .eq("organization_id", selectedSite.organization_id)
        .eq("is_active", true)
        .order("start_date", { ascending: false });
      return data ?? [];
    },
    enabled: !!selectedSite?.organization_id,
  });

  const { data: equipment = [] } = useQuery({
    queryKey: ["equipment-for-site", siteId],
    queryFn: async () => {
      if (!siteId) return [];
      const { data } = await supabase
        .from("equipment")
        .select("id, name, model, category_id, equipment_categories(name)")
        .eq("site_id", siteId)
        .order("name");
      return data ?? [];
    },
    enabled: !!siteId,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks-by-frequency", frequency],
    queryFn: async () => {
      const { data } = await supabase
        .from("maintenance_tasks")
        .select("id, title, description, category_id, equipment_categories(name)")
        .eq("frequency", frequency)
        .order("title");
      return data ?? [];
    },
  });

  // Default: pre-select all when entering custom mode or data changes
  useEffect(() => {
    if (customMode) {
      setSelectedEquipmentIds(new Set(equipment.map((e: any) => e.id)));
      setSelectedTaskIds(new Set(tasks.map((t: any) => t.id)));
    }
  }, [customMode, equipment, tasks]);

  const toggleAll = (kind: "tasks" | "equipment", on: boolean) => {
    if (kind === "tasks") setSelectedTaskIds(on ? new Set(tasks.map((t: any) => t.id)) : new Set());
    else setSelectedEquipmentIds(on ? new Set(equipment.map((e: any) => e.id)) : new Set());
  };

  const previewItemsCount = useMemo(() => {
    const eqs = customMode ? equipment.filter((e: any) => selectedEquipmentIds.has(e.id)) : equipment;
    const ts = customMode ? tasks.filter((t: any) => selectedTaskIds.has(t.id)) : tasks;
    let n = 0;
    for (const eq of eqs) {
      for (const t of ts as any[]) {
        if (!t.category_id || t.category_id === (eq as any).category_id) n++;
      }
    }
    return n;
  }, [customMode, equipment, tasks, selectedEquipmentIds, selectedTaskIds]);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!siteId) throw new Error("Выберите ЦОД");

      const period = getPeriod(frequency, date);

      const { data: protocol, error: pErr } = await supabase
        .from("maintenance_protocols")
        .insert({
          site_id: siteId,
          contract_id: contractId || null,
          frequency,
          period_start: period.start,
          period_end: period.end,
          status: "in_progress",
          notes: notes || null,
          created_by: session?.user.id,
        })
        .select("id")
        .single();
      if (pErr) throw pErr;

      const eqs = (customMode ? equipment.filter((e: any) => selectedEquipmentIds.has(e.id)) : equipment) as any[];
      const ts = (customMode ? tasks.filter((t: any) => selectedTaskIds.has(t.id)) : tasks) as any[];

      const items: { protocol_id: string; equipment_id: string; task_id: string }[] = [];
      for (const eq of eqs) {
        for (const task of ts) {
          if (!task.category_id || task.category_id === eq.category_id) {
            items.push({ protocol_id: protocol.id, equipment_id: eq.id, task_id: task.id });
          }
        }
      }
      if (items.length > 0) {
        const { error: iErr } = await supabase.from("protocol_items").insert(items);
        if (iErr) throw iErr;
      }
      return { id: protocol.id, count: items.length };
    },
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["protocols"] });
      setOpen(false);
      setSiteId("");
      setContractId("");
      setFrequency("daily");
      setNotes("");
      setCustomMode(false);
      setSelectedTaskIds(new Set());
      setSelectedEquipmentIds(new Set());
      toast({ title: "Протокол создан", description: `Сформировано пунктов: ${r.count}` });
    },
    onError: (e: any) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4 mr-2" />Создать протокол</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Новый протокол обслуживания</DialogTitle>
          <DialogDescription>
            Чеклист формируется автоматически. Включите режим выборочного создания, чтобы выбрать конкретное оборудование и регламенты.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>ЦОД *</Label>
              <Select value={siteId} onValueChange={(v) => { setSiteId(v); setContractId(""); }}>
                <SelectTrigger><SelectValue placeholder="Выберите площадку" /></SelectTrigger>
                <SelectContent>
                  {sites.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Договор</Label>
              <Select value={contractId || "__none__"} onValueChange={(v) => setContractId(v === "__none__" ? "" : v)} disabled={!selectedSite}>
                <SelectTrigger><SelectValue placeholder="Без договора" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Без договора —</SelectItem>
                  {contracts.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.contract_number}{c.title ? ` · ${c.title}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Тип работ *</Label>
              <Select value={frequency} onValueChange={(v) => setFrequency(v as Frequency)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {frequencyOptions.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Дата *</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Примечания</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>

          <Card className="bg-muted/30">
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox id="custom-mode" checked={customMode} onCheckedChange={(v) => setCustomMode(!!v)} />
                  <Label htmlFor="custom-mode" className="font-medium cursor-pointer">
                    Выборочный режим — выбрать конкретное оборудование и регламенты
                  </Label>
                </div>
                <Badge variant="secondary">К созданию: {previewItemsCount} пунктов</Badge>
              </div>

              {customMode && siteId && (
                <div className="grid md:grid-cols-2 gap-3">
                  {/* Equipment */}
                  <div className="space-y-2 border rounded-md p-2 bg-background">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold flex items-center gap-1">
                        <Server className="h-3.5 w-3.5" /> Оборудование ({selectedEquipmentIds.size}/{equipment.length})
                      </h4>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => toggleAll("equipment", true)}>Все</Button>
                        <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => toggleAll("equipment", false)}>Нет</Button>
                      </div>
                    </div>
                    <ScrollArea className="h-48">
                      <div className="space-y-1">
                        {equipment.map((eq: any) => (
                          <label key={eq.id} className="flex items-start gap-2 text-sm p-1 rounded hover:bg-muted/50 cursor-pointer">
                            <Checkbox
                              checked={selectedEquipmentIds.has(eq.id)}
                              onCheckedChange={(v) => {
                                setSelectedEquipmentIds((prev) => {
                                  const next = new Set(prev);
                                  if (v) next.add(eq.id); else next.delete(eq.id);
                                  return next;
                                });
                              }}
                              className="mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="truncate">{eq.name}</div>
                              <div className="text-xs text-muted-foreground truncate">
                                {eq.equipment_categories?.name ?? "—"}{eq.model ? ` · ${eq.model}` : ""}
                              </div>
                            </div>
                          </label>
                        ))}
                        {equipment.length === 0 && <p className="text-xs text-muted-foreground p-2">Нет оборудования</p>}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Tasks */}
                  <div className="space-y-2 border rounded-md p-2 bg-background">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold flex items-center gap-1">
                        <ListChecks className="h-3.5 w-3.5" /> Регламенты ({selectedTaskIds.size}/{tasks.length})
                      </h4>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => toggleAll("tasks", true)}>Все</Button>
                        <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => toggleAll("tasks", false)}>Нет</Button>
                      </div>
                    </div>
                    <ScrollArea className="h-48">
                      <div className="space-y-1">
                        {tasks.map((t: any) => (
                          <label key={t.id} className="flex items-start gap-2 text-sm p-1 rounded hover:bg-muted/50 cursor-pointer">
                            <Checkbox
                              checked={selectedTaskIds.has(t.id)}
                              onCheckedChange={(v) => {
                                setSelectedTaskIds((prev) => {
                                  const next = new Set(prev);
                                  if (v) next.add(t.id); else next.delete(t.id);
                                  return next;
                                });
                              }}
                              className="mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="truncate">{t.title}</div>
                              <div className="text-xs text-muted-foreground truncate">
                                {t.equipment_categories?.name ?? "Все категории"}
                              </div>
                            </div>
                          </label>
                        ))}
                        {tasks.length === 0 && <p className="text-xs text-muted-foreground p-2">Нет регламентов с такой периодичностью</p>}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button onClick={() => createMutation.mutate()} disabled={!siteId || createMutation.isPending || previewItemsCount === 0}>
            {createMutation.isPending ? "Создание..." : `Создать (${previewItemsCount})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}