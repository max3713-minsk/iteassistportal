import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const WEEKDAYS = [
  "Воскресенье", "Понедельник", "Вторник", "Среда",
  "Четверг", "Пятница", "Суббота",
];
const MONTHS = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

/**
 * Top-of-dashboard banner: live clock (HH:MM:SS), full date and weekday.
 * Weekday is rendered in the brand red to match portal accent palette.
 */
export function ClockBanner({ className }: { className?: string }) {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  const weekday = WEEKDAYS[now.getDay()];
  const dateStr = `${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border bg-gradient-to-r from-card via-card to-muted/40",
        "px-5 py-4 flex items-center justify-between gap-4 animate-fade-in",
        className,
      )}
    >
      {/* Decorative pulse dot */}
      <span className="absolute left-0 top-0 h-full w-1 bg-primary/70" aria-hidden />
      <div className="flex items-baseline gap-3 min-w-0">
        <div
          className="font-heading font-bold tabular-nums tracking-tight text-4xl md:text-5xl text-foreground"
          aria-label="Текущее время"
        >
          {time}
        </div>
        <div className="hidden sm:flex items-baseline gap-2 text-sm md:text-base">
          <span className="font-semibold text-primary uppercase tracking-wide">
            {weekday}
          </span>
          <span className="text-muted-foreground">·</span>
          <span className="text-foreground/80">{dateStr}</span>
        </div>
      </div>
      <div className="sm:hidden text-right">
        <div className="text-xs font-semibold text-primary uppercase">{weekday}</div>
        <div className="text-xs text-muted-foreground">{dateStr}</div>
      </div>
      {/* Animated background pulse */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/5 blur-3xl animate-pulse"
      />
    </div>
  );
}