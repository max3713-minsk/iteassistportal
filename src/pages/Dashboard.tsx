import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Server, Ticket, ClipboardList, AlertTriangle, CheckCircle2, Clock, Loader2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format, subDays, startOfDay } from "date-fns";
import { ru } from "date-fns/locale";

/* ─── Summary counts ─── */
function useSummary() {
  return useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: async () => {
      const [sites, equipment, openTickets, activeProtocols] = await Promise.all([
        supabase.from("sites").select("*", { count: "exact", head: true }),
        supabase.from("equipment").select("*", { count: "exact", head: true }),
        supabase
          .from("tickets")
          .select("*", { count: "exact", head: true })
          .in("status", ["open", "in_progress"]),
        supabase
          .from("maintenance_protocols")
          .select("*", { count: "exact", head: true })
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
}

/* ─── Tickets by status ─── */
function useTicketsByStatus() {
  return useQuery({
    queryKey: ["dashboard-tickets-status"],
    queryFn: async () => {
      const { data } = await supabase.from("tickets").select("status");
      const counts: Record<string, number> = {};
      (data ?? []).forEach((t) => {
        counts[t.status] = (counts[t.status] || 0) + 1;
      });
      const labels: Record<string, string> = {
        open: "Открыта",
        in_progress: "В работе",
        waiting: "Ожидание",
        resolved: "Решена",
        closed: "Закрыта",
      };
      return Object.entries(labels).map(([key, label]) => ({
        status: key,
        label,
        count: counts[key] || 0,
      }));
    },
  });
}

/* ─── Tickets by priority ─── */
function useTicketsByPriority() {
  return useQuery({
    queryKey: ["dashboard-tickets-priority"],
    queryFn: async () => {
      const { data } = await supabase
        .from("tickets")
        .select("priority")
        .in("status", ["open", "in_progress", "waiting"]);
      const counts: Record<string, number> = {};
      (data ?? []).forEach((t) => {
        counts[t.priority] = (counts[t.priority] || 0) + 1;
      });
      return ["P1", "P2", "P3", "P4"].map((p) => ({ priority: p, count: counts[p] || 0 }));
    },
  });
}

/* ─── Protocols by status ─── */
function useProtocolsByStatus() {
  return useQuery({
    queryKey: ["dashboard-protocols-status"],
    queryFn: async () => {
      const { data } = await supabase.from("maintenance_protocols").select("status");
      const counts: Record<string, number> = {};
      (data ?? []).forEach((p) => {
        counts[p.status] = (counts[p.status] || 0) + 1;
      });
      const labels: Record<string, string> = {
        pending: "Ожидает",
        in_progress: "В работе",
        completed: "Завершён",
        overdue: "Просрочен",
      };
      return Object.entries(labels).map(([key, label]) => ({
        status: key,
        label,
        count: counts[key] || 0,
      }));
    },
  });
}

/* ─── Activity over last 14 days ─── */
function useActivity() {
  return useQuery({
    queryKey: ["dashboard-activity"],
    queryFn: async () => {
      const since = subDays(new Date(), 13);
      const [tickets, protocols] = await Promise.all([
        supabase.from("tickets").select("created_at").gte("created_at", since.toISOString()),
        supabase
          .from("maintenance_protocols")
          .select("created_at")
          .gte("created_at", since.toISOString()),
      ]);

      const days: Record<string, { tickets: number; protocols: number }> = {};
      for (let i = 0; i < 14; i++) {
        const d = format(subDays(new Date(), 13 - i), "yyyy-MM-dd");
        days[d] = { tickets: 0, protocols: 0 };
      }
      (tickets.data ?? []).forEach((t) => {
        const d = format(new Date(t.created_at), "yyyy-MM-dd");
        if (days[d]) days[d].tickets++;
      });
      (protocols.data ?? []).forEach((p) => {
        const d = format(new Date(p.created_at), "yyyy-MM-dd");
        if (days[d]) days[d].protocols++;
      });

      return Object.entries(days).map(([date, v]) => ({
        date,
        label: format(new Date(date), "dd MMM", { locale: ru }),
        tickets: v.tickets,
        protocols: v.protocols,
      }));
    },
  });
}

/* ─── Equipment by status ─── */
function useEquipmentByStatus() {
  return useQuery({
    queryKey: ["dashboard-equipment-status"],
    queryFn: async () => {
      const { data } = await supabase.from("equipment").select("status");
      const counts: Record<string, number> = {};
      (data ?? []).forEach((e) => {
        const s = e.status || "active";
        counts[s] = (counts[s] || 0) + 1;
      });
      const labels: Record<string, string> = {
        active: "Активно",
        maintenance: "На обслуживании",
        decommissioned: "Выведено",
        faulty: "Неисправно",
      };
      // Ensure all known statuses are present
      const allStatuses = Object.keys(labels);
      // Add any statuses from data that aren't in our labels
      Object.keys(counts).forEach((s) => {
        if (!allStatuses.includes(s)) allStatuses.push(s);
      });
      return allStatuses.map((status) => ({
        status,
        label: labels[status] || status,
        count: counts[status] || 0,
      }));
    },
  });
}

/* ─── Recent 5 tickets ─── */
function useRecentTickets() {
  return useQuery({
    queryKey: ["dashboard-recent-tickets"],
    queryFn: async () => {
      const { data } = await supabase
        .from("tickets")
        .select("id, title, status, priority, created_at, site_id, sites(name)")
        .order("created_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
  });
}

/* ─── Colors ─── */
const STATUS_COLORS = [
  "hsl(217 91% 60%)",   // blue
  "hsl(38 92% 50%)",    // amber
  "hsl(142 71% 45%)",   // green
  "hsl(0 72% 51%)",     // red
  "hsl(262 83% 58%)",   // violet
];
const PRIORITY_COLORS = [
  "hsl(0 72% 51%)",     // red – P1
  "hsl(25 95% 53%)",    // orange – P2
  "hsl(38 92% 50%)",    // amber – P3
  "hsl(217 91% 60%)",   // blue – P4
];
const EQUIPMENT_COLORS = [
  "hsl(160 84% 39%)",   // teal
  "hsl(38 92% 50%)",    // amber
  "hsl(0 72% 51%)",     // red
  "hsl(262 83% 58%)",   // violet
  "hsl(199 89% 48%)",   // sky
];
const PROTOCOL_COLORS = [
  "hsl(38 92% 50%)",    // amber
  "hsl(217 91% 60%)",   // blue
  "hsl(160 84% 39%)",   // teal
  "hsl(0 72% 51%)",     // red
];

const activityConfig: ChartConfig = {
  tickets: { label: "Заявки", color: "hsl(217 91% 60%)" },
  protocols: { label: "Протоколы", color: "hsl(160 84% 39%)" },
};

const ticketStatusConfig: ChartConfig = {
  count: { label: "Кол-во" },
};

export default function Dashboard() {
  const { data: summary } = useSummary();
  const { data: ticketsByStatus } = useTicketsByStatus();
  const { data: ticketsByPriority } = useTicketsByPriority();
  const { data: protocolsByStatus } = useProtocolsByStatus();
  const { data: activity } = useActivity();
  const { data: equipmentByStatus } = useEquipmentByStatus();
  const { data: recentTickets } = useRecentTickets();

  const priorityVariant: Record<string, "destructive" | "default" | "secondary" | "outline"> = {
    P1: "destructive",
    P2: "default",
    P3: "secondary",
    P4: "outline",
  };
  const statusLabels: Record<string, string> = {
    open: "Открыта",
    in_progress: "В работе",
    waiting: "Ожидание",
    resolved: "Решена",
    closed: "Закрыта",
  };

  const stats = [
    { label: "Площадки", value: summary?.sites ?? 0, icon: Building2, color: "text-primary" },
    { label: "Оборудование", value: summary?.equipment ?? 0, icon: Server, color: "text-accent" },
    { label: "Открытые заявки", value: summary?.openTickets ?? 0, icon: Ticket, color: "text-destructive" },
    { label: "Активные протоколы", value: summary?.activeProtocols ?? 0, icon: ClipboardList, color: "text-primary" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Панель управления</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className={cn("h-5 w-5", s.color)} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-heading font-bold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Row: Tickets by status + Tickets by priority */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Заявки по статусам</CardTitle>
          </CardHeader>
          <CardContent>
            {ticketsByStatus && ticketsByStatus.some((d) => d.count > 0) ? (
              <ChartContainer config={ticketStatusConfig} className="h-[260px] w-full">
                <BarChart data={ticketsByStatus}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {ticketsByStatus.map((_, i) => (
                      <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-10">Нет данных</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Открытые заявки по приоритету</CardTitle>
          </CardHeader>
          <CardContent>
            {ticketsByPriority ? (
              <ChartContainer config={ticketStatusConfig} className="h-[300px] w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent nameKey="priority" />} />
                  <Pie
                    data={ticketsByPriority}
                    dataKey="count"
                    nameKey="priority"
                    cx="50%"
                    cy="45%"
                    outerRadius={80}
                    label={({ priority, count }) => (count > 0 ? `${priority}: ${count}` : "")}
                  >
                    {ticketsByPriority.map((_, i) => (
                      <Cell key={i} fill={PRIORITY_COLORS[i]} />
                    ))}
                  </Pie>
                  <Legend
                    payload={["P1 — Критический", "P2 — Высокий", "P3 — Средний", "P4 — Низкий"].map((label, i) => ({
                      value: label,
                      type: "circle" as const,
                      color: PRIORITY_COLORS[i],
                    }))}
                    wrapperStyle={{ fontSize: 12 }}
                  />
                </PieChart>
              </ChartContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-10">Нет открытых заявок</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row: Protocols by status + Equipment by status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Протоколы по статусам</CardTitle>
          </CardHeader>
          <CardContent>
            {protocolsByStatus && protocolsByStatus.some((d) => d.count > 0) ? (
              <ChartContainer config={ticketStatusConfig} className="h-[260px] w-full">
                <BarChart data={protocolsByStatus}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {protocolsByStatus.map((_, i) => (
                      <Cell key={i} fill={PROTOCOL_COLORS[i % PROTOCOL_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-10">Нет данных</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Оборудование по статусу</CardTitle>
          </CardHeader>
          <CardContent>
            {equipmentByStatus ? (
              <ChartContainer config={ticketStatusConfig} className="h-[300px] w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent nameKey="label" />} />
                  <Pie
                    data={equipmentByStatus}
                    dataKey="count"
                    nameKey="label"
                    cx="50%"
                    cy="45%"
                    outerRadius={80}
                    label={({ label, count }) => (count > 0 ? `${label}: ${count}` : "")}
                  >
                    {equipmentByStatus.map((_, i) => (
                      <Cell key={i} fill={EQUIPMENT_COLORS[i % EQUIPMENT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend
                    payload={equipmentByStatus.map((item, i) => ({
                      value: item.label,
                      type: "circle" as const,
                      color: EQUIPMENT_COLORS[i % EQUIPMENT_COLORS.length],
                    }))}
                    wrapperStyle={{ fontSize: 12 }}
                  />
                </PieChart>
              </ChartContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-10">Нет данных</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Активность за 14 дней</CardTitle>
        </CardHeader>
        <CardContent>
          {activity && activity.some((d) => d.tickets > 0 || d.protocols > 0) ? (
            <ChartContainer config={activityConfig} className="h-[300px] w-full">
              <LineChart data={activity}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="tickets" stroke="hsl(217 91% 60%)" strokeWidth={2} dot={{ r: 3 }} name="Заявки" />
                <Line type="monotone" dataKey="protocols" stroke="hsl(160 84% 39%)" strokeWidth={2} dot={{ r: 3 }} name="Протоколы" />
              </LineChart>
            </ChartContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-10">Нет активности за последние 14 дней</p>
          )}
        </CardContent>
      </Card>

      {/* Recent tickets */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Последние заявки</CardTitle>
          <Link to="/tickets" className="text-sm text-primary hover:underline flex items-center gap-1">
            Все заявки <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </CardHeader>
        <CardContent>
          {recentTickets && recentTickets.length > 0 ? (
            <div className="space-y-3">
              {recentTickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  to={`/tickets?id=${ticket.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{ticket.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {(ticket as any).sites?.name ?? "—"} · {format(new Date(ticket.created_at), "dd MMM yyyy", { locale: ru })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-3 shrink-0">
                    <Badge variant={priorityVariant[ticket.priority] ?? "outline"} className="text-xs">
                      {ticket.priority}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {statusLabels[ticket.status] ?? ticket.status}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-10">Нет заявок</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
