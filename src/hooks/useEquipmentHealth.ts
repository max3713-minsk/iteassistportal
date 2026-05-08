import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { calculateHealthScore, HealthResult } from "@/lib/health-score";

/**
 * Загружает данные за 30 дней и возвращает map equipmentId -> HealthResult.
 * Все вычисления — на клиенте, без дополнительных запросов на каждое устройство.
 */
export function useEquipmentHealth(equipment: any[] | undefined) {
  return useQuery({
    queryKey: ["equipment-health", (equipment ?? []).map((e) => e.id).join(",")],
    enabled: !!equipment && equipment.length > 0,
    queryFn: async () => {
      const ids = (equipment ?? []).map((e) => e.id);
      const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();

      const [{ data: tickets }, { data: protocols }] = await Promise.all([
        supabase
          .from("tickets")
          .select("equipment_id, request_type, created_at, sla_deadline, resolved_at, status")
          .in("equipment_id", ids)
          .gte("created_at", since),
        supabase
          .from("protocol_items")
          .select("equipment_id, completed_at, status")
          .in("equipment_id", ids)
          .eq("status", "done")
          .order("completed_at", { ascending: false }),
      ]);

      const incidentsByEq = new Map<string, number>();
      const slaByEq = new Map<string, number>();
      (tickets ?? []).forEach((t: any) => {
        if (!t.equipment_id) return;
        if (t.request_type === "incident") {
          incidentsByEq.set(t.equipment_id, (incidentsByEq.get(t.equipment_id) ?? 0) + 1);
        }
        if (t.sla_deadline && (!t.resolved_at || new Date(t.resolved_at) > new Date(t.sla_deadline))) {
          slaByEq.set(t.equipment_id, (slaByEq.get(t.equipment_id) ?? 0) + 1);
        }
      });

      const lastTOByEq = new Map<string, string>();
      (protocols ?? []).forEach((p: any) => {
        if (!p.equipment_id || !p.completed_at) return;
        if (!lastTOByEq.has(p.equipment_id)) lastTOByEq.set(p.equipment_id, p.completed_at);
      });

      const map: Record<string, HealthResult> = {};
      const now = Date.now();
      (equipment ?? []).forEach((e: any) => {
        const last = lastTOByEq.get(e.id);
        const days = last ? Math.floor((now - new Date(last).getTime()) / 86400000) : null;
        map[e.id] = calculateHealthScore({
          equipment: { created_at: e.created_at, status: e.status },
          incidents30d: incidentsByEq.get(e.id) ?? 0,
          zabbixProblems: 0, // подтянем через Zabbix отдельно (не блокирующе)
          daysSinceLastMaintenance: days,
          slaBreaches30d: slaByEq.get(e.id) ?? 0,
        });
      });
      return map;
    },
    staleTime: 60_000,
  });
}