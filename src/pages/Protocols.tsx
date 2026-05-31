import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, X, FileDown, CheckCircle2, Calendar as CalIcon, FileText, ListChecks, Trash2, Cloud, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format, parseISO, isWithinInterval } from "date-fns";
import { logAudit } from "@/lib/audit";
import ProtocolList from "@/components/protocols/ProtocolList";
import ProtocolDetail from "@/components/protocols/ProtocolDetail";
import CreateProtocolDialog from "@/components/protocols/CreateProtocolDialog";
import BatchCreateProtocolDialog from "@/components/protocols/BatchCreateProtocolDialog";
import QuickReportButton from "@/components/protocols/QuickReportButton";
import ProtocolTemplatesManager from "@/components/help/ProtocolTemplatesManager";
import ProtocolSignersDialog from "@/components/protocols/ProtocolSignersDialog";
import { frequencyLabels } from "@/lib/schedule-utils";
import { useAutoProtocols } from "@/hooks/useAutoProtocols";
import { exportProtocolDocx } from "@/lib/export-protocol-docx";
import { fetchProtocolDocxData } from "@/lib/protocol-docx-data";
import { snapshotProtocolGraphs } from "@/components/monitoring/ProtocolGraphs";
import { buildProtocolDocxBlob } from "@/lib/export-protocol-docx";
import { sendToSeafile } from "@/lib/seafile";
import { frequencyLabels as FREQ_LBL } from "@/lib/schedule-utils";

export default function Protocols() {
  const { isStaff, user, hasRole } = useAuth();
  const canManage = hasRole("admin") || hasRole("engineer");
  const { toast } = useToast();
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const dateParam = searchParams.get("date") || "";
  const topTab = searchParams.get("tab") === "templates" ? "templates" : "list";

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterSite, setFilterSite] = useState("all");
  const [filterFrequency, setFilterFrequency] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [periodFrom, setPeriodFrom] = useState("");
  const [periodTo, setPeriodTo] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"active" | "overdue" | "completed">("active");
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number; label: string } | null>(null);
  const [signersFor, setSignersFor] = useState<string | null>(null);
  const [bulkSignersOpen, setBulkSignersOpen] = useState(false);

  // Auto-create protocols for today
  useAutoProtocols();

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

  const todayStr = format(new Date(), "yyyy-MM-dd");

  const activeProtocols = useMemo(() => {
    return protocols.filter(
      (p) => p.status !== "completed" && p.period_end >= todayStr
    );
  }, [protocols, todayStr]);

  const overdueProtocols = useMemo(() => {
    return protocols.filter(
      (p) => p.status !== "completed" && p.period_end < todayStr
    );
  }, [protocols, todayStr]);

  const completedProtocols = useMemo(() => {
    return protocols.filter((p) => p.status === "completed");
  }, [protocols]);

  const applyFilters = (list: typeof protocols) => {
    let result = list;
    if (filterSite !== "all") result = result.filter((p) => p.site_id === filterSite);
    if (filterFrequency !== "all") result = result.filter((p) => p.frequency === filterFrequency);
    if (filterStatus !== "all") result = result.filter((p) => p.status === filterStatus);
    if (dateParam) {
      result = result.filter((p) => p.period_start <= dateParam && p.period_end >= dateParam);
    }
    if (periodFrom) result = result.filter((p) => p.period_end >= periodFrom);
    if (periodTo)   result = result.filter((p) => p.period_start <= periodTo);
    return result;
  };

  const filtered = useMemo(() => {
    const base =
      activeTab === "active"
        ? activeProtocols
        : activeTab === "overdue"
        ? overdueProtocols
        : completedProtocols;
    return applyFilters(base);
  }, [activeProtocols, overdueProtocols, completedProtocols, activeTab, filterSite, filterFrequency, filterStatus, dateParam, periodFrom, periodTo]);

  const hasFilters = filterSite !== "all" || filterFrequency !== "all" || filterStatus !== "all" || !!periodFrom || !!periodTo;

  function resetFilters() {
    setFilterSite("all"); setFilterFrequency("all"); setFilterStatus("all");
    setPeriodFrom(""); setPeriodTo("");
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function toggleSelectAll(ids: string[]) {
    setSelectedIds((prev) => {
      const all = ids.every((i) => prev.has(i));
      if (all) { const n = new Set(prev); ids.forEach((i) => n.delete(i)); return n; }
      const n = new Set(prev); ids.forEach((i) => n.add(i)); return n;
    });
  }

  async function bulkComplete() {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    const nowIso = new Date().toISOString();
    // Сначала отмечаем все работы выполненными — завершение протокола
    // подразумевает 100% выполнение работ.
    const { error: itemsErr } = await supabase
      .from("protocol_items")
      .update({ status: "completed", completed_by: user!.id, completed_at: nowIso })
      .in("protocol_id", ids)
      .neq("status", "completed");
    if (itemsErr) { toast({ title: "Ошибка", description: itemsErr.message, variant: "destructive" }); return; }
    const { error } = await supabase
      .from("maintenance_protocols")
      .update({ status: "completed", completed_at: nowIso, completed_by: user!.id } as any)
      .in("id", ids);
    if (error) { toast({ title: "Ошибка", description: error.message, variant: "destructive" }); return; }
    await logAudit({ action: `Массовое завершение протоколов (${ids.length})`, module: "protocols", details: ids.join(", ") });
    toast({ title: `Завершено: ${ids.length}` });
    setSelectedIds(new Set());
    qc.invalidateQueries({ queryKey: ["protocols"] });
    qc.invalidateQueries({ queryKey: ["protocol-items"] });
  }

  async function bulkCompleteWorks() {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    if (!window.confirm(`Отметить все работы в ${ids.length} протокол(ах) выполненными?`)) return;
    const nowIso = new Date().toISOString();
    const { error: itemsErr } = await supabase
      .from("protocol_items")
      .update({ status: "completed", completed_by: user!.id, completed_at: nowIso })
      .in("protocol_id", ids)
      .neq("status", "completed");
    if (itemsErr) { toast({ title: "Ошибка", description: itemsErr.message, variant: "destructive" }); return; }
    // Переводим протоколы из pending в in_progress (если ещё не завершены)
    await supabase
      .from("maintenance_protocols")
      .update({ status: "in_progress" } as any)
      .in("id", ids)
      .neq("status", "completed");
    await logAudit({ action: `Массовое выполнение работ (${ids.length})`, module: "protocols", details: ids.join(", ") });
    toast({ title: `Работы отмечены выполненными: ${ids.length}` });
    qc.invalidateQueries({ queryKey: ["protocols"] });
    qc.invalidateQueries({ queryKey: ["protocol-items"] });
  }

  async function completeAllWorks(id: string) {
    if (!window.confirm("Отметить все работы протокола выполненными?")) return;
    try {
      const nowIso = new Date().toISOString();
      const { error: itemsErr } = await supabase
        .from("protocol_items")
        .update({ status: "completed", completed_by: user!.id, completed_at: nowIso })
        .eq("protocol_id", id)
        .neq("status", "completed");
      if (itemsErr) throw itemsErr;
      const { error: pErr } = await supabase
        .from("maintenance_protocols")
        .update({ status: "in_progress" })
        .eq("id", id)
        .neq("status", "completed");
      if (pErr) throw pErr;
      await logAudit({ action: "Выполнение всех работ протокола", module: "protocols", entityId: id });
      toast({ title: "Все работы отмечены выполненными" });
      qc.invalidateQueries({ queryKey: ["protocols"] });
      qc.invalidateQueries({ queryKey: ["protocol-items", id] });
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    }
  }

  async function bulkDelete() {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    if (!window.confirm(`Удалить ${ids.length} протокол(ов) безвозвратно? Связанные пункты также будут удалены.`)) return;
    setBulkBusy(true);
    try {
      const { error: e1 } = await supabase.from("protocol_items").delete().in("protocol_id", ids);
      if (e1) throw e1;
      const { error: e2 } = await supabase.from("maintenance_protocols").delete().in("id", ids);
      if (e2) throw e2;
      await logAudit({ action: `Массовое удаление протоколов (${ids.length})`, module: "protocols", details: ids.join(", ") });
      toast({ title: `Удалено: ${ids.length}` });
      setSelectedIds(new Set());
      qc.invalidateQueries({ queryKey: ["protocols"] });
    } catch (e: any) {
      toast({ title: "Ошибка удаления", description: e.message, variant: "destructive" });
    } finally {
      setBulkBusy(false);
    }
  }

  async function bulkSendSeafile() {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    const missing = ids.filter((id) => {
      const p: any = protocols.find((x) => x.id === id);
      return !(p?.executor_user_id || p?.executor_signature_user_id) || !(p?.responsible_user_id || p?.responsible_signature_user_id);
    });
    if (missing.length > 0) {
      toast({
        title: "Не заполнены подписанты",
        description: `Протоколов без «Выполнил/Ответственный»: ${missing.length}. Откройте протокол и заполните поля.`,
        variant: "destructive",
      });
      return;
    }
    setBulkBusy(true);
    setBulkProgress({ done: 0, total: ids.length, label: "Подготовка…" });
    try {
      const { data: setting } = await supabase
        .from("integration_settings")
        .select("enabled, config")
        .eq("key", "seafile")
        .maybeSingle();
      if (!setting?.enabled) {
        toast({ title: "Seafile не настроен", description: "Включите интеграцию в разделе «Интеграции».", variant: "destructive" });
        return;
      }

      let okCount = 0;
      let errCount = 0;
      for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        try {
          const proto = protocols.find((p) => p.id === id);
          const siteName0 = proto?.sites?.name ?? "site";
          setBulkProgress({ done: i, total: ids.length, label: `Подготовка: ${siteName0}` });
          const data = await fetchProtocolDocxData(id);
          const blob = await buildProtocolDocxBlob(data);
          const freqLabel = FREQ_LBL[proto?.frequency ?? ""] ?? proto?.frequency ?? "protocol";
          const siteName = proto?.sites?.name ?? "site";
          const dateStr = proto?.period_end ?? format(new Date(), "yyyy-MM-dd");
          const filename = `Протокол_${freqLabel}_${siteName}_${dateStr}.docx`.replace(/[/\\:*?"<>|]/g, "_");
          setBulkProgress({ done: i, total: ids.length, label: `Загрузка в облако: ${siteName} (${i + 1}/${ids.length})` });
          await sendToSeafile({
            kind: "protocol",
            blob,
            filename,
            meta: {
              protocol_id: id,
              site: siteName,
              frequency: proto?.frequency,
              period_start: proto?.period_start,
              period_end: proto?.period_end,
              // Путь в Seafile должен строиться по отчётной дате (period_end),
              // а не по дате выгрузки.
              date: dateStr,
              year: dateStr.slice(0, 4),
              month: dateStr.slice(5, 7),
              period: dateStr,
            },
          });
          okCount++;
        } catch (err: any) {
          errCount++;
          console.error("Seafile upload failed for", id, err);
        }
        setBulkProgress({ done: i + 1, total: ids.length, label: `Готово: ${i + 1}/${ids.length}` });
      }
      await logAudit({ action: `Массовая отправка протоколов в облако (${okCount}/${ids.length})`, module: "protocols", details: ids.join(", ") });
      toast({
        title: errCount === 0 ? `Отправлено в облако: ${okCount}` : `Отправлено: ${okCount}, ошибок: ${errCount}`,
        variant: errCount > 0 ? "destructive" : "default",
      });
      if (errCount === 0) setSelectedIds(new Set());
    } finally {
      setBulkBusy(false);
      setBulkProgress(null);
    }
  }

  function bulkExportCsv() {
    if (selectedIds.size === 0) return;
    const rows = filtered.filter((p) => selectedIds.has(p.id));
    const header = ["ЦОД", "Тип работ", "Период с", "Период по", "Статус", "Создан"];
    const lines = [header.join(";")].concat(
      rows.map((p) => [
        (p.sites?.name ?? "").replace(/;/g, ","),
        frequencyLabels[p.frequency] ?? p.frequency,
        p.period_start, p.period_end,
        p.status,
        format(new Date(p.created_at), "dd.MM.yyyy HH:mm"),
      ].join(";")),
    );
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `protocols_${format(new Date(), "yyyyMMdd_HHmm")}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  const fetchProtocolData = async (protocolId: string) => {
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
      return null;
    }

    const siteName = (protocol as any).sites?.name ?? "—";
    const mappedItems = items.map((it: any) => ({
      equipmentName: it.equipment
        ? `${it.equipment.name}${it.equipment.model ? ` (${it.equipment.model})` : ""}`
        : "—",
      taskTitle: it.maintenance_tasks?.title ?? "—",
      status: it.status ?? "pending",
      notes: it.notes,
      completedAt: it.completed_at,
    }));

    return { protocol, siteName, items: mappedItems };
  };

  const handleExportPdf = async (protocolId: string) => {
    const result = await fetchProtocolData(protocolId);
    if (!result) return;
    const { protocol, siteName, items: mappedItems } = result;

    const freq = frequencyLabels[protocol.frequency] ?? protocol.frequency;
    const period = `${format(new Date(protocol.period_start), "dd.MM.yyyy")} — ${format(new Date(protocol.period_end), "dd.MM.yyyy")}`;

    // Group by equipment
    const eqMap = new Map<string, typeof mappedItems>();
    for (const item of mappedItems) {
      if (!eqMap.has(item.equipmentName)) eqMap.set(item.equipmentName, []);
      eqMap.get(item.equipmentName)!.push(item);
    }

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
        .sig { border-top: 1px solid #333; width: 200px; text-align: center; padding-top: 4px; margin-top: 60px; }
        @media print { body { padding: 20px; } }
      </style>
    </head><body>`;
    html += `<h1>Протокол технического обслуживания</h1>`;
    html += `<p class="meta">${siteName} • ${freq} • ${period}</p>`;

    for (const [eqName, eqItems] of eqMap) {
      html += `<h2>${eqName}</h2>`;
      html += `<table><tr><th>№</th><th>Задача</th><th>Статус</th><th>Примечания</th><th>Дата выполнения</th></tr>`;
      eqItems.forEach((it, idx) => {
        const status = it.status === "completed" ? "✔ Выполнено" : "— Не выполнено";
        const cls = it.status === "completed" ? "done" : "pending";
        html += `<tr>
          <td>${idx + 1}</td>
          <td>${it.taskTitle}</td>
          <td class="${cls}">${status}</td>
          <td>${it.notes ?? ""}</td>
          <td>${it.completedAt ? format(new Date(it.completedAt), "dd.MM.yyyy HH:mm") : ""}</td>
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

  const handleExportDocx = async (protocolId: string) => {
    try {
      const data = await fetchProtocolDocxData(protocolId);
      try { data.graphs = await snapshotProtocolGraphs(); } catch { /* no graphs */ }
      await exportProtocolDocx(data);
    } catch (e) {
      toast({ title: "Ошибка экспорта", description: (e as Error).message, variant: "destructive" });
    }
  };

  if (selectedId) {
    return (
      <div>
        <ProtocolDetail
          protocolId={selectedId}
          onBack={() => setSelectedId(null)}
          onExportPdf={handleExportPdf}
          onExportDocx={handleExportDocx}
        />
      </div>
    );
  }

  return (
    <div>
      <Tabs
        value={topTab}
        onValueChange={(v) => {
          const next = new URLSearchParams(searchParams);
          if (v === "templates") next.set("tab", "templates"); else next.delete("tab");
          setSearchParams(next, { replace: true });
        }}
        className="mb-4"
      >
        <TabsList>
          <TabsTrigger value="list" className="gap-1.5">
            <ListChecks className="h-3.5 w-3.5" /> Протоколы
          </TabsTrigger>
          {canManage && (
            <TabsTrigger value="templates" className="gap-1.5">
              <FileText className="h-3.5 w-3.5" /> Шаблоны
            </TabsTrigger>
          )}
        </TabsList>
      </Tabs>

      {topTab === "templates" && canManage ? (
        <ProtocolTemplatesManager />
      ) : (
      <>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-heading text-2xl font-bold">Протоколы обслуживания</h1>
        {isStaff && (
          <div className="flex gap-2">
            <QuickReportButton />
            <BatchCreateProtocolDialog />
            <CreateProtocolDialog defaultDate={dateParam} />
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="mb-4">
        <TabsList>
          <TabsTrigger value="active">Активные ({activeProtocols.length})</TabsTrigger>
          <TabsTrigger value="overdue">Просрочены ({overdueProtocols.length})</TabsTrigger>
          <TabsTrigger value="completed">Завершённые ({completedProtocols.length})</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="w-56">
          <Select value={filterSite} onValueChange={setFilterSite}>
            <SelectTrigger>
              <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Все ЦОД" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все ЦОД</SelectItem>
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
        {activeTab === "active" && (
          <div className="w-48">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger><SelectValue placeholder="Все статусы" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="pending">Ожидает</SelectItem>
                <SelectItem value="in_progress">В работе</SelectItem>
                <SelectItem value="overdue">Просрочен</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <CalIcon className="h-3.5 w-3.5 text-muted-foreground" />
          <Input type="date" value={periodFrom} onChange={(e) => setPeriodFrom(e.target.value)} className="w-40 h-9" placeholder="Период с" />
          <span className="text-muted-foreground text-xs">—</span>
          <Input type="date" value={periodTo} onChange={(e) => setPeriodTo(e.target.value)} className="w-40 h-9" placeholder="по" />
        </div>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={resetFilters} className="h-9 text-xs">
            <X className="h-3 w-3 mr-1" /> Сбросить
          </Button>
        )}
      </div>

      {/* Bulk actions bar */}
      {isStaff && selectedIds.size > 0 && (
        <div className="flex items-center gap-2 mb-3 p-2 bg-primary/5 border border-primary/20 rounded-lg">
          <span className="text-sm font-medium">Выбрано: {selectedIds.size}</span>
          {bulkProgress && (
            <span className="text-xs text-muted-foreground flex items-center gap-2">
              <span className="inline-block h-2 w-32 rounded bg-muted overflow-hidden">
                <span
                  className="block h-full bg-primary transition-all"
                  style={{ width: `${Math.round((bulkProgress.done / Math.max(1, bulkProgress.total)) * 100)}%` }}
                />
              </span>
              {bulkProgress.label}
            </span>
          )}
          <div className="ml-auto flex gap-2">
            <Button size="sm" variant="outline" onClick={bulkExportCsv}>
              <FileDown className="h-3.5 w-3.5 mr-1" /> Экспорт CSV
            </Button>
            <Button size="sm" variant="outline" onClick={bulkSendSeafile} disabled={bulkBusy}>
              <Cloud className="h-3.5 w-3.5 mr-1" /> {bulkBusy && bulkProgress ? `${bulkProgress.done}/${bulkProgress.total}` : "В облако"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setBulkSignersOpen(true)}>
              <UserCheck className="h-3.5 w-3.5 mr-1" /> Подписанты
            </Button>
            <Button size="sm" variant="outline" onClick={bulkCompleteWorks}>
              <ListChecks className="h-3.5 w-3.5 mr-1" /> Выполнить все работы
            </Button>
            {activeTab !== "completed" && (
              <Button size="sm" onClick={bulkComplete}>
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Завершить
              </Button>
            )}
            <Button size="sm" variant="destructive" onClick={bulkDelete} disabled={bulkBusy}>
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Удалить
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {dateParam && (
        <p className="text-sm text-muted-foreground mb-3">
          Фильтр по дате: <strong>{format(new Date(dateParam), "dd.MM.yyyy")}</strong>
        </p>
      )}

      <ProtocolList
        loading={isLoading}
        protocols={filtered}
        onSelect={setSelectedId}
        selectedIds={isStaff ? selectedIds : undefined}
        onToggleSelect={isStaff ? toggleSelect : undefined}
        onToggleSelectAll={isStaff ? toggleSelectAll : undefined}
        onAssignSigners={isStaff ? (id) => setSignersFor(id) : undefined}
        onCompleteAllWorks={isStaff ? completeAllWorks : undefined}
      />
      </>
      )}
      <ProtocolSignersDialog
        protocolId={signersFor}
        open={!!signersFor}
        onOpenChange={(v) => { if (!v) setSignersFor(null); }}
      />
      <ProtocolSignersDialog
        protocolIds={Array.from(selectedIds)}
        open={bulkSignersOpen}
        onOpenChange={setBulkSignersOpen}
      />
    </div>
  );
}
