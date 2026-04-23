import { useState, useMemo } from "react";
import { Responsive, WidthProvider, type Layout } from "react-grid-layout";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Lock, Unlock, RotateCcw, LayoutGrid, Eye, EyeOff } from "lucide-react";
import { useDashboardLayout, WIDGET_TITLES, type LayoutItem } from "@/hooks/useDashboardLayout";
import { WIDGET_COMPONENTS } from "@/components/dashboard/widgets";

const ResponsiveGridLayout = WidthProvider(Responsive);

export default function Dashboard() {
  const { layout, save, reset } = useDashboardLayout();
  const [editMode, setEditMode] = useState(false);

  const visible = useMemo(() => layout.filter((w) => !w.hidden), [layout]);

  function handleLayoutChange(next: Layout[]) {
    if (!editMode) return;
    const map = new Map(next.map((n) => [n.i, n]));
    const merged: LayoutItem[] = layout.map((w) => {
      const n = map.get(w.i);
      if (!n || w.hidden) return w;
      return { ...w, x: n.x, y: n.y, w: n.w, h: n.h };
    });
    save(merged);
  }

  function toggleHidden(key: string) {
    const next = layout.map((w) => w.i === key ? { ...w, hidden: !w.hidden } : w);
    save(next);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Панель управления</h1>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <LayoutGrid className="h-4 w-4 mr-1.5" />
                Виджеты
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 bg-background z-50">
              <DropdownMenuLabel>Видимость виджетов</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {layout.map((w) => (
                <DropdownMenuCheckboxItem
                  key={w.i}
                  checked={!w.hidden}
                  onCheckedChange={() => toggleHidden(w.i)}
                  onSelect={(e) => e.preventDefault()}
                >
                  {w.hidden ? <EyeOff className="h-3.5 w-3.5 mr-2 text-muted-foreground" /> : <Eye className="h-3.5 w-3.5 mr-2" />}
                  {WIDGET_TITLES[w.i] ?? w.i}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => reset()}>
                <RotateCcw className="h-3.5 w-3.5 mr-2" />
                Сбросить раскладку
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

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
          Перетащите виджеты за заголовок и измените их размер за правый нижний угол. Нажмите «Готово» для сохранения.
        </p>
      )}

      <ResponsiveGridLayout
        className={editMode ? "dashboard-edit" : ""}
        layouts={{ lg: visible, md: visible, sm: visible, xs: visible, xxs: visible }}
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
        {visible.map((w) => {
          const Comp = WIDGET_COMPONENTS[w.i];
          if (!Comp) return null;
          return (
            <div key={w.i} data-grid={w}>
              <Comp />
            </div>
          );
        })}
      </ResponsiveGridLayout>
    </div>
  );
}