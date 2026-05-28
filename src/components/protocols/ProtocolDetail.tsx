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
import { ArrowLeft, CheckCircle2, Circle, FileDown, FileText, Check, Save, CloudUpload, UserCheck, ListChecks } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { frequencyLabels } from "@/lib/schedule-utils";
import { cn } from "@/lib/utils";
import { logAudit } from "@/lib/audit";
import { useState } from "react";
import ProtocolGraphs from "@/components/monitoring/ProtocolGraphs";
import ProtocolSignersDialog from "@/components/protocols/ProtocolSignersDialog";
import { buildProtocolDocxBlob } from "@/lib/export-protocol-docx";
import { fetchProtocolDocxData } from "@/lib/protocol-docx-data";
import { snapshotProtocolGraphs } from "@/components/monitoring/ProtocolGraphs";

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
  onExportDocx?: (protocolId: string) => void;
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

export default function ProtocolDetail({ protocolId, onBack, onExportPdf, onExportDocx }: Props) {
  const { session, isStaff } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [itemNotes, setItemNotes] = useState<Record<string, string>>({});
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

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

  const [protocolNotes, setProtocolNotes] = useState("");
  const [seafileUploading, setSeafileUploading] = useState(false);
  const [signersOpen, setSignersOpen] = useState(false);

  const isOnRequest = protocol?.frequency === "on_request";

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
          result: isOnRequest ? (itemNotes[item.id] || item.notes || null) : item.result,
        })
        .eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["protocol-items", protocolId] });
    },
  });

  const saveItemResult = useMutation({
    mutationFn: async ({ itemId, result }: { itemId: string; result: string }) => {
      const { error } = await supabase
        .from("protocol_items")
        .update({ result, notes: result })
        .eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["protocol-items", protocolId] });
      toast({ title: "Результат сохранён" });
    },
  });

  const saveProtocolNotes = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("maintenance_protocols")
        .update({ notes: protocolNotes, status: "in_progress" })
        .eq("id", protocolId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["protocol", protocolId] });
      toast({ title: "Результат работы сохранён" });
    },
  });

  const completeProtocol = useMutation({
    mutationFn: async () => {
      // Auto-complete all pending items: завершение протокола = все работы выполнены
      const pendingItems = items.filter((i) => i.status !== "completed");
      if (pendingItems.length > 0) {
        const nowIso = new Date().toISOString();
        const { error: itemsErr } = await supabase
          .from("protocol_items")
          .update({
            status: "completed",
            completed_by: session?.user.id,
            completed_at: nowIso,
          })
          .in("id", pendingItems.map((i) => i.id));
        if (itemsErr) throw itemsErr;
      }

      const { error } = await supabase
        .from("maintenance_protocols")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          completed_by: session?.user.id,
        })
        .eq("id", protocolId);
      if (error) throw error;

      // If on_request protocol is linked to a ticket, resolve the ticket
      if (protocol?.ticket_id) {
        await supabase
          .from("tickets")
          .update({ status: "resolved", resolved_at: new Date().toISOString() })
          .eq("id", protocol.ticket_id);
      }

      await logAudit({
        action: "Завершение протокола",
        module: "protocols",
        entityId: protocolId,
        details: `${(protocol as any)?.sites?.name} — ${frequencyLabels[protocol?.frequency ?? ""]}`,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["protocol", protocolId] });
      qc.invalidateQueries({ queryKey: ["protocol-items", protocolId] });
      qc.invalidateQueries({ queryKey: ["protocols"] });
      qc.invalidateQueries({ queryKey: ["tickets"] });
      toast({ title: "Протокол завершён" });
    },
  });

  const bulkCompleteItems = useMutation({
    mutationFn: async (ids?: string[]) => {
      const pendingItems = ids && ids.length > 0
        ? items.filter((i) => ids.includes(i.id) && i.status !== "completed")
        : items.filter((i) => i.status !== "completed");
      if (pendingItems.length === 0) return 0;
      const { error } = await supabase
        .from("protocol_items")
        .update({
          status: "completed",
          completed_by: session?.user.id,
          completed_at: new Date().toISOString(),
        })
        .in("id", pendingItems.map((i) => i.id));
      if (error) throw error;
      return pendingItems.length;
    },
    onSuccess: (count) => {
      qc.invalidateQueries({ queryKey: ["protocol-items", protocolId] });
      setSelectedItemIds(new Set());
      toast({ title: "Работы отмечены выполненными", description: `Обновлено: ${count}` });
    },
    onError: (e: any) => {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    },
  });

  // Initialize protocolNotes from protocol data
  const currentProtocolNotes = protocolNotes || protocol?.notes || "";

  if (!protocol) return <p className="text-muted-foreground">Загрузка...</p>;

  const allCompleted = totalCount > 0 && completedCount === totalCount;
  const isCompleted = protocol.status === "completed";

  const sendToSeafile = async () => {
    if (!allCompleted && !isOnRequest) {
      const ok = window.confirm(
        `Протокол не завершён: выполнено ${completedCount} из ${totalCount}. Отправить в Seafile несмотря на это?`
      );
      if (!ok) return;
    }
    if (!(protocol as any)?.executor_user_id && !(protocol as any)?.executor_signature_user_id) {
      toast({ title: "Заполните подписантов", description: "Укажите «Выполнил» и «Ответственный» перед отправкой.", variant: "destructive" });
      setSignersOpen(true);
      return;
    }
    if (!(protocol as any)?.responsible_user_id && !(protocol as any)?.responsible_signature_user_id) {
      toast({ title: "Заполните подписантов", description: "Укажите «Выполнил» и «Ответственный» перед отправкой.", variant: "destructive" });
      setSignersOpen(true);
      return;
    }
    setSeafileUploading(true);
    try {
      const docxData = await fetchProtocolDocxData(protocolId);
      let graphs: { name: string; pngBase64: string; widthPx: number; heightPx: number }[] = [];
      try { graphs = await snapshotProtocolGraphs(); } catch { /* ignore */ }
      docxData.graphs = graphs;
      const docxBlob = await buildProtocolDocxBlob(docxData);

      // Convert blob → base64
      const docxBase64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve((r.result as string).split(",")[1] || "");
        r.onerror = reject;
        r.readAsDataURL(docxBlob);
      });

      const { data, error } = await supabase.functions.invoke("protocol-export-seafile", {
        body: {
          protocol_id: protocolId,
          docx_base64: docxBase64,
          graphs: graphs.map((g) => ({ name: g.name, pngBase64: g.pngBase64 })),
        },
      });
      if (error) throw error;
      const res = data as { folder?: string; uploaded?: string[]; viewUrl?: string; error?: string };
      if (res?.error) throw new Error(res.error);

      await logAudit({
        action: "Экспорт протокола в Seafile",
        module: "protocols",
        entityId: protocolId,
        details: `${res.folder} • файлов: ${res.uploaded?.length ?? 0}`,
      });
      toast({
        title: "Загружено в Seafile",
        description: `${res.folder} • файлов: ${res.uploaded?.length ?? 0}`,
      });
    } catch (e) {
      toast({
        title: "Ошибка отправки в Seafile",
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setSeafileUploading(false);
    }
  };

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
        {isStaff && !isCompleted && !isOnRequest && !allCompleted && (
          <>
            <Button
              variant="outline"
              onClick={() => bulkCompleteItems.mutate(undefined)}
              disabled={bulkCompleteItems.isPending}
            >
              <ListChecks className="h-4 w-4 mr-2" />
              Выполнить все работы
            </Button>
            {selectedItemIds.size > 0 && (
              <Button
                variant="outline"
                onClick={() => bulkCompleteItems.mutate(Array.from(selectedItemIds))}
                disabled={bulkCompleteItems.isPending}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Выполнить выбранные ({selectedItemIds.size})
              </Button>
            )}
          </>
        )}
        {isStaff && !isCompleted && (
          <Button onClick={() => {
            const p: any = protocol;
            if (!(p?.executor_user_id || p?.executor_signature_user_id) || !(p?.responsible_user_id || p?.responsible_signature_user_id)) {
              toast({ title: "Заполните подписантов", description: "Укажите «Выполнил» и «Ответственный» перед завершением.", variant: "destructive" });
              setSignersOpen(true);
              return;
            }
            if (!isOnRequest && !allCompleted) {
              const ok = window.confirm(
                `Все работы будут автоматически отмечены выполненными (${totalCount - completedCount} осталось). Продолжить?`
              );
              if (!ok) return;
            }
            completeProtocol.mutate();
          }} disabled={completeProtocol.isPending}>
            <Check className="h-4 w-4 mr-2" />
            Завершить протокол
          </Button>
        )}
        {isStaff && (
          <Button variant="outline" onClick={() => setSignersOpen(true)}>
            <UserCheck className="h-4 w-4 mr-2" />
            Подписанты
          </Button>
        )}
        <Button variant="outline" onClick={() => onExportPdf(protocolId)}>
          <FileDown className="h-4 w-4 mr-2" />
          Скачать PDF
        </Button>
        {onExportDocx && (
          <Button variant="outline" onClick={() => onExportDocx(protocolId)}>
            <FileText className="h-4 w-4 mr-2" />
            Скачать DOC
          </Button>
        )}
        {isStaff && (
          <Button variant="outline" onClick={sendToSeafile} disabled={seafileUploading}>
            <CloudUpload className="h-4 w-4 mr-2" />
            {seafileUploading ? "Отправка..." : "Отправить в Seafile"}
          </Button>
        )}
      </div>

      {/* On-request: result entry */}
      {isOnRequest && (
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-base">Результат выполнения заявки</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0 space-y-3">
            {isStaff && !isCompleted ? (
              <>
                <Textarea
                  placeholder="Опишите результат выполнения работ по заявке..."
                  className="min-h-[100px]"
                  value={protocolNotes || protocol.notes || ""}
                  onChange={(e) => setProtocolNotes(e.target.value)}
                />
                <Button
                  size="sm"
                  onClick={() => saveProtocolNotes.mutate()}
                  disabled={saveProtocolNotes.isPending || !protocolNotes}
                >
                  Сохранить результат
                </Button>
              </>
            ) : (
              <p className="text-sm whitespace-pre-wrap">
                {protocol.notes || <span className="text-muted-foreground italic">Результат ещё не заполнен</span>}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Attached monitoring graphs */}
      <ProtocolGraphs protocolId={protocolId} readonly={isCompleted || !isStaff} />

      {/* Checklist */}
      <ScrollArea className="h-[calc(100vh-380px)] min-h-[300px]">
        <div className="space-y-4">
          {grouped.map((group) => (
            <Card key={group.equipmentName}>
              <CardHeader className="py-3 px-4 flex flex-row items-center gap-3 space-y-0">
                {isStaff && !isCompleted && !isOnRequest && (
                  <Checkbox
                    checked={
                      group.items.filter((i) => i.status !== "completed").length > 0 &&
                      group.items
                        .filter((i) => i.status !== "completed")
                        .every((i) => selectedItemIds.has(i.id))
                    }
                    onCheckedChange={(v) => {
                      setSelectedItemIds((prev) => {
                        const next = new Set(prev);
                        const pending = group.items.filter((i) => i.status !== "completed");
                        if (v) pending.forEach((i) => next.add(i.id));
                        else pending.forEach((i) => next.delete(i.id));
                        return next;
                      });
                    }}
                  />
                )}
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
                      {isStaff && !isCompleted && !isOnRequest && !done && (
                        <Checkbox
                          className="mt-1 shrink-0"
                          checked={selectedItemIds.has(item.id)}
                          onCheckedChange={(v) => {
                            setSelectedItemIds((prev) => {
                              const next = new Set(prev);
                              if (v) next.add(item.id);
                              else next.delete(item.id);
                              return next;
                            });
                          }}
                        />
                      )}
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
      <ProtocolSignersDialog
        protocolId={protocolId}
        open={signersOpen}
        onOpenChange={setSignersOpen}
      />
    </div>
  );
}
