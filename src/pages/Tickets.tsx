import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Ticket, HelpCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow, format } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { logAudit } from "@/lib/audit";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CreateTicketDialog } from "@/components/tickets/CreateTicketDialog";
import { TicketDetailDialog } from "@/components/tickets/TicketDetailDialog";
import {
  STATUS_LABELS,
  STATUS_COLORS,
  PRIORITY_COLORS,
  ROW_STATUS_CLASSES,
  REQUEST_TYPE_LABELS,
  PRODUCTS,
} from "@/lib/ticket-categories";

export default function Tickets() {
  const { user, isStaff, hasRole } = useAuth();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showHelp, setShowHelp] = useState(false);

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["tickets", statusFilter],
    queryFn: async () => {
      let q = supabase
        .from("tickets")
        .select("*, sites(name), equipment(name)")
        .order("created_at", { ascending: false });

      if (statusFilter === "active") {
        q = q.in("status", ["open", "assigned", "in_progress", "waiting", "overdue"]);
      } else if (statusFilter !== "all") {
        q = q.eq("status", statusFilter as any);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  // Auto-mark overdue tickets
  const overdueChecked = useRef(false);
  useEffect(() => {
    if (overdueChecked.current || !tickets.length) return;
    overdueChecked.current = true;
    const now = new Date();
    const overdueTickets = tickets.filter(
      (t: any) =>
        (t.status === "open" || t.status === "assigned") &&
        t.sla_deadline &&
        new Date(t.sla_deadline) < now
    );
    if (overdueTickets.length === 0) return;
    (async () => {
      for (const t of overdueTickets) {
        await supabase.from("tickets").update({ status: "overdue" }).eq("id", t.id);
        await logAudit({ action: "Автоматическая просрочка SLA", module: "tickets", entityId: t.id, details: t.title });
      }
      qc.invalidateQueries({ queryKey: ["tickets"] });
    })();
  }, [tickets, qc]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-bold">Заявки</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => setShowHelp(true)} title="Справка">
            <HelpCircle className="h-4 w-4" />
          </Button>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все</SelectItem>
              <SelectItem value="active">Активные</SelectItem>
              <SelectItem value="open">Новые</SelectItem>
              <SelectItem value="assigned">Назначенные</SelectItem>
              <SelectItem value="in_progress">В работе</SelectItem>
              <SelectItem value="waiting">Ожидание</SelectItem>
              <SelectItem value="overdue">Просроченные</SelectItem>
              <SelectItem value="resolved">Решённые</SelectItem>
              <SelectItem value="closed">Закрытые</SelectItem>
              <SelectItem value="cancelled">Отменённые</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />Новая заявка
          </Button>
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
                <TableHead className="w-[60px]">П</TableHead>
                <TableHead>Тема</TableHead>
                <TableHead className="hidden lg:table-cell">Продукт</TableHead>
                <TableHead className="hidden md:table-cell">Тип</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="hidden md:table-cell">Создана</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((t: any) => {
                const product = PRODUCTS.find((p) => p.code === t.product_code);
                return (
                  <TableRow
                    key={t.id}
                    className={cn("cursor-pointer", ROW_STATUS_CLASSES[t.status])}
                    onClick={() => setSelectedTicket(t)}
                  >
                    <TableCell>
                      <Badge className={PRIORITY_COLORS[t.priority]}>{t.priority}</Badge>
                    </TableCell>
                    <TableCell className="font-medium max-w-[300px] truncate">
                      {t.title}
                      {t.sites?.name && (
                        <span className="text-xs text-muted-foreground ml-2">
                          {t.sites.name}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">
                      {product ? (
                        <Badge variant="outline" className="text-xs font-mono">{product.code}</Badge>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">
                      {REQUEST_TYPE_LABELS[t.request_type] || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[t.status]}>
                        {STATUS_LABELS[t.status] || t.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(t.created_at), { addSuffix: true, locale: ru })}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      <CreateTicketDialog open={createOpen} onOpenChange={setCreateOpen} />

      {selectedTicket && (
        <TicketDetailDialog
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
        />
      )}

      {/* Help dialog */}
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Жизненный цикл заявки</DialogTitle>
            <DialogDescription>Статусы и матрица переходов</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <div key={key} className="flex items-center gap-3">
                <Badge className={STATUS_COLORS[key]}>{label}</Badge>
                <span className="text-muted-foreground">
                  {key === "open" && "Заявка создана, ожидает назначения"}
                  {key === "assigned" && "Инженер назначен, ожидается принятие в работу"}
                  {key === "in_progress" && "Инженер работает над заявкой"}
                  {key === "waiting" && "Приостановлена, ожидание информации"}
                  {key === "overdue" && "SLA просрочен, требует немедленного внимания"}
                  {key === "resolved" && "Работы выполнены, ожидает подтверждения заказчика"}
                  {key === "closed" && "Заказчик подтвердил, заявка закрыта"}
                  {key === "cancelled" && "Отменена администратором или отозвана заказчиком"}
                </span>
              </div>
            ))}
            <div className="border-t pt-3 space-y-2">
              <h4 className="font-medium">Время реакции (SLA)</h4>
              <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                <div><Badge className={PRIORITY_COLORS.P1}>P1</Badge> — 30 мин (24/7)</div>
                <div><Badge className={PRIORITY_COLORS.P2}>P2</Badge> — 60 мин</div>
                <div><Badge className={PRIORITY_COLORS.P3}>P3</Badge> — 120 мин</div>
                <div><Badge className={PRIORITY_COLORS.P4}>P4</Badge> — 180 мин</div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
