export interface HealthInput {
  equipment: { created_at?: string; status?: string | null };
  incidents30d: number;
  zabbixProblems: number;
  daysSinceLastMaintenance: number | null;
  slaBreaches30d: number;
}

export type HealthGrade = "excellent" | "good" | "fair" | "poor" | "critical";

export interface HealthFactor { name: string; impact: number; description: string }

export interface HealthResult {
  score: number;
  grade: HealthGrade;
  factors: HealthFactor[];
}

export function calculateHealthScore(input: HealthInput): HealthResult {
  let score = 100;
  const factors: HealthFactor[] = [];

  const zbx = Math.min(input.zabbixProblems * 10, 40);
  if (zbx > 0) {
    score -= zbx;
    factors.push({ name: "Проблемы Zabbix", impact: -zbx, description: `${input.zabbixProblems} активных проблем` });
  }

  const inc = Math.min(input.incidents30d * 5, 25);
  if (inc > 0) {
    score -= inc;
    factors.push({ name: "Инциденты", impact: -inc, description: `${input.incidents30d} инцидентов за 30 дней` });
  }

  if (input.daysSinceLastMaintenance !== null) {
    const overdue = Math.max(0, input.daysSinceLastMaintenance - 35);
    const pen = Math.min(overdue, 20);
    if (pen > 0) {
      score -= pen;
      factors.push({ name: "Давность ТО", impact: -pen, description: `Последнее ТО ${input.daysSinceLastMaintenance} дн. назад` });
    }
  } else {
    score -= 15;
    factors.push({ name: "Нет ТО", impact: -15, description: "Плановое ТО не проводилось" });
  }

  const sla = Math.min(input.slaBreaches30d * 3, 15);
  if (sla > 0) {
    score -= sla;
    factors.push({ name: "Нарушения SLA", impact: -sla, description: `${input.slaBreaches30d} нарушений за 30 дней` });
  }

  if (input.equipment.status === "faulty" || input.equipment.status === "decommissioned") {
    score -= 30;
    factors.push({ name: "Неисправность", impact: -30, description: "Устройство помечено как неисправное" });
  }
  if (input.equipment.status === "maintenance") {
    score -= 10;
    factors.push({ name: "На обслуживании", impact: -10, description: "Устройство на плановом обслуживании" });
  }

  score = Math.max(0, Math.min(100, score));
  const grade: HealthGrade =
    score >= 85 ? "excellent" : score >= 70 ? "good" : score >= 50 ? "fair" : score >= 30 ? "poor" : "critical";
  return { score, grade, factors };
}

export const HEALTH_GRADE_CONFIG: Record<HealthGrade, { label: string; color: string; bg: string; ring: string }> = {
  excellent: { label: "Отлично",  color: "hsl(142 70% 40%)", bg: "bg-emerald-500/10", ring: "ring-emerald-500/40" },
  good:      { label: "Хорошо",   color: "hsl(160 60% 40%)", bg: "bg-teal-500/10",    ring: "ring-teal-500/40" },
  fair:      { label: "Удовл.",   color: "hsl(38 92% 50%)",  bg: "bg-amber-500/10",   ring: "ring-amber-500/40" },
  poor:      { label: "Плохо",    color: "hsl(25 95% 53%)",  bg: "bg-orange-500/10",  ring: "ring-orange-500/40" },
  critical:  { label: "Критично", color: "hsl(0 72% 51%)",   bg: "bg-red-500/10",     ring: "ring-red-500/40" },
};