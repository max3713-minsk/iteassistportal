import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, RotateCcw, Loader2, GitCompare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { logAudit } from "@/lib/audit";
import type { MapDoc } from "./MapEditor";

interface Props {
  mapId: string | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onRestore: (doc: MapDoc) => Promise<void> | void;
  currentDoc: MapDoc;
}

type Version = {
  id: string;
  version_number: number;
  comment: string | null;
  created_by_name: string | null;
  node_count: number;
  edge_count: number;
  created_at: string;
  data: MapDoc;
};

export default function MapVersionsDialog({ mapId, open, onOpenChange, onRestore, currentDoc }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [diffId, setDiffId] = useState<string | null>(null);

  const { data: versions = [], isLoading } = useQuery({
    queryKey: ["map-versions", mapId],
    enabled: open && !!mapId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("infrastructure_map_versions" as any)
        .select("*")
        .eq("map_id", mapId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as unknown as Version[];
    },
  });

  const restoreMut = useMutation({
    mutationFn: async (v: Version) => {
      await onRestore(v.data);
      await logAudit({
        action: `Откат карты к версии #${v.version_number}`,
        module: "infrastructure_maps",
        entityId: mapId ?? undefined,
      });
    },
    onSuccess: () => {
      toast({ title: "Версия восстановлена" });
      qc.invalidateQueries({ queryKey: ["map-versions", mapId] });
      onOpenChange(false);
    },
    onError: (e: any) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  });

  const diff = (a: MapDoc | undefined, b: MapDoc) => {
    const aN = new Set((a?.nodes ?? []).map((n) => n.id));
    const bN = new Set(b.nodes.map((n) => n.id));
    const aE = new Set((a?.edges ?? []).map((e) => e.id));
    const bE = new Set(b.edges.map((e) => e.id));
    const addedN = [...bN].filter((x) => !aN.has(x)).length;
    const removedN = [...aN].filter((x) => !bN.has(x)).length;
    const addedE = [...bE].filter((x) => !aE.has(x)).length;
    const removedE = [...aE].filter((x) => !bE.has(x)).length;
    return { addedN, removedN, addedE, removedE };
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[420px] sm:max-w-[420px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="h-4 w-4" /> История версий
          </SheetTitle>
          <SheetDescription>
            Снимки карты создаются автоматически при каждом сохранении. Хранятся последние 50.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-160px)] mt-4 pr-2">
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : versions.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Версий пока нет. Сохраните карту, чтобы создать первый снимок.
            </div>
          ) : (
            <div className="space-y-2">
              {versions.map((v, idx) => {
                const prev = versions[idx + 1]?.data;
                const d = diff(prev, v.data);
                const isCurrent = idx === 0;
                return (
                  <div key={v.id} className="rounded-lg border p-3 hover:border-primary/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <Badge variant={isCurrent ? "default" : "outline"} className="font-mono text-xs">
                        #{v.version_number}
                      </Badge>
                      {isCurrent && <Badge variant="secondary" className="text-[10px]">текущая</Badge>}
                      <span className="ml-auto text-[11px] text-muted-foreground">
                        {new Date(v.created_at).toLocaleString("ru-RU")}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {v.created_by_name || "—"} · {v.node_count} узлов · {v.edge_count} связей
                    </div>
                    {prev && (d.addedN || d.removedN || d.addedE || d.removedE) ? (
                      <div className="text-[11px] mt-1 flex flex-wrap gap-2">
                        {d.addedN > 0 && <span className="text-emerald-500">+{d.addedN} узл.</span>}
                        {d.removedN > 0 && <span className="text-destructive">−{d.removedN} узл.</span>}
                        {d.addedE > 0 && <span className="text-emerald-500">+{d.addedE} связ.</span>}
                        {d.removedE > 0 && <span className="text-destructive">−{d.removedE} связ.</span>}
                      </div>
                    ) : null}
                    {v.comment && (
                      <p className="text-xs italic text-muted-foreground mt-1">«{v.comment}»</p>
                    )}
                    {!isCurrent && (
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 h-7"
                          onClick={() => setDiffId(diffId === v.id ? null : v.id)}
                        >
                          <GitCompare className="h-3 w-3" />
                          {diffId === v.id ? "Скрыть" : "Что изменилось"}
                        </Button>
                        <Button
                          size="sm"
                          className="gap-1.5 h-7"
                          disabled={restoreMut.isPending}
                          onClick={() => {
                            if (confirm(`Восстановить версию #${v.version_number}? Текущее состояние будет заменено.`)) {
                              restoreMut.mutate(v);
                            }
                          }}
                        >
                          <RotateCcw className="h-3 w-3" /> Восстановить
                        </Button>
                      </div>
                    )}
                    {diffId === v.id && (() => {
                      const dvc = diff(v.data, currentDoc);
                      return (
                        <div className="mt-2 rounded-md bg-muted/40 p-2 text-[11px] space-y-0.5">
                          <div className="font-medium text-muted-foreground">Различия с текущей:</div>
                          <div>Узлы: <span className="text-emerald-500">+{dvc.addedN}</span> / <span className="text-destructive">−{dvc.removedN}</span></div>
                          <div>Связи: <span className="text-emerald-500">+{dvc.addedE}</span> / <span className="text-destructive">−{dvc.removedE}</span></div>
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
