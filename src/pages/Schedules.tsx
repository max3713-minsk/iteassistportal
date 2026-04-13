import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, CalendarCheck, CheckCircle2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, isPast, isToday, addDays } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";

interface ScheduleForm {
  equipment_id: string;
  task_id: string;
  next_due_date: Date | undefined;
  assigned_to: string;
}

const emptyForm: ScheduleForm = { equipment_id: "", task_id: "", next_due_date: undefined, assigned_to: "" };

export default function Schedules() {
  const { isStaff } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ScheduleForm>(emptyForm);

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ["schedules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_schedules")
        .select("*, equipment(name, sites(name)), maintenance_tasks(title, frequency)")
        .order("next_due_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: equipment = [] } = useQuery({
    queryKey: ["equipment-list"],
    queryFn: async () => {
      const { data } = await supabase.from("equipment").select("id, name").order("name");
      return data ?? [];
    },
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["maintenance-tasks"],
    queryFn: async () => {
      const { data } = await supabase.from("maintenance_tasks").select("id, title, frequency").order("title");
      return data ?? [];
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["engineer-profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("user_id, full_name");
      return data ?? [];
    },
    enabled: isStaff,
  });

  const createMutation = useMutation({
    mutationFn: async (f: ScheduleForm) => {
      const { error } = await supabase.from("maintenance_schedules").insert({
        equipment_id: f.equipment_id,
        task_id: f.task_id,
        next_due_date: f.next_due_date ? format(f.next_due_date, "yyyy-MM-dd") : "",
        assigned_to: f.assigned_to || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["schedules"] });
      setOpen(false);
      setForm(emptyForm);
      toast({ title: "Расписание создано" });
    },
    onError: (e: any) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  });

  const completeMutation = useMutation({
    mutationFn: async (id: string) => {
      const today = format(new Date(), "yyyy-MM-dd");
      const { error } = await supabase
        .from("maintenance_schedules")
        .update({ last_completed_date: today, next_due_date: format(addDays(new Date(), 30), "yyyy-MM-dd") })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["schedules"] });
      toast({ title: "Задача отмечена выполненной" });
    },
  });

  const frequencyLabels: Record<string, string> = {
    daily: "Ежедневно",
    weekly: "Еженедельно",
    monthly: "Ежемесячно",
    quarterly: "Ежеквартально",
    semi_annual: "Раз в полгода",
    on_request: "По запросу",
  };

  const getDueStatus = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isPast(date) && !isToday(date)) return { label: "Просрочено", className: "bg-destructive text-destructive-foreground" };
    if (isToday(date)) return { label: "Сегодня", className: "bg-orange-500 text-white" };
    const daysLeft = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 7) return { label: `${daysLeft} дн.`, className: "bg-yellow-500 text-white" };
    return { label: `${daysLeft} дн.`, className: "bg-muted text-muted-foreground" };
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-bold">Календарь ТО</h1>
        {isStaff && (
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setForm(emptyForm); }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Добавить расписание</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Новое расписание ТО</DialogTitle>
                <DialogDescription>Привяжите задачу обслуживания к оборудованию</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Оборудование</Label>
                  <Select value={form.equipment_id} onValueChange={(v) => setForm({ ...form, equipment_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Выберите оборудование" /></SelectTrigger>
                    <SelectContent>
                      {equipment.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Задача ТО</Label>
                  <Select value={form.task_id} onValueChange={(v) => setForm({ ...form, task_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Выберите задачу" /></SelectTrigger>
                    <SelectContent>
                      {tasks.map((t: any) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.title} ({frequencyLabels[t.frequency] ?? t.frequency})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Следующая дата</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !form.next_due_date && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.next_due_date ? format(form.next_due_date, "PPP", { locale: ru }) : "Выберите дату"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={form.next_due_date}
                        onSelect={(d) => setForm({ ...form, next_due_date: d })}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Ответственный</Label>
                  <Select value={form.assigned_to} onValueChange={(v) => setForm({ ...form, assigned_to: v })}>
                    <SelectTrigger><SelectValue placeholder="Не назначен" /></SelectTrigger>
                    <SelectContent>
                      {profiles.map((p: any) => (
                        <SelectItem key={p.user_id} value={p.user_id}>{p.full_name ?? p.user_id.slice(0, 8)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => createMutation.mutate(form)}
                  disabled={!form.equipment_id || !form.task_id || !form.next_due_date || createMutation.isPending}
                >
                  {createMutation.isPending ? "Создание..." : "Создать"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Загрузка...</p>
      ) : schedules.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CalendarCheck className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">Расписания ещё не созданы</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Оборудование</TableHead>
                <TableHead>Задача</TableHead>
                <TableHead>Частота</TableHead>
                <TableHead>Площадка</TableHead>
                <TableHead>Срок</TableHead>
                <TableHead className="hidden md:table-cell">Посл. выполнение</TableHead>
                {isStaff && <TableHead className="w-24">Действия</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules.map((s: any) => {
                const dueStatus = getDueStatus(s.next_due_date);
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.equipment?.name ?? "—"}</TableCell>
                    <TableCell>{s.maintenance_tasks?.title ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{frequencyLabels[s.maintenance_tasks?.frequency] ?? "—"}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{(s.equipment as any)?.sites?.name ?? "—"}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={dueStatus.className}>
                        {format(new Date(s.next_due_date), "dd.MM.yy")} • {dueStatus.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {s.last_completed_date ? format(new Date(s.last_completed_date), "dd.MM.yy") : "—"}
                    </TableCell>
                    {isStaff && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => completeMutation.mutate(s.id)}
                          title="Отметить выполненным"
                        >
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
