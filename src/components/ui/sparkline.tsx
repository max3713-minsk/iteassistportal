import * as React from "react";
import { cn } from "@/lib/utils";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
  /** "up" → green, "down" → red, "auto" infers from first vs last. */
  trend?: "up" | "down" | "neutral" | "auto";
}

/**
 * Tiny dependency-free SVG sparkline for KPI cards.
 */
export function Sparkline({
  data, width = 96, height = 28, className, trend = "auto",
}: SparklineProps) {
  if (!data || data.length < 2) {
    return <div className={cn("h-7 w-24", className)} />;
  }
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = Math.max(1, max - min);
  const stepX = width / (data.length - 1);
  const points = data
    .map((v, i) => `${(i * stepX).toFixed(1)},${(height - ((v - min) / range) * (height - 4) - 2).toFixed(1)}`)
    .join(" ");

  const inferred: "up" | "down" | "neutral" =
    trend === "auto"
      ? data[data.length - 1] > data[0] ? "up" : data[data.length - 1] < data[0] ? "down" : "neutral"
      : trend;

  const stroke =
    inferred === "up" ? "hsl(142 76% 45%)" :
    inferred === "down" ? "hsl(0 76% 55%)" :
    "hsl(var(--muted-foreground))";

  const fillId = React.useId();

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn("inline-block overflow-visible", className)}
      style={{ width, height }}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={`0,${height} ${points} ${width},${height}`}
        fill={`url(#${fillId})`}
        stroke="none"
      />
      <polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}