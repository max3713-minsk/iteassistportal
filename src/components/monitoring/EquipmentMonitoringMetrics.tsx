import { useQuery } from "@tanstack/react-query";
import { invokeZabbix } from "@/lib/zabbix-invoke";
import { supabase } from "@/integrations/supabase/client";
import { Cpu, MemoryStick, HardDrive, Loader2, AlertCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatItemValue, toPercent, percentColor } from "./formatMetric";

interface Props {
  zabbixHostId: string;
}

interface ZabbixItem {
  itemid: string;
  name: string;
  key_: string;
  lastvalue: string;
  lastclock: string;
  units: string;
}

function findMetric(items: ZabbixItem[], patterns: RegExp[]): ZabbixItem | null {
  for (const p of patterns) {
    const found = items.find((i) => p.test(i.key_) || p.test(i.name));
    if (found) return found;
  }
  return null;
}

export default function EquipmentMonitoringMetrics({ zabbixHostId }: Props) {
  const { data: items = [], isLoading, error } = useQuery({
    queryKey: ["host-items-by-zbx", zabbixHostId],
    queryFn: async () => {
      const { data, error } = await invokeZabbix( {
        body: { action: "getItemsByHost", params: { hostid: zabbixHostId } },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return (data?.result ?? []) as ZabbixItem[];
    },
    refetchInterval: 60000,
    staleTime: 30000,
    retry: 1,
  });

  if (isLoading) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
      </span>
    );
  }

  if (error) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <AlertCircle className="h-3 w-3" />
          </span>
        </TooltipTrigger>
        <TooltipContent>Нет связи с Zabbix</TooltipContent>
      </Tooltip>
    );
  }

  const cpu = findMetric(items, [/system\.cpu\.util/, /cpu.*util/i, /processor.*load/i]);
  const mem = findMetric(items, [/vm\.memory\.util/, /memory.*util/i, /mem.*pused/i]);
  const disk = findMetric(items, [/vfs\.fs\.pused/, /disk.*pused/i, /storage.*used/i]);

  const metrics = [
    { icon: Cpu, label: "CPU", item: cpu },
    { icon: MemoryStick, label: "RAM", item: mem },
    { icon: HardDrive, label: "Disk", item: disk },
  ];

  return (
    <div className="flex items-center gap-2.5 text-xs">
      {metrics.map(({ icon: Icon, label, item }) => {
        const pct = toPercent(item ? { ...item, units: "%" } : null);
        return (
        <Tooltip key={label}>
          <TooltipTrigger asChild>
            <span className={`inline-flex items-center gap-1 ${percentColor(pct)} cursor-help`}>
              <Icon className="h-3 w-3" />
              <span className="font-mono font-medium">{pct == null ? "—" : `${pct.toFixed(0)}%`}</span>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            {item ? (
              <div className="text-xs">
                <div className="font-medium">{item.name}</div>
                <div className="font-mono text-muted-foreground">{item.key_}</div>
                <div className="mt-1">Текущее: <span className="font-mono">{formatItemValue(item)}</span></div>
                {item.lastclock && (
                  <div className="text-muted-foreground mt-1">
                    {new Date(parseInt(item.lastclock) * 1000).toLocaleString("ru-RU")}
                  </div>
                )}
              </div>
            ) : (
              <span>Метрика {label} не найдена в Zabbix</span>
            )}
          </TooltipContent>
        </Tooltip>
        );
      })}
    </div>
  );
}

