import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { format, subDays } from "date-fns";
import { ru } from "date-fns/locale";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell,
  LineChart, Line, Legend, AreaChart, Area, RadialBarChart, RadialBar,
} from "recharts";
import {
  Building2, Server, Ticket, ClipboardList, CheckCircle2, Clock, ExternalLink,
  Star, Activity, AlertTriangle, ShieldCheck, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig,
} from "@/components/ui/chart";
import { supabase } from "@/integrations/supabase/client";
import FavoriteMetricsWidget from "@/components/monitoring/FavoriteMetricsWidget";

/* ============ Types ============ */
export type ChartType = "bar" | "pie" | "donut" | "line" | "area" | "radial" | "list";

export interface WidgetMeta {
  type: string;
  title: string;
  description: string;
  category: "Заявки" | "Протоколы" | "Оборудование" | "Мониторинг" | "Сводка";
  icon: LucideIcon;
  defaultW: number;
  defaultH: number;
  minW: number;
  minH: number;
  supportedCharts?: ChartType[]; // если не задан — визуализация фиксирована
  defaultChart?: ChartType;
  Component: React.FC<{ chartType?: ChartType }>;
}

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

/* ============ Wrapper ============ */
function WidgetShell({ title, action, children, icon: Icon }: {
  title: string; action?: React.ReactNode; children: React.ReactNode; icon?: LucideIcon;
}) {
  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="dashboard-drag-handle flex flex-row items-center justify-between pb-2 shrink-0 cursor-move">
        <CardTitle className="text-base flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
          {title}
        </CardTitle>
        {action}
      </CardHeader>
      <CardContent className="flex-1 overflow-auto" onMouseDown={(e) => e.stopPropagation()}>{children}</CardContent>
    </Card>
  );
}

/* ============ Generic categorical renderer ============ */
function CategoricalChart({ data, colors, chartType = "bar" }: {
  data: Array<{ label: string; count: number }>;
  colors: string[];
  chartType?: ChartType;
}) {
  if (!data?.some((d) => d.count > 0)) {
    return <p className="text-sm text-muted-foreground text-center py-10">Нет данных</p>;
  }
  if (chartType === "list") {
    const total = data.reduce((s, d) => s + d.count, 0);
    return (
      <div className="space-y-2">
        {data.map((d, i) => (
          <div key={d.label} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
                {d.label}
              </span>
              <span className="font-medium tabular-nums">{d.count}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${total ? (d.count / total) * 100 : 0}%`, background: colors[i % colors.length] }} />
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <ChartContainer config={baseConfig} className="h-full w-full">
      {chartType === "pie" || chartType === "donut" ? (
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent nameKey="label" />} />
          <Pie data={data} dataKey="count" nameKey="label" cx="50%" cy="45%"
               outerRadius={75} innerRadius={chartType === "donut" ? 40 : 0}
               label={({ count }) => (count > 0 ? count : "")}>
            {data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
          </Pie>
          <Legend payload={data.map((d, i) => ({ value: d.label, type: "circle" as const, color: colors[i % colors.length] }))}
                  wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      ) : chartType === "radial" ? (
        <RadialBarChart innerRadius="20%" outerRadius="100%" data={data} startAngle={90} endAngle={-270}>
          <RadialBar dataKey="count" background>
            {data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
          </RadialBar>
          <Legend iconSize={8} payload={data.map((d, i) => ({ value: `${d.label} (${d.count})`, type: "circle" as const, color: colors[i % colors.length] }))}
                  wrapperStyle={{ fontSize: 11 }} />
        </RadialBarChart>
      ) : chartType === "area" ? (
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Area type="monotone" dataKey="count" stroke={colors[0]} fill={colors[0]} fillOpacity={0.3} />
        </AreaChart>
      ) : chartType === "line" ? (
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Line type="monotone" dataKey="count" stroke={colors[0]} strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      ) : (
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
          </Bar>
        </BarChart>
      )}
    </ChartContainer>
  );
}

/* ============ Summary tiles ============ */
const SummaryWidget: WidgetMeta["Component"] = () => {
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
      <CardHeader className="dashboard-drag-handle pb-2 shrink-0 cursor-move">
        <CardTitle className="text-base">Сводка</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-3" onMouseDown={(e) => e.stopPropagation()}>
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
};

/* ============ Tickets by status ============ */
const TicketsByStatusWidget: WidgetMeta["Component"] = ({ chartType }) => {
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
    <WidgetShell title="Заявки по статусам" icon={Ticket}>
      <CategoricalChart data={data ?? []} colors={STATUS_COLORS} chartType={chartType ?? "bar"} />
    </WidgetShell>
  );
};

/* ============ Tickets by priority ============ */
const TicketsByPriorityWidget: WidgetMeta["Component"] = ({ chartType }) => {
  const { data } = useQuery({
    queryKey: ["dashboard-tickets-priority"],
    queryFn: async () => {
      const { data } = await supabase.from("tickets").select("priority")
        .in("status", ["open", "in_progress", "waiting", "overdue"]);
      const counts: Record<string, number> = {};
      (data ?? []).forEach((t) => { counts[t.priority] = (counts[t.priority] || 0) + 1; });
      const labelMap: Record<string, string> = { P1: "P1 — Критический", P2: "P2 — Высокий", P3: "P3 — Средний", P4: "P4 — Низкий" };
      return ["P1", "P2", "P3", "P4"].map((p) => ({ status: p, label: labelMap[p], count: counts[p] || 0 }));
    },
  });
  return (
    <WidgetShell title="Открытые заявки по приоритету" icon={AlertTriangle}>
      <CategoricalChart data={data ?? []} colors={PRIORITY_COLORS} chartType={chartType ?? "donut"} />
    </WidgetShell>
  );
};

/* ============ Closed tickets stats ============ */
const ClosedStatsWidget: WidgetMeta["Component"] = () => {
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
    <WidgetShell title="Закрытые заявки" icon={CheckCircle2}>
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
};

/* ============ Protocols by status ============ */
const ProtocolsByStatusWidget: WidgetMeta["Component"] = ({ chartType }) => {
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
    <WidgetShell title="Протоколы по статусам" icon={ClipboardList}>
      <CategoricalChart data={data ?? []} colors={PROTOCOL_COLORS} chartType={chartType ?? "bar"} />
    </WidgetShell>
  );
};

/* ============ Equipment by status ============ */
const EquipmentByStatusWidget: WidgetMeta["Component"] = ({ chartType }) => {
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
  const colors = (data ?? []).map((d) => EQUIPMENT_STATUS_COLOR_MAP[d.status] ?? EQUIPMENT_FALLBACK);
  return (
    <WidgetShell title="Оборудование по статусу" icon={Server}>
      <CategoricalChart data={data ?? []} colors={colors.length ? colors : STATUS_COLORS} chartType={chartType ?? "donut"} />
    </WidgetShell>
  );
};

/* ============ Activity ============ */
const ActivityWidget: WidgetMeta["Component"] = ({ chartType }) => {
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
  const empty = !data || !data.some((d) => d.tickets > 0 || d.protocols > 0);
  return (
    <WidgetShell title="Активность за 14 дней" icon={Activity}>
      {empty ? (
        <p className="text-sm text-muted-foreground text-center py-10">Нет активности</p>
      ) : (
        <ChartContainer config={activityConfig} className="h-full w-full">
          {chartType === "bar" ? (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="tickets" fill="hsl(217 91% 60%)" name="Заявки" radius={[3, 3, 0, 0]} />
              <Bar dataKey="protocols" fill="hsl(160 84% 39%)" name="Протоколы" radius={[3, 3, 0, 0]} />
            </BarChart>
          ) : chartType === "area" ? (
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="tickets" stroke="hsl(217 91% 60%)" fill="hsl(217 91% 60%)" fillOpacity={0.25} name="Заявки" />
              <Area type="monotone" dataKey="protocols" stroke="hsl(160 84% 39%)" fill="hsl(160 84% 39%)" fillOpacity={0.25} name="Протоколы" />
            </AreaChart>
          ) : (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="tickets" stroke="hsl(217 91% 60%)" strokeWidth={2} dot={{ r: 3 }} name="Заявки" />
              <Line type="monotone" dataKey="protocols" stroke="hsl(160 84% 39%)" strokeWidth={2} dot={{ r: 3 }} name="Протоколы" />
            </LineChart>
          )}
        </ChartContainer>
      )}
    </WidgetShell>
  );
};

/* ============ Recent tickets ============ */
const RecentTicketsWidget: WidgetMeta["Component"] = () => {
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
      icon={Ticket}
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
};

/* ============ Monitoring: Active hosts ============ */
const MonitoringHostsWidget: WidgetMeta["Component"] = ({ chartType }) => {
  const { data } = useQuery({
    queryKey: ["dashboard-monitored-hosts"],
    queryFn: async () => {
      const { data } = await supabase.from("monitored_hosts").select("status");
      const counts: Record<string, number> = {};
      (data ?? []).forEach((h: any) => { const s = h.status || "unknown"; counts[s] = (counts[s] || 0) + 1; });
      const labels: Record<string, string> = {
        active: "Активен", inactive: "Не активен", maintenance: "Обслуживание", unknown: "Неизвестно",
      };
      const all = [...new Set([...Object.keys(labels), ...Object.keys(counts)])];
      return all.map((s) => ({ status: s, label: labels[s] || s, count: counts[s] || 0 }));
    },
  });
  return (
    <WidgetShell title="Хосты мониторинга" icon={Server}>
      <CategoricalChart data={data ?? []} colors={STATUS_COLORS} chartType={chartType ?? "donut"} />
    </WidgetShell>
  );
};

/* ============ Monitoring: TZ coverage ============ */
const TZCoverageWidget: WidgetMeta["Component"] = ({ chartType }) => {
  const { data } = useQuery({
    queryKey: ["dashboard-tz-coverage"],
    queryFn: async () => {
      const [reqs, cov] = await Promise.all([
        supabase.from("tz_requirements").select("id"),
        supabase.from("tz_coverage").select("requirement_id,status"),
      ]);
      const total = (reqs.data ?? []).length;
      const map = new Map<string, string>();
      (cov.data ?? []).forEach((c: any) => map.set(c.requirement_id, c.status));
      let covered = 0, partial = 0;
      map.forEach((s) => { if (s === "covered") covered++; else if (s === "partial") partial++; });
      const none = total - covered - partial;
      return [
        { status: "covered", label: "Покрыто", count: covered },
        { status: "partial", label: "Частично", count: partial },
        { status: "none", label: "Не покрыто", count: Math.max(0, none) },
      ];
    },
  });
  return (
    <WidgetShell title="Покрытие ТЗ мониторингом" icon={ShieldCheck}>
      <CategoricalChart data={data ?? []}
        colors={["hsl(152 82% 30%)", "hsl(38 92% 50%)", "hsl(220 9% 46%)"]}
        chartType={chartType ?? "donut"} />
    </WidgetShell>
  );
};

/* ============ Monitoring: Recent events ============ */
const RecentEventsWidget: WidgetMeta["Component"] = () => {
  const { data } = useQuery({
    queryKey: ["dashboard-monitor-events"],
    queryFn: async () => {
      const { data } = await supabase.from("monitor_events")
        .select("id, severity, host, message, occurred_at")
        .order("occurred_at", { ascending: false }).limit(10);
      return data ?? [];
    },
    refetchInterval: 60000,
  });
  const sevColor: Record<string, string> = {
    critical: "destructive", high: "destructive", warning: "default", info: "secondary",
  };
  return (
    <WidgetShell title="События мониторинга" icon={AlertTriangle}
      action={<Link to="/monitoring" className="text-sm text-primary hover:underline flex items-center gap-1">Все <ExternalLink className="h-3.5 w-3.5" /></Link>}>
      {data && data.length > 0 ? (
        <div className="space-y-1.5">
          {data.map((e: any) => (
            <div key={e.id} className="flex items-start gap-2 p-2 rounded border text-xs">
              <Badge variant={(sevColor[e.severity] ?? "outline") as any} className="text-[10px] shrink-0">{e.severity}</Badge>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{e.message}</p>
                <p className="text-muted-foreground">{e.host} · {format(new Date(e.occurred_at), "dd MMM HH:mm", { locale: ru })}</p>
              </div>
            </div>
          ))}
        </div>
      ) : <p className="text-sm text-muted-foreground text-center py-10">Нет событий</p>}
    </WidgetShell>
  );
};

/* ============ Favorite metrics (re-uses existing) ============ */
const FavoriteMetricsWrap: WidgetMeta["Component"] = () => <FavoriteMetricsWidget />;

/* ============ Registry ============ */
export const WIDGET_REGISTRY: Record<string, WidgetMeta> = {
  "summary": {
    type: "summary", title: "Сводка", description: "Ключевые показатели: ЦОД, оборудование, заявки, протоколы.",
    category: "Сводка", icon: Building2, defaultW: 12, defaultH: 3, minW: 4, minH: 3,
    Component: SummaryWidget,
  },
  "tickets-by-status": {
    type: "tickets-by-status", title: "Заявки по статусам", description: "Распределение всех заявок по статусам.",
    category: "Заявки", icon: Ticket, defaultW: 4, defaultH: 7, minW: 3, minH: 4,
    supportedCharts: ["bar", "pie", "donut", "radial", "list"], defaultChart: "bar",
    Component: TicketsByStatusWidget,
  },
  "tickets-by-priority": {
    type: "tickets-by-priority", title: "Открытые заявки по приоритету", description: "Активные заявки в разрезе P1–P4.",
    category: "Заявки", icon: AlertTriangle, defaultW: 4, defaultH: 7, minW: 3, minH: 4,
    supportedCharts: ["donut", "pie", "bar", "radial", "list"], defaultChart: "donut",
    Component: TicketsByPriorityWidget,
  },
  "closed-stats": {
    type: "closed-stats", title: "Закрытые заявки", description: "Сводка закрытых заявок и среднее время реагирования.",
    category: "Заявки", icon: CheckCircle2, defaultW: 4, defaultH: 7, minW: 3, minH: 5,
    Component: ClosedStatsWidget,
  },
  "recent-tickets": {
    type: "recent-tickets", title: "Последние заявки", description: "Список 8 самых свежих заявок.",
    category: "Заявки", icon: Ticket, defaultW: 12, defaultH: 7, minW: 4, minH: 5,
    Component: RecentTicketsWidget,
  },
  "protocols-by-status": {
    type: "protocols-by-status", title: "Протоколы по статусам", description: "Распределение протоколов ТО.",
    category: "Протоколы", icon: ClipboardList, defaultW: 6, defaultH: 7, minW: 3, minH: 4,
    supportedCharts: ["bar", "pie", "donut", "radial", "list"], defaultChart: "bar",
    Component: ProtocolsByStatusWidget,
  },
  "equipment-by-status": {
    type: "equipment-by-status", title: "Оборудование по статусу", description: "Состояние парка оборудования.",
    category: "Оборудование", icon: Server, defaultW: 6, defaultH: 7, minW: 3, minH: 4,
    supportedCharts: ["donut", "pie", "bar", "radial", "list"], defaultChart: "donut",
    Component: EquipmentByStatusWidget,
  },
  "activity": {
    type: "activity", title: "Активность за 14 дней", description: "Динамика заявок и протоколов.",
    category: "Сводка", icon: Activity, defaultW: 12, defaultH: 7, minW: 4, minH: 5,
    supportedCharts: ["line", "area", "bar"], defaultChart: "line",
    Component: ActivityWidget,
  },
  "monitoring-hosts": {
    type: "monitoring-hosts", title: "Хосты мониторинга", description: "Состояние всех хостов под мониторингом.",
    category: "Мониторинг", icon: Server, defaultW: 6, defaultH: 7, minW: 3, minH: 4,
    supportedCharts: ["donut", "pie", "bar", "radial", "list"], defaultChart: "donut",
    Component: MonitoringHostsWidget,
  },
  "monitoring-events": {
    type: "monitoring-events", title: "События мониторинга", description: "Свежие события и проблемы.",
    category: "Мониторинг", icon: AlertTriangle, defaultW: 6, defaultH: 7, minW: 3, minH: 5,
    Component: RecentEventsWidget,
  },
  "tz-coverage": {
    type: "tz-coverage", title: "Покрытие ТЗ", description: "Сколько требований ТЗ покрыто мониторингом.",
    category: "Мониторинг", icon: ShieldCheck, defaultW: 4, defaultH: 7, minW: 3, minH: 4,
    supportedCharts: ["donut", "pie", "bar", "radial", "list"], defaultChart: "donut",
    Component: TZCoverageWidget,
  },
  "favorite-metrics": {
    type: "favorite-metrics", title: "Избранные метрики", description: "Последние значения избранных метрик Zabbix.",
    category: "Мониторинг", icon: Star, defaultW: 6, defaultH: 8, minW: 3, minH: 5,
    Component: FavoriteMetricsWrap,
  },
};

export const CHART_TYPE_LABELS: Record<ChartType, string> = {
  bar: "Столбцы",
  pie: "Круговая",
  donut: "Кольцевая",
  line: "Линейная",
  area: "Областная",
  radial: "Радиальная",
  list: "Список",
};
