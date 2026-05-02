import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { SLATimer } from "@/components/tickets/SLATimer";
import {
  STATUS_LABELS,
  STATUS_COLORS,
  PRIORITY_COLORS,
  STATUS_TRANSITIONS,
  type AppRole,
} from "@/lib/ticket-categories";
import { logAudit } from "@/lib/audit";

const COLUMNS: { key: string; tone: string }[] = [
  { key: "open", tone: "border-t-red-500" },
  { key: "assigned", tone: "border-t-violet-500" },
  { key: "in_progress", tone: "border-t-blue-400" },
  { key: "waiting", tone: "border-t-yellow-500" },
  { key: "overdue", tone: "border-t-destructive" },
  { key: "resolved", tone: "border-t-emerald-500" },
  { key: "closed", tone: "border-t-gray-400" },
];

interface Props {
  tickets: any[];
  onSelect: (t: any) => void;
}

export function TicketKanban({ tickets, onSelect }: Props) {
  const { roles, user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  const moveMutation = useMutation({
    mutationFn: async ({ ticket, newStatus }: { ticket: any; newStatus: string }) => {
      const updates: any = { status: newStatus };
      if (newStatus === "resolved") updates.resolved_at = new Date().toISOString();
      if (newStatus === "in_progress" && !ticket.first_response_at) {
        updates.first_response_at = new Date().toISOString();
      }
      const { error } = await supabase.from("tickets").update(updates).eq("id", ticket.id);
      if (error) throw error;

      await supabase.from("ticket_status_history").insert({
        ticket_id: ticket.id,
        old_status: ticket.status,
        new_status: newStatus,
        changed_by: user!.id,
        comment: "Перемещено через канбан",
      });

      await logAudit({
        action: `Смена статуса: ${ticket.status} → ${newStatus}`,
        module: "tickets",
        entityId: ticket.id,
        details: ticket.title,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tickets"] });
    },
    onError: (e: any) => toast({ title: "Не удалось переместить", description: e.message, variant: "destructive" }),
  });

  function canTransition(ticket: any, toStatus: string): boolean {
    if (ticket.status === toStatus) return false;
    const transitions = STATUS_TRANSITIONS[ticket.status] ?? [];
    const isOwner = ticket.created_by === user?.id;
    return transitions.some((t) => {
      if (t.to !== toStatus) return false;
      if (t.roles.includes("customer") && !isOwner) return false;
      return t.roles.some((r) => (roles as AppRole[]).includes(r));
    });
  }

  const grouped: Record<string, any[]> = {};
  for (const c of COLUMNS) grouped[c.key] = [];
  for (const t of tickets) {
    if (grouped[t.status]) grouped[t.status].push(t);
  }

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex gap-3 min-w-max">
        {COLUMNS.map((col) => {
          const items = grouped[col.key] ?? [];
          const isOver = dragOverCol === col.key;
          return (
            <div
              key={col.key}
              className={cn(
                "w-[280px] shrink-0 rounded-lg border-t-4 bg-muted/30 transition-colors",
                col.tone,
                isOver && "bg-primary/10 ring-2 ring-primary/40",
              )}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverCol(col.key);
              }}
              onDragLeave={() => setDragOverCol((c) => (c === col.key ? null : c))}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverCol(null);
                const id = e.dataTransfer.getData("text/ticket-id");
                const ticket = tickets.find((t) => t.id === id);
                if (!ticket) return;
                if (!canTransition(ticket, col.key)) {
                  toast({
                    title: "Переход недоступен",
                    description: `Нельзя перейти из «${STATUS_LABELS[ticket.status]}» в «${STATUS_LABELS[col.key]}» с вашими правами.`,
                    variant: "destructive",
                  });
                  return;
                }
                moveMutation.mutate({ ticket, newStatus: col.key });
              }}
            >
              <div className="px-3 py-2 flex items-center justify-between border-b">
                <div className="flex items-center gap-2">
                  <Badge className={STATUS_COLORS[col.key]}>{STATUS_LABELS[col.key]}</Badge>
                </div>
                <span className="text-xs text-muted-foreground tabular-nums">{items.length}</span>
              </div>
              <div className="p-2 space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto">
                {items.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">Пусто</p>
                ) : (
                  items.map((t) => (
                    <Card
                      key={t.id}
                      className="p-2.5 cursor-grab active:cursor-grabbing hover:border-primary/40 transition-all"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/ticket-id", t.id);
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      onClick={() => onSelect(t)}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <Badge className={cn(PRIORITY_COLORS[t.priority], "text-[10px] px-1.5 py-0")}>
                          {t.priority}
                        </Badge>
                        <SLATimer deadline={t.sla_deadline} status={t.status} compact />
                      </div>
                      <p className="text-sm font-medium line-clamp-2 mb-1">{t.title}</p>
                      {t.sites?.name && (
                        <p className="text-[11px] text-muted-foreground truncate">📍 {t.sites.name}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1.5">
                        {formatDistanceToNow(new Date(t.created_at), { addSuffix: true, locale: ru })}
                      </p>
                    </Card>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground mt-3">
        💡 Перетащите карточку в нужный столбец, чтобы сменить статус. Доступные переходы зависят от ваших ролей.
      </p>
    </div>
  );
}