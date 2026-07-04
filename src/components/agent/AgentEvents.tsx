import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollText, Search } from "lucide-react";
import { format } from "date-fns";

type EventRow = {
  id: string;
  agent_id: string;
  time_created: string | null;
  log: string | null;
  level: string | null;
  source: string | null;
  event_id: number | string | null;
  message: string | null;
};

const LEVELS = ["Critical", "Error", "Warning", "AuditFailure"] as const;

function LevelBadge({ level }: { level: string | null }) {
  const l = (level || "").trim();
  const cls =
    l === "Critical"
      ? "bg-red-600 hover:bg-red-600 text-white border-transparent"
      : l === "Error"
      ? "bg-red-800 hover:bg-red-800 text-white border-transparent"
      : l === "Warning"
      ? "bg-orange-500 hover:bg-orange-500 text-white border-transparent"
      : l === "AuditFailure"
      ? "bg-purple-600 hover:bg-purple-600 text-white border-transparent"
      : "bg-muted text-muted-foreground border-transparent";
  return <Badge className={cls}>{l || "—"}</Badge>;
}

export function AgentEvents({ agentId }: { agentId: string }) {
  const [levelFilter, setLevelFilter] = useState<string | null>(null);
  const [logFilter, setLogFilter] = useState<string>("all");
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["agent-events", agentId],
    enabled: !!agentId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("agent_events")
        .select("*")
        .eq("agent_id", agentId)
        .order("time_created", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as EventRow[];
    },
    refetchInterval: 60000,
  });

  const counts = useMemo(() => {
    const c: Record<string, number> = { Critical: 0, Error: 0, Warning: 0, AuditFailure: 0 };
    for (const e of events) if (e.level && c[e.level] != null) c[e.level]++;
    return c;
  }, [events]);

  const logs = useMemo(() => {
    const s = new Set<string>();
    for (const e of events) if (e.log) s.add(e.log);
    return Array.from(s).sort();
  }, [events]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return events.filter((e) => {
      if (levelFilter && e.level !== levelFilter) return false;
      if (logFilter !== "all" && e.log !== logFilter) return false;
      if (needle) {
        const hay = `${e.source ?? ""} ${e.message ?? ""}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [events, levelFilter, logFilter, q]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ScrollText className="h-4 w-4" /> События Windows ({events.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {LEVELS.map((l) => (
            <Button
              key={l}
              size="sm"
              variant={levelFilter === l ? "default" : "outline"}
              onClick={() => setLevelFilter(levelFilter === l ? null : l)}
              className="h-7"
            >
              {l}: {counts[l] ?? 0}
            </Button>
          ))}
          <Select value={logFilter} onValueChange={setLogFilter}>
            <SelectTrigger className="w-[180px] h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все журналы</SelectItem>
              {logs.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Поиск по source/message..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-7 h-8"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-sm text-muted-foreground">Загрузка...</div>
        ) : filtered.length === 0 ? (
          <div className="text-sm text-muted-foreground">Событий нет</div>
        ) : (
          <div className="max-h-[480px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Время</TableHead>
                  <TableHead className="w-[110px]">Журнал</TableHead>
                  <TableHead className="w-[120px]">Уровень</TableHead>
                  <TableHead className="w-[180px]">Источник</TableHead>
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead>Сообщение</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((e) => {
                  const isOpen = expanded === e.id;
                  const msg = e.message ?? "";
                  return (
                    <TableRow
                      key={e.id}
                      className="cursor-pointer align-top"
                      onClick={() => setExpanded(isOpen ? null : e.id)}
                    >
                      <TableCell className="text-xs font-mono">
                        {e.time_created ? format(new Date(e.time_created), "dd.MM HH:mm:ss") : "—"}
                      </TableCell>
                      <TableCell className="text-xs">{e.log || "—"}</TableCell>
                      <TableCell><LevelBadge level={e.level} /></TableCell>
                      <TableCell className="text-xs font-mono">{e.source || "—"}</TableCell>
                      <TableCell className="text-xs font-mono">{e.event_id ?? "—"}</TableCell>
                      <TableCell className={"text-xs " + (isOpen ? "whitespace-pre-wrap break-words" : "truncate max-w-[420px]")}>
                        {msg || "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AgentEvents;