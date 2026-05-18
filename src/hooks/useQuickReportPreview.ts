import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter } from "date-fns";
import { isTaskScheduledOnDate, buildHolidayMap, type HolidayEntry } from "@/lib/schedule-utils";
import type { Database } from "@/integrations/supabase/types";

export type Frequency = Database["public"]["Enums"]["maintenance_frequency"];
export const SCHEDULED_FREQUENCIES: Frequency[] = ["daily", "weekly", "monthly", "quarterly", "semi_annual"];

export const FREQ_LABELS: Record<string, string> = {
  daily: "Ежедневный",
  weekly: "Еженедельный",
  monthly: "Ежемесячный",
  quarterly: "Квартальный",
  semi_annual: "Полугодовой",
  on_request: "По запросу",
};

export function getPeriod(freq: Frequency, d: Date) {
  const s = format(d, "yyyy-MM-dd");
  switch (freq) {
    case "daily": return { start: s, end: s };
    case "weekly": return { start: format(startOfWeek(d, { weekStartsOn: 1 }), "yyyy-MM-dd"), end: format(endOfWeek(d, { weekStartsOn: 1 }), "yyyy-MM-dd") };
    case "monthly": return { start: format(startOfMonth(d), "yyyy-MM-dd"), end: format(endOfMonth(d), "yyyy-MM-dd") };
    case "quarterly": return { start: format(startOfQuarter(d), "yyyy-MM-dd"), end: format(endOfQuarter(d), "yyyy-MM-dd") };
    case "semi_annual": {
      const m = d.getMonth(), y = d.getFullYear();
      return m < 6 ? { start: `${y}-01-01`, end: `${y}-06-30` } : { start: `${y}-07-01`, end: `${y}-12-31` };
    }
    default: return { start: s, end: s };
  }
}

export interface PreviewItem {
  siteId: string;
  siteName: string;
  freq: Frequency;
  freqLabel: string;
  exists: boolean;
  existingStatus?: string | null;
}

export function useQuickReportPreview(siteIds?: string[]) {
  const today = useMemo(() => new Date(), []);
  const todayStr = format(today, "yyyy-MM-dd");

  const { data: holidays = [] } = useQuery({
    queryKey: ["holidays-BY"],
    queryFn: async () => {
      const { data } = await supabase.from("holidays").select("date,name,day_type").eq("country_code", "BY");
      return (data ?? []) as HolidayEntry[];
    },
    staleTime: 1000 * 60 * 60,
  });

  const holidayMap = useMemo(() => buildHolidayMap(holidays as HolidayEntry[]), [holidays]);

  const scheduledFreqs = useMemo(
    () => SCHEDULED_FREQUENCIES.filter((f) => isTaskScheduledOnDate(f, today, undefined, holidayMap)),
    [holidayMap, today]
  );

  const { data: allSites = [] } = useQuery({
    queryKey: ["sites-quick-report"],
    queryFn: async () => {
      const { data } = await supabase.from("sites").select("id,name,organization_id");
      return data ?? [];
    },
  });

  const sites = useMemo(() => {
    if (!siteIds || siteIds.length === 0) return allSites;
    return allSites.filter((s) => siteIds.includes(s.id));
  }, [allSites, siteIds]);

  const { data: existingToday = [] } = useQuery({
    queryKey: ["protocols-today", todayStr],
    queryFn: async () => {
      const { data } = await supabase
        .from("maintenance_protocols")
        .select("id, site_id, frequency, period_start, period_end, status")
        .eq("report_date", todayStr);
      return data ?? [];
    },
    refetchInterval: 30_000,
  });

  const previewItems: PreviewItem[] = useMemo(() => {
    return sites.flatMap((site) =>
      scheduledFreqs.map((freq) => {
        const period = getPeriod(freq, today);
        const existing = existingToday.find(
          (p) =>
            p.site_id === site.id &&
            p.frequency === freq &&
            p.period_start === period.start &&
            p.period_end === period.end
        );
        return {
          siteId: site.id,
          siteName: site.name,
          freq,
          freqLabel: FREQ_LABELS[freq],
          exists: !!existing,
          existingStatus: existing?.status,
        };
      })
    );
  }, [sites, scheduledFreqs, existingToday, today]);

  const scheduledCount = previewItems.filter((i) => !i.exists).length;

  return { previewItems, scheduledCount, sites, scheduledFreqs, today };
}