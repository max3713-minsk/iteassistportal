import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollText, Search, Download } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { SeafileSendButton } from "@/components/SeafileSendButton";

const moduleLabels: Record<string, string> = {
  tickets: "Заявки",
  protocols: "Протоколы",
  equipment: "Оборудование",
  sites: "ЦОД",
  users: "Пользователи",
  documents: "Документы",
  schedules: "Календарь ТО",
  auth: "Авторизация",
};

export default function AuditLog() {
  const { hasRole } = useAuth();
const [moduleFilter, setModuleFilter] = useState("all");
  const [orgFilter, setOrgFilter] = useState("all");
  const [search, setSearch] = useState("");

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["audit-logs", moduleFilter, orgFilter],
    queryFn: async () => {
      let q = supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (moduleFilter !== "all") {
        q = q.eq("module", moduleFilter);
      }
      if (orgFilter !== "all") {
        q = q.eq("organization", orgFilter);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data as any[];
    },
    enabled: hasRole("admin"),
  });

  const { data: allOrgs = [] } = useQuery({
    queryKey: ["audit-logs-orgs"],
    queryFn: async () => {
      const { data } = await supabase.from("audit_logs").select("organization");
      const orgs = [...new Set((data ?? []).map((r: any) => r.organization).filter(Boolean))].sort();
      return orgs as string[];
    },
    enabled: hasRole("admin"),
  });

  if (!hasRole("admin")) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Доступ ограничен</p>
      </div>
    );
  }

  const filtered = search
    ? logs.filter(
        (l) =>
          l.user_name?.toLowerCase().includes(search.toLowerCase()) ||
          l.action?.toLowerCase().includes(search.toLowerCase()) ||
          l.details?.toLowerCase().includes(search.toLowerCase())
      )
    : logs;

  const buildCsvBlob = () => {
    const header = ["Дата и время", "Пользователь", "Организация", "Модуль", "Действие", "Подробности"];
    const rows = filtered.map((l: any) => [
      format(new Date(l.created_at), "dd.MM.yyyy HH:mm:ss", { locale: ru }),
      l.user_name || "",
      l.organization || "",
      moduleLabels[l.module] || l.module,
      l.action,
      l.details || "",
    ]);
    const bom = "\uFEFF";
    const csv = bom + [header, ...rows].map((r) => r.map((c: string) => `"${c.replace(/"/g, '""')}"`).join(";")).join("\n");
    return new Blob([csv], { type: "text/csv;charset=utf-8;" });
  };

  const exportCSV = () => {
    const blob = buildCsvBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit_log_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-bold">Журнал событий</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={filtered.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Экспорт CSV
          </Button>
          <SeafileSendButton
            variant="outline"
            size="sm"
            kind="audit"
            disabled={filtered.length === 0}
            getPayload={() => ({
              blob: buildCsvBlob(),
              filename: `audit_log_${format(new Date(), "yyyy-MM-dd")}.csv`,
              meta: { name: "audit_log", org: orgFilter !== "all" ? orgFilter : "" },
            })}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Поиск..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-48">
          <Select value={moduleFilter} onValueChange={setModuleFilter}>
            <SelectTrigger><SelectValue placeholder="Все модули" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все модули</SelectItem>
              {Object.entries(moduleLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-56">
          <Select value={orgFilter} onValueChange={setOrgFilter}>
            <SelectTrigger><SelectValue placeholder="Все организации" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все организации</SelectItem>
              {allOrgs.map((org: string) => (
                <SelectItem key={org} value={org}>{org}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Загрузка...</p>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ScrollText className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">Записей не найдено</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
             <TableHeader>
              <TableRow>
                <TableHead className="w-[160px]">Дата и время</TableHead>
                <TableHead>Пользователь</TableHead>
                <TableHead>Организация</TableHead>
                <TableHead>Модуль</TableHead>
                <TableHead>Действие</TableHead>
                <TableHead className="hidden md:table-cell">Подробности</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((log: any) => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {format(new Date(log.created_at), "dd.MM.yyyy HH:mm:ss", { locale: ru })}
                  </TableCell>
                  <TableCell className="font-medium">{log.user_name || "—"}</TableCell>
                  <TableCell className="text-sm">{log.organization || "—"}</TableCell>
                  <TableCell>
                    <span className="text-sm">{moduleLabels[log.module] || log.module}</span>
                  </TableCell>
                  <TableCell className="text-sm">{log.action}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-[300px] truncate">
                    {log.details || "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
