import { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import { format, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type Frequency = Database["public"]["Enums"]["maintenance_frequency"];

const frequencyOptions: { value: Frequency; label: string }[] = [
  { value: "daily", label: "Ежедневные" },
  { value: "weekly", label: "Еженедельные" },
  { value: "monthly", label: "Ежемесячные" },
  { value: "quarterly", label: "Ежеквартальные" },
  { value: "semi_annual", label: "Полугодовые" },
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
      if (month < 6) {
        return { start: `${year}-01-01`, end: `${year}-06-30` };
      }
      return { start: `${year}-07-01`, end: `${year}-12-31` };
    }
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
  const [frequency, setFrequency] = useState<Frequency>("daily");
  const [date, setDate] = useState(defaultDate || format(new Date(), "yyyy-MM-dd"));
  const [notes, setNotes] = useState("");

  const { data: sites = [] } = useQuery({
    queryKey: ["sites"],
    queryFn: async () => {
      const { data } = await supabase.from("sites").select("id, name").order("name");
      return data ?? [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!siteId) throw new Error("Выберите площадку");

      const period = getPeriod(frequency, date);

      // 1. Create protocol
      const { data: protocol, error: pErr } = await supabase
        .from("maintenance_protocols")
        .insert({
          site_id: siteId,
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

      // 2. Get equipment for this site
      const { data: equipment } = await supabase
        .from("equipment")
        .select("id, category_id")
        .eq("site_id", siteId);

      // 3. Get tasks matching frequency
      const { data: tasks } = await supabase
        .from("maintenance_tasks")
        .select("id, category_id")
        .eq("frequency", frequency);

      if (!equipment?.length || !tasks?.length) return protocol.id;

      // 4. Generate protocol items: match tasks to equipment by category
      const items: { protocol_id: string; equipment_id: string; task_id: string }[] = [];
      for (const eq of equipment) {
        for (const task of tasks) {
          // Match by category or if task has no category (applies to all)
          if (!task.category_id || task.category_id === eq.category_id) {
            items.push({
              protocol_id: protocol.id,
              equipment_id: eq.id,
              task_id: task.id,
            });
          }
        }
      }

      if (items.length > 0) {
        const { error: iErr } = await supabase.from("protocol_items").insert(items);
        if (iErr) throw iErr;
      }

      return protocol.id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["protocols"] });
      setOpen(false);
      setSiteId("");
      setFrequency("daily");
      setNotes("");
      toast({ title: "Протокол создан", description: "Чеклист сформирован автоматически" });
    },
    onError: (e: any) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4 mr-2" />Создать протокол</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Новый протокол обслуживания</DialogTitle>
          <DialogDescription>Чеклист будет сформирован автоматически на основе оборудования и задач площадки</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>ЦОД *</Label>
            <Select value={siteId} onValueChange={setSiteId}>
              <SelectTrigger><SelectValue placeholder="Выберите площадку" /></SelectTrigger>
              <SelectContent>
                {sites.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Тип работ *</Label>
            <Select value={frequency} onValueChange={(v) => setFrequency(v as Frequency)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {frequencyOptions.map((f) => (
                  <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Дата *</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Примечания</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => createMutation.mutate()} disabled={!siteId || createMutation.isPending}>
            {createMutation.isPending ? "Создание..." : "Создать"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
