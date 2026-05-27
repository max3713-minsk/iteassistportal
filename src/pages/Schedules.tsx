import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, CalendarDays } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import MaintenanceCalendar from "@/components/schedules/MaintenanceCalendar";
import DayDetail from "@/components/schedules/DayDetail";
import DayStats from "@/components/schedules/DayStats";
import { useHolidays } from "@/hooks/useHolidays";
import HolidaysPanel from "@/pages/Holidays";
import {
  frequencyColors,
  frequencyLabels,
  isTaskScheduledOnDate,
  type TaskWithCategory,
  type FrequencyType,
} from "@/lib/schedule-utils";
import { format, addDays, startOfDay } from "date-fns";

export default function Schedules() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [contractId, setContractId] = useState<string>("");
  const [tab, setTab] = useState("calendar");
  const { holidayMap } = useHolidays("BY");

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

  // Past protocols by period — used to flag overdue (incomplete) dates in the calendar.
  const { data: protocols = [] } = useQuery({
    queryKey: ["maintenance-protocols-coverage", activeContract?.organization_id],
    queryFn: async () => {
      if (!activeContract?.organization_id) return [];
      const { data } = await supabase
        .from("maintenance_protocols")
        .select("period_start, period_end, frequency, status")
        .eq("customer_org_id", activeContract.organization_id);
      return data ?? [];
    },
    enabled: !!activeContract?.organization_id,
  });

  // For each freq, set of "yyyy-MM-dd" days covered by a completed protocol.
  const completedDaysByFreq = useMemo(() => {
    const map = new Map<FrequencyType, Set<string>>();
    for (const p of protocols as any[]) {
      if (p.status !== "completed") continue;
      const set = map.get(p.frequency as FrequencyType) ?? new Set<string>();
      let d = startOfDay(new Date(p.period_start));
      const end = startOfDay(new Date(p.period_end));
      while (d <= end) { set.add(format(d, "yyyy-MM-dd")); d = addDays(d, 1); }
      map.set(p.frequency as FrequencyType, set);
    }
    return map;
  }, [protocols]);

  // Compute incomplete past dates: any past (or today) day where a task is scheduled
  // and there is NO completed protocol of that frequency covering the day.
  const incompleteDates = useMemo(() => {
    const today = startOfDay(new Date());
    const out = new Set<string>();
    if (!contractStartDate) return out;
    let d = startOfDay(contractStartDate);
    while (d <= today) {
      for (const t of tasks) {
        if (!isTaskScheduledOnDate(t.frequency, d, contractStartDate, holidayMap)) continue;
        const covered = completedDaysByFreq.get(t.frequency)?.has(format(d, "yyyy-MM-dd"));
        if (!covered) { out.add(format(d, "yyyy-MM-dd")); break; }
      }
      d = addDays(d, 1);
    }
    return out;
  }, [tasks, contractStartDate, holidayMap, completedDaysByFreq]);

  const legend: FrequencyType[] = ["daily", "weekly", "monthly", "quarterly", "semi_annual"];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="font-heading text-2xl font-bold">Календарь ТО</h1>
        {tab === "calendar" && contracts.length > 0 && (
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

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="calendar"><CalendarIcon className="h-3.5 w-3.5 mr-1.5" />Календарь</TabsTrigger>
          <TabsTrigger value="holidays"><CalendarDays className="h-3.5 w-3.5 mr-1.5" />Праздники (РБ)</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
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
                holidays={holidayMap}
                incompleteDates={incompleteDates}
              />
            </Card>
            {selectedDate && (
              <DayStats date={selectedDate} tasks={tasks} holidays={holidayMap} />
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
                holidays={holidayMap}
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
        </TabsContent>

        <TabsContent value="holidays">
          <HolidaysPanel embedded />
        </TabsContent>
      </Tabs>
    </div>
  );
}
