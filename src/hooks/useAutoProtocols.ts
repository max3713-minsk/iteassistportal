import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter } from "date-fns";
import { isTaskScheduledOnDate } from "@/lib/schedule-utils";
import type { Database } from "@/integrations/supabase/types";

type Frequency = Database["public"]["Enums"]["maintenance_frequency"];

function getPeriod(frequency: Frequency, d: Date): { start: string; end: string } {
  const dateStr = format(d, "yyyy-MM-dd");
  switch (frequency) {
    case "daily":
      return { start: dateStr, end: dateStr };
    case "weekly":
      return {
        start: format(startOfWeek(d, { weekStartsOn: 1 }), "yyyy-MM-dd"),
        end: format(endOfWeek(d, { weekStartsOn: 1 }), "yyyy-MM-dd"),
      };
    case "monthly":
      return {
        start: format(startOfMonth(d), "yyyy-MM-dd"),
        end: format(endOfMonth(d), "yyyy-MM-dd"),
      };
    case "quarterly":
      return {
        start: format(startOfQuarter(d), "yyyy-MM-dd"),
        end: format(endOfQuarter(d), "yyyy-MM-dd"),
      };
    case "semi_annual": {
      const month = d.getMonth();
      const year = d.getFullYear();
      return month < 6
        ? { start: `${year}-01-01`, end: `${year}-06-30` }
        : { start: `${year}-07-01`, end: `${year}-12-31` };
    }
    default:
      return { start: dateStr, end: dateStr };
  }
}

const SCHEDULED_FREQUENCIES: Frequency[] = ["daily", "weekly", "monthly", "quarterly", "semi_annual"];

export function useAutoProtocols() {
  const { session, isStaff } = useAuth();
  const qc = useQueryClient();
  const ran = useRef(false);

  useEffect(() => {
    if (!session?.user?.id || !isStaff || ran.current) return;
    ran.current = true;

    (async () => {
      const today = new Date();
      const todayStr = format(today, "yyyy-MM-dd");

      // Which frequencies are scheduled today?
      const scheduledToday = SCHEDULED_FREQUENCIES.filter((f) =>
        isTaskScheduledOnDate(f, today)
      );
      if (scheduledToday.length === 0) return;

      // Get all sites
      const { data: sites } = await supabase.from("sites").select("id");
      if (!sites?.length) return;

      for (const site of sites) {
        for (const freq of scheduledToday) {
          const period = getPeriod(freq, today);

          // Check if protocol already exists for this site/frequency/period
          const { data: existing } = await supabase
            .from("maintenance_protocols")
            .select("id")
            .eq("site_id", site.id)
            .eq("frequency", freq)
            .eq("period_start", period.start)
            .eq("period_end", period.end)
            .limit(1);

          if (existing && existing.length > 0) continue;

          // Create protocol
          const { data: protocol, error: pErr } = await supabase
            .from("maintenance_protocols")
            .insert({
              site_id: site.id,
              frequency: freq,
              period_start: period.start,
              period_end: period.end,
              status: "in_progress",
              created_by: session.user.id,
            })
            .select("id")
            .single();

          if (pErr || !protocol) continue;

          // Get equipment + tasks and generate items
          const [{ data: equipment }, { data: tasks }] = await Promise.all([
            supabase.from("equipment").select("id, category_id").eq("site_id", site.id),
            supabase.from("maintenance_tasks").select("id, category_id").eq("frequency", freq),
          ]);

          if (!equipment?.length || !tasks?.length) continue;

          const items: { protocol_id: string; equipment_id: string; task_id: string }[] = [];
          for (const eq of equipment) {
            for (const task of tasks) {
              if (!task.category_id || task.category_id === eq.category_id) {
                items.push({ protocol_id: protocol.id, equipment_id: eq.id, task_id: task.id });
              }
            }
          }

          if (items.length > 0) {
            await supabase.from("protocol_items").insert(items);
          }
        }
      }

      qc.invalidateQueries({ queryKey: ["protocols"] });
    })();
  }, [session?.user?.id, isStaff, qc]);
}
