import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon } from "lucide-react";
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
  const [contractId, setContractId] = useState<string>("");

  const { data: contracts = [] } = useQuery({
    queryKey: ["active-contracts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("contracts")
        .select("id, contract_number, start_date, organization_id, organizations(name)")
        .eq("is_active", true)
        .order("start_date", { ascending: false });
      return data ?? [];
    },
  });

  const activeContract = contracts.find((c: any) => c.id === contractId) ?? contracts[0];
  const contractStartDate = activeContract?.start_date ? new Date(activeContract.start_date) : undefined;

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
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="font-heading text-2xl font-bold">Календарь ТО</h1>
        {contracts.length > 0 && (
          <div className="flex items-center gap-2">
            <Select value={activeContract?.id ?? ""} onValueChange={setContractId}>
              <SelectTrigger className="w-[320px]"><SelectValue placeholder="Выберите договор"/></SelectTrigger>
              <SelectContent>
                {contracts.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.organizations?.name} — {c.contract_number} (с {c.start_date})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {contractStartDate && (
              <Badge variant="outline" className="gap-1"><CalendarIcon className="h-3 w-3"/>Старт: {activeContract?.start_date}</Badge>
            )}
          </div>
        )}
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
          <div className="lg:col-span-3 space-y-4">
            <Card className="p-4">
              <MaintenanceCalendar
                tasks={tasks}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                serviceStartDate={contractStartDate}
              />
            </Card>
            {selectedDate && (
              <DayStats date={selectedDate} tasks={tasks} />
            )}
          </div>

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
