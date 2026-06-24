import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ListTree, RefreshCw, ArrowUpDown } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

type Category = "critical" | "system" | "service" | "user";

interface ProcessRow {
  pid: number;
  name: string;
  cpu_percent: number;
  ram_mb: number;
  exe_path?: string;
  username?: string;
  category: Category;
}

const CATEGORY_META: Record<Category, { label: string; color: string; badge: string }> = {
  critical: { label: "Критичный",       color: "text-red-500",    badge: "border-red-500/40 text-red-500 bg-red-500/10" },
  system:   { label: "Системный",       color: "text-orange-500", badge: "border-orange-500/40 text-orange-500 bg-orange-500/10" },
  service:  { label: "Сервис",          color: "text-yellow-500", badge: "border-yellow-500/40 text-yellow-500 bg-yellow-500/10" },
  user:     { label: "Пользовательский", color: "text-zinc-300",   badge: "border-zinc-500/40 text-zinc-300 bg-zinc-500/10" },
};

function formatRam(mb: number): string {
  if (!Number.isFinite(mb)) return "—";
  if (mb < 1024) return `${Math.round(mb)} МБ`;
  return `${(mb / 1024).toFixed(1)} ГБ`;
}

type SortKey = "name" | "pid" | "cpu_percent" | "ram_mb" | "username" | "category";

export function AgentProcesses({ agentId }: { agentId: string }) {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<Category | "all">("all");
  const [sortKey, setSortKey] = useState<SortKey>("ram_mb");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const { data, refetch, isFetching } = useQuery({
    queryKey: ["agent-processes", agentId],
    enabled: !!agentId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("agent_processes")
        .select("*")
        .eq("agent_id", agentId)
        .maybeSingle();
      if (error) throw error;
      return data as { agent_id: string; collected_at: string; processes: ProcessRow[]; updated_at: string } | null;
    },
    refetchInterval: 60000,
  });

  const processes: ProcessRow[] = useMemo(() => {
    const arr = Array.isArray(data?.processes) ? (data!.processes as ProcessRow[]) : [];
    return arr;
  }, [data]);

  const counts = useMemo(() => {
    const c: Record<Category, number> = { critical: 0, system: 0, service: 0, user: 0 };
    for (const p of processes) {
      const cat = (p.category as Category) || "user";
      if (c[cat] !== undefined) c[cat] += 1;
    }
    return c;
  }, [processes]);

  const filteredSorted = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = processes;
    if (q) rows = rows.filter((p) => (p.name || "").toLowerCase().includes(q));
    if (catFilter !== "all") rows = rows.filter((p) => (p.category || "user") === catFilter);
    const dir = sortDir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = a[sortKey] as any;
      const bv = b[sortKey] as any;
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv), "ru") * dir;
    });
  }, [processes, search, catFilter, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "name" || key === "username" || key === "category" ? "asc" : "desc");
    }
  };

  const SortHead = ({ k, children, className }: { k: SortKey; children: React.ReactNode; className?: string }) => (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => toggleSort(k)}
        className="inline-flex items-center gap-1 hover:text-foreground"
      >
        {children}
        <ArrowUpDown className={`h-3 w-3 ${sortKey === k ? "opacity-100" : "opacity-40"}`} />
      </button>
    </TableHead>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle className="text-base flex items-center gap-2">
          <ListTree className="h-4 w-4" /> Процессы
        </CardTitle>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isFetching ? "animate-spin" : ""}`} />
          Обновить
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {!data ? (
          <div className="text-sm text-muted-foreground py-6 text-center">
            Нет данных о процессах
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <div className="text-muted-foreground">
                Обновлено {data.collected_at
                  ? formatDistanceToNow(new Date(data.collected_at), { addSuffix: true, locale: ru })
                  : "—"}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-red-500">Критичные {counts.critical}</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-orange-500">Системные {counts.system}</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-yellow-500">Сервисы {counts.service}</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-zinc-300">Пользовательские {counts.user}</span>
                <span className="text-muted-foreground">·</span>
                <span>Всего: <span className="font-medium text-foreground">{processes.length}</span></span>
              </div>
            </div>

            <Input
              placeholder="Поиск по имени процесса…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />

            <div className="flex flex-wrap gap-2">
              {(["all", "critical", "system", "service", "user"] as const).map((k) => {
                const active = catFilter === k;
                const label =
                  k === "all" ? `Все (${processes.length})` : `${CATEGORY_META[k].label} (${counts[k]})`;
                const cls = k === "all"
                  ? "border-border text-foreground"
                  : CATEGORY_META[k].badge;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setCatFilter(k)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition ${cls} ${active ? "ring-2 ring-ring/60" : "opacity-70 hover:opacity-100"}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {filteredSorted.length === 0 ? (
              <div className="text-sm text-muted-foreground py-6 text-center">
                Процессы не найдены
              </div>
            ) : (
              <div className="max-h-[600px] overflow-auto rounded-md border">
                <Table>
                  <TableHeader className="sticky top-0 bg-card">
                    <TableRow>
                      <SortHead k="name">Имя</SortHead>
                      <SortHead k="pid">PID</SortHead>
                      <SortHead k="cpu_percent">CPU %</SortHead>
                      <SortHead k="ram_mb">RAM</SortHead>
                      <SortHead k="username">Пользователь</SortHead>
                      <SortHead k="category">Категория</SortHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSorted.map((p) => {
                      const cat = (p.category as Category) || "user";
                      const meta = CATEGORY_META[cat] ?? CATEGORY_META.user;
                      return (
                        <TableRow key={`${p.pid}-${p.name}`}>
                          <TableCell
                            className={`font-mono font-medium ${meta.color}`}
                            title={p.exe_path || undefined}
                          >
                            {p.name}
                          </TableCell>
                          <TableCell className="font-mono text-muted-foreground">{p.pid}</TableCell>
                          <TableCell>{Number(p.cpu_percent ?? 0).toFixed(1)}</TableCell>
                          <TableCell>{formatRam(Number(p.ram_mb ?? 0))}</TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {p.username || "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={meta.badge}>
                              {meta.label}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default AgentProcesses;