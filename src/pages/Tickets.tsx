import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Ticket, HelpCircle, ChevronLeft, ChevronRight, LayoutGrid, List, Search, X, Inbox } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatDistanceToNow, format } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CreateTicketDialog } from "@/components/tickets/CreateTicketDialog";
import { TicketDetailDialog } from "@/components/tickets/TicketDetailDialog";
import { SLATimer } from "@/components/tickets/SLATimer";
import { TicketKanban } from "@/components/tickets/TicketKanban";
import { EmptyState } from "@/components/ui/empty-state";
import {
  STATUS_LABELS,
  STATUS_COLORS,
  PRIORITY_COLORS,
  ROW_STATUS_CLASSES,
  REQUEST_TYPE_LABELS,
  PRODUCTS,
} from "@/lib/ticket-categories";

const PAGE_SIZE = 50;
const KANBAN_PAGE_SIZE = 200;

export default function Tickets() {
  const { user, isStaff, hasRole } = useAuth();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [productFilter, setProductFilter] = useState<string>("all");
  const [requestTypeFilter, setRequestTypeFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"list" | "kanban">("list");
  const [showHelp, setShowHelp] = useState(false);
  const [page, setPage] = useState(0);

  // Reset page when any filter changes
  useEffect(() => { setPage(0); }, [statusFilter, priorityFilter, productFilter, requestTypeFilter, search, view]);

  // Load orgs for filter
  const { data: orgs = [] } = useQuery({
    queryKey: ["orgs-for-tickets-filter"],
    queryFn: async () => {
      const { data } = await supabase.from("organizations").select("id, name").order("name");
      return data ?? [];
    },
  });
  const [orgFilter, setOrgFilter] = useState<string>("all");
  useEffect(() => { setPage(0); }, [orgFilter]);

  const { data: ticketsResult, isLoading } = useQuery({
    queryKey: ["tickets", view, statusFilter, priorityFilter, productFilter, requestTypeFilter, orgFilter, search, page],
    queryFn: async () => {
      const limit = view === "kanban" ? KANBAN_PAGE_SIZE : PAGE_SIZE;
      let q = supabase
        .from("tickets")
        .select("*, sites(name), equipment(name)", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(view === "kanban" ? 0 : page * limit, view === "kanban" ? limit - 1 : (page + 1) * limit - 1);

      if (statusFilter === "active") {
        q = q.in("status", ["open", "assigned", "in_progress", "waiting", "overdue"]);
      } else if (statusFilter !== "all") {
        q = q.eq("status", statusFilter as any);
      }
      if (priorityFilter !== "all") q = q.eq("priority", priorityFilter as any);
      if (productFilter !== "all") q = q.eq("product_code", productFilter);
      if (requestTypeFilter !== "all") q = q.eq("request_type", requestTypeFilter);
      if (orgFilter !== "all") q = q.eq("organization_id", orgFilter);
      if (search.trim()) q = q.ilike("title", `%${search.trim()}%`);

      const { data, error, count } = await q;
      if (error) throw error;
      return { rows: data ?? [], total: count ?? 0 };
    },
  });

  // Realtime: invalidate on any tickets change
  useEffect(() => {
    const channel = supabase
      .channel("tickets-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "tickets" },
        () => qc.invalidateQueries({ queryKey: ["tickets"] }))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  const tickets = ticketsResult?.rows ?? [];
  const total = ticketsResult?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasActiveFilters =
    statusFilter !== "all" || priorityFilter !== "all" || productFilter !== "all" ||
    requestTypeFilter !== "all" || orgFilter !== "all" || !!search.trim();

  function resetFilters() {
    setStatusFilter("all");
    setPriorityFilter("all");
    setProductFilter("all");
    setRequestTypeFilter("all");
    setOrgFilter("all");
    setSearch("");
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-bold">Заявки</h1>
        <div className="flex gap-2">
          <ToggleGroup type="single" value={view} onValueChange={(v) => v && setView(v as "list" | "kanban")} size="sm">
            <ToggleGroupItem value="list" aria-label="Список"><List className="h-4 w-4" /></ToggleGroupItem>
            <ToggleGroupItem value="kanban" aria-label="Канбан"><LayoutGrid className="h-4 w-4" /></ToggleGroupItem>
          </ToggleGroup>
          <Button variant="outline" size="icon" onClick={() => setShowHelp(true)} title="Справка">
            <HelpCircle className="h-4 w-4" />
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />Новая заявка
          </Button>
        </div>
      </div>

      {/* Filters bar */}
      <Card className="mb-4 p-3">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          <div className="relative col-span-2 md:col-span-3 lg:col-span-2">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Поиск по теме…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-7 h-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Статус" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
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
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Приоритет" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все приоритеты</SelectItem>
              <SelectItem value="P1">P1 — Критический</SelectItem>
              <SelectItem value="P2">P2 — Высокий</SelectItem>
              <SelectItem value="P3">P3 — Средний</SelectItem>
              <SelectItem value="P4">P4 — Низкий</SelectItem>
            </SelectContent>
          </Select>
          <Select value={productFilter} onValueChange={setProductFilter}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Продукт" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все продукты</SelectItem>
              {PRODUCTS.map((p) => (
                <SelectItem key={p.code} value={p.code}>{p.code} — {p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={requestTypeFilter} onValueChange={setRequestTypeFilter}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Тип" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все типы</SelectItem>
              {Object.entries(REQUEST_TYPE_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={orgFilter} onValueChange={setOrgFilter}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Организация" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все организации</SelectItem>
              {orgs.map((o: any) => (
                <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {hasActiveFilters && (
          <div className="flex items-center justify-between mt-2 pt-2 border-t">
            <span className="text-xs text-muted-foreground">Найдено: {total}</span>
            <Button variant="ghost" size="sm" onClick={resetFilters} className="h-7 text-xs">
              <X className="h-3 w-3 mr-1" />Сбросить фильтры
            </Button>
          </div>
        )}
      </Card>

      {/* Bulk actions bar (staff only, list view only) */}
      {isStaff && view === "list" && selectedIds.size > 0 && (
        <Card className="mb-3 p-2 sticky top-2 z-10 border-primary/40 bg-card/95 backdrop-blur">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-medium px-1">Выбрано: {selectedIds.size}</span>
            <Select disabled={bulkBusy} onValueChange={(v) => bulkUpdate({ status: v }, "Статус изменён")}>
              <SelectTrigger className="h-8 w-[160px]"><SelectValue placeholder="Сменить статус" /></SelectTrigger>
              <SelectContent>
                {(["open","assigned","in_progress","waiting","resolved","closed","cancelled"] as const).map((s) => (
                  <SelectItem key={s} value={s}>{STATUS_LABELS[s] ?? s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select disabled={bulkBusy} onValueChange={(v) => bulkUpdate({ priority: v }, "Приоритет изменён")}>
              <SelectTrigger className="h-8 w-[150px]"><SelectValue placeholder="Сменить приоритет" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="P1">P1 — Критический</SelectItem>
                <SelectItem value="P2">P2 — Высокий</SelectItem>
                <SelectItem value="P3">P3 — Средний</SelectItem>
                <SelectItem value="P4">P4 — Низкий</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" disabled={bulkBusy} onClick={() => bulkUpdate({ assigned_to: user?.id, status: "assigned" }, "Назначено на вас")}>
              <UserPlus className="h-3.5 w-3.5 mr-1" />Назначить на себя
            </Button>
            <Button size="sm" variant="outline" disabled={bulkBusy} onClick={() => bulkUpdate({ assigned_to: null }, "Снято назначение")}>
              <UserX className="h-3.5 w-3.5 mr-1" />Снять назначение
            </Button>
            {hasRole("admin") && (
              <Button size="sm" variant="destructive" disabled={bulkBusy} onClick={bulkDelete}>
                <Trash2 className="h-3.5 w-3.5 mr-1" />Удалить
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())} className="ml-auto">
              <X className="h-3.5 w-3.5 mr-1" />Сбросить
            </Button>
          </div>
        </Card>
      )}

      {isLoading ? (
        <Card>
          <div className="p-4 space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </Card>
      ) : tickets.length === 0 ? (
        hasActiveFilters ? (
          <EmptyState
            icon={Search}
            title="Ничего не найдено"
            description="Попробуйте изменить фильтры или сбросить их."
            action={{ label: "Сбросить фильтры", icon: X, onClick: resetFilters }}
          />
        ) : (
          <EmptyState
            icon={Inbox}
            title="Заявок пока нет"
            description="Создайте первую заявку — инженеры получат уведомление и SLA-таймер запустится автоматически."
            action={{ label: "Новая заявка", icon: Plus, onClick: () => setCreateOpen(true) }}
          />
        )
      ) : view === "kanban" ? (
        <TicketKanban tickets={tickets} onSelect={setSelectedTicket} />
      ) : (
        <TooltipProvider delayDuration={400}>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">П</TableHead>
                <TableHead>Тема</TableHead>
                <TableHead className="hidden lg:table-cell">Продукт</TableHead>
                <TableHead className="hidden md:table-cell">Тип</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="hidden md:table-cell">SLA</TableHead>
                <TableHead className="hidden md:table-cell">Создана</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((t: any, idx: number) => {
                const product = PRODUCTS.find((p) => p.code === t.product_code);
                const row = (
                  <TableRow
                    key={t.id}
                    className={cn(
                      "cursor-pointer animate-in fade-in-0 transition-all duration-200",
                      ROW_STATUS_CLASSES[t.status],
                    )}
                    style={{ animationDelay: `${Math.min(idx * 20, 200)}ms` }}
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
                    <TableCell className="hidden md:table-cell">
                      <SLATimer deadline={t.sla_deadline} status={t.status} compact />
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(t.created_at), { addSuffix: true, locale: ru })}
                    </TableCell>
                  </TableRow>
                );
                if (t.description) {
                  return (
                    <Tooltip key={t.id}>
                      <TooltipTrigger asChild>{row}</TooltipTrigger>
                      <TooltipContent side="right" className="max-w-md">
                        <p className="text-xs">{t.description.slice(0, 100)}{t.description.length > 100 ? "…" : ""}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                }
                return row;
              })}
            </TableBody>
          </Table>
          {/* Pagination */}
          <div className="flex items-center justify-between p-3 border-t">
            <span className="text-sm text-muted-foreground">
              Всего: {total} • Страница {page + 1} из {totalPages}
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Предыдущая
              </Button>
              <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page + 1 >= totalPages}>
                Следующая <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </Card>
        </TooltipProvider>
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
