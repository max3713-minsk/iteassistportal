import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { invokeZabbix } from "@/lib/zabbix-invoke";
import { useZabbixConnection } from "@/hooks/useZabbixConnection";
import { cn } from "@/lib/utils";
import { Server, AlertTriangle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Header heartbeat: pulse + "Zabbix · N hosts · M problems".
 * Click → /monitoring (problems tab).
 */
export function LiveStatusIndicator() {
  const { active, isLoading } = useZabbixConnection();
  const navigate = useNavigate();

  const { data, isError, isFetching } = useQuery({
    enabled: !!active?.id,
    queryKey: ["live-status", active?.id],
    refetchInterval: 30_000,
    staleTime: 25_000,
    queryFn: async () => {
      const [hostsRes, probsRes] = await Promise.all([
        invokeZabbix({ body: { action: "getHosts" } }),
        invokeZabbix({ body: { action: "getProblems" } }),
      ]);
      const hosts = (hostsRes.data?.result as unknown[] | undefined) ?? [];
      const probs = (probsRes.data?.result as unknown[] | undefined) ?? [];
      return { hosts: hosts.length, problems: probs.length };
    },
  });

  if (isLoading || !active) return null;

  const offline = isError || !data;
  const hasIssues = !!data && data.problems > 0;
  // Indicator colour reflects collector connectivity, not problem count:
  //  • green  — connected
  //  • red    — collector unavailable
  //  • yellow — connection attempt in progress
  const connecting = isFetching && !data && !isError;
  const dotColor = connecting
    ? "bg-yellow-500"
    : offline
      ? "bg-red-500"
      : "bg-emerald-500";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={() => navigate(hasIssues ? "/monitoring?tab=problems" : "/monitoring")}
          className={cn(
            "group hidden md:inline-flex items-center gap-2 h-9 px-3 rounded-full",
            "border bg-card/60 backdrop-blur hover:bg-card transition-colors",
            "text-xs font-medium",
          )}
        >
          <span className="relative flex h-2 w-2">
            {(!offline || connecting) && (
              <span className={cn(
                "absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping",
                dotColor,
              )} />
            )}
            <span className={cn("relative inline-flex rounded-full h-2 w-2", dotColor)} />
          </span>
          <span className="text-muted-foreground">Zabbix</span>
          {!offline ? (
            <>
              <span className="inline-flex items-center gap-1 text-foreground">
                <Server className="h-3 w-3 opacity-70" />
                {data.hosts}
              </span>
              <span className={cn(
                "inline-flex items-center gap-1",
                hasIssues ? "text-red-500" : "text-muted-foreground/70",
              )}>
                <AlertTriangle className="h-3 w-3" />
                {data.problems}
              </span>
            </>
          ) : (
            <span className="text-muted-foreground">офлайн</span>
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent>
        {connecting
          ? "Подключение к Zabbix…"
          : offline
            ? "Коллектор Zabbix недоступен"
            : `Подключено · ${data.hosts} хостов · ${data.problems} активных проблем`}
      </TooltipContent>
    </Tooltip>
  );
}