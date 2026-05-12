import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Link2, Trash2, Search, X } from "lucide-react";
import { toast } from "sonner";
import { logAudit } from "@/lib/audit";

const KIND_LABELS: Record<string, string> = {
  related: "Связанная",
  duplicate: "Дубликат",
  parent: "Родитель",
  child: "Подзадача",
  blocks: "Блокирует",
  blocked_by: "Блокируется",
};

interface Props {
  ticketId: string;
  canEdit: boolean;
}

export function TicketLinks({ ticketId, canEdit }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState<string>("related");
  const [picking, setPicking] = useState(false);

  const { data: links = [] } = useQuery({
    queryKey: ["ticket-links", ticketId],
    queryFn: async () => {
      const { data: outgoing } = await supabase
        .from("ticket_links")
        .select("id, kind, target_ticket_id, source_ticket_id, created_at")
        .or(`source_ticket_id.eq.${ticketId},target_ticket_id.eq.${ticketId}`);
      const ids = new Set<string>();
      (outgoing ?? []).forEach((l: any) => {
        ids.add(l.source_ticket_id);
        ids.add(l.target_ticket_id);
      });
      ids.delete(ticketId);
      const idArr = Array.from(ids);
      const { data: tickets } = idArr.length
        ? await supabase.from("tickets").select("id, title, status, priority").in("id", idArr)
        : { data: [] as any[] };
      const byId = new Map<string, any>((tickets ?? []).map((t: any) => [t.id, t]));
      return (outgoing ?? []).map((l: any) => {
        const otherId = l.source_ticket_id === ticketId ? l.target_ticket_id : l.source_ticket_id;
        const inverse = l.target_ticket_id === ticketId;
        return {
          ...l,
          other: byId.get(otherId),
          inverse,
        };
      });
    },
  });

  const { data: candidates = [] } = useQuery({
    queryKey: ["ticket-link-search", ticketId, search],
    queryFn: async () => {
      if (!search.trim() || search.trim().length < 2) return [];
      const { data } = await supabase
        .from("tickets")
        .select("id, title, status, priority")
        .neq("id", ticketId)
        .ilike("title", `%${search.trim()}%`)
        .limit(8);
      return data ?? [];
    },
    enabled: picking,
  });

  async function addLink(targetId: string) {
    const { error } = await supabase.from("ticket_links").insert({
      source_ticket_id: ticketId,
      target_ticket_id: targetId,
      kind: kind as any,
      created_by: user?.id,
    });
    if (error) {
      toast.error("Не удалось добавить связь", { description: error.message });
      return;
    }
    await logAudit({ action: `Связь заявок (${KIND_LABELS[kind]})`, module: "tickets", entityId: ticketId, details: targetId });
    toast.success("Связь добавлена");
    setSearch("");
    setPicking(false);
    qc.invalidateQueries({ queryKey: ["ticket-links", ticketId] });
  }

  async function removeLink(id: string) {
    const { error } = await supabase.from("ticket_links").delete().eq("id", id);
    if (error) {
      toast.error("Не удалось удалить", { description: error.message });
      return;
    }
    toast.success("Связь удалена");
    qc.invalidateQueries({ queryKey: ["ticket-links", ticketId] });
  }

  return (
    <div className="border rounded-lg p-3 space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Link2 className="h-4 w-4" /> Связанные заявки {links.length > 0 && `(${links.length})`}
        </Label>
        {canEdit && !picking && (
          <Button size="sm" variant="outline" onClick={() => setPicking(true)}>
            <Link2 className="h-3.5 w-3.5 mr-1" /> Связать
          </Button>
        )}
      </div>

      {picking && canEdit && (
        <div className="space-y-2 bg-muted/40 p-2 rounded">
          <div className="flex gap-2">
            <Select value={kind} onValueChange={setKind}>
              <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(KIND_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск заявки по теме…"
                className="pl-7 h-9"
                autoFocus
              />
            </div>
            <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => { setPicking(false); setSearch(""); }}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          {candidates.length > 0 && (
            <div className="border rounded bg-background max-h-44 overflow-y-auto">
              {candidates.map((t: any) => (
                <button
                  key={t.id}
                  onClick={() => addLink(t.id)}
                  className="w-full text-left px-2 py-1.5 text-sm hover:bg-muted flex items-center gap-2"
                >
                  <Badge variant="outline" className="text-[10px] font-mono shrink-0">{t.priority}</Badge>
                  <span className="truncate flex-1">{t.title}</span>
                </button>
              ))}
            </div>
          )}
          {search.trim().length >= 2 && candidates.length === 0 && (
            <p className="text-xs text-muted-foreground px-1">Ничего не найдено</p>
          )}
        </div>
      )}

      {links.length === 0 && !picking ? (
        <p className="text-xs text-muted-foreground">Нет связанных заявок</p>
      ) : (
        <div className="space-y-1">
          {links.map((l: any) => (
            <div key={l.id} className="flex items-center gap-2 text-sm py-1 group">
              <Badge variant="secondary" className="text-[10px] shrink-0">
                {l.inverse && (l.kind === "parent" || l.kind === "child" || l.kind === "blocks" || l.kind === "blocked_by")
                  ? KIND_LABELS[
                      l.kind === "parent" ? "child"
                      : l.kind === "child" ? "parent"
                      : l.kind === "blocks" ? "blocked_by"
                      : "blocks"
                    ]
                  : KIND_LABELS[l.kind]}
              </Badge>
              {l.other ? (
                <>
                  <Badge variant="outline" className="text-[10px] font-mono">{l.other.priority}</Badge>
                  <span className="truncate flex-1">{l.other.title}</span>
                </>
              ) : (
                <span className="text-muted-foreground italic">Заявка недоступна</span>
              )}
              {canEdit && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                  onClick={() => removeLink(l.id)}
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}