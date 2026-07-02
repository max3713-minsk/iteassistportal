import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { HardDrive, Package, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

interface Props {
  agentId: string;
}

function healthVariant(h?: string): { variant: any; className: string } {
  const v = (h || "").toLowerCase();
  if (v === "healthy" || v === "ok") return { variant: "default", className: "bg-green-600 hover:bg-green-600 text-white" };
  if (v === "warning") return { variant: "default", className: "bg-orange-500 hover:bg-orange-500 text-white" };
  if (v === "unhealthy" || v === "critical" || v === "failed") return { variant: "destructive", className: "" };
  return { variant: "secondary", className: "" };
}

function fmtInstallDate(s?: string): string {
  if (!s) return "—";
  const digits = String(s).replace(/\D/g, "");
  if (digits.length === 8) return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
  return s;
}

export function AgentInventory({ agentId }: Props) {
  const [q, setQ] = useState("");

  const { data: inv } = useQuery({
    queryKey: ["agent-inventory", agentId],
    enabled: !!agentId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("agent_inventory")
        .select("*")
        .eq("agent_id", agentId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    refetchInterval: 60_000,
  });

  const disks: any[] = Array.isArray(inv?.disks_health) ? inv.disks_health : [];
  const software: any[] = Array.isArray(inv?.software) ? inv.software : [];

  const filteredSoftware = useMemo(() => {
    const term = q.trim().toLowerCase();
    const sorted = [...software].sort((a, b) =>
      String(a?.name || "").localeCompare(String(b?.name || ""), "ru"),
    );
    if (!term) return sorted;
    return sorted.filter((s) =>
      String(s?.name || "").toLowerCase().includes(term) ||
      String(s?.publisher || "").toLowerCase().includes(term),
    );
  }, [software, q]);

  const updatedLabel = inv?.collected_at
    ? `Обновлено ${formatDistanceToNow(new Date(inv.collected_at), { addSuffix: true, locale: ru })}`
    : null;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base flex items-center gap-2">
            <HardDrive className="h-4 w-4" /> Здоровье дисков
          </CardTitle>
          {updatedLabel && <span className="text-xs text-muted-foreground">{updatedLabel}</span>}
        </CardHeader>
        <CardContent>
          {disks.length === 0 ? (
            <div className="text-sm text-muted-foreground">Нет данных о дисках</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Диск</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Объём</TableHead>
                  <TableHead>Здоровье</TableHead>
                  <TableHead>Температура</TableHead>
                  <TableHead>Износ</TableHead>
                  <TableHead>Серийник</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {disks.map((d, i) => {
                  const size = Number(d?.size_gb);
                  const temp = Number(d?.temperature) || 0;
                  const wear = Number(d?.wear) || 0;
                  const hv = healthVariant(d?.health);
                  const tempCls =
                    temp >= 70 ? "text-red-600 font-medium"
                    : temp >= 65 ? "text-orange-500 font-medium"
                    : "";
                  return (
                    <TableRow key={i}>
                      <TableCell className="max-w-[280px] truncate" title={d?.name}>{d?.name || "—"}</TableCell>
                      <TableCell>{d?.media_type || "—"}</TableCell>
                      <TableCell>{Number.isFinite(size) ? `${size.toFixed(1)} ГБ` : "—"}</TableCell>
                      <TableCell>
                        <Badge variant={hv.variant} className={hv.className}>{d?.health || "—"}</Badge>
                      </TableCell>
                      <TableCell className={tempCls}>{temp > 0 ? `${temp}°C` : "—"}</TableCell>
                      <TableCell>{wear > 0 ? `${wear}%` : "—"}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{d?.serial || "—"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4" /> Установленное ПО
            </CardTitle>
            <span className="text-xs text-muted-foreground">Всего программ: {software.length}</span>
          </div>
          {software.length > 0 && (
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Поиск по названию или издателю"
                className="pl-8"
              />
            </div>
          )}
        </CardHeader>
        <CardContent>
          {software.length === 0 ? (
            <div className="text-sm text-muted-foreground">Нет данных о ПО</div>
          ) : (
            <div className="max-h-[480px] overflow-auto rounded-md border">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead>Название</TableHead>
                    <TableHead className="w-[140px]">Версия</TableHead>
                    <TableHead>Издатель</TableHead>
                    <TableHead className="w-[130px]">Установлено</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSoftware.map((s, i) => (
                    <TableRow key={i}>
                      <TableCell className="max-w-[360px] truncate" title={s?.name}>{s?.name || "—"}</TableCell>
                      <TableCell className="font-mono text-xs">{s?.version || "—"}</TableCell>
                      <TableCell className="max-w-[280px] truncate text-muted-foreground" title={s?.publisher}>{s?.publisher || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{fmtInstallDate(s?.install_date)}</TableCell>
                    </TableRow>
                  ))}
                  {filteredSoftware.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                        Ничего не найдено
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}