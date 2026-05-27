import { useMemo, useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  isBefore,
  startOfDay,
  addMonths,
  subMonths,
} from "date-fns";
import { ru } from "date-fns/locale";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  frequencyColors,
  frequencyLabels,
  isTaskScheduledOnDate,
  isNonWorkingDay,
  type FrequencyType,
  type TaskWithCategory,
  type HolidayMap,
} from "@/lib/schedule-utils";

interface Props {
  tasks: TaskWithCategory[];
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  serviceStartDate?: Date;
  holidays?: HolidayMap;
  /** Set of "yyyy-MM-dd" past/today dates that have at least one task with no completed protocol covering it. */
  incompleteDates?: Set<string>;
}

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export default function MaintenanceCalendar({ tasks, selectedDate, onSelectDate, serviceStartDate, holidays, incompleteDates }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const today = startOfDay(new Date());
  const startBoundary = serviceStartDate ? startOfDay(serviceStartDate) : null;

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days: Date[] = [];
    let d = calStart;
    while (d <= calEnd) {
      days.push(d);
      d = addDays(d, 1);
    }
    return days;
  }, [currentMonth]);

  // Precompute frequencies per day
  const dayFrequencies = useMemo(() => {
    const map = new Map<string, Set<FrequencyType>>();
    for (const day of calendarDays) {
      const key = format(day, "yyyy-MM-dd");
      const freqs = new Set<FrequencyType>();
      for (const t of tasks) {
        if (isTaskScheduledOnDate(t.frequency, day, serviceStartDate, holidays)) {
          freqs.add(t.frequency);
        }
      }
      if (freqs.size > 0) map.set(key, freqs);
    }
    return map;
  }, [calendarDays, tasks, serviceStartDate, holidays]);

  const isPast = (date: Date) => isBefore(date, today) && !isSameDay(date, today);
  const isBeforeStart = (date: Date) => startBoundary ? isBefore(date, startBoundary) && !isSameDay(date, startBoundary) : false;

  // Frequency priority for dot ordering
  const freqOrder: FrequencyType[] = ["daily", "weekly", "monthly", "quarterly", "semi_annual"];

  return (
    <div className="select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button variant="outline" size="sm" className="h-8" onClick={() => setCurrentMonth(new Date())}>
            <CalendarDays className="h-3.5 w-3.5 mr-1" /> Сегодня
          </Button>
        </div>
        <h2 className="font-heading text-lg font-semibold capitalize">
          {format(currentMonth, "LLLL yyyy", { locale: ru })}
        </h2>
        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((wd) => (
          <div key={wd} className="text-center text-xs font-medium text-muted-foreground py-1">
            {wd}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const inMonth = isSameMonth(day, currentMonth);
          const past = isPast(day);
          const beforeStart = isBeforeStart(day);
          const isToday = isSameDay(day, today);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const freqs = dayFrequencies.get(key);
          const hasEvents = freqs && freqs.size > 0;
          const sortedFreqs = freqs
            ? freqOrder.filter((f) => freqs.has(f))
            : [];
          const holiday = holidays?.get(key);
          const isHoliday = holiday?.day_type === "holiday";
          const isWorkdayTransfer = holiday?.day_type === "workday";
          const isIncomplete = (past || isToday) && incompleteDates?.has(key);

          return (
            <button
              key={key}
              onClick={() => !past && !beforeStart && inMonth && onSelectDate(day)}
              disabled={past || beforeStart || !inMonth}
              className={cn(
                "relative flex flex-col items-center justify-start rounded-lg p-1 min-h-[60px] md:min-h-[72px] transition-all text-sm border border-transparent",
                !inMonth && "opacity-20 cursor-default",
                inMonth && past && "opacity-40 cursor-default bg-muted/50",
                inMonth && beforeStart && "opacity-30 cursor-not-allowed bg-muted/30",
                inMonth && !past && !beforeStart && "hover:border-primary/40 cursor-pointer",
                isToday && "ring-2 ring-primary/50 font-bold",
                isSelected && "border-primary bg-primary/5 dark:bg-primary/10 shadow-sm",
                inMonth && isHoliday && "bg-red-500/10 dark:bg-red-500/15",
                inMonth && isWorkdayTransfer && "bg-blue-500/10 dark:bg-blue-500/15",
              )}
              title={
                beforeStart ? "До даты старта договора"
                : holiday ? `${holiday.name}${isHoliday ? " (нерабочий)" : isWorkdayTransfer ? " (рабочий перенос)" : ""}`
                : undefined
              }
            >
              <span
                className={cn(
                  "text-xs md:text-sm leading-none mb-1",
                  isToday && "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center",
                  past && "text-muted-foreground",
                  inMonth && isHoliday && !isToday && "text-red-600 dark:text-red-400 font-medium",
                )}
              >
                {format(day, "d")}
              </span>
              {inMonth && holiday && (
                <span className={cn(
                  "text-[9px] leading-none truncate max-w-full px-0.5",
                  isHoliday ? "text-red-600/80 dark:text-red-400/80" : "text-blue-600/80 dark:text-blue-400/80",
                )}>
                  {holiday.name.length > 10 ? holiday.name.slice(0, 9) + "…" : holiday.name}
                </span>
              )}

              {/* Frequency dots */}
              {hasEvents && inMonth && (
                <div className="flex flex-wrap gap-0.5 justify-center mt-auto">
                  {sortedFreqs.map((f) => (
                    <span
                      key={f}
                      className={cn(
                        "w-2 h-2 rounded-full",
                        past ? "bg-muted-foreground/30" : frequencyColors[f].dot,
                      )}
                    />
                  ))}
                </div>
              )}
              {/* Incomplete-protocol indicator (past or today only) */}
              {isIncomplete && inMonth && (
                <span
                  className="absolute top-0.5 right-0.5 text-amber-500"
                  title="Есть незавершённые протоколы на эту дату"
                >
                  <AlertTriangle className="h-3 w-3" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-3 border-t flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        {freqOrder.map((f) => (
          <div key={f} className="flex items-center gap-1.5">
            <span className={cn("w-2.5 h-2.5 rounded-full", frequencyColors[f].dot)} />
            <span>{frequencyLabels[f]}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-red-500/30 border border-red-500/50" />
          <span>Праздник</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-blue-500/30 border border-blue-500/50" />
          <span>Рабочий перенос</span>
        </div>
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="h-3 w-3 text-amber-500" />
          <span>Незавершённый протокол</span>
        </div>
      </div>
    </div>
  );
}
