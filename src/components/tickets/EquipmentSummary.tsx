import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Server, ShieldCheck, ShieldAlert, ShieldX, Activity, ExternalLink, MapPin, Hash, Cpu } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ru } from "date-fns/locale";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  active:       { label: "Активно",        cls: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30" },
  maintenance:  { label: "На обслуживании", cls: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30" },
  broken:       { label: "Неисправно",      cls: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30" },
  decommissioned:{ label: "Списано",        cls: "bg-muted text-muted-foreground border-border" },
  reserve:      { label: "Резерв",          cls: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30" },
};

function warrantyState(until: string | null) {
  if (!until) return { icon: ShieldAlert, label: "Гарантия не указана", cls: "text-muted-foreground", days: null as number | null };
  const days = differenceInDays(new Date(until), new Date());
  if (days < 0) return { icon: ShieldX, label: `Истекла ${Math.abs(days)} дн. назад`, cls: "text-destructive", days };
  if (days <= 30) return { icon: ShieldAlert, label: `Истекает через ${days} дн.`, cls: "text-yellow-600 dark:text-yellow-400", days };
  return { icon: ShieldCheck, label: `Действует до ${format(new Date(until), "dd.MM.yyyy")}`, cls: "text-green-600 dark:text-green-400", days };
}

export function EquipmentSummary({ equipmentId }: { equipmentId: string | null }) {
  const { data: eq, isLoading } = useQuery({
    queryKey: ["ticket-equipment-summary", equipmentId],
    enabled: !!equipmentId,
    queryFn: async () => {
      const { data } = await supabase
        .from("equipment")
        .select("*, sites(name, city), equipment_categories(name, icon), organizations(short_name, name)")
        .eq("id", equipmentId!)
        .maybeSingle();
      return data;
    },
  });

  const { data: monLink } = useQuery({
    queryKey: ["ticket-equipment-monlink", equipmentId],
    enabled: !!equipmentId,
    queryFn: async () => {
      const { data } = await supabase
        .from("monitoring_host_links")
        .select("zabbix_host_id, host_name")
        .eq("equipment_id", equipmentId!)
        .maybeSingle();
      return data;
    },
  });

  if (!equipmentId) return null;
  if (isLoading) return <Skeleton className="h-28 w-full" />;
  if (!eq) return null;

  const status = STATUS_MAP[eq.status ?? "active"] ?? STATUS_MAP.active;
  const w = warrantyState(eq.warranty_until);
  const WIcon = w.icon;

  return (
    <div className="border rounded-lg p-3 space-y-3 bg-muted/20">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Server className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{eq.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {eq.equipment_categories?.name ?? "Оборудование"}
              {eq.model && ` • ${eq.model}`}
            </p>
          </div>
        </div>
        <Badge variant="outline" className={cn("shrink-0 text-xs", status.cls)}>
          {status.label}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        {eq.sites?.name && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span className="truncate">{eq.sites.name}{eq.sites.city ? `, ${eq.sites.city}` : ""}</span>
          </div>
        )}
        {eq.serial_number && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Hash className="h-3 w-3" />
            <span className="truncate font-mono">{eq.serial_number}</span>
          </div>
        )}
        {eq.os_info && (
          <div className="flex items-center gap-1.5 text-muted-foreground col-span-2">
            <Cpu className="h-3 w-3" />
            <span className="truncate">{eq.os_info}</span>
          </div>
        )}
      </div>

      <div className={cn("flex items-center gap-1.5 text-xs", w.cls)}>
        <WIcon className="h-3.5 w-3.5" />
        <span>{w.label}</span>
        {eq.warranty_provider && (
          <span className="text-muted-foreground">• {eq.warranty_provider}</span>
        )}
      </div>

      <div className="flex flex-wrap gap-2 pt-1 border-t">
        <Button asChild size="sm" variant="outline" className="h-7 text-xs">
          <Link to={`/equipment?id=${eq.id}`}>
            <Server className="h-3 w-3 mr-1" /> Карточка
          </Link>
        </Button>
        {monLink?.zabbix_host_id ? (
          <Button asChild size="sm" variant="outline" className="h-7 text-xs">
            <Link to={`/monitoring?host=${monLink.zabbix_host_id}`}>
              <Activity className="h-3 w-3 mr-1" /> Мониторинг
              <ExternalLink className="h-3 w-3 ml-1" />
            </Link>
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground self-center">Не привязано к мониторингу</span>
        )}
      </div>
    </div>
  );
}
