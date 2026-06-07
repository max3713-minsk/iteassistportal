import { Fragment, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  problems: any[];
  /** Опционально: события из notification_log (event_type ~ alert) для глубокой истории */
  events?: { created_at: string }[];
}

const DAYS = ["ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ", "ВС"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

/**
 * Heatmap проблем по дням недели × часам суток.
 * Источник: Zabbix problems (поле clock в секундах) + опц. notification_log.
 */
export default function ProblemsHeatmap({ problems, events = [] }: Props) {
  const grid = useMemo(() => {
    // [day 0..6 (Mon..Sun)][hour 0..23] = count
    const g: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    const push = (d: Date) => {
      // JS getDay: 0..6 (Sun..Sat). Преобразуем к Пн..Вс.
      const jsDay = d.getDay();
      const day = (jsDay + 6) % 7;
      const hour = d.getHours();
      g[day][hour] += 1;
    };
    for (const p of problems ?? []) {
      const ts = parseInt(p?.clock || p?.lastchange || "0", 10);
      if (!ts) continue;
      push(new Date(ts * 1000));
    }
    for (const e of events ?? []) {
      if (!e?.created_at) continue;
      push(new Date(e.created_at));
    }
    return g;
  }, [problems, events]);

  const max = useMemo(() => {
    let m = 0;
    for (const r of grid) for (const c of r) if (c > m) m = c;
    return m;
  }, [grid]);

  const total = useMemo(
    () => grid.reduce((s, r) => s + r.reduce((a, b) => a + b, 0), 0),
    [grid],
  );

  // peak cell
  const peak = useMemo(() => {
    let best = { d: 0, h: 0, v: 0 };
    grid.forEach((r, d) => r.forEach((v, h) => { if (v > best.v) best = { d, h, v }; }));
    return best;
  }, [grid]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-500" />
          Тепловая карта проблем
          <span className="ml-auto text-xs font-normal text-muted-foreground">
            всего: {total}
            {max > 0 && ` · пик ${DAYS[peak.d]} ${String(peak.h).padStart(2, "0")}:00 (${peak.v})`}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Нет данных за выбранный период.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="inline-grid gap-[3px] min-w-full" style={{ gridTemplateColumns: "auto repeat(24, minmax(20px, 1fr))" }}>
              <div />
              {HOURS.map((h) => (
                <div key={h} className="text-[10px] text-muted-foreground text-center font-mono">
                  {h % 3 === 0 ? String(h).padStart(2, "0") : ""}
                </div>
              ))}
              {DAYS.map((d, di) => (
                <Fragment key={d}>
                  <div className="text-[11px] text-muted-foreground pr-2 flex items-center">{d}</div>
                  {HOURS.map((h) => {
                    const v = grid[di][h];
                    const intensity = max > 0 ? v / max : 0;
                    return (
                      <div
                        key={`c${di}-${h}`}
                        title={`${d} ${String(h).padStart(2, "0")}:00 — ${v} событий`}
                        className={cn(
                          "aspect-square rounded-[3px] transition-all hover:ring-2 hover:ring-primary/50 cursor-default",
                        )}
                        style={{
                          background: v === 0
                            ? "hsl(var(--muted) / 0.3)"
                            : `hsl(var(--destructive) / ${0.15 + intensity * 0.75})`,
                        }}
                      />
                    );
                  })}
                </Fragment>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-4 text-[11px] text-muted-foreground">
              <span>меньше</span>
              {[0.15, 0.35, 0.55, 0.75, 0.95].map((a) => (
                <span key={a} className="h-3 w-5 rounded-[2px]" style={{ background: `hsl(var(--destructive) / ${a})` }} />
              ))}
              <span>больше</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
