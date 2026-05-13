import { Plug, Check, ChevronDown } from "lucide-react";
import { useZabbixConnection } from "@/hooks/useZabbixConnection";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/**
 * Global Zabbix-connection picker. Renders nothing when no connections
 * are configured (so non-monitoring users don't see noise).
 */
export default function ZabbixConnectionPicker({ className }: { className?: string }) {
  const { connections, active, setActiveId, isLoading } = useZabbixConnection();
  if (isLoading) return null;
  // Hide when there's nothing to choose between — the live status indicator already
  // tells the user whether monitoring is connected, so the picker is just noise.
  if (connections.length < 2) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("h-9 gap-2 max-w-[280px]", className)}
          title="Активное подключение Zabbix"
        >
          <Plug className="h-4 w-4 text-primary shrink-0" />
          <span className="truncate font-medium">
            {active?.name ?? "Подключение"}
          </span>
          {active?.organizations?.name && (
            <span className="hidden md:inline text-muted-foreground truncate">
              · {active.organizations.name}
            </span>
          )}
          <ChevronDown className="h-3.5 w-3.5 opacity-60 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[300px]">
        <DropdownMenuLabel className="text-xs">Активное подключение Zabbix</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {connections.map((c) => (
          <DropdownMenuItem
            key={c.id}
            onClick={() => setActiveId(c.id)}
            className="flex items-start gap-2 cursor-pointer"
          >
            <Check className={cn("h-4 w-4 mt-0.5", active?.id === c.id ? "opacity-100 text-primary" : "opacity-0")} />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">{c.name}</div>
              <div className="text-[11px] text-muted-foreground truncate">
                {c.organizations?.name ?? "—"} · {c.zabbix_url}
              </div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}