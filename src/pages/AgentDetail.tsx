import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Cpu, HardDrive, Network } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { formatDistanceToNow, format } from "date-fns";
import { ru } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { AgentProcesses } from "@/components/agent/AgentProcesses";
import { AgentInventory } from "@/components/agent/AgentInventory";

function isOnline(lastSeen: string | null): boolean {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < 5 * 60 * 1000;
}

export default function AgentDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { hasRole } = useAuth();
  const isAdmin = hasRole("admin");

  const { data: agent } = useQuery({
    queryKey: ["agent", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_registrations")
        .select("*, equipment:equipment_id(id, name), organization:organization_id(id, name), site:site_id(id, name)")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
    refetchInterval: 30000,
  });

  const { data: metrics = [] } = useQuery({
    queryKey: ["agent-metrics", agent?.agent_id],
    enabled: !!agent?.agent_id,
    queryFn: async () => {
      const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const { data, error } = await supabase
        .from("agent_metrics")
        .select("*")
        .eq("agent_id", agent.agent_id)
        .gte("collected_at", since)
        .order("collected_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 30000,
  });

  const { data: equipmentList = [] } = useQuery({
    queryKey: ["equipment-min"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data } = await supabase.from("equipment").select("id, name").order("name");
      return data ?? [];
    },
  });

  const latest = metrics[metrics.length - 1] as any;

  const chartData = useMemo(() => {
    return metrics.map((m: any) => ({
      t: format(new Date(m.collected_at), "HH:mm"),
      cpu: m.cpu_usage_percent != null ? Number(m.cpu_usage_percent) : null,
      ramPct: m.ram_used_mb && m.ram_total_mb ? Math.round((Number(m.ram_used_mb) / Number(m.ram_total_mb)) * 100) : null,
    }));
  }, [metrics]);

  const linkMut = useMutation({
    mutationFn: async (equipment_id: string | null) => {
      const { error } = await supabase
        .from("agent_registrations")
        .update({ equipment_id })
        .eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agent", id] });
      toast({ title: "Привязка обновлена" });
    },
    onError: (e: any) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  });

  if (!agent) {
    return <div className="p-8 text-muted-foreground">Загрузка...</div>;
  }

  const online = isOnline(agent.last_seen_at);
  const disks: any[] = Array.isArray(latest?.disk_metrics) ? latest.disk_metrics : [];
  const networksRaw: any[] = Array.isArray(latest?.network_metrics) ? latest.network_metrics : [];

  const pickIp = (n: any): string | null => {
    const ips: string[] = Array.isArray(n?.ip_addresses)
      ? n.ip_addresses
      : Array.isArray(n?.ips)
      ? n.ips
      : n?.ip
      ? [n.ip]
      : [];
    const good = ips.find(
      (ip) => ip && !ip.toLowerCase().startsWith("fe80") && !ip.startsWith("169.254"),
    );
    return good ?? null;
  };

  const fmtBytes = (v: any): string => {
    const n = Number(v);
    if (!Number.isFinite(n) || n <= 0) return "0 Б";
    const units = ["Б", "КБ", "МБ", "ГБ", "ТБ"];
    let i = 0;
    let val = n;
    while (val >= 1024 && i < units.length - 1) {
      val /= 1024;
      i++;
    }
    return `${val.toFixed(val >= 100 || i === 0 ? 0 : 1)} ${units[i]}`;
  };

  const networks = networksRaw
    .map((n) => ({
      ...n,
      _ip: pickIp(n),
      _rx: Number(n?.bytes_recv ?? n?.rx_bytes ?? n?.rx ?? 0) || 0,
      _tx: Number(n?.bytes_sent ?? n?.tx_bytes ?? n?.tx ?? 0) || 0,
    }))
    .filter((n) => n._ip || n._rx > 0 || n._tx > 0)
    .sort((a, b) => b._rx + b._tx - (a._rx + a._tx));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/agents"><ArrowLeft className="h-4 w-4 mr-1" /> К списку</Link>
        </Button>
      </div>

      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{agent.hostname || agent.agent_id}</h1>
          <p className="text-sm text-muted-foreground font-mono">{agent.agent_id}</p>
        </div>
        <Badge variant={online ? "default" : "secondary"} className={online ? "bg-green-600 hover:bg-green-600" : ""}>
          {online ? "Онлайн" : "Оффлайн"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">OS</CardTitle></CardHeader>
          <CardContent><div className="text-sm">{agent.os_type} {agent.os_version}</div><div className="text-xs text-muted-foreground">{agent.arch}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">CPU</CardTitle></CardHeader>
          <CardContent><div className="text-sm">{agent.cpu_model || "—"}</div><div className="text-xs text-muted-foreground">{agent.cpu_cores} ядер</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">RAM</CardTitle></CardHeader>
          <CardContent><div className="text-sm">{agent.ram_total_mb ? `${Math.round(agent.ram_total_mb / 1024)} ГБ` : "—"}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Последняя активность</CardTitle></CardHeader>
          <CardContent><div className="text-sm">{agent.last_seen_at ? formatDistanceToNow(new Date(agent.last_seen_at), { addSuffix: true, locale: ru }) : "—"}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Привязка</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div><div className="text-muted-foreground">Организация</div><div>{agent.organization?.name || "—"}</div></div>
            <div><div className="text-muted-foreground">ЦОД</div><div>{agent.site?.name || "—"}</div></div>
            <div>
              <div className="text-muted-foreground">Оборудование</div>
              {isAdmin ? (
                <Select
                  value={agent.equipment_id ?? "none"}
                  onValueChange={(v) => linkMut.mutate(v === "none" ? null : v)}
                >
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Не привязано</SelectItem>
                    {(equipmentList as any[]).map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div>{agent.equipment?.name || "—"}</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Cpu className="h-4 w-4" /> CPU за 24 часа</CardTitle></CardHeader>
          <CardContent style={{ height: 240 }}>
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="t" />
                <YAxis domain={[0, 100]} />
                <RTooltip />
                <Line type="monotone" dataKey="cpu" stroke="hsl(var(--primary))" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">RAM за 24 часа (%)</CardTitle></CardHeader>
          <CardContent style={{ height: 240 }}>
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="t" />
                <YAxis domain={[0, 100]} />
                <RTooltip />
                <Line type="monotone" dataKey="ramPct" stroke="hsl(var(--primary))" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><HardDrive className="h-4 w-4" /> Диски</CardTitle></CardHeader>
        <CardContent>
          {disks.length === 0 ? (
            <div className="text-sm text-muted-foreground">Нет данных</div>
          ) : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Точка</TableHead><TableHead>Всего</TableHead>
                <TableHead>Свободно</TableHead><TableHead>Заполненность</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {disks.map((d: any, i: number) => {
                  const total = Number(d.total_gb ?? d.total ?? 0) || 0;
                  const free = Number(d.free_gb ?? d.free ?? 0) || 0;
                  const usedPct = Number.isFinite(Number(d.used_percent))
                    ? Math.round(Number(d.used_percent))
                    : total
                    ? Math.round(((total - free) / total) * 100)
                    : 0;
                  const mount = d.mount_point || d.mount || d.device || d.path || d.name || "—";
                  return (
                    <TableRow key={i}>
                      <TableCell className="font-mono">{mount}</TableCell>
                      <TableCell>{total.toFixed(1)} ГБ</TableCell>
                      <TableCell>{free.toFixed(1)} ГБ</TableCell>
                      <TableCell>
                        <Badge
                          variant={usedPct >= 90 ? "destructive" : "default"}
                          className={usedPct >= 75 && usedPct < 90 ? "bg-orange-500 hover:bg-orange-500 text-white" : ""}
                        >
                          {usedPct}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Network className="h-4 w-4" /> Сетевые интерфейсы</CardTitle></CardHeader>
        <CardContent>
          {networks.length === 0 ? (
            <div className="text-sm text-muted-foreground">Нет активных интерфейсов</div>
          ) : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Интерфейс</TableHead><TableHead>IP</TableHead>
                <TableHead>RX</TableHead><TableHead>TX</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {networks.map((n: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono">{n.interface || n.name || n.iface || "—"}</TableCell>
                    <TableCell className="font-mono">{n._ip || "—"}</TableCell>
                    <TableCell>{fmtBytes(n._rx)}</TableCell>
                    <TableCell>{fmtBytes(n._tx)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">История метрик ({metrics.length})</CardTitle></CardHeader>
        <CardContent>
          <div className="max-h-80 overflow-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Время</TableHead><TableHead>CPU %</TableHead>
                <TableHead>RAM (МБ)</TableHead><TableHead>Uptime</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {[...metrics].reverse().slice(0, 100).map((m: any) => (
                  <TableRow key={m.id}>
                    <TableCell>{format(new Date(m.collected_at), "dd.MM HH:mm:ss")}</TableCell>
                    <TableCell>{m.cpu_usage_percent != null ? Number(m.cpu_usage_percent).toFixed(1) : "—"}</TableCell>
                    <TableCell>{m.ram_used_mb ?? "—"} / {m.ram_total_mb ?? "—"}</TableCell>
                    <TableCell>{m.uptime_seconds ? `${Math.floor(m.uptime_seconds / 3600)} ч` : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {agent.agent_id && <AgentProcesses agentId={agent.agent_id} />}
    </div>
  );
}