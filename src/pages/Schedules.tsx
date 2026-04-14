import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import MaintenanceCalendar from "@/components/schedules/MaintenanceCalendar";
import DayDetail from "@/components/schedules/DayDetail";
import DayStats from "@/components/schedules/DayStats";
import {
  frequencyColors,
  frequencyLabels,
  type TaskWithCategory,
  type FrequencyType,
} from "@/lib/schedule-utils";

export default function Schedules() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Fetch tasks with category names
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["maintenance-tasks-full"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_tasks")
        .select("id, title, description, frequency, category_id, equipment_categories(name)")
        .order("title");
      if (error) throw error;
      return (data ?? []).map((t: any) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        frequency: t.frequency as FrequencyType,
        category_id: t.category_id,
        categoryName: t.equipment_categories?.name ?? "Без категории",
      })) as TaskWithCategory[];
    },
  });

  // For now, completed tasks would come from protocol_items
  // Placeholder: no completed tasks until protocols are created
  const completedTaskIds = useMemo(() => new Set<string>(), []);

  const legend: FrequencyType[] = ["daily", "weekly", "monthly", "quarterly", "semi_annual"];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-bold">Календарь ТО</h1>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-4">
        {legend.map((f) => (
          <div key={f} className="flex items-center gap-1.5 text-xs">
            <span className={cn("w-3 h-3 rounded-full", frequencyColors[f].dot)} />
            <span className="text-muted-foreground">{frequencyLabels[f]}</span>
          </div>
        ))}
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Загрузка...</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Calendar */}
          <Card className="lg:col-span-3 p-4">
            <MaintenanceCalendar
              tasks={tasks}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
          </Card>

          {/* Day detail */}
          <div className="lg:col-span-2">
            {selectedDate ? (
              <DayDetail
                date={selectedDate}
                tasks={tasks}
                completedTaskIds={completedTaskIds}
                onClose={() => setSelectedDate(null)}
              />
            ) : (
              <Card className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-muted-foreground text-sm">
                  Выберите дату в календаре, чтобы увидеть запланированные задачи
                </p>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
