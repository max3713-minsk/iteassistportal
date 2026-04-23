import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { format, subDays } from "date-fns";
import { ru } from "date-fns/locale";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell,
  LineChart, Line, Legend,
} from "recharts";
import {
  Building2, Server, Ticket, ClipboardList, CheckCircle2, Clock, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig,
} from "@/components/ui/chart";
import { supabase } from "@/integrations/supabase/client";

/* ============ Colors / config ============ */
const STATUS_COLORS = [
  "hsl(217 91% 60%)", "hsl(38 92% 50%)", "hsl(262 83% 58%)",
  "hsl(0 72% 51%)", "hsl(142 71% 45%)", "hsl(160 84% 39%)",
];
const PRIORITY_COLORS = ["hsl(0 72% 51%)", "hsl(25 95% 53%)", "hsl(38 92% 50%)", "hsl(217 91% 60%)"];
const EQUIPMENT_STATUS_COLOR_MAP: Record<string, string> = {
  active: "hsl(152 82% 30%)", maintenance: "hsl(38 92% 50%)",
  decommissioned: "hsl(220 9% 46%)", faulty: "hsl(0 72% 51%)",
};
const EQUIPMENT_FALLBACK = "hsl(199 89% 48%)";
const PROTOCOL_COLORS = ["hsl(38 92% 50%)", "hsl(217 91% 60%)", "hsl(160 84% 39%)", "hsl(0 72% 51%)"];
const activityConfig: ChartConfig = {
  tickets: { label: "Заявки", color: "hsl(217 91% 60%)" },
  protocols: { label: "Протоколы", color: "hsl(160 84% 39%)" },
};
const baseConfig: ChartConfig = { count: { label: "Кол-во" } };

/* ============ Wrapper card with drag handle ============ */
function WidgetShell({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="dashboard-drag-handle flex flex-row items-center justify-between pb-2 shrink-0">
        <CardTitle className="text-base">{title}</CardTitle>
        {action}
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">{children}</CardContent>
    </Card>
  );
}

/* ============ Summary tiles ============ */
export function SummaryWidget() {
  const { data: summary } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: async () => {
      const [sites, equipment, openTickets, activeProtocols] = await Promise.all([
        supabase.from("sites").select("*", { count: "exact", head: true }),
        supabase.from("equipment").select("*", { count: "exact", head: true }),
        supabase.from("tickets").select("*", { count: "exact", head: true })
          .in("status", ["open", "in_progress", "waiting", "overdue"]),
        supabase.from("maintenance_protocols").select("*", { count: "exact", head: true })
          .in("status", ["pending", "in_progress"]),
      ]);
      return {
        sites: sites.count ?? 0,
        equipment: equipment.count ?? 0,
        openTickets: openTickets.count ?? 0,
        activeProtocols: activeProtocols.count ?? 0,
      };
    },
  });
  const stats = [
    { label: "ЦОД", value: summary?.sites ?? 0, icon: Building2, color: "text-primary", to: "/sites" },
    { label: "Оборудование", value: summary?.equipment ?? 0, icon: Server, color: "text-accent", to: "/equipment" },
    { label: "Открытые заявки", value: summary?.openTickets ?? 0, icon: Ticket, color: "text-destructive", to: "/tickets" },
    { label: "Активные протоколы", value: summary?.activeProtocols ?? 0, icon: ClipboardList, color: "text-primary", to: "/protocols" },
  ];
  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="dashboard-drag-handle pb-2 shrink-0">
        <CardTitle className="text-base">Сводка</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <Link key={s.label} to={s.to} className="block">
            <div className="rounded-lg border p-3 hover:border-primary/40 hover:shadow-md transition-all h-full">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{s.label}</span>
                <s.icon className={cn("h-4 w-4", s.color)} />
              </div>
              <div className="text-2xl font-heading font-bold mt-1">{s.value}</div>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

/* ============ Tickets by status ============ */
export function TicketsByStatusWidget() {
  const { data } = useQuery({
    queryKey: ["dashboard-tickets-status"],
    queryFn: async () => {
      const { data } = await supabase.from("tickets").select("status");
      const counts: Record<string, number> = {};
      (data ?? []).forEach((t) => { counts[t.status] = (counts[t.status] || 0) + 1; });
      const labels: Record<string, string> = {
        open: "Открыта", in_progress: "В работе", waiting: "Ожидание",
        overdue: "Просрочена", resolved: "Решена", closed: "Закрыта",
      };
      return Object.entries(labels).map(([key, label]) => ({ status: key, label, count: counts[key] || 0 }));
    },
  });
  return (
    <WidgetShell title="Заявки по статусам">
      {data && data.some((d) => d.count > 0) ? (
        <ChartContainer config={baseConfig} className="h-full w-full">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {data.map((_, i) => <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ChartContainer>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-10">Нет данных</p>
      )}
    </WidgetShell>
  );
}

/* ============ Tickets by priority ============ */
export function TicketsByPriorityWidget() {
  const { data } = useQuery({
    queryKey: ["dashboard-tickets-priority"],
    queryFn: async () => {
      const { data } = await supabase.from("tickets").select("priority")
        .in("status", ["open", "in_progress", "waiting", "overdue"]);
      const counts: Record<string, number> = {};
      (data ?? []).forEach((t) => { counts[t.priority] = (counts[t.priority] || 0) + 1; });
      return ["P1", "P2", "P3", "P4"].map((p) => ({ priority: p, count: counts[p] || 0 }));
    },
  });
  return (
    <WidgetShell title="Открытые заявки по приоритету">
      {data ? (
        <ChartContainer config={baseConfig} className="h-full w-full">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="priority" />} />
            <Pie data={data} dataKey="count" nameKey="priority" cx="50%" cy="45%" outerRadius={70} label={false}>
              {data.map((_, i) => <Cell key={i} fill={PRIORITY_COLORS[i]} />)}
            </Pie>
            <Legend
              payload={["P1 — Критический", "P2 — Высокий", "P3 — Средний", "P4 — Низкий"].map((label, i) => ({
                value: label, type: "circle" as const, color: PRIORITY_COLORS[i],
              }))}
              wrapperStyle={{ fontSize: 11 }}
            />
          </PieChart>
        </ChartContainer>
      ) : (<p className="text-sm text-muted-foreground text-center py-10">Нет открытых заявок</p>)}
    </WidgetShell>
  );
}

/* ============ Closed tickets stats ============ */
export function ClosedStatsWidget() {
  const { data } = useQuery({
    queryKey: ["dashboard-closed-tickets-stats"],
    queryFn: async () => {
      const { data } = await supabase.from("tickets")
        .select("id, priority, created_at, first_response_at, resolved_at")
        .in("status", ["resolved", "closed"]);
      const rows = data ?? [];
      const byPriority: Record<string, number> = { P1: 0, P2: 0, P3: 0, P4: 0 };
      let sum = 0, cnt = 0;
      rows.forEach((t) => {
        byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;
        if (t.first_response_at) {
          const diff = new Date(t.first_response_at).getTime() - new Date(t.created_at).getTime();
          if (diff > 0) { sum += diff; cnt++; }
        }
      });
      return { total: rows.length, byPriority, avgResponseMs: cnt ? sum / cnt : null };
    },
  });

  function formatDuration(ms: number) {
    const min = Math.round(ms / 60000);
    if (min < 60) return `${min} мин`;
    const h = Math.floor(min / 60);
    if (h < 24) return `${h} ч ${min % 60 ? `${min % 60} мин` : ""}`.trim();
    const d = Math.floor(h / 24);
    return `${d} д ${h % 24 ? `${h % 24} ч` : ""}`.trim();
  }

  return (
    <WidgetShell title="Закрытые заявки">
      <div className="space-y-4">
        <div>
          <p className="text-xs text-muted-foreground">Всего закрыто</p>
          <p className="text-3xl font-heading font-bold flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-success" />
            {data?.total ?? 0}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Среднее время первого реагирования</p>
          <p className="text-base font-heading font-semibold">
            {data?.avgResponseMs ? (
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-muted-foreground" />
                {formatDuration(data.avgResponseMs)}
              </span>
            ) : <span className="text-muted-foreground text-sm">Нет данных</span>}
          </p>
        </div>
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground mb-2">По приоритетам</p>
          <div className="space-y-1">
            {["P1", "P2", "P3", "P4"].map((p, i) => (
              <div key={p} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PRIORITY_COLORS[i] }} />
                  <span className="text-muted-foreground">
                    {p === "P1" ? "Критический" : p === "P2" ? "Высокий" : p === "P3" ? "Средний" : "Низкий"}
                  </span>
                </div>
                <span className="font-medium">{data?.byPriority[p] ?? 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </WidgetShell>
  );
}

/* ============ Protocols by status ============ */
export function ProtocolsByStatusWidget() {
  const { data } = useQuery({
    queryKey: ["dashboard-protocols-status"],
    queryFn: async () => {
      const { data } = await supabase.from("maintenance_protocols").select("status");
      const counts: Record<string, number> = {};
      (data ?? []).forEach((p) => { counts[p.status] = (counts[p.status] || 0) + 1; });
      const labels: Record<string, string> = {
        pending: "Ожидает", in_progress: "В работе", completed: "Завершён", overdue: "Просрочен",
      };
      return Object.entries(labels).map(([key, label]) => ({ status: key, label, count: counts[key] || 0 }));
    },
  });
  return (
    <WidgetShell title="Протоколы по статусам">
      {data && data.some((d) => d.count > 0) ? (
        <ChartContainer config={baseConfig} className="h-full w-full">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {data.map((_, i) => <Cell key={i} fill={PROTOCOL_COLORS[i % PROTOCOL_COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ChartContainer>
      ) : (<p className="text-sm text-muted-foreground text-center py-10">Нет данных</p>)}
    </WidgetShell>
  );
}

/* ============ Equipment by status ============ */
export function EquipmentByStatusWidget() {
  const { data } = useQuery({
    queryKey: ["dashboard-equipment-status"],
    queryFn: async () => {
      const { data } = await supabase.from("equipment").select("status");
      const counts: Record<string, number> = {};
      (data ?? []).forEach((e) => { const s = e.status || "active"; counts[s] = (counts[s] || 0) + 1; });
      const labels: Record<string, string> = {
        active: "Активно", maintenance: "На обслуживании",
        decommissioned: "Выведено", faulty: "Неисправно",
      };
      const all = [...new Set([...Object.keys(labels), ...Object.keys(counts)])];
      return all.map((status) => ({ status, label: labels[status] || status, count: counts[status] || 0 }));
    },
  });
  return (
    <WidgetShell title="Оборудование по статусу">
      {data ? (
        <ChartContainer config={baseConfig} className="h-full w-full">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="label" />} />
            <Pie data={data} dataKey="count" nameKey="label" cx="50%" cy="45%" outerRadius={70}
              label={({ label, count }) => (count > 0 ? `${label}: ${count}` : "")}>
              {data.map((item, i) => (
                <Cell key={i} fill={EQUIPMENT_STATUS_COLOR_MAP[item.status] ?? EQUIPMENT_FALLBACK} />
              ))}
            </Pie>
            <Legend
              payload={data.map((item) => ({
                value: item.label, type: "circle" as const,
                color: EQUIPMENT_STATUS_COLOR_MAP[item.status] ?? EQUIPMENT_FALLBACK,
              }))}
              wrapperStyle={{ fontSize: 11 }}
            />
          </PieChart>
        </ChartContainer>
      ) : (<p className="text-sm text-muted-foreground text-center py-10">Нет данных</p>)}
    </WidgetShell>
  );
}

/* ============ Activity ============ */
export function ActivityWidget() {
  const { data } = useQuery({
    queryKey: ["dashboard-activity"],
    queryFn: async () => {
      const since = subDays(new Date(), 13);
      const [t, p] = await Promise.all([
        supabase.from("tickets").select("created_at").gte("created_at", since.toISOString()),
        supabase.from("maintenance_protocols").select("created_at").gte("created_at", since.toISOString()),
      ]);
      const days: Record<string, { tickets: number; protocols: number }> = {};
      for (let i = 0; i < 14; i++) {
        const d = format(subDays(new Date(), 13 - i), "yyyy-MM-dd");
        days[d] = { tickets: 0, protocols: 0 };
      }
      (t.data ?? []).forEach((x) => { const d = format(new Date(x.created_at), "yyyy-MM-dd"); if (days[d]) days[d].tickets++; });
      (p.data ?? []).forEach((x) => { const d = format(new Date(x.created_at), "yyyy-MM-dd"); if (days[d]) days[d].protocols++; });
      return Object.entries(days).map(([date, v]) => ({
        date, label: format(new Date(date), "dd MMM", { locale: ru }),
        tickets: v.tickets, protocols: v.protocols,
      }));
    },
  });
  return (
    <WidgetShell title="Активность за 14 дней">
      {data && data.some((d) => d.tickets > 0 || d.protocols > 0) ? (
        <ChartContainer config={activityConfig} className="h-full w-full">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line type="monotone" dataKey="tickets" stroke="hsl(217 91% 60%)" strokeWidth={2} dot={{ r: 3 }} name="Заявки" />
            <Line type="monotone" dataKey="protocols" stroke="hsl(160 84% 39%)" strokeWidth={2} dot={{ r: 3 }} name="Протоколы" />
          </LineChart>
        </ChartContainer>
      ) : (<p className="text-sm text-muted-foreground text-center py-10">Нет активности</p>)}
    </WidgetShell>
  );
}

/* ============ Recent tickets ============ */
export function RecentTicketsWidget() {
  const { data } = useQuery({
    queryKey: ["dashboard-recent-tickets"],
    queryFn: async () => {
      const { data } = await supabase.from("tickets")
        .select("id, title, status, priority, created_at, site_id, sites(name)")
        .order("created_at", { ascending: false }).limit(8);
      return data ?? [];
    },
  });
  const priorityVariant: Record<string, "destructive" | "default" | "secondary" | "outline"> = {
    P1: "destructive", P2: "default", P3: "secondary", P4: "outline",
  };
  const statusLabels: Record<string, string> = {
    open: "Открыта", in_progress: "В работе", waiting: "Ожидание",
    overdue: "Просрочена", resolved: "Решена", closed: "Закрыта",
  };
  return (
    <WidgetShell
      title="Последние заявки"
      action={
        <Link to="/tickets" className="text-sm text-primary hover:underline flex items-center gap-1">
          Все <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      }
    >
      {data && data.length > 0 ? (
        <div className="space-y-2">
          {data.map((t) => (
            <Link key={t.id} to={`/tickets?id=${t.id}`}
              className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted/50 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{t.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {(t as { sites?: { name?: string } }).sites?.name ?? "—"} · {format(new Date(t.created_at), "dd MMM", { locale: ru })}
                </p>
              </div>
              <div className="flex items-center gap-1.5 ml-2 shrink-0">
                <Badge variant={priorityVariant[t.priority] ?? "outline"} className="text-xs">{t.priority}</Badge>
                <Badge variant="outline" className="text-xs">{statusLabels[t.status] ?? t.status}</Badge>
              </div>
            </Link>
          ))}
        </div>
      ) : (<p className="text-sm text-muted-foreground text-center py-10">Нет заявок</p>)}
    </WidgetShell>
  );
}

/* ============ Registry ============ */
export const WIDGET_COMPONENTS: Record<string, () => JSX.Element> = {
  "summary": SummaryWidget,
  "tickets-by-status": TicketsByStatusWidget,
  "tickets-by-priority": TicketsByPriorityWidget,
  "closed-stats": ClosedStatsWidget,
  "protocols-by-status": ProtocolsByStatusWidget,
  "equipment-by-status": EquipmentByStatusWidget,
  "activity": ActivityWidget,
  "recent-tickets": RecentTicketsWidget,
};