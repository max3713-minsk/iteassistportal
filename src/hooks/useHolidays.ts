import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { buildHolidayMap, type HolidayEntry } from "@/lib/schedule-utils";

export function useHolidays(country = "BY") {
  const q = useQuery({
    queryKey: ["holidays", country],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("holidays")
        .select("date, name, day_type")
        .eq("country_code", country)
        .order("date");
      if (error) throw error;
      return (data ?? []) as HolidayEntry[];
    },
    staleTime: 5 * 60 * 1000,
  });

  return { entries: q.data ?? [], holidayMap: buildHolidayMap(q.data), isLoading: q.isLoading };
}