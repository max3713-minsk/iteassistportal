import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { priorityColor, priorityLabel, duration } from "./monitoringUtils";

interface Props {
  isZabbixConfigured: boolean;
  onClickEvent?: (event: unknown) => void;
}

interface ZbxEvent {
  eventid: string;
  name: string;
  clock: string;
  severity: string;
  value: string;
  acknowledged: string;
  hosts?: { hostid: string; name: string }[];
}

export default function RecentEventsFeed({ isZabbixConfigured, onClickEvent }: Props) {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["zabbix", "getRecentEvents"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("zabbix-proxy", {
        body: { action: "getRecentEvents" },
      });
      if (error) throw error;
      return (data?.result as ZbxEvent[]) || [];
    },
    enabled: isZabbixConfigured,
    refetchInterval: 30000,
    retry: 1,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          Последние алерты
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-6">
            <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">Свежих алертов нет</p>
          </div>
        ) : (
          <div className="space-y-1">
            {events.slice(0, 10).map((ev) => (
              <div
                key={ev.eventid}
                className="flex items-start gap-3 p-2 rounded hover:bg-muted/40 cursor-pointer transition-colors border-l-2"
                style={{
                  borderLeftColor:
                    parseInt(ev.severity) >= 4 ? "hsl(var(--destructive))"
                    : parseInt(ev.severity) === 3 ? "hsl(38 92% 50%)"
                    : parseInt(ev.severity) === 2 ? "hsl(48 96% 53%)"
                    : "hsl(var(--muted-foreground))",
                }}
                onClick={() => onClickEvent?.(ev)}
              >
                <AlertCircle className={`h-4 w-4 flex-shrink-0 mt-0.5 ${parseInt(ev.severity) >= 4 ? "text-destructive" : "text-amber-500"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{ev.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {ev.hosts?.[0]?.name || "—"} • {new Date(parseInt(ev.clock) * 1000).toLocaleTimeString("ru-RU")}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant={priorityColor(ev.severity) as "default"} className="text-[10px]">
                    {priorityLabel(ev.severity)}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">{duration(ev.clock)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
