import { useMemo } from "react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  frequencyColors,
  frequencyLabels,
  isTaskScheduledOnDate,
  type TaskWithCategory,
  type FrequencyType,
} from "@/lib/schedule-utils";

interface Props {
  date: Date;
  tasks: TaskWithCategory[];
}

const FREQ_ORDER: FrequencyType[] = ["daily", "weekly", "monthly", "quarterly", "semi_annual"];

export default function DayStats({ date, tasks }: Props) {
  const dateStr = format(date, "yyyy-MM-dd");

  // Build a set of completed task IDs from protocol items that match the date range
  const { data: completedTaskIdsForDate = new Set<string>() } = useQuery({
    queryKey: ["day-completed-tasks", dateStr],
    queryFn: async () => {
      // Find protocols where period_start <= date <= period_end and status = completed
      const { data: protocols, error: pErr } = await supabase
        .from("maintenance_protocols")
        .select("id")
        .lte("period_start", dateStr)
        .gte("period_end", dateStr)
        .eq("status", "completed");
      if (pErr) throw pErr;
      if (!protocols || protocols.length === 0) return new Set<string>();

      const protocolIds = protocols.map((p) => p.id);
      const { data: items, error: iErr } = await supabase
        .from("protocol_items")
        .select("task_id")
        .in("protocol_id", protocolIds)
        .eq("status", "completed");
      if (iErr) throw iErr;

      return new Set((items ?? []).map((i) => i.task_id));
    },
  });

  const stats = useMemo(() => {
    const result: {
      frequency: FrequencyType;
      total: number;
      completed: number;
      percent: number;
    }[] = [];

    for (const freq of FREQ_ORDER) {
      const scheduled = tasks.filter(
        (t) => t.frequency === freq && isTaskScheduledOnDate(freq, date)
      );
      if (scheduled.length === 0) continue;

      const completed = scheduled.filter((t) => completedTaskIdsForDate.has(t.id)).length;
      const percent = Math.round((completed / scheduled.length) * 100);

      result.push({ frequency: freq, total: scheduled.length, completed, percent });
    }

    return result;
  }, [date, tasks, completedTaskIdsForDate]);

  if (stats.length === 0) {
    return null;
  }

  const totalAll = stats.reduce((s, r) => s + r.total, 0);
  const completedAll = stats.reduce((s, r) => s + r.completed, 0);
  const overallPercent = totalAll > 0 ? Math.round((completedAll / totalAll) * 100) : 0;

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-sm font-semibold">Статистика выполнения</h3>
        <span className="text-xs text-muted-foreground">
          {completedAll} из {totalAll} ({overallPercent}%)
        </span>
      </div>

      {/* Overall progress */}
      <div>
        <Progress value={overallPercent} className="h-2" />
      </div>

      {/* Per-frequency breakdown */}
      <div className="space-y-3">
        {stats.map((s) => (
          <div key={s.frequency} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className={cn("w-2.5 h-2.5 rounded-full", frequencyColors[s.frequency].dot)} />
                <span className={frequencyColors[s.frequency].text}>
                  {frequencyLabels[s.frequency]}
                </span>
              </div>
              <span className="text-muted-foreground">
                {s.completed}/{s.total} ({s.percent}%)
              </span>
            </div>
            <Progress
              value={s.percent}
              className={cn("h-1.5", s.percent === 100 && "[&>div]:bg-emerald-500")}
            />
          </div>
        ))}
      </div>
    </Card>
  );
}
