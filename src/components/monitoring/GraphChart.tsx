import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Loader2, AlertCircle } from "lucide-react";

interface Series {
  hostid: string;
  hostName: string;
  itemid: string;
  itemName: string;
  units?: string;
}

interface Props {
  series: Series[];
  timeRange: string; // 1h, 6h, 1d, 1w, 1m
  chartType?: "line" | "area" | "bar";
  height?: number;
  aggregation?: "avg" | "min" | "max";
}

const RANGE_TO_SECONDS: Record<string, number> = {
  "1h": 3600,
  "6h": 6 * 3600,
  "1d": 86400,
  "1w": 7 * 86400,
  "1m": 30 * 86400,
};

const COLORS = ["hsl(var(--primary))", "hsl(var(--destructive))", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

// Use trends for ranges > 1 day (Zabbix stores hourly trends), history for shorter
function shouldUseTrends(timeRange: string): boolean {
  return ["1w", "1m"].includes(timeRange);
}

export default function GraphChart({ series, timeRange, chartType = "line", height = 300, aggregation = "avg" }: Props) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["graph-data", series.map(s => s.itemid).join(","), timeRange, aggregation],
    queryFn: async () => {
      if (!series.length) return [];
      const seconds = RANGE_TO_SECONDS[timeRange] || 3600;
      const timeFrom = Math.floor(Date.now() / 1000) - seconds;
      const useTrends = shouldUseTrends(timeRange);

      const results = await Promise.all(
        series.map(async (s) => {
          const { data, error } = await supabase.functions.invoke("zabbix-proxy", {
            body: {
              action: useTrends ? "getTrends" : "getHistory",
              params: {
                itemids: [s.itemid],
                time_from: timeFrom,
                history: 0, // numeric float; could also try 3 (uint)
                limit: useTrends ? 2000 : 5000,
              },
            },
          });
          if (error) throw error;
          let raw = data?.result ?? [];

          // If history empty, try uint history (type 3)
          if (!useTrends && raw.length === 0) {
            const { data: d2 } = await supabase.functions.invoke("zabbix-proxy", {
              body: {
                action: "getHistory",
                params: { itemids: [s.itemid], time_from: timeFrom, history: 3, limit: 5000 },
              },
            });
            raw = d2?.result ?? [];
          }

          return raw.map((p: any) => ({
            clock: parseInt(p.clock) * 1000,
            value: useTrends
              ? parseFloat(aggregation === "max" ? p.value_max : aggregation === "min" ? p.value_min : p.value_avg)
              : parseFloat(p.value),
            itemid: s.itemid,
          }));
        })
      );

      // Merge all series into one timeline
      const map = new Map<number, Record<string, any>>();
      results.forEach((points, idx) => {
        const key = `s${idx}`;
        points.forEach((p: any) => {
          const bucket = map.get(p.clock) || { clock: p.clock };
          bucket[key] = p.value;
          map.set(p.clock, bucket);
        });
      });

      return [...map.values()].sort((a, b) => a.clock - b.clock);
    },
    enabled: series.length > 0,
    refetchInterval: 60000,
    retry: 1,
  });

  if (!series.length) {
    return (
      <div style={{ height }} className="flex items-center justify-center bg-muted/30 rounded border border-dashed">
        <p className="text-sm text-muted-foreground">Выберите хост и метрику</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ height }} className="flex items-center justify-center bg-muted/30 rounded">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ height }} className="flex flex-col items-center justify-center bg-destructive/5 rounded border border-destructive/20 gap-2">
        <AlertCircle className="h-6 w-6 text-destructive" />
        <p className="text-xs text-destructive">{(error as Error).message}</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div style={{ height }} className="flex items-center justify-center bg-muted/30 rounded border border-dashed">
        <p className="text-sm text-muted-foreground">Нет данных за выбранный период</p>
      </div>
    );
  }

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    if (["1w", "1m"].includes(timeRange)) {
      return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
    }
    return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  };

  const ChartComp = chartType === "area" ? AreaChart : chartType === "bar" ? BarChart : LineChart;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ChartComp data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
        <XAxis dataKey="clock" tickFormatter={formatTime} stroke="hsl(var(--muted-foreground))" fontSize={11} />
        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
        <Tooltip
          contentStyle={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 8,
            fontSize: 12,
          }}
          labelFormatter={(ts: number) => new Date(ts).toLocaleString("ru-RU")}
          formatter={(value: any, name: string) => {
            const idx = parseInt(name.replace("s", ""));
            const s = series[idx];
            return [`${typeof value === "number" ? value.toFixed(2) : value} ${s?.units || ""}`, s?.itemName || name];
          }}
        />
        <Legend
          formatter={(value) => {
            const idx = parseInt(value.replace("s", ""));
            const s = series[idx];
            return s ? `${s.hostName}: ${s.itemName}` : value;
          }}
          wrapperStyle={{ fontSize: 11 }}
        />
        {series.map((_, idx) => {
          const key = `s${idx}`;
          const color = COLORS[idx % COLORS.length];
          if (chartType === "area") {
            return <Area key={key} type="monotone" dataKey={key} stroke={color} fill={color} fillOpacity={0.2} strokeWidth={2} />;
          }
          if (chartType === "bar") {
            return <Bar key={key} dataKey={key} fill={color} />;
          }
          return <Line key={key} type="monotone" dataKey={key} stroke={color} strokeWidth={2} dot={false} />;
        })}
      </ChartComp>
    </ResponsiveContainer>
  );
}
