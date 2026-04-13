import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter } from "lucide-react";
import { format } from "date-fns";
import ProtocolList from "@/components/protocols/ProtocolList";
import ProtocolDetail from "@/components/protocols/ProtocolDetail";
import CreateProtocolDialog from "@/components/protocols/CreateProtocolDialog";
import { frequencyLabels } from "@/lib/schedule-utils";

export default function Protocols() {
  const { isStaff } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get("date") || "";

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterSite, setFilterSite] = useState("all");
  const [filterFrequency, setFilterFrequency] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: protocols = [], isLoading } = useQuery({
    queryKey: ["protocols"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_protocols")
        .select("*, sites(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: sites = [] } = useQuery({
    queryKey: ["sites"],
    queryFn: async () => {
      const { data } = await supabase.from("sites").select("id, name").order("name");
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    let result = protocols;
    if (filterSite !== "all") result = result.filter((p) => p.site_id === filterSite);
    if (filterFrequency !== "all") result = result.filter((p) => p.frequency === filterFrequency);
    if (filterStatus !== "all") result = result.filter((p) => p.status === filterStatus);
    if (dateParam) {
      result = result.filter((p) => p.period_start <= dateParam && p.period_end >= dateParam);
    }
    return result;
  }, [protocols, filterSite, filterFrequency, filterStatus, dateParam]);

  const handleExportPdf = async (protocolId: string) => {
    // Fetch protocol + items for PDF
    const { data: protocol } = await supabase
      .from("maintenance_protocols")
      .select("*, sites(name)")
      .eq("id", protocolId)
      .single();

    const { data: items } = await supabase
      .from("protocol_items")
      .select("*, equipment(name, model), maintenance_tasks(title)")
      .eq("protocol_id", protocolId)
      .order("equipment_id");

    if (!protocol || !items) {
      toast({ title: "Ошибка", description: "Не удалось загрузить данные", variant: "destructive" });
      return;
    }

    // Generate simple text-based PDF using browser print
    const siteName = (protocol as any).sites?.name ?? "—";
    const freq = frequencyLabels[protocol.frequency] ?? protocol.frequency;
    const period = `${format(new Date(protocol.period_start), "dd.MM.yyyy")} — ${format(new Date(protocol.period_end), "dd.MM.yyyy")}`;

    let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Протокол ТО</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 12px; padding: 40px; }
        h1 { font-size: 18px; text-align: center; margin-bottom: 4px; }
        h2 { font-size: 14px; margin-top: 20px; margin-bottom: 8px; }
        .meta { text-align: center; color: #666; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        th, td { border: 1px solid #333; padding: 6px 8px; text-align: left; }
        th { background: #f0f0f0; font-weight: bold; }
        .done { color: green; }
        .pending { color: #999; }
        .footer { margin-top: 40px; display: flex; justify-content: space-between; }
        .sig { border-top: 1px solid #333; width: 200px; text-align: center; padding-top: 4px; margin-top: 60px; }
        @media print { body { padding: 20px; } }
      </style>
    </head><body>`;
    html += `<h1>Протокол технического обслуживания</h1>`;
    html += `<p class="meta">${siteName} • ${freq} • ${period}</p>`;

    // Group by equipment
    const eqMap = new Map<string, typeof items>();
    for (const item of items) {
      const name = (item as any).equipment
        ? `${(item as any).equipment.name}${(item as any).equipment.model ? ` (${(item as any).equipment.model})` : ""}`
        : "—";
      if (!eqMap.has(name)) eqMap.set(name, []);
      eqMap.get(name)!.push(item);
    }

    for (const [eqName, eqItems] of eqMap) {
      html += `<h2>${eqName}</h2>`;
      html += `<table><tr><th>№</th><th>Задача</th><th>Статус</th><th>Примечания</th><th>Дата выполнения</th></tr>`;
      eqItems.forEach((it: any, idx: number) => {
        const status = it.status === "completed" ? "✔ Выполнено" : "— Не выполнено";
        const cls = it.status === "completed" ? "done" : "pending";
        html += `<tr>
          <td>${idx + 1}</td>
          <td>${it.maintenance_tasks?.title ?? "—"}</td>
          <td class="${cls}">${status}</td>
          <td>${it.notes ?? ""}</td>
          <td>${it.completed_at ? format(new Date(it.completed_at), "dd.MM.yyyy HH:mm") : ""}</td>
        </tr>`;
      });
      html += `</table>`;
    }

    html += `<div style="display:flex;justify-content:space-between;margin-top:60px;">
      <div class="sig">Исполнитель</div>
      <div class="sig">Ответственный</div>
    </div>`;
    html += `</body></html>`;

    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      setTimeout(() => win.print(), 500);
    }
  };

  if (selectedId) {
    return (
      <div>
        <ProtocolDetail
          protocolId={selectedId}
          onBack={() => setSelectedId(null)}
          onExportPdf={handleExportPdf}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-heading text-2xl font-bold">Протоколы обслуживания</h1>
        {isStaff && <CreateProtocolDialog defaultDate={dateParam} />}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="w-56">
          <Select value={filterSite} onValueChange={setFilterSite}>
            <SelectTrigger>
              <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Все площадки" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все площадки</SelectItem>
              {sites.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-56">
          <Select value={filterFrequency} onValueChange={setFilterFrequency}>
            <SelectTrigger><SelectValue placeholder="Все типы" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все типы работ</SelectItem>
              <SelectItem value="daily">Ежедневные</SelectItem>
              <SelectItem value="weekly">Еженедельные</SelectItem>
              <SelectItem value="monthly">Ежемесячные</SelectItem>
              <SelectItem value="quarterly">Ежеквартальные</SelectItem>
              <SelectItem value="semi_annual">Полугодовые</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-48">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger><SelectValue placeholder="Все статусы" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              <SelectItem value="pending">Ожидает</SelectItem>
              <SelectItem value="in_progress">В работе</SelectItem>
              <SelectItem value="completed">Завершён</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {dateParam && (
        <p className="text-sm text-muted-foreground mb-3">
          Фильтр по дате: <strong>{format(new Date(dateParam), "dd.MM.yyyy")}</strong>
        </p>
      )}

      {isLoading ? (
        <p className="text-muted-foreground">Загрузка...</p>
      ) : (
        <ProtocolList protocols={filtered} onSelect={setSelectedId} />
      )}
    </div>
  );
}
