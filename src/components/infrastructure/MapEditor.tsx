import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow, ReactFlowProvider, Background, BackgroundVariant, Controls, MiniMap,
  addEdge, useEdgesState, useNodesState, MarkerType, ConnectionMode,
  type Connection, type Edge, type Node, type ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { invokeZabbix } from "@/lib/zabbix-invoke";
import { useZabbixConnection } from "@/hooks/useZabbixConnection";
import { DeviceNode, DeviceNodeData } from "./DeviceNode";
import { NODE_LIBRARY, NodeKind, NODE_INFO } from "./nodeTypes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Save, Trash2, Magnet, AlignStartHorizontal, AlignEndHorizontal, AlignCenterHorizontal,
  AlignStartVertical, AlignEndVertical, AlignCenterVertical, ArrowUpToLine, ArrowDownToLine,
  Activity, Link2, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nodeTypes = { device: DeviceNode };

export type MapDoc = { nodes: Node[]; edges: Edge[] };

interface Props {
  initial: MapDoc;
  readOnly?: boolean;
  onSave?: (doc: MapDoc) => Promise<void> | void;
  saving?: boolean;
}

let nid = 0;
const newId = () => `n_${Date.now().toString(36)}_${(++nid).toString(36)}`;

type EdgeKind = "smoothstep" | "step" | "straight" | "default";
type ArrowDir = "none" | "forward" | "backward" | "both";

const PRIMARY = "hsl(var(--primary))";

function buildEdgeStyle(opts: {
  color?: string; width?: number; dashed?: boolean;
}) {
  return {
    stroke: opts.color ?? PRIMARY,
    strokeWidth: opts.width ?? 2,
    strokeDasharray: opts.dashed ? "6 4" : undefined,
  };
}

function buildMarkers(dir: ArrowDir, color: string) {
  const m: Partial<Edge> = {};
  if (dir === "forward" || dir === "both")
    m.markerEnd = { type: MarkerType.ArrowClosed, color };
  if (dir === "backward" || dir === "both")
    m.markerStart = { type: MarkerType.ArrowClosed, color };
  if (dir === "none") {
    m.markerEnd = undefined;
    m.markerStart = undefined;
  }
  return m;
}

function readEdgeMeta(e: Edge) {
  const m = (e.data as any) ?? {};
  return {
    color: (e.style as any)?.stroke ?? PRIMARY,
    width: (e.style as any)?.strokeWidth ?? 2,
    dashed: !!((e.style as any)?.strokeDasharray),
    animated: !!e.animated,
    flow: !!m.flow,
    dir: ((): ArrowDir => {
      const hasStart = !!e.markerStart, hasEnd = !!e.markerEnd;
      if (hasStart && hasEnd) return "both";
      if (hasEnd) return "forward";
      if (hasStart) return "backward";
      return "none";
    })(),
    type: (e.type as EdgeKind) ?? "smoothstep",
    label: (e.label as string) ?? "",
  };
}

/* Live status — queries Zabbix for equipment-bound nodes */
function useLiveStatuses(nodes: Node[]) {
  const { activeId } = useZabbixConnection();
  const equipmentIds = useMemo(() => {
    const ids = new Set<string>();
    nodes.forEach((n) => {
      const eq = (n.data as any)?.equipmentId as string | undefined;
      if (eq) ids.add(eq);
    });
    return [...ids];
  }, [nodes]);

  const { data: links = [] } = useQuery({
    queryKey: ["map-equipment-links", equipmentIds],
    enabled: equipmentIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("monitoring_host_links")
        .select("equipment_id, zabbix_host_id, host_name")
        .in("equipment_id", equipmentIds);
      if (error) throw error;
      return data ?? [];
    },
  });

  const hostIds = useMemo(() => links.map((l) => l.zabbix_host_id), [links]);

  const { data: zbxData } = useQuery({
    queryKey: ["map-zbx-status", activeId, hostIds],
    enabled: !!activeId && hostIds.length > 0,
    refetchInterval: 30_000,
    queryFn: async () => {
      const [hostsRes, probsRes] = await Promise.all([
        invokeZabbix({ body: { action: "getHosts", hostids: hostIds } }),
        invokeZabbix({ body: { action: "getProblems", hostids: hostIds } }),
      ]);
      const hosts = ((hostsRes.data as any)?.result ?? []) as any[];
      const probs = ((probsRes.data as any)?.result ?? []) as any[];
      return { hosts, probs };
    },
  });

  return useMemo(() => {
    const map = new Map<string, "ok" | "problem" | "down" | "unknown">();
    if (!zbxData) return map;
    const hostStatusByHostId = new Map<string, "ok" | "down">();
    for (const h of zbxData.hosts) {
      hostStatusByHostId.set(String(h.hostid), h.available === "1" ? "ok" : h.available === "2" ? "down" : "ok");
    }
    const problemHostIds = new Set<string>();
    for (const p of zbxData.probs) {
      const sev = parseInt(p.severity || "0");
      if (sev >= 3) for (const h of (p.hosts ?? [])) problemHostIds.add(String(h.hostid));
    }
    for (const link of links) {
      const hs = hostStatusByHostId.get(String(link.zabbix_host_id));
      let s: "ok" | "problem" | "down" | "unknown" = "unknown";
      if (hs === "down") s = "down";
      else if (problemHostIds.has(String(link.zabbix_host_id))) s = "problem";
      else if (hs === "ok") s = "ok";
      map.set(link.equipment_id, s);
    }
    return map;
  }, [zbxData, links]);
}

function EditorInner({ initial, readOnly, onSave, saving }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);
  const [selected, setSelected] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [snap, setSnap] = useState(true);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [rfi, setRfi] = useState<ReactFlowInstance | null>(null);

  /* Equipment list (for binding) */
  const { data: equipment = [] } = useQuery({
    queryKey: ["map-equipment-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("equipment")
        .select("id, name, model, sites(name, organization)")
        .order("name");
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  /* Live statuses from Zabbix */
  const liveStatuses = useLiveStatuses(nodes);

  /* Apply live statuses into node.data.status without overwriting manual nodes */
  useEffect(() => {
    if (liveStatuses.size === 0) return;
    setNodes((ns) =>
      ns.map((n) => {
        const eq = (n.data as any)?.equipmentId;
        if (!eq) return n;
        const s = liveStatuses.get(eq);
        if (!s) return n;
        if ((n.data as any)?.status === s) return n;
        return { ...n, data: { ...(n.data as any), status: s, live: true } };
      }),
    );
  }, [liveStatuses, setNodes]);

  useEffect(() => {
    if (!selected) return;
    const fresh = nodes.find((n) => n.id === selected.id);
    if (fresh && fresh !== selected) setSelected(fresh);
  }, [nodes, selected]);

  const onConnect = useCallback(
    (c: Connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...c,
            type: "smoothstep",
            animated: false,
            style: buildEdgeStyle({}),
            ...buildMarkers("forward", PRIMARY),
            data: { flow: false },
          },
          eds,
        ),
      ),
    [setEdges],
  );

  const addNode = useCallback(
    (kind: NodeKind) => {
      const info = NODE_INFO[kind];
      const center = rfi?.screenToFlowPosition?.({
        x: (wrapperRef.current?.clientWidth ?? 800) / 2,
        y: (wrapperRef.current?.clientHeight ?? 600) / 2,
      }) ?? { x: 200, y: 200 };
      const node: Node = {
        id: newId(),
        type: "device",
        position: { x: center.x, y: center.y },
        data: { label: info.label, kind, status: "unknown" } as DeviceNodeData,
        ...(kind === "zone" ? { zIndex: -1 } : {}),
      };
      setNodes((ns) => [...ns, node]);
    },
    [rfi, setNodes],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (readOnly || !rfi) return;
      const kind = e.dataTransfer.getData("application/lovable-node") as NodeKind;
      if (!kind) return;
      const pos = rfi.screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const info = NODE_INFO[kind];
      const node: Node = {
        id: newId(),
        type: "device",
        position: pos,
        data: { label: info.label, kind, status: "unknown" } as DeviceNodeData,
      };
      setNodes((ns) => [...ns, node]);
    },
    [rfi, readOnly, setNodes],
  );

  const updateSelected = (patch: Partial<DeviceNodeData> & { equipmentId?: string | null }) => {
    if (!selected) return;
    setNodes((ns) =>
      ns.map((n) => (n.id === selected.id ? { ...n, data: { ...(n.data as any), ...patch } } : n)),
    );
  };

  const updateSelectedEdge = (mut: (m: ReturnType<typeof readEdgeMeta>) => Partial<ReturnType<typeof readEdgeMeta>>) => {
    if (!selectedEdge) return;
    setEdges((es) =>
      es.map((e) => {
        if (e.id !== selectedEdge.id) return e;
        const m = readEdgeMeta(e);
        const next = { ...m, ...mut(m) };
        const style = buildEdgeStyle({ color: next.color, width: next.width, dashed: next.dashed });
        const markers = buildMarkers(next.dir, next.color);
        return {
          ...e,
          type: next.type,
          animated: next.animated,
          style,
          markerStart: undefined,
          markerEnd: undefined,
          ...markers,
          label: next.label,
          ...(next.label
            ? {
                labelBgPadding: [6, 3] as [number, number],
                labelBgBorderRadius: 6,
                labelBgStyle: { fill: "hsl(var(--background))", fillOpacity: 0.85 },
                labelStyle: { fill: "hsl(var(--foreground))", fontSize: 11, fontWeight: 500 },
              }
            : {}),
          data: { ...((e.data as any) ?? {}), flow: next.flow },
          className: next.flow ? "lovable-flow-edge" : undefined,
        };
      }),
    );
  };

  // Sync selected edge after edits
  useEffect(() => {
    if (!selectedEdge) return;
    const fresh = edges.find((e) => e.id === selectedEdge.id);
    if (fresh && fresh !== selectedEdge) setSelectedEdge(fresh);
  }, [edges, selectedEdge]);

  const deleteSelected = () => {
    if (selected) {
      setNodes((ns) => ns.filter((n) => n.id !== selected.id));
      setEdges((es) => es.filter((e) => e.source !== selected.id && e.target !== selected.id));
      setSelected(null);
    }
    if (selectedEdge) {
      setEdges((es) => es.filter((e) => e.id !== selectedEdge.id));
      setSelectedEdge(null);
    }
  };

  const handleSave = async () => {
    await onSave?.({ nodes, edges });
  };

  /* Multi-selection alignment / z-order */
  const selectedNodes = nodes.filter((n) => n.selected);
  const selCount = selectedNodes.length;

  const align = (mode: "left" | "right" | "h-center" | "top" | "bottom" | "v-center") => {
    if (selCount < 2) return;
    const xs = selectedNodes.map((n) => n.position.x);
    const ys = selectedNodes.map((n) => n.position.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const cX = (minX + maxX) / 2, cY = (minY + maxY) / 2;
    const ids = new Set(selectedNodes.map((n) => n.id));
    setNodes((ns) =>
      ns.map((n) => {
        if (!ids.has(n.id)) return n;
        const p = { ...n.position };
        if (mode === "left") p.x = minX;
        if (mode === "right") p.x = maxX;
        if (mode === "h-center") p.x = cX;
        if (mode === "top") p.y = minY;
        if (mode === "bottom") p.y = maxY;
        if (mode === "v-center") p.y = cY;
        return { ...n, position: p };
      }),
    );
  };

  const setZ = (mode: "front" | "back") => {
    const ids = new Set(selectedNodes.map((n) => n.id));
    if (!ids.size && selected) ids.add(selected.id);
    if (!ids.size) return;
    const allZ = nodes.map((n) => n.zIndex ?? 0);
    const top = (Math.max(0, ...allZ) || 0) + 1;
    const bottom = (Math.min(0, ...allZ) || 0) - 1;
    setNodes((ns) => ns.map((n) => (ids.has(n.id) ? { ...n, zIndex: mode === "front" ? top : bottom } : n)));
  };

  const sel = (selected?.data as unknown as DeviceNodeData & { equipmentId?: string; live?: boolean }) ?? null;
  const selMeta = selectedEdge ? readEdgeMeta(selectedEdge) : null;

  return (
    <div className="flex h-[calc(100vh-220px)] min-h-[560px] gap-4">
      {/* Library */}
      {!readOnly && (
        <aside className="w-56 shrink-0 rounded-xl border bg-card p-3 overflow-y-auto">
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2 px-1">Палитра</div>
          <div className="grid grid-cols-2 gap-2">
            {NODE_LIBRARY.map((it) => {
              const Icon = it.icon;
              return (
                <button
                  key={it.kind}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("application/lovable-node", it.kind)}
                  onClick={() => addNode(it.kind)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-lg border bg-background/50 p-2.5 text-[11px]",
                    "hover:bg-accent/10 hover:border-primary/40 transition-all cursor-grab active:cursor-grabbing",
                  )}
                >
                  <span className="h-8 w-8 rounded-md flex items-center justify-center"
                    style={{ background: `hsl(${it.accent} / 0.15)`, color: `hsl(${it.accent})` }}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-center leading-tight">{it.label}</span>
                </button>
              );
            })}
          </div>
          <div className="text-[10px] text-muted-foreground/70 mt-3 px-1">
            Перетащите элемент на холст или кликните для добавления
          </div>
        </aside>
      )}

      {/* Canvas */}
      <div ref={wrapperRef} className="flex-1 rounded-xl border bg-muted/10 overflow-hidden relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setRfi}
          onDrop={onDrop}
          onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
          onNodeClick={(_, n) => { setSelected(n); setSelectedEdge(null); }}
          onEdgeClick={(_, e) => { setSelectedEdge(e); setSelected(null); }}
          onPaneClick={() => { setSelected(null); setSelectedEdge(null); }}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Loose}
          snapToGrid={snap}
          snapGrid={[20, 20]}
          fitView
          proOptions={{ hideAttribution: true }}
          deleteKeyCode={readOnly ? null : ["Backspace", "Delete"]}
          nodesDraggable={!readOnly}
          nodesConnectable={!readOnly}
          multiSelectionKeyCode={["Shift", "Meta", "Control"]}
          selectionOnDrag
          elementsSelectable
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1.2} color="hsl(var(--border))" />
          <Controls className="!bg-card !border !border-border [&>button]:!bg-card [&>button]:!border-border [&>button]:!text-foreground" />
          <MiniMap
            pannable zoomable
            maskColor="hsl(var(--background) / 0.6)"
            nodeStrokeColor="hsl(var(--primary))"
            nodeColor={(n) => {
              const k = (n.data as any)?.kind as NodeKind;
              return k && NODE_INFO[k] ? `hsl(${NODE_INFO[k].accent})` : "hsl(var(--muted))";
            }}
            className="!bg-card !border !border-border !rounded-lg overflow-hidden"
          />
        </ReactFlow>

        {/* Toolbar overlay */}
        {!readOnly && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-card/95 backdrop-blur border rounded-lg px-2 py-1.5 shadow-lg">
            <Button size="sm" variant={snap ? "default" : "outline"} onClick={() => setSnap(s => !s)} className="gap-1.5 h-8" title="Привязка к сетке">
              <Magnet className="h-3.5 w-3.5" />
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-0.5" title="Выравнивание (выбрать 2+ узла)">
              <Button size="icon" variant="ghost" className="h-8 w-8" disabled={selCount < 2} onClick={() => align("left")}><AlignStartVertical className="h-3.5 w-3.5" /></Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" disabled={selCount < 2} onClick={() => align("h-center")}><AlignCenterVertical className="h-3.5 w-3.5" /></Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" disabled={selCount < 2} onClick={() => align("right")}><AlignEndVertical className="h-3.5 w-3.5" /></Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" disabled={selCount < 2} onClick={() => align("top")}><AlignStartHorizontal className="h-3.5 w-3.5" /></Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" disabled={selCount < 2} onClick={() => align("v-center")}><AlignCenterHorizontal className="h-3.5 w-3.5" /></Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" disabled={selCount < 2} onClick={() => align("bottom")}><AlignEndHorizontal className="h-3.5 w-3.5" /></Button>
            </div>
            <Separator orientation="vertical" className="h-6" />
            <Button size="icon" variant="ghost" className="h-8 w-8" disabled={!selected && selCount === 0} onClick={() => setZ("front")} title="На передний план"><ArrowUpToLine className="h-3.5 w-3.5" /></Button>
            <Button size="icon" variant="ghost" className="h-8 w-8" disabled={!selected && selCount === 0} onClick={() => setZ("back")} title="На задний план"><ArrowDownToLine className="h-3.5 w-3.5" /></Button>
            <Separator orientation="vertical" className="h-6" />
            <Button size="sm" onClick={handleSave} disabled={saving} className="gap-2 h-8">
              <Save className="h-3.5 w-3.5" /> {saving ? "..." : "Сохранить"}
            </Button>
          </div>
        )}
      </div>

      {/* Inspector */}
      <Sheet open={!!selected || !!selectedEdge} onOpenChange={(o) => { if (!o) { setSelected(null); setSelectedEdge(null); } }}>
        <SheetContent side="right" className="w-[380px] sm:max-w-[380px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{selectedEdge ? "Связь" : "Узел"}</SheetTitle>
          </SheetHeader>

          {sel && (
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label>Название</Label>
                <Input value={sel.label} onChange={(e) => updateSelected({ label: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Подпись / модель</Label>
                <Input value={sel.subtitle ?? ""} onChange={(e) => updateSelected({ subtitle: e.target.value })} placeholder="напр. HP DL380 G10" />
              </div>
              <div className="space-y-2">
                <Label>Тип</Label>
                <Select value={sel.kind} onValueChange={(v) => updateSelected({ kind: v as NodeKind })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {NODE_LIBRARY.map((it) => <SelectItem key={it.kind} value={it.kind}>{it.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Link2 className="h-3.5 w-3.5" /> Привязка к оборудованию
                </Label>
                <Select
                  value={sel.equipmentId ?? "none"}
                  onValueChange={(v) => {
                    if (v === "none") {
                      updateSelected({ equipmentId: null, live: false });
                      return;
                    }
                    const eq = equipment.find((x: any) => x.id === v);
                    updateSelected({
                      equipmentId: v,
                      label: eq?.name ?? sel.label,
                      subtitle: eq?.model ?? sel.subtitle,
                    });
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Не привязано" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Не привязано —</SelectItem>
                    {equipment.map((eq: any) => (
                      <SelectItem key={eq.id} value={eq.id}>
                        {eq.name}{eq.sites?.name ? ` · ${eq.sites.name}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {sel.equipmentId && (
                  <Badge variant="outline" className="gap-1 text-[10px]">
                    <Activity className="h-3 w-3" /> Live-статус из Zabbix
                  </Badge>
                )}
              </div>

              <div className="space-y-2">
                <Label>Статус (ручной, если без привязки)</Label>
                <Select
                  value={sel.status ?? "unknown"}
                  onValueChange={(v) => updateSelected({ status: v as any })}
                  disabled={!!sel.equipmentId}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unknown">Не определён</SelectItem>
                    <SelectItem value="ok">В работе</SelectItem>
                    <SelectItem value="problem">Проблема</SelectItem>
                    <SelectItem value="down">Недоступен</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button variant="destructive" className="w-full gap-2" onClick={deleteSelected}>
                <Trash2 className="h-4 w-4" /> Удалить узел
              </Button>
            </div>
          )}

          {selectedEdge && selMeta && (
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label>Подпись</Label>
                <Input
                  value={selMeta.label}
                  onChange={(e) => updateSelectedEdge(() => ({ label: e.target.value }))}
                  placeholder="напр. 10G LACP"
                />
              </div>

              <div className="space-y-2">
                <Label>Тип линии</Label>
                <Select value={selMeta.type} onValueChange={(v) => updateSelectedEdge(() => ({ type: v as EdgeKind }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="smoothstep">Скруглённая ломаная</SelectItem>
                    <SelectItem value="step">Прямая ломаная</SelectItem>
                    <SelectItem value="straight">Прямая</SelectItem>
                    <SelectItem value="default">Bezier</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Стрелки</Label>
                <Select value={selMeta.dir} onValueChange={(v) => updateSelectedEdge(() => ({ dir: v as ArrowDir }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Без стрелок</SelectItem>
                    <SelectItem value="forward">→ Однонаправленная</SelectItem>
                    <SelectItem value="backward">← Обратная</SelectItem>
                    <SelectItem value="both">↔ Двусторонняя</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Толщина: {selMeta.width}px</Label>
                <Slider min={1} max={6} step={1} value={[selMeta.width]} onValueChange={(v) => updateSelectedEdge(() => ({ width: v[0] }))} />
              </div>

              <div className="flex items-center justify-between">
                <Label className="m-0">Пунктир</Label>
                <Switch checked={selMeta.dashed} onCheckedChange={(v) => updateSelectedEdge(() => ({ dashed: v }))} />
              </div>

              <div className="flex items-center justify-between">
                <Label className="m-0">Анимация (бегущий пунктир)</Label>
                <Switch checked={selMeta.animated} onCheckedChange={(v) => updateSelectedEdge(() => ({ animated: v }))} />
              </div>

              <div className="flex items-center justify-between">
                <Label className="m-0 flex items-center gap-1.5"><Zap className="h-3.5 w-3.5" /> Поток данных</Label>
                <Switch checked={selMeta.flow} onCheckedChange={(v) => updateSelectedEdge(() => ({ flow: v }))} />
              </div>

              <div className="space-y-2">
                <Label>Цвет</Label>
                <div className="flex gap-2 flex-wrap">
                  {[
                    ["hsl(var(--primary))", "Основной"],
                    ["hsl(var(--success))", "ОК"],
                    ["hsl(var(--warning))", "Внимание"],
                    ["hsl(var(--destructive))", "Авария"],
                    ["hsl(var(--muted-foreground))", "Нейтр."],
                  ].map(([color, name]) => (
                    <button
                      key={color} title={name}
                      onClick={() => updateSelectedEdge(() => ({ color }))}
                      className={cn("h-8 w-8 rounded-md border hover:scale-110 transition-transform",
                        selMeta.color === color && "ring-2 ring-offset-2 ring-offset-background ring-primary")}
                      style={{ background: color }}
                    />
                  ))}
                </div>
              </div>

              <Button variant="destructive" className="w-full gap-2" onClick={deleteSelected}>
                <Trash2 className="h-4 w-4" /> Удалить связь
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default function MapEditor(props: Props) {
  return (
    <ReactFlowProvider>
      <EditorInner {...props} />
    </ReactFlowProvider>
  );
}
