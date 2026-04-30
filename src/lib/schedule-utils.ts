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
  format,
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

/** Holiday entry from DB. day_type: 'holiday' (нерабочий) | 'workday' (рабочая суббота) | 'short_day' */
export interface HolidayEntry {
  date: string; // yyyy-MM-dd
  name: string;
  day_type: "holiday" | "workday" | "short_day";
}

export type HolidayMap = Map<string, HolidayEntry>;

export function buildHolidayMap(entries: HolidayEntry[] | undefined | null): HolidayMap {
  const m = new Map<string, HolidayEntry>();
  for (const e of entries ?? []) m.set(e.date, e);
  return m;
}

/** Is the date a non-working day considering holidays + workday transfers */
export function isNonWorkingDay(date: Date, holidays?: HolidayMap): boolean {
  const key = format(date, "yyyy-MM-dd");
  const h = holidays?.get(key);
  if (h?.day_type === "holiday") return true;
  if (h?.day_type === "workday") return false; // перенос: рабочая суббота
  return isWeekend(date);
}

/** Find next working day on or after date (skipping holidays/weekends, respecting transfers) */
export function nextWorkingDay(date: Date, holidays?: HolidayMap, maxIter = 30): Date {
  let d = date;
  for (let i = 0; i < maxIter; i++) {
    if (!isNonWorkingDay(d, holidays)) return d;
    d = addDays(d, 1);
  }
  return d;
}

/** Returns true if `date` is the rescheduled (shifted) execution day for a task that
 *  originally fell on a holiday/weekend. Used by the calendar to draw the dot on the new day. */
export function isShiftedTargetDate(
  frequency: FrequencyType,
  date: Date,
  holidays?: HolidayMap,
  serviceStartDate?: Date,
): boolean {
  if (frequency === "on_request" || frequency === "daily") return false;
  // Today must itself be a working day
  if (isNonWorkingDay(date, holidays)) return false;
  // Walk backward — find the most recent original scheduled date that was non-working,
  // making sure no working day exists in between (which would have absorbed the shift).
  let probe = addDays(date, -1);
  for (let i = 0; i < 14; i++) {
    if (!isNonWorkingDay(probe, holidays)) return false; // working day in between → not a shift target
    if (isOriginalScheduledDate(frequency, probe, serviceStartDate)) return true;
    probe = addDays(probe, -1);
  }
  return false;
}

/** Get first business day (Mon-Fri) of a given month/year */
function getFirstBusinessDay(year: number, month: number, holidays?: HolidayMap): Date {
  let d = new Date(year, month, 1);
  while (isNonWorkingDay(d, holidays)) {
    d = addDays(d, 1);
  }
  return d;
}

/** Original (unshifted) scheduled date check — used internally and for shift detection */
function isOriginalScheduledDate(
  frequency: FrequencyType,
  date: Date,
  serviceStartDate?: Date,
): boolean {
  if (frequency === "on_request") return false;
  if (serviceStartDate && isBefore(date, serviceStartDate) && !isSameDay(date, serviceStartDate)) return false;

  if (frequency === "daily") return !isWeekend(date);
  if (frequency === "weekly") return isWednesday(date);

  const year = getYear(date);
  const month = getMonth(date);
  // For "original" — use plain weekend rule (no holiday awareness) so shifts can be detected
  let d = new Date(year, month, 1);
  while (isWeekend(d)) d = addDays(d, 1);
  const firstBD = d;

  if (frequency === "monthly") return isSameDay(date, firstBD);
  if (frequency === "quarterly") return [0, 3, 6, 9].includes(month) && isSameDay(date, firstBD);
  if (frequency === "semi_annual") return [0, 6].includes(month) && isSameDay(date, firstBD);
  return false;
}

/** Check if a task with given frequency is scheduled on a particular date.
 *  When `holidays` provided: tasks falling on a holiday/weekend are shifted to next working day. */
export function isTaskScheduledOnDate(
  frequency: FrequencyType,
  date: Date,
  serviceStartDate?: Date,
  holidays?: HolidayMap,
): boolean {
  if (frequency === "on_request") return false;

  // Don't schedule before contract start date
  if (serviceStartDate && isBefore(date, serviceStartDate) && !isSameDay(date, serviceStartDate)) {
    return false;
  }

  // Daily — every working day (skip holidays + weekends, respect transfers)
  if (frequency === "daily") {
    return !isNonWorkingDay(date, holidays);
  }

  // Today must be a working day to host any scheduled task
  if (isNonWorkingDay(date, holidays)) return false;

  // Case 1: original scheduled date and it's a working day
  if (isOriginalScheduledDate(frequency, date, serviceStartDate)) {
    return true;
  }

  // Case 2: shifted target — original date fell on holiday/weekend, this is next working day
  if (holidays && isShiftedTargetDate(frequency, date, holidays, serviceStartDate)) {
    return true;
  }

  return false;
}

/** Get all unique frequency types scheduled on a date */
export function getFrequenciesForDate(
  tasks: { frequency: FrequencyType }[],
  date: Date,
  holidays?: HolidayMap,
): FrequencyType[] {
  const freqs = new Set<FrequencyType>();
  for (const t of tasks) {
    if (isTaskScheduledOnDate(t.frequency, date, undefined, holidays)) {
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
