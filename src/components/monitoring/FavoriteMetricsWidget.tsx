import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, X, BarChart3, Activity } from "lucide-react";
import { useFavoriteMetrics } from "@/hooks/useFavoriteMetrics";
import { useMetricTranslations } from "@/hooks/useMetricTranslations";
import { formatItemValue } from "./formatMetric";
import MetricGraphDialog from "./MetricGraphDialog";

/** Виджет «Избранные метрики» — последние значения, по клику открывает график. */
export default function FavoriteMetricsWidget() {
  const { favorites, remove } = useFavoriteMetrics();
  const { translate } = useMetricTranslations();
  const [openMetric, setOpenMetric] = useState<any>(null);

  const itemIds = favorites.map((f) => f.itemid);

  // Подтягиваем последние значения для всех избранных метрик
  const { data: latestMap = {} } = useQuery({
    queryKey: ["favorite-metrics-values", itemIds.join(",")],
    queryFn: async () => {
      if (itemIds.length === 0) return {};
      const { data, error } = await supabase.functions.invoke("zabbix-proxy", {
        body: { action: "getItems", params: { itemids: itemIds, output: ["itemid", "lastvalue", "lastclock", "units", "name", "key_"] } },
      });
      if (error) return {};
      const map: Record<string, any> = {};
      (data?.result || []).forEach((it: any) => { map[it.itemid] = it; });
      return map;
    },
    enabled: itemIds.length > 0,
    refetchInterval: 30000,
  });

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="widget-drag-handle cursor-move pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
          Избранные метрики
          <Badge variant="outline" className="text-[10px] ml-1">{favorites.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto" onMouseDown={(e) => e.stopPropagation()}>
        {favorites.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground space-y-1">
            <Activity className="h-8 w-8 mx-auto opacity-30" />
            <p>Нет избранных метрик</p>
            <p className="text-xs">
              Откройте «Хосты» → выберите хост → нажмите ⭐ рядом с метрикой
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {favorites.map((f) => {
              const latest = latestMap[f.itemid];
              const value = latest
                ? formatItemValue({ lastvalue: latest.lastvalue, units: latest.units, key_: f.item_key, name: f.item_name })
                : "—";
              const display = translate({ key_: f.item_key, name: f.item_name });
              return (
                <div
                  key={f.id}
                  className="flex items-center gap-3 p-2 rounded border hover:bg-muted/40 group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{display}</p>
                    <p className="text-xs text-muted-foreground truncate">{f.host_name}</p>
                  </div>
                  <p className="font-mono text-sm font-bold whitespace-nowrap">{value}</p>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      title="Открыть график"
                      onClick={() => setOpenMetric({
                        itemid: f.itemid,
                        name: f.item_name,
                        key_: f.item_key,
                        units: f.units || undefined,
                        hostid: f.zabbix_host_id,
                        hostName: f.host_name,
                        zabbixHostId: f.zabbix_host_id,
                      })}
                    >
                      <BarChart3 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive"
                      title="Убрать"
                      onClick={() => remove(f.itemid)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <MetricGraphDialog
        open={!!openMetric}
        onClose={() => setOpenMetric(null)}
        metric={openMetric}
      />
    </Card>
  );
}