import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface DashboardWidgetRow {
  id: string;
  user_id: string;
  widget_type: string;
  title: string;
  config: { x?: number; y?: number; w?: number; h?: number; hidden?: boolean } & Record<string, unknown>;
  position: number;
}

export interface LayoutItem {
  i: string;          // widget_type key
  x: number;
  y: number;
  w: number;
  h: number;
  hidden?: boolean;
}

export const DEFAULT_WIDGETS: LayoutItem[] = [
  { i: "summary",            x: 0, y: 0,  w: 12, h: 3 },
  { i: "tickets-by-status",  x: 0, y: 3,  w: 4,  h: 7 },
  { i: "tickets-by-priority",x: 4, y: 3,  w: 4,  h: 7 },
  { i: "closed-stats",       x: 8, y: 3,  w: 4,  h: 7 },
  { i: "protocols-by-status",x: 0, y: 10, w: 6,  h: 7 },
  { i: "equipment-by-status",x: 6, y: 10, w: 6,  h: 7 },
  { i: "activity",           x: 0, y: 17, w: 12, h: 7 },
  { i: "recent-tickets",     x: 0, y: 24, w: 12, h: 7 },
];

export const WIDGET_TITLES: Record<string, string> = {
  "summary": "Сводка",
  "tickets-by-status": "Заявки по статусам",
  "tickets-by-priority": "Открытые заявки по приоритету",
  "closed-stats": "Закрытые заявки",
  "protocols-by-status": "Протоколы по статусам",
  "equipment-by-status": "Оборудование по статусу",
  "activity": "Активность за 14 дней",
  "recent-tickets": "Последние заявки",
};

export function useDashboardLayout() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["dashboard-layout", user?.id],
    queryFn: async () => {
      if (!user) return [] as DashboardWidgetRow[];
      const { data } = await supabase
        .from("user_dashboard_widgets")
        .select("*")
        .eq("user_id", user.id)
        .order("position", { ascending: true });
      return (data || []) as unknown as DashboardWidgetRow[];
    },
    enabled: !!user,
  });

  // Merge stored config with defaults
  const rows = query.data ?? [];
  const stored = new Map(rows.map((r) => [r.widget_type, r]));
  const layout: LayoutItem[] = DEFAULT_WIDGETS.map((d) => {
    const r = stored.get(d.i);
    if (!r) return d;
    return {
      i: d.i,
      x: r.config.x ?? d.x,
      y: r.config.y ?? d.y,
      w: r.config.w ?? d.w,
      h: r.config.h ?? d.h,
      hidden: r.config.hidden ?? false,
    };
  });

  const save = useMutation({
    mutationFn: async (items: LayoutItem[]) => {
      if (!user) return;
      // upsert each widget
      const payload = items.map((it, idx) => ({
        user_id: user.id,
        widget_type: it.i,
        title: WIDGET_TITLES[it.i] ?? it.i,
        config: { x: it.x, y: it.y, w: it.w, h: it.h, hidden: it.hidden ?? false },
        position: idx,
      }));
      // Delete then re-insert (simpler than composite upsert without unique key)
      await supabase.from("user_dashboard_widgets").delete().eq("user_id", user.id);
      if (payload.length) await supabase.from("user_dashboard_widgets").insert(payload);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dashboard-layout", user?.id] }),
  });

  const reset = useMutation({
    mutationFn: async () => {
      if (!user) return;
      await supabase.from("user_dashboard_widgets").delete().eq("user_id", user.id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dashboard-layout", user?.id] }),
  });

  return {
    layout,
    isLoading: query.isLoading,
    save: save.mutate,
    reset: reset.mutate,
  };
}