import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { WIDGET_REGISTRY, type ChartType } from "@/components/dashboard/widgets";

export interface WidgetInstance {
  id: string;          // db row id, used as react-grid-layout key
  type: string;        // widget_type, key in WIDGET_REGISTRY
  x: number; y: number; w: number; h: number;
  chartType?: ChartType;
  config?: Record<string, unknown>;
}

interface DbRow {
  id: string;
  user_id: string;
  widget_type: string;
  title: string;
  config: { x?: number; y?: number; w?: number; h?: number; chartType?: ChartType; extra?: Record<string, unknown> } & Record<string, unknown>;
  position: number;
}

const DEFAULT_TYPES: Array<{ type: string; x: number; y: number; w: number; h: number; chartType?: ChartType }> = [
  { type: "summary",             x: 0,  y: 0,  w: 12, h: 3 },
  { type: "tickets-by-status",   x: 0,  y: 3,  w: 4,  h: 7, chartType: "bar" },
  { type: "tickets-by-priority", x: 4,  y: 3,  w: 4,  h: 7, chartType: "donut" },
  { type: "closed-stats",        x: 8,  y: 3,  w: 4,  h: 7 },
  { type: "monitoring-hosts",    x: 0,  y: 10, w: 6,  h: 7, chartType: "donut" },
  { type: "monitoring-events",   x: 6,  y: 10, w: 6,  h: 7 },
  { type: "protocols-by-status", x: 0,  y: 17, w: 6,  h: 7, chartType: "bar" },
  { type: "equipment-by-status", x: 6,  y: 17, w: 6,  h: 7, chartType: "donut" },
  { type: "activity",            x: 0,  y: 24, w: 12, h: 7, chartType: "line" },
  { type: "recent-tickets",      x: 0,  y: 31, w: 12, h: 7 },
];

export function useDashboardLayout() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["dashboard-layout", user?.id],
    queryFn: async () => {
      if (!user) return [] as WidgetInstance[];
      const { data } = await supabase
        .from("user_dashboard_widgets")
        .select("*")
        .eq("user_id", user.id)
        .order("position", { ascending: true });
      const rows = (data || []) as unknown as DbRow[];
      if (rows.length === 0) {
        // initialise defaults locally (persisted on first save)
        return DEFAULT_TYPES.map((d, i) => ({
          id: `default-${i}-${d.type}`, type: d.type, x: d.x, y: d.y, w: d.w, h: d.h, chartType: d.chartType,
        })) as WidgetInstance[];
      }
      return rows.map((r) => ({
        id: r.id,
        type: r.widget_type,
        x: r.config.x ?? 0,
        y: r.config.y ?? 0,
        w: r.config.w ?? WIDGET_REGISTRY[r.widget_type]?.defaultW ?? 4,
        h: r.config.h ?? WIDGET_REGISTRY[r.widget_type]?.defaultH ?? 6,
        chartType: r.config.chartType,
        config: (r.config.extra as Record<string, unknown>) ?? {},
      })) as WidgetInstance[];
    },
    enabled: !!user,
  });

  const layout = query.data ?? [];

  async function persist(items: WidgetInstance[]) {
    if (!user) return;
    await supabase.from("user_dashboard_widgets").delete().eq("user_id", user.id);
    if (!items.length) return;
    const payload = items.map((it, idx) => ({
      user_id: user.id,
      widget_type: it.type,
      title: WIDGET_REGISTRY[it.type]?.title ?? it.type,
      config: { x: it.x, y: it.y, w: it.w, h: it.h, chartType: it.chartType ?? null, extra: (it.config ?? {}) as Record<string, unknown> } as unknown as never,
      position: idx,
    }));
    await supabase.from("user_dashboard_widgets").insert(payload);
  }

  const save = useMutation({
    mutationFn: persist,
    onMutate: async (items) => {
      await qc.cancelQueries({ queryKey: ["dashboard-layout", user?.id] });
      const prev = qc.getQueryData(["dashboard-layout", user?.id]);
      qc.setQueryData(["dashboard-layout", user?.id], items);
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["dashboard-layout", user?.id], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["dashboard-layout", user?.id] }),
  });

  const reset = useMutation({
    mutationFn: async () => {
      if (!user) return;
      await supabase.from("user_dashboard_widgets").delete().eq("user_id", user.id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dashboard-layout", user?.id] }),
  });

  function addWidget(type: string, initialConfig?: Record<string, unknown>) {
    const meta = WIDGET_REGISTRY[type];
    if (!meta) return;
    // find lowest free y
    const maxY = layout.reduce((m, w) => Math.max(m, w.y + w.h), 0);
    const next: WidgetInstance = {
      id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type, x: 0, y: maxY,
      w: meta.defaultW, h: meta.defaultH,
      chartType: meta.defaultChart,
      config: initialConfig ?? {},
    };
    save.mutate([...layout, next]);
  }

  function removeWidget(id: string) {
    save.mutate(layout.filter((w) => w.id !== id));
  }

  function setChartType(id: string, chartType: ChartType) {
    save.mutate(layout.map((w) => (w.id === id ? { ...w, chartType } : w)));
  }

  function setWidgetConfig(id: string, config: Record<string, unknown>) {
    save.mutate(layout.map((w) => (w.id === id ? { ...w, config: { ...(w.config ?? {}), ...config } } : w)));
  }

  return {
    layout,
    isLoading: query.isLoading,
    save: save.mutate,
    reset: reset.mutate,
    addWidget,
    removeWidget,
    setChartType,
    setWidgetConfig,
  };
}
