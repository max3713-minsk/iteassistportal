import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { BarChart3, Plus, X, Loader2 } from "lucide-react";
import GraphChart from "./GraphChart";
import { useToast } from "@/hooks/use-toast";

interface SavedGraph {
  id: string;
  name: string;
  description: string | null;
  chart_type: string;
  time_range: string;
  aggregation: string | null;
  item_keys: any;
  is_shared: boolean;
  is_template: boolean;
  user_id: string;
}

interface Props {
  protocolId: string;
  readonly?: boolean;
}

const STORAGE_KEY = (id: string) => `protocol-graphs-${id}`;

export default function ProtocolGraphs({ protocolId, readonly = false }: Props) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [attached, setAttached] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  // Load attached graph ids from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY(protocolId));
      if (raw) setAttached(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, [protocolId]);

  const persist = (next: string[]) => {
    setAttached(next);
    localStorage.setItem(STORAGE_KEY(protocolId), JSON.stringify(next));
  };

  const { data: graphs = [], isLoading } = useQuery({
    queryKey: ["saved-graphs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_graphs")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as SavedGraph[]) || [];
    },
  });

  const attachedGraphs = useMemo(
    () => attached.map((id) => graphs.find((g) => g.id === id)).filter(Boolean) as SavedGraph[],
    [attached, graphs]
  );

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const apply = () => {
    const next = [...new Set([...attached, ...selected])];
    persist(next);
    setSelected(new Set());
    setOpen(false);
    toast({ title: `Прикреплено графиков: ${next.length}` });
  };

  const remove = (id: string) => {
    persist(attached.filter((g) => g !== id));
  };

  return (
    <Card>
      <CardHeader className="py-3 px-4 flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          Графики мониторинга
          {attachedGraphs.length > 0 && (
            <Badge variant="outline" className="text-[10px]">{attachedGraphs.length}</Badge>
          )}
        </CardTitle>
        {!readonly && (
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Прикрепить график
          </Button>
        )}
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        {attachedGraphs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            {readonly
              ? "К протоколу не прикреплены графики"
              : "Нажмите «Прикрепить график», чтобы добавить визуализации из библиотеки"}
          </p>
        ) : (
          <div ref={containerRef} className="grid grid-cols-1 lg:grid-cols-2 gap-4 protocol-graphs-grid">
            {attachedGraphs.map((g) => {
              const items = Array.isArray(g.item_keys) ? g.item_keys : [];
              return (
                <Card key={g.id} className="relative" data-graph-id={g.id} data-graph-name={g.name}>
                  <CardHeader className="pb-2 flex-row items-start justify-between space-y-0">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm">{g.name}</CardTitle>
                      {g.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{g.description}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {items.length} метрик · период: {g.time_range}
                      </p>
                    </div>
                    {!readonly && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => remove(g.id)}
                        title="Открепить"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent>
                    <GraphChart
                      series={items.map((it: any) => ({
                        hostid: it.hostid,
                        hostName: it.hostName,
                        itemid: it.itemid,
                        itemName: it.name,
                        units: it.units,
                        color: it.color,
                        ip: it.ip,
                        hostGroup: it.hostGroup,
                      }))}
                      timeRange={g.time_range}
                      chartType={g.chart_type as any}
                      aggregation={(g.aggregation as any) || "avg"}
                      height={200}
                      exportable
                      graphName={g.name}
                    />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Picker dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Выберите графики из библиотеки</DialogTitle>
            <DialogDescription>
              Графики будут отображены в детальном виде и попадут в экспорт DOCX.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 border rounded">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : graphs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Сохранённых графиков нет. Создайте их во вкладке «Графики».
              </p>
            ) : (
              <div className="divide-y">
                {graphs.map((g) => {
                  const isAlready = attached.includes(g.id);
                  const isSel = selected.has(g.id);
                  return (
                    <label
                      key={g.id}
                      className={`flex items-start gap-3 p-3 cursor-pointer hover:bg-muted/40 ${
                        isAlready ? "opacity-50" : ""
                      }`}
                    >
                      <Checkbox
                        checked={isSel || isAlready}
                        disabled={isAlready}
                        onCheckedChange={() => toggle(g.id)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium flex items-center gap-2">
                          {g.name}
                          {g.is_template && <Badge className="text-[10px]">Шаблон регламента</Badge>}
                          {g.is_shared && <Badge variant="outline" className="text-[10px]">Общий</Badge>}
                          {isAlready && <Badge variant="secondary" className="text-[10px]">Уже прикреплён</Badge>}
                        </p>
                        {g.description && (
                          <p className="text-xs text-muted-foreground">{g.description}</p>
                        )}
                        <p className="text-[10px] text-muted-foreground">
                          Период: {g.time_range} · {Array.isArray(g.item_keys) ? g.item_keys.length : 0} метрик
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </ScrollArea>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Отмена</Button>
            <Button onClick={apply} disabled={selected.size === 0}>
              Прикрепить ({selected.size})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

/**
 * Snapshot all visible protocol graphs as PNG data URLs.
 * Walks the live DOM, finds <svg> charts under `.protocol-graphs-grid` and rasterises them.
 */
export async function snapshotProtocolGraphs(): Promise<{ name: string; pngBase64: string; widthPx: number; heightPx: number }[]> {
  const grid = document.querySelector(".protocol-graphs-grid");
  if (!grid) return [];
  const cards = Array.from(grid.querySelectorAll<HTMLElement>("[data-graph-id]"));
  const out: { name: string; pngBase64: string; widthPx: number; heightPx: number }[] = [];

  for (const card of cards) {
    const name = card.dataset.graphName || "График";
    const svg = card.querySelector("svg");
    if (!svg) continue;

    try {
      const xml = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);

      const png = await new Promise<{ base64: string; w: number; h: number }>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const w = svg.clientWidth || 800;
          const h = svg.clientHeight || 200;
          const canvas = document.createElement("canvas");
          canvas.width = w * 2;
          canvas.height = h * 2;
          const ctx = canvas.getContext("2d")!;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.scale(2, 2);
          ctx.drawImage(img, 0, 0, w, h);
          resolve({ base64: canvas.toDataURL("image/png"), w, h });
        };
        img.onerror = reject;
        img.src = url;
      });

      URL.revokeObjectURL(url);
      out.push({ name, pngBase64: png.base64, widthPx: png.w, heightPx: png.h });
    } catch {
      /* skip on error */
    }
  }
  return out;
}
