import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow, ReactFlowProvider, Background, BackgroundVariant, Controls, MiniMap,
  addEdge, useEdgesState, useNodesState, MarkerType, ConnectionMode,
  type Connection, type Edge, type Node, type ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { DeviceNode, DeviceNodeData } from "./DeviceNode";
import { NODE_LIBRARY, NodeKind, NODE_INFO } from "./nodeTypes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Save, Trash2, Undo2, Redo2, Plus } from "lucide-react";
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

function EditorInner({ initial, readOnly, onSave, saving }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);
  const [selected, setSelected] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [rfi, setRfi] = useState<ReactFlowInstance | null>(null);

  // Keep selected node fresh when nodes update
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
            style: { stroke: "hsl(var(--primary))", strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: "hsl(var(--primary))" },
            data: { label: "" },
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
        position: { x: center.x + Math.random() * 60 - 30, y: center.y + Math.random() * 60 - 30 },
        data: { label: info.label, kind, status: "unknown" } as DeviceNodeData,
        ...(kind === "zone" ? { zIndex: -1, draggable: true, selectable: true } : {}),
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

  const updateSelected = (patch: Partial<DeviceNodeData>) => {
    if (!selected) return;
    setNodes((ns) =>
      ns.map((n) => (n.id === selected.id ? { ...n, data: { ...(n.data as any), ...patch } } : n)),
    );
  };

  const updateSelectedEdge = (patch: { label?: string; animated?: boolean; style?: any }) => {
    if (!selectedEdge) return;
    setEdges((es) =>
      es.map((e) =>
        e.id === selectedEdge.id
          ? {
              ...e,
              ...(patch.animated !== undefined ? { animated: patch.animated } : {}),
              ...(patch.style ? { style: { ...e.style, ...patch.style } } : {}),
              ...(patch.label !== undefined
                ? { label: patch.label, labelBgPadding: [6, 3] as [number, number], labelBgBorderRadius: 6, labelBgStyle: { fill: "hsl(var(--background))", fillOpacity: 0.85 }, labelStyle: { fill: "hsl(var(--foreground))", fontSize: 11, fontWeight: 500 } }
                : {}),
            }
          : e,
      ),
    );
    setSelectedEdge((se) => (se ? { ...se, ...(patch.label !== undefined ? { label: patch.label } : {}) } : se));
  };

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

  const sel = (selected?.data as unknown as DeviceNodeData) ?? null;

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
                  <span
                    className="h-8 w-8 rounded-md flex items-center justify-center"
                    style={{ background: `hsl(${it.accent} / 0.15)`, color: `hsl(${it.accent})` }}
                  >
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
          fitView
          proOptions={{ hideAttribution: true }}
          deleteKeyCode={readOnly ? null : ["Backspace", "Delete"]}
          nodesDraggable={!readOnly}
          nodesConnectable={!readOnly}
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
          <div className="absolute top-3 right-3 flex items-center gap-2 bg-card/90 backdrop-blur border rounded-lg px-2 py-1.5 shadow-lg">
            <Button size="sm" onClick={handleSave} disabled={saving} className="gap-2">
              <Save className="h-4 w-4" /> {saving ? "Сохранение..." : "Сохранить"}
            </Button>
          </div>
        )}
      </div>

      {/* Inspector */}
      <Sheet open={!!selected || !!selectedEdge} onOpenChange={(o) => { if (!o) { setSelected(null); setSelectedEdge(null); } }}>
        <SheetContent side="right" className="w-[360px] sm:max-w-[360px]">
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
              <div className="space-y-2">
                <Label>Статус</Label>
                <Select value={sel.status ?? "unknown"} onValueChange={(v) => updateSelected({ status: v as any })}>
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

          {selectedEdge && (
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label>Подпись</Label>
                <Input
                  value={(selectedEdge.label as string) ?? ""}
                  onChange={(e) => updateSelectedEdge({ label: e.target.value })}
                  placeholder="напр. 10G LACP"
                />
              </div>
              <div className="space-y-2">
                <Label>Стиль линии</Label>
                <Select
                  value={selectedEdge.animated ? "animated" : "solid"}
                  onValueChange={(v) => updateSelectedEdge({ animated: v === "animated" })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solid">Сплошная</SelectItem>
                    <SelectItem value="animated">Анимированная (поток)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Цвет</Label>
                <div className="flex gap-2">
                  {[
                    ["hsl(var(--primary))", "Основной"],
                    ["hsl(var(--success))", "ОК"],
                    ["hsl(var(--warning))", "Внимание"],
                    ["hsl(var(--destructive))", "Авария"],
                    ["hsl(var(--muted-foreground))", "Нейтр."],
                  ].map(([color, name]) => (
                    <button
                      key={color}
                      title={name}
                      onClick={() => updateSelectedEdge({ style: { stroke: color, strokeWidth: 2 } })}
                      className="h-8 w-8 rounded-md border hover:scale-110 transition-transform"
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
