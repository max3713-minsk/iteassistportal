import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Ticket, MessageSquare, Clock } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

const priorityColors: Record<string, string> = {
  P1: "bg-destructive text-destructive-foreground",
  P2: "bg-orange-500 text-white",
  P3: "bg-yellow-500 text-white",
  P4: "bg-muted text-muted-foreground",
};

const statusLabels: Record<string, string> = {
  open: "Открыта",
  in_progress: "В работе",
  waiting: "Ожидание",
  resolved: "Решена",
  closed: "Закрыта",
};

const statusColors: Record<string, string> = {
  open: "bg-blue-500 text-white",
  in_progress: "bg-primary text-primary-foreground",
  waiting: "bg-yellow-500 text-white",
  resolved: "bg-green-500 text-white",
  closed: "bg-muted text-muted-foreground",
};

interface TicketForm {
  title: string;
  description: string;
  priority: string;
  site_id: string;
  equipment_id: string;
}

const emptyForm: TicketForm = { title: "", description: "", priority: "P3", site_id: "", equipment_id: "" };

export default function Tickets() {
  const { user, isStaff } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<TicketForm>(emptyForm);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [comment, setComment] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("active");

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["tickets", statusFilter],
    queryFn: async () => {
      let q = supabase
        .from("tickets")
        .select("*, sites(name), equipment(name)")
        .order("created_at", { ascending: false });

      if (statusFilter === "active") {
        q = q.in("status", ["open", "in_progress", "waiting"]);
      } else if (statusFilter !== "all") {
        q = q.eq("status", statusFilter as any);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const { data: sites = [] } = useQuery({
    queryKey: ["sites"],
    queryFn: async () => {
      const { data } = await supabase.from("sites").select("id, name").order("name");
      return data ?? [];
    },
  });

  const { data: equipment = [] } = useQuery({
    queryKey: ["equipment-list"],
    queryFn: async () => {
      const { data } = await supabase.from("equipment").select("id, name, site_id").order("name");
      return data ?? [];
    },
  });

  const { data: comments = [], refetch: refetchComments } = useQuery({
    queryKey: ["ticket-comments", selectedTicket?.id],
    queryFn: async () => {
      if (!selectedTicket) return [];
      const { data } = await supabase
        .from("ticket_comments")
        .select("*, profiles:user_id(full_name)")
        .eq("ticket_id", selectedTicket.id)
        .order("created_at", { ascending: true });
      return data ?? [];
    },
    enabled: !!selectedTicket,
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
    mutationFn: async (f: TicketForm) => {
      const { error } = await supabase.from("tickets").insert({
        title: f.title,
        description: f.description || null,
        priority: f.priority as any,
        site_id: f.site_id || null,
        equipment_id: f.equipment_id || null,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tickets"] });
      qc.invalidateQueries({ queryKey: ["open-tickets-count"] });
      setOpen(false);
      setForm(emptyForm);
      toast({ title: "Заявка создана" });
    },
    onError: (e: any) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const payload: any = { status };
      if (status === "resolved" || status === "closed") payload.resolved_at = new Date().toISOString();
      const { error } = await supabase.from("tickets").update(payload).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tickets"] });
      qc.invalidateQueries({ queryKey: ["open-tickets-count"] });
      if (selectedTicket) {
        setSelectedTicket((prev: any) => prev ? { ...prev, status: "updated" } : null);
      }
      toast({ title: "Статус обновлён" });
    },
  });

  const assignMutation = useMutation({
    mutationFn: async ({ id, assigned_to }: { id: string; assigned_to: string }) => {
      const { error } = await supabase.from("tickets").update({ assigned_to }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tickets"] });
      toast({ title: "Инженер назначен" });
    },
  });

  const commentMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTicket || !comment.trim()) return;
      const { error } = await supabase.from("ticket_comments").insert({
        ticket_id: selectedTicket.id,
        user_id: user!.id,
        content: comment.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setComment("");
      refetchComments();
      toast({ title: "Комментарий добавлен" });
    },
  });

  const filteredEquipment = form.site_id
    ? equipment.filter((e: any) => e.site_id === form.site_id)
    : equipment;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-bold">Заявки</h1>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Активные</SelectItem>
              <SelectItem value="open">Открытые</SelectItem>
              <SelectItem value="in_progress">В работе</SelectItem>
              <SelectItem value="waiting">Ожидание</SelectItem>
              <SelectItem value="resolved">Решённые</SelectItem>
              <SelectItem value="closed">Закрытые</SelectItem>
              <SelectItem value="all">Все</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setForm(emptyForm); }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Новая заявка</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Новая заявка</DialogTitle>
                <DialogDescription>Опишите проблему или запрос</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Тема</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Краткое описание проблемы" />
                </div>
                <div className="space-y-2">
                  <Label>Приоритет</Label>
                  <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="P1">P1 — Критический</SelectItem>
                      <SelectItem value="P2">P2 — Высокий</SelectItem>
                      <SelectItem value="P3">P3 — Средний</SelectItem>
                      <SelectItem value="P4">P4 — Низкий</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Площадка</Label>
                  <Select value={form.site_id} onValueChange={(v) => setForm({ ...form, site_id: v, equipment_id: "" })}>
                    <SelectTrigger><SelectValue placeholder="Выберите площадку" /></SelectTrigger>
                    <SelectContent>
                      {sites.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Оборудование</Label>
                  <Select value={form.equipment_id} onValueChange={(v) => setForm({ ...form, equipment_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Выберите оборудование" /></SelectTrigger>
                    <SelectContent>
                      {filteredEquipment.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Описание</Label>
                  <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Подробное описание проблемы" />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => createMutation.mutate(form)} disabled={!form.title || createMutation.isPending}>
                  {createMutation.isPending ? "Создание..." : "Создать"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Загрузка...</p>
      ) : tickets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Ticket className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">Заявок пока нет</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Приоритет</TableHead>
                <TableHead>Тема</TableHead>
                <TableHead>Площадка</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="hidden md:table-cell">Создана</TableHead>
                {isStaff && <TableHead>Назначен</TableHead>}
                {isStaff && <TableHead className="w-32">Действия</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((t: any) => (
                <TableRow key={t.id} className="cursor-pointer" onClick={() => setSelectedTicket(t)}>
                  <TableCell>
                    <Badge className={priorityColors[t.priority]}>{t.priority}</Badge>
                  </TableCell>
                  <TableCell className="font-medium max-w-[300px] truncate">{t.title}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{t.sites?.name ?? "—"}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[t.status]}>{statusLabels[t.status]}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(t.created_at), { addSuffix: true, locale: ru })}
                  </TableCell>
                  {isStaff && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Select
                        value={t.assigned_to ?? ""}
                        onValueChange={(v) => assignMutation.mutate({ id: t.id, assigned_to: v })}
                      >
                        <SelectTrigger className="h-8 w-[140px]">
                          <SelectValue placeholder="Не назначен" />
                        </SelectTrigger>
                        <SelectContent>
                          {profiles.map((p: any) => (
                            <SelectItem key={p.user_id} value={p.user_id}>{p.full_name ?? p.user_id.slice(0, 8)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  )}
                  {isStaff && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Select
                        value={t.status}
                        onValueChange={(v) => updateStatusMutation.mutate({ id: t.id, status: v })}
                      >
                        <SelectTrigger className="h-8 w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Открыта</SelectItem>
                          <SelectItem value="in_progress">В работе</SelectItem>
                          <SelectItem value="waiting">Ожидание</SelectItem>
                          <SelectItem value="resolved">Решена</SelectItem>
                          <SelectItem value="closed">Закрыта</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Ticket detail dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={(v) => { if (!v) setSelectedTicket(null); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedTicket && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={priorityColors[selectedTicket.priority]}>{selectedTicket.priority}</Badge>
                  <Badge className={statusColors[selectedTicket.status]}>{statusLabels[selectedTicket.status]}</Badge>
                </div>
                <DialogTitle className="text-lg">{selectedTicket.title}</DialogTitle>
                <DialogDescription>
                  {selectedTicket.sites?.name && `Площадка: ${selectedTicket.sites.name}`}
                  {selectedTicket.equipment?.name && ` • Оборудование: ${selectedTicket.equipment.name}`}
                  {` • ${format(new Date(selectedTicket.created_at), "dd.MM.yyyy HH:mm")}`}
                </DialogDescription>
              </DialogHeader>

              {selectedTicket.description && (
                <div className="bg-muted/50 rounded-lg p-4 text-sm">{selectedTicket.description}</div>
              )}

              {selectedTicket.sla_deadline && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  SLA: {format(new Date(selectedTicket.sla_deadline), "dd.MM.yyyy HH:mm")}
                </div>
              )}

              <div className="space-y-3">
                <h3 className="font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" /> Комментарии ({comments.length})
                </h3>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {comments.map((c: any) => (
                    <div key={c.id} className="bg-muted/30 rounded-lg p-3 text-sm">
                      <div className="flex justify-between mb-1">
                        <span className="font-medium">{(c as any).profiles?.full_name ?? "Пользователь"}</span>
                        <span className="text-muted-foreground text-xs">
                          {format(new Date(c.created_at), "dd.MM HH:mm")}
                        </span>
                      </div>
                      <p>{c.content}</p>
                    </div>
                  ))}
                  {comments.length === 0 && <p className="text-muted-foreground text-sm">Комментариев пока нет</p>}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Напишите комментарий..."
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && commentMutation.mutate()}
                  />
                  <Button size="sm" onClick={() => commentMutation.mutate()} disabled={!comment.trim() || commentMutation.isPending}>
                    Отправить
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
