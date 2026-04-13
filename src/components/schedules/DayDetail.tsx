import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, Circle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  completedTaskIds: Set<string>;
  onClose: () => void;
}

interface GroupedCategory {
  categoryName: string;
  items: { task: TaskWithCategory; completed: boolean }[];
}

export default function DayDetail({ date, tasks, completedTaskIds, onClose }: Props) {
  const grouped = useMemo(() => {
    // Filter tasks scheduled on this date
    const scheduled = tasks.filter((t) =>
      isTaskScheduledOnDate(t.frequency, date)
    );

    // Group by category
    const catMap = new Map<string, GroupedCategory>();
    for (const t of scheduled) {
      const catName = t.categoryName || "Без категории";
      if (!catMap.has(catName)) {
        catMap.set(catName, { categoryName: catName, items: [] });
      }
      catMap.get(catName)!.items.push({
        task: t,
        completed: completedTaskIds.has(t.id),
      });
    }

    return Array.from(catMap.values()).sort((a, b) =>
      a.categoryName.localeCompare(b.categoryName)
    );
  }, [date, tasks, completedTaskIds]);

  const totalTasks = grouped.reduce((s, g) => s + g.items.length, 0);
  const completedCount = grouped.reduce(
    (s, g) => s + g.items.filter((i) => i.completed).length,
    0
  );

  return (
    <div className="border rounded-lg bg-card animate-in slide-in-from-right-5 fade-in-0 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h3 className="font-heading text-lg font-semibold">
            {format(date, "d MMMM yyyy", { locale: ru })}
          </h3>
          <p className="text-sm text-muted-foreground">
            Задач: {totalTasks} • Выполнено: {completedCount}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 px-4 py-2 border-b">
        {(["daily", "weekly", "monthly", "quarterly", "semi_annual"] as FrequencyType[]).map((f) => (
          <div key={f} className="flex items-center gap-1 text-xs">
            <span className={cn("w-2.5 h-2.5 rounded-full", frequencyColors[f].dot)} />
            <span className="text-muted-foreground">{frequencyLabels[f]}</span>
          </div>
        ))}
      </div>

      {/* Task list */}
      <ScrollArea className="max-h-[60vh]">
        <div className="p-4 space-y-4">
          {grouped.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Нет запланированных задач на эту дату
            </p>
          ) : (
            grouped.map((group) => (
              <div key={group.categoryName}>
                <h4 className="text-sm font-semibold mb-2 text-foreground">
                  {group.categoryName}
                </h4>
                <div className="space-y-1.5">
                  {group.items.map(({ task, completed }) => (
                    <div
                      key={task.id}
                      className={cn(
                        "flex items-start gap-2 rounded-md px-3 py-2 text-sm",
                        frequencyColors[task.frequency].bg,
                      )}
                    >
                      {completed ? (
                        <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-emerald-500" />
                      ) : (
                        <Circle className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground/50" />
                      )}
                      <div className="flex-1 min-w-0">
                        <span
                          className={cn(
                            "leading-tight",
                            completed && "line-through text-muted-foreground",
                            frequencyColors[task.frequency].text,
                          )}
                        >
                          {task.title}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] shrink-0 border-0",
                          frequencyColors[task.frequency].text,
                        )}
                      >
                        {frequencyLabels[task.frequency]}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
