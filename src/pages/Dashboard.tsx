import { useMemo, useState } from "react";
import { Responsive, WidthProvider, type Layout } from "react-grid-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
  DropdownMenuRadioGroup, DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import {
  Lock, Unlock, RotateCcw, Plus, Trash2, BarChart3, MoreVertical,
} from "lucide-react";
import { useDashboardLayout, type WidgetInstance } from "@/hooks/useDashboardLayout";
import {
  WIDGET_REGISTRY, CHART_TYPE_LABELS, type ChartType,
} from "@/components/dashboard/widgets";

const ResponsiveGridLayout = WidthProvider(Responsive);

export default function Dashboard() {
  const { layout, save, reset, addWidget, removeWidget, setChartType } = useDashboardLayout();
  const [editMode, setEditMode] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);

  const presentTypes = useMemo(() => new Set(layout.map((w) => w.type)), [layout]);

  function handleLayoutChange(next: Layout[]) {
    if (!editMode) return;
    const map = new Map(next.map((n) => [n.i, n]));
    const merged = layout.map((w) => {
      const n = map.get(w.id);
      return n ? { ...w, x: n.x, y: n.y, w: n.w, h: n.h } : w;
    });
    save(merged);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="font-heading text-2xl font-bold">Панель управления</h1>
          <p className="text-xs text-muted-foreground">
            Единая территория для виджетов: оперативные данные, мониторинг и аналитика. Раскладка сохраняется индивидуально для каждого пользователя.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={libraryOpen} onOpenChange={setLibraryOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1.5" />
                Библиотека виджетов
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Добавить виджет</DialogTitle>
                <DialogDescription>
                  Выберите виджет из библиотеки. Можно добавлять один и тот же виджет несколько раз с разной визуализацией.
                </DialogDescription>
              </DialogHeader>
              <WidgetLibrary
                onAdd={(type) => { addWidget(type); setLibraryOpen(false); setEditMode(true); }}
                presentTypes={presentTypes}
              />
            </DialogContent>
          </Dialog>

          <Button variant="outline" size="sm" onClick={() => reset()}>
            <RotateCcw className="h-4 w-4 mr-1.5" />
            Сбросить
          </Button>

          <Button
            variant={editMode ? "default" : "outline"}
            size="sm"
            onClick={() => setEditMode((v) => !v)}
          >
            {editMode ? <Unlock className="h-4 w-4 mr-1.5" /> : <Lock className="h-4 w-4 mr-1.5" />}
            {editMode ? "Готово" : "Настроить"}
          </Button>
        </div>
      </div>

      {editMode && (
        <p className="text-xs text-muted-foreground">
          Перетащите виджеты за заголовок и измените их размер за правый нижний угол.
          Меню «⋯» в правом верхнем углу каждого виджета — выбор визуализации и удаление.
        </p>
      )}

      {layout.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center space-y-3">
          <BarChart3 className="h-10 w-10 mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">На панели нет виджетов</p>
          <Button onClick={() => setLibraryOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Добавить из библиотеки
          </Button>
        </div>
      ) : (
        <ResponsiveGridLayout
          className={editMode ? "dashboard-edit" : ""}
          layouts={{ lg: layoutToGrid(layout), md: layoutToGrid(layout), sm: layoutToGrid(layout), xs: layoutToGrid(layout), xxs: layoutToGrid(layout) }}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 12, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={40}
          margin={[16, 16]}
          containerPadding={[0, 0]}
          isDraggable={editMode}
          isResizable={editMode}
          draggableHandle=".dashboard-drag-handle"
          onLayoutChange={handleLayoutChange}
          compactType="vertical"
        >
          {layout.map((w) => {
            const meta = WIDGET_REGISTRY[w.type];
            if (!meta) return <div key={w.id} />;
            const Comp = meta.Component;
            return (
              <div key={w.id} data-grid={{ i: w.id, x: w.x, y: w.y, w: w.w, h: w.h, minW: meta.minW, minH: meta.minH }}
                   className="relative group">
                <Comp chartType={w.chartType ?? meta.defaultChart} />
                <WidgetMenu
                  instance={w}
                  onChartChange={(t) => setChartType(w.id, t)}
                  onRemove={() => removeWidget(w.id)}
                />
              </div>
            );
          })}
        </ResponsiveGridLayout>
      )}
    </div>
  );
}

function layoutToGrid(items: WidgetInstance[]): Layout[] {
  return items.map((w) => {
    const meta = WIDGET_REGISTRY[w.type];
    return { i: w.id, x: w.x, y: w.y, w: w.w, h: w.h, minW: meta?.minW, minH: meta?.minH };
  });
}

/* ============ Per-widget menu ============ */
function WidgetMenu({ instance, onChartChange, onRemove }: {
  instance: WidgetInstance;
  onChartChange: (t: ChartType) => void;
  onRemove: () => void;
}) {
  const meta = WIDGET_REGISTRY[instance.type];
  const supports = meta?.supportedCharts ?? [];
  return (
    <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" className="h-7 w-7 bg-background/80 backdrop-blur border">
            <MoreVertical className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 bg-popover z-50">
          {supports.length > 0 && (
            <>
              <DropdownMenuLabel className="text-xs">Визуализация</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={instance.chartType ?? meta?.defaultChart ?? supports[0]}
                onValueChange={(v) => onChartChange(v as ChartType)}
              >
                {supports.map((t) => (
                  <DropdownMenuRadioItem key={t} value={t} className="text-sm">
                    {CHART_TYPE_LABELS[t]}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem onClick={onRemove} className="text-destructive">
            <Trash2 className="h-3.5 w-3.5 mr-2" />
            Удалить виджет
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/* ============ Library dialog ============ */
function WidgetLibrary({ onAdd, presentTypes }: {
  onAdd: (type: string) => void;
  presentTypes: Set<string>;
}) {
  const grouped = useMemo(() => {
    const g: Record<string, typeof WIDGET_REGISTRY[string][]> = {};
    Object.values(WIDGET_REGISTRY).forEach((m) => { (g[m.category] ||= []).push(m); });
    return g;
  }, []);
  return (
    <div className="space-y-5">
      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat}>
          <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">{cat}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {items.map((m) => {
              const Icon = m.icon;
              const present = presentTypes.has(m.type);
              return (
                <button
                  key={m.type}
                  onClick={() => onAdd(m.type)}
                  className="text-left rounded-lg border p-3 hover:border-primary/40 hover:bg-muted/40 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-md bg-muted p-2 shrink-0">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{m.title}</p>
                        {present && <Badge variant="secondary" className="text-[10px]">уже на панели</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{m.description}</p>
                      {m.supportedCharts && (
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Виды: {m.supportedCharts.map((t) => CHART_TYPE_LABELS[t]).join(" · ")}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
