import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, RefreshCw, Trash2, Pencil, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

type Holiday = {
  id: string;
  date: string;
  name: string;
  day_type: "holiday" | "workday" | "short_day";
  source: string;
  country_code: string;
  notes: string | null;
};

const DAY_TYPE_LABEL: Record<string, string> = {
  holiday: "Праздник (нерабочий)",
  workday: "Рабочая суббота (перенос)",
  short_day: "Сокращённый день",
};
const DAY_TYPE_COLOR: Record<string, string> = {
  holiday: "bg-red-500/15 text-red-600 dark:text-red-300",
  workday: "bg-blue-500/15 text-blue-600 dark:text-blue-300",
  short_day: "bg-amber-500/15 text-amber-600 dark:text-amber-300",
};

export default function Holidays({ embedded = false }: { embedded?: boolean } = {}) {
  const { hasRole } = useAuth();
  const isAdmin = hasRole("admin") || hasRole("engineer");
  const qc = useQueryClient();
  const [year, setYear] = useState(new Date().getFullYear());
  const [syncing, setSyncing] = useState(false);
  const [editing, setEditing] = useState<Holiday | null>(null);
  const [open, setOpen] = useState(false);

  const { data: holidays = [], isLoading } = useQuery({
    queryKey: ["holidays-admin", year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("holidays")
        .select("*")
        .gte("date", `${year}-01-01`)
        .lte("date", `${year}-12-31`)
        .order("date");
      if (error) throw error;
      return data as Holiday[];
    },
  });

  async function syncFromNager() {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("holidays-sync", {
        body: { country: "BY", years: [year, year + 1] },
      });
      if (error) throw error;
      toast.success(`Синхронизировано: добавлено ${data.inserted}, обновлено ${data.updated}`);
      qc.invalidateQueries({ queryKey: ["holidays"] });
      qc.invalidateQueries({ queryKey: ["holidays-admin"] });
    } catch (e: any) {
      toast.error("Ошибка синхронизации: " + (e?.message ?? e));
    } finally {
      setSyncing(false);
    }
  }

  async function handleSave(payload: Partial<Holiday>) {
    try {
      if (editing?.id) {
        const { error } = await supabase.from("holidays").update({
          date: payload.date, name: payload.name, day_type: payload.day_type, notes: payload.notes,
        }).eq("id", editing.id);
        if (error) throw error;
        toast.success("Обновлено");
      } else {
        const { error } = await supabase.from("holidays").insert({
          date: payload.date!, name: payload.name!, day_type: payload.day_type!,
          notes: payload.notes, source: "manual", country_code: "BY",
        });
        if (error) throw error;
        toast.success("Добавлено");
      }
      setOpen(false);
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["holidays"] });
      qc.invalidateQueries({ queryKey: ["holidays-admin"] });
    } catch (e: any) {
      toast.error("Ошибка: " + (e?.message ?? e));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Удалить запись?")) return;
    const { error } = await supabase.from("holidays").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Удалено");
    qc.invalidateQueries({ queryKey: ["holidays"] });
    qc.invalidateQueries({ queryKey: ["holidays-admin"] });
  }

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 1 + i);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          {embedded ? (
            <h2 className="font-heading text-lg font-semibold flex items-center gap-2">
              <CalendarDays className="h-5 w-5" /> Праздники и переносы (РБ)
            </h2>
          ) : (
            <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
              <CalendarDays className="h-6 w-6" /> Праздники и переносы (РБ)
            </h1>
          )}
          <p className="text-sm text-muted-foreground mt-1">
            Календарь ТО автоматически переносит регламентные работы со праздничных и выходных дней на ближайший рабочий день.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
          {isAdmin && (
            <>
              <Button variant="outline" onClick={syncFromNager} disabled={syncing} className="gap-2">
                <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
                Синхронизировать (Nager.Date)
              </Button>
              <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
                <DialogTrigger asChild>
                  <Button className="gap-2"><Plus className="h-4 w-4" /> Добавить</Button>
                </DialogTrigger>
                <HolidayDialog editing={editing} onSave={handleSave} />
              </Dialog>
            </>
          )}
        </div>
      </div>

      <Card>
        {isLoading ? (
          <p className="p-6 text-muted-foreground">Загрузка...</p>
        ) : holidays.length === 0 ? (
          <p className="p-6 text-muted-foreground text-center">
            Записей нет. Нажмите «Синхронизировать», чтобы загрузить праздники РБ из Nager.Date.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Дата</TableHead>
                <TableHead>Название</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead>Источник</TableHead>
                <TableHead>Заметки</TableHead>
                {isAdmin && <TableHead className="w-24"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {holidays.map((h) => (
                <TableRow key={h.id}>
                  <TableCell className="font-mono">{h.date}</TableCell>
                  <TableCell>{h.name}</TableCell>
                  <TableCell>
                    <Badge className={DAY_TYPE_COLOR[h.day_type]} variant="outline">
                      {DAY_TYPE_LABEL[h.day_type]}
                    </Badge>
                  </TableCell>
                  <TableCell><Badge variant="outline">{h.source}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{h.notes ?? "—"}</TableCell>
                  {isAdmin && (
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => { setEditing(h); setOpen(true); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(h.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}

function HolidayDialog({ editing, onSave }: { editing: Holiday | null; onSave: (p: Partial<Holiday>) => void }) {
  const [date, setDate] = useState(editing?.date ?? format(new Date(), "yyyy-MM-dd"));
  const [name, setName] = useState(editing?.name ?? "");
  const [dayType, setDayType] = useState(editing?.day_type ?? "holiday");
  const [notes, setNotes] = useState(editing?.notes ?? "");

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{editing ? "Редактировать" : "Добавить"} запись</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <div>
          <Label>Дата</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <Label>Название</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Например: День Конституции" />
        </div>
        <div>
          <Label>Тип дня</Label>
          <Select value={dayType} onValueChange={(v: any) => setDayType(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="holiday">Праздник (нерабочий)</SelectItem>
              <SelectItem value="workday">Рабочая суббота (перенос)</SelectItem>
              <SelectItem value="short_day">Сокращённый день</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Заметки</Label>
          <Input value={notes ?? ""} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>
      <DialogFooter>
        <Button onClick={() => onSave({ date, name, day_type: dayType as any, notes })}>
          Сохранить
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}