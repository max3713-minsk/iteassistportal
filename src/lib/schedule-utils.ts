import {
  isWednesday,
  getDay,
  addDays,
  startOfMonth,
  getMonth,
  getYear,
  isBefore,
  isSameDay,
  isWeekend,
} from "date-fns";

export type FrequencyType = "daily" | "weekly" | "monthly" | "quarterly" | "semi_annual" | "on_request";

export const frequencyLabels: Record<string, string> = {
  daily: "Ежедневно",
  weekly: "Еженедельно",
  monthly: "Ежемесячно",
  quarterly: "Ежеквартально",
  semi_annual: "Раз в полгода",
  on_request: "По запросу",
};

export const frequencyColors: Record<string, { bg: string; text: string; dot: string }> = {
  daily: { bg: "bg-blue-500/15 dark:bg-blue-500/25", text: "text-blue-700 dark:text-blue-300", dot: "bg-blue-500" },
  weekly: { bg: "bg-emerald-500/15 dark:bg-emerald-500/25", text: "text-emerald-700 dark:text-emerald-300", dot: "bg-emerald-500" },
  monthly: { bg: "bg-amber-500/15 dark:bg-amber-500/25", text: "text-amber-700 dark:text-amber-300", dot: "bg-amber-500" },
  quarterly: { bg: "bg-purple-500/15 dark:bg-purple-500/25", text: "text-purple-700 dark:text-purple-300", dot: "bg-purple-500" },
  semi_annual: { bg: "bg-cyan-500/15 dark:bg-cyan-500/25", text: "text-cyan-700 dark:text-cyan-300", dot: "bg-cyan-500" },
  on_request: { bg: "bg-muted", text: "text-muted-foreground", dot: "bg-muted-foreground" },
};

/** Get first business day (Mon-Fri) of a given month/year */
function getFirstBusinessDay(year: number, month: number): Date {
  let d = new Date(year, month, 1);
  while (isWeekend(d)) {
    d = addDays(d, 1);
  }
  return d;
}

/** Check if a task with given frequency is scheduled on a particular date */
export function isTaskScheduledOnDate(
  frequency: FrequencyType,
  date: Date,
  _serviceStartDate?: Date
): boolean {
  if (frequency === "on_request") return false;

  // Don't schedule on weekends except daily
  const weekend = isWeekend(date);

  if (frequency === "daily") {
    return !weekend;
  }

  if (frequency === "weekly") {
    return isWednesday(date);
  }

  const year = getYear(date);
  const month = getMonth(date);
  const firstBD = getFirstBusinessDay(year, month);

  if (frequency === "monthly") {
    return isSameDay(date, firstBD);
  }

  if (frequency === "quarterly") {
    // Quarters: Jan(0), Apr(3), Jul(6), Oct(9)
    if ([0, 3, 6, 9].includes(month)) {
      return isSameDay(date, firstBD);
    }
    return false;
  }

  if (frequency === "semi_annual") {
    // Half-year: Jan(0), Jul(6)
    if ([0, 6].includes(month)) {
      return isSameDay(date, firstBD);
    }
    return false;
  }

  return false;
}

/** Get all unique frequency types scheduled on a date */
export function getFrequenciesForDate(
  tasks: { frequency: FrequencyType }[],
  date: Date
): FrequencyType[] {
  const freqs = new Set<FrequencyType>();
  for (const t of tasks) {
    if (isTaskScheduledOnDate(t.frequency, date)) {
      freqs.add(t.frequency);
    }
  }
  return Array.from(freqs);
}

export interface TaskWithCategory {
  id: string;
  title: string;
  description: string | null;
  frequency: FrequencyType;
  category_id: string | null;
  categoryName?: string;
}
