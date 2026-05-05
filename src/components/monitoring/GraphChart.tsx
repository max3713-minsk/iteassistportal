import { useQuery } from "@tanstack/react-query";
import { invokeZabbix } from "@/lib/zabbix-invoke";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Loader2, AlertCircle, FileImage, FileText, FileType2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef } from "react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { formatRaw } from "./formatMetric";

interface Series {
  hostid: string;
  hostName: string;
  itemid: string;
  itemName: string;
  units?: string;
  color?: string;
  ip?: string;
  hostGroup?: string;
}

interface Props {
  series: Series[];
  timeRange: string;
  chartType?: "line" | "area" | "bar";
  height?: number;
  aggregation?: "avg" | "min" | "max";
  exportable?: boolean;
  graphName?: string;
  refetchInterval?: number; // ms; 0 = off
  showHostMeta?: boolean;
}

const RANGE_TO_SECONDS: Record<string, number> = {
  "1h": 3600,
  "6h": 6 * 3600,
  "1d": 86400,
  "1w": 7 * 86400,
  "1m": 30 * 86400,
};

export const DEFAULT_SERIES_COLORS = ["#dc2626", "#2563eb", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

function shouldUseTrends(timeRange: string): boolean {
  return ["1w", "1m"].includes(timeRange);
}

export default function GraphChart({
  series, timeRange, chartType = "line", height = 300, aggregation = "avg",
  exportable = false, graphName = "graph", refetchInterval = 60000, showHostMeta = true,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["graph-data", series.map(s => s.itemid).join(","), timeRange, aggregation],
    queryFn: async () => {
      if (!series.length) return [];
      const seconds = RANGE_TO_SECONDS[timeRange] || 3600;
      const timeFrom = Math.floor(Date.now() / 1000) - seconds;
      const useTrends = shouldUseTrends(timeRange);

      const results = await Promise.all(
        series.map(async (s) => {
          const { data, error } = await invokeZabbix( {
            body: {
              action: useTrends ? "getTrends" : "getHistory",
              params: {
                itemids: [s.itemid],
                time_from: timeFrom,
                history: 0,
                limit: useTrends ? 2000 : 5000,
              },
            },
          });
          if (error) throw error;
          let raw = data?.result ?? [];

          if (!useTrends && raw.length === 0) {
            const { data: d2 } = await invokeZabbix( {
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
    refetchInterval: refetchInterval > 0 ? refetchInterval : false,
    retry: 1,
  });

  const exportCSV = () => {
    if (!data?.length) return;
    const header = ["timestamp", ...series.map((s) => `${s.hostName} - ${s.itemName}`)].join(",");
    const rows = data.map((row: any) => {
      const cells = [new Date(row.clock).toISOString()];
      series.forEach((_, idx) => cells.push(row[`s${idx}`] ?? ""));
      return cells.join(",");
    });
    const csv = "\uFEFF" + [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${graphName.replace(/[^a-zа-я0-9_-]+/gi, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPNG = async () => {
    if (!exportRef.current) return;
    try {
      const dataUrl = await toPng(exportRef.current, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        cacheBust: true,
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${graphName.replace(/[^a-zа-я0-9_-]+/gi, "_")}.png`;
      a.click();
    } catch (e) {
      console.error("PNG export failed", e);
    }
  };

  const exportPDF = async () => {
    if (!exportRef.current) return;
    try {
      const dataUrl = await toPng(exportRef.current, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        cacheBust: true,
      });
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 10;

      // Header
      pdf.setFontSize(14);
      pdf.text(graphName, margin, margin + 5);
      pdf.setFontSize(9);
      pdf.setTextColor(100);
      const meta = `Период: ${timeRange} · Сгенерировано: ${new Date().toLocaleString("ru-RU")}`;
      pdf.text(meta, margin, margin + 11);

      // Source list
      let metaY = margin + 16;
      series.slice(0, 6).forEach((s) => {
        const line = `• ${s.hostName}${s.ip ? ` [${s.ip}]` : ""}${s.hostGroup ? ` (${s.hostGroup})` : ""} — ${s.itemName}`;
        pdf.text(line, margin, metaY);
        metaY += 5;
      });

      // Chart image
      const img = new Image();
      img.src = dataUrl;
      await new Promise((res) => (img.onload = res));
      const ratio = img.width / img.height;
      const availW = pageW - margin * 2;
      const availH = pageH - metaY - margin;
      let drawW = availW;
      let drawH = drawW / ratio;
      if (drawH > availH) {
        drawH = availH;
        drawW = drawH * ratio;
      }
      pdf.addImage(dataUrl, "PNG", margin, metaY + 2, drawW, drawH);
      pdf.save(`${graphName.replace(/[^a-zа-я0-9_-]+/gi, "_")}.pdf`);
    } catch (e) {
      console.error("PDF export failed", e);
    }
  };

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
    <div className="space-y-2">
      {exportable && data.length > 0 && (
        <div className="flex items-center justify-end gap-1">
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={exportCSV}>
            <FileText className="h-3 w-3 mr-1" /> CSV
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={exportPNG}>
            <FileImage className="h-3 w-3 mr-1" /> PNG
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={exportPDF}>
            <FileType2 className="h-3 w-3 mr-1" /> PDF
          </Button>
        </div>
      )}
      <div ref={exportRef} className="bg-card rounded p-3">
        {showHostMeta && series.length > 0 && (
          <div className="mb-2 pb-2 border-b text-xs space-y-0.5">
            <div className="font-semibold text-foreground">{graphName}</div>
            {series.map((s, i) => (
              <div key={s.itemid} className="flex items-center gap-2 text-muted-foreground">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-sm"
                  style={{ background: s.color || DEFAULT_SERIES_COLORS[i % DEFAULT_SERIES_COLORS.length] }}
                />
                <span className="font-medium text-foreground">{s.hostName}</span>
                {s.ip && <span className="font-mono">[{s.ip}]</span>}
                {s.hostGroup && <span>· {s.hostGroup}</span>}
                <span>— {s.itemName}</span>
              </div>
            ))}
          </div>
        )}
        <div ref={containerRef}>
        <ResponsiveContainer width="100%" height={height}>
          <ChartComp data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis dataKey="clock" tickFormatter={formatTime} stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickFormatter={(v: number) => formatRaw(v, series[0]?.units)}
              width={70}
            />
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
                return [formatRaw(value, s?.units), s?.itemName || name];
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
            {series.map((s, idx) => {
              const key = `s${idx}`;
              const color = s.color || DEFAULT_SERIES_COLORS[idx % DEFAULT_SERIES_COLORS.length];
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
        </div>
      </div>
    </div>
  );
}
