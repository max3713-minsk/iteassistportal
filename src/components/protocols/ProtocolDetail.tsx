import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CheckCircle2, Circle, FileDown, Check } from "lucide-react";
import { frequencyLabels } from "@/lib/schedule-utils";
import { cn } from "@/lib/utils";
import { useState } from "react";

const statusLabels: Record<string, string> = {
  pending: "Ожидает",
  in_progress: "В работе",
  completed: "Завершён",
  overdue: "Просрочен",
};

interface Props {
  protocolId: string;
  onBack: () => void;
  onExportPdf: (protocolId: string) => void;
}

interface ProtocolItem {
  id: string;
  equipment_id: string;
  task_id: string;
  status: string | null;
  result: string | null;
  notes: string | null;
  completed_at: string | null;
  equipment?: { name: string; model: string | null } | null;
  maintenance_tasks?: { title: string; description: string | null } | null;
}

interface GroupedEquipment {
  equipmentName: string;
  items: ProtocolItem[];
}

export default function ProtocolDetail({ protocolId, onBack, onExportPdf }: Props) {
  const { session, isStaff } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [itemNotes, setItemNotes] = useState<Record<string, string>>({});

  const { data: protocol } = useQuery({
    queryKey: ["protocol", protocolId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_protocols")
        .select("*, sites(name)")
        .eq("id", protocolId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: items = [] } = useQuery({
    queryKey: ["protocol-items", protocolId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("protocol_items")
        .select("*, equipment(name, model), maintenance_tasks(title, description)")
        .eq("protocol_id", protocolId)
        .order("equipment_id");
      if (error) throw error;
      return data as ProtocolItem[];
    },
  });

  const grouped = useMemo(() => {
    const map = new Map<string, GroupedEquipment>();
    for (const item of items) {
      const eqName = item.equipment
        ? `${item.equipment.name}${item.equipment.model ? ` (${item.equipment.model})` : ""}`
        : "Неизвестное оборудование";
      if (!map.has(eqName)) {
        map.set(eqName, { equipmentName: eqName, items: [] });
      }
      map.get(eqName)!.items.push(item);
    }
    return Array.from(map.values()).sort((a, b) => a.equipmentName.localeCompare(b.equipmentName));
  }, [items]);

  const completedCount = items.filter((i) => i.status === "completed").length;
  const totalCount = items.length;

  const toggleItem = useMutation({
    mutationFn: async (item: ProtocolItem) => {
      const newStatus = item.status === "completed" ? "pending" : "completed";
      const { error } = await supabase
        .from("protocol_items")
        .update({
          status: newStatus,
          completed_by: newStatus === "completed" ? session?.user.id : null,
          completed_at: newStatus === "completed" ? new Date().toISOString() : null,
          notes: itemNotes[item.id] || item.notes || null,
        })
        .eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["protocol-items", protocolId] });
    },
  });

  const completeProtocol = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("maintenance_protocols")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          completed_by: session?.user.id,
        })
        .eq("id", protocolId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["protocol", protocolId] });
      qc.invalidateQueries({ queryKey: ["protocols"] });
      toast({ title: "Протокол завершён" });
    },
  });

  if (!protocol) return <p className="text-muted-foreground">Загрузка...</p>;

  const allCompleted = totalCount > 0 && completedCount === totalCount;
  const isCompleted = protocol.status === "completed";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="font-heading text-xl font-bold truncate">
            {(protocol as any).sites?.name} — {frequencyLabels[protocol.frequency]}
          </h2>
          <p className="text-sm text-muted-foreground">
            {format(new Date(protocol.period_start), "dd.MM.yyyy")} — {format(new Date(protocol.period_end), "dd.MM.yyyy")}
          </p>
        </div>
        <Badge variant={isCompleted ? "default" : "secondary"}>
          {statusLabels[protocol.status]}
        </Badge>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Прогресс выполнения</span>
            <span className="text-sm text-muted-foreground">{completedCount} / {totalCount}</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : "0%" }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        {isStaff && !isCompleted && allCompleted && (
          <Button onClick={() => completeProtocol.mutate()} disabled={completeProtocol.isPending}>
            <Check className="h-4 w-4 mr-2" />
            Завершить протокол
          </Button>
        )}
        {isCompleted && (
          <Button variant="outline" onClick={() => onExportPdf(protocolId)}>
            <FileDown className="h-4 w-4 mr-2" />
            Скачать PDF
          </Button>
        )}
      </div>

      {/* Checklist */}
      <ScrollArea className="h-[calc(100vh-380px)] min-h-[300px]">
        <div className="space-y-4">
          {grouped.map((group) => (
            <Card key={group.equipmentName}>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-base">{group.equipmentName}</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0 space-y-2">
                {group.items.map((item) => {
                  const done = item.status === "completed";
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "flex items-start gap-3 rounded-md border p-3",
                        done && "bg-muted/50"
                      )}
                    >
                      {isStaff && !isCompleted ? (
                        <button
                          onClick={() => toggleItem.mutate(item)}
                          className="mt-0.5 shrink-0"
                          disabled={toggleItem.isPending}
                        >
                          {done ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground/50 hover:text-primary transition-colors" />
                          )}
                        </button>
                      ) : (
                        <span className="mt-0.5 shrink-0">
                          {done ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground/50" />
                          )}
                        </span>
                      )}
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className={cn("text-sm font-medium", done && "line-through text-muted-foreground")}>
                          {item.maintenance_tasks?.title ?? "Задача"}
                        </p>
                        {item.maintenance_tasks?.description && (
                          <p className="text-xs text-muted-foreground">{item.maintenance_tasks.description}</p>
                        )}
                        {isStaff && !isCompleted && !done && (
                          <Textarea
                            placeholder="Примечание..."
                            className="mt-1 text-xs h-8 min-h-[32px] resize-none"
                            value={itemNotes[item.id] ?? item.notes ?? ""}
                            onChange={(e) => setItemNotes((prev) => ({ ...prev, [item.id]: e.target.value }))}
                          />
                        )}
                        {done && item.notes && (
                          <p className="text-xs text-muted-foreground italic">📝 {item.notes}</p>
                        )}
                        {done && item.completed_at && (
                          <p className="text-xs text-muted-foreground">
                            ✅ {format(new Date(item.completed_at), "dd.MM.yyyy HH:mm")}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
