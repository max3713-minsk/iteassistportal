import { useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Upload, FileDown, Search, Filter, FileCheck2, FileX2 } from "lucide-react";
import { frequencyLabels, frequencyColors, type FrequencyType } from "@/lib/schedule-utils";
import { cn } from "@/lib/utils";
import { logAudit } from "@/lib/audit";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import TaskMetricBindings, { type MetricBinding } from "./TaskMetricBindings";
import { isLogAnalysisTask } from "@/lib/log-task-detect";
import { BarChart3, ScrollText } from "lucide-react";

type Frequency = FrequencyType;
const FREQS: Frequency[] = ["daily", "weekly", "monthly", "quarterly", "semi_annual", "on_request"];

interface TaskRow {
  id: string;
  title: string;
  description: string | null;
  frequency: Frequency;
  category_id: string | null;
  site_id: string | null;
  equipment_id: string | null;
  equipment_ids: string[] | null;
  is_active: boolean;
  is_system: boolean;
  include_in_protocol: boolean;
  metric_bindings: MetricBinding[];
}

const FREQ_BY_LABEL: Record<string, Frequency> = {
  "ежедневно": "daily", "ежедневные": "daily", "daily": "daily",
  "еженедельно": "weekly", "еженедельные": "weekly", "weekly": "weekly",
  "ежемесячно": "monthly", "ежемесячные": "monthly", "monthly": "monthly",
  "ежеквартально": "quarterly", "ежеквартальные": "quarterly", "quarterly": "quarterly",
  "полугодовые": "semi_annual", "раз в полгода": "semi_annual", "semi_annual": "semi_annual",
  "по запросу": "on_request", "on_request": "on_request",
};

export default function WorkScopeManager() {
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const canEdit = hasRole("admin") || hasRole("engineer");
  const fileRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState("");
  const [filterFreq, setFilterFreq] = useState<string>("all");
  const [filterCat, setFilterCat] = useState<string>("all");
  const [filterSite, setFilterSite] = useState<string>("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<TaskRow> | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: categories = [] } = useQuery({
    queryKey: ["wsm-categories"],
    queryFn: async () => {
      const { data } = await supabase.from("equipment_categories").select("id, name").order("name");
      return data ?? [];
    },
  });
  const { data: sites = [] } = useQuery({
    queryKey: ["wsm-sites"],
    queryFn: async () => {
      const { data } = await supabase.from("sites").select("id, name").order("name");
      return data ?? [];
    },
  });
  const { data: equipment = [] } = useQuery({
    queryKey: ["wsm-equipment"],
    queryFn: async () => {
      const { data } = await supabase.from("equipment").select("id, name, site_id, category_id").order("name");
      return data ?? [];
    },
  });

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["wsm-tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_tasks")
        .select("id, title, description, frequency, category_id, site_id, equipment_id, equipment_ids, is_active, is_system, include_in_protocol, metric_bindings")
        .order("title");
      if (error) throw error;
      return ((data ?? []) as any[]).map((t) => ({
        ...t,
        metric_bindings: Array.isArray(t.metric_bindings) ? t.metric_bindings : [],
      })) as TaskRow[];
    },
  });

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (filterFreq !== "all" && t.frequency !== filterFreq) return false;
      if (filterCat !== "all" && t.category_id !== filterCat) return false;
      if (filterSite !== "all" && t.site_id !== filterSite && filterSite !== "__none__") return false;
      if (filterSite === "__none__" && t.site_id) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!t.title.toLowerCase().includes(q) && !(t.description ?? "").toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [tasks, filterFreq, filterCat, filterSite, search]);

  const saveMutation = useMutation({
    mutationFn: async (row: Partial<TaskRow>) => {
      const eqIds = (row.equipment_ids ?? []).filter(Boolean);
      const payload = {
        title: row.title!,
        description: row.description || null,
        frequency: row.frequency!,
        category_id: row.category_id || null,
        site_id: row.site_id || null,
        equipment_id: eqIds.length === 1 ? eqIds[0] : null,
        equipment_ids: eqIds,
        is_active: row.is_active ?? true,
        include_in_protocol: row.include_in_protocol ?? true,
        metric_bindings: (row.metric_bindings ?? []) as any,
      };
      if (row.id) {
        const { error } = await supabase.from("maintenance_tasks").update(payload as any).eq("id", row.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("maintenance_tasks").insert(payload as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wsm-tasks"] });
      qc.invalidateQueries({ queryKey: ["maintenance-tasks-all-ref"] });
      setDialogOpen(false);
      setEditing(null);
      toast({ title: "Сохранено" });
    },
    onError: (e: any) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  });

  const bulkUpdate = useMutation({
    mutationFn: async ({ ids, patch }: { ids: string[]; patch: Partial<Pick<TaskRow, "include_in_protocol" | "is_active">> }) => {
      const { error } = await supabase.from("maintenance_tasks").update(patch).in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wsm-tasks"] });
      toast({ title: "Обновлено" });
      setSelectedIds(new Set());
    },
    onError: (e: any) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  });

  const bulkDelete = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("maintenance_tasks").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wsm-tasks"] });
      toast({ title: "Удалено" });
      setSelectedIds(new Set());
    },
    onError: (e: any) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("maintenance_tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wsm-tasks"] });
      toast({ title: "Удалено" });
    },
    onError: (e: any) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  });

  function openCreate() {
    setEditing({ frequency: "monthly", is_active: true, include_in_protocol: true });
    setDialogOpen(true);
  }
  function openEdit(t: TaskRow) {
    setEditing(t);
    setDialogOpen(true);
  }

  async function handleImport(file: File) {
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf);
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: "" });
      if (!rows.length) throw new Error("Пустой файл");

      const catByName = new Map(categories.map((c: any) => [c.name.toLowerCase().trim(), c.id]));
      const siteByName = new Map(sites.map((s: any) => [s.name.toLowerCase().trim(), s.id]));

      const toInsert: any[] = [];
      const errors: string[] = [];

      rows.forEach((r, idx) => {
        const title = String(r["Наименование"] ?? r["Название"] ?? r["title"] ?? "").trim();
        const freqRaw = String(r["Периодичность"] ?? r["frequency"] ?? "").toLowerCase().trim();
        if (!title) { errors.push(`Строка ${idx + 2}: пустое наименование`); return; }
        const frequency = FREQ_BY_LABEL[freqRaw] ?? "monthly";
        const catName = String(r["Категория"] ?? r["category"] ?? "").toLowerCase().trim();
        const siteName = String(r["ЦОД"] ?? r["site"] ?? "").toLowerCase().trim();
        toInsert.push({
          title,
          description: String(r["Описание"] ?? r["description"] ?? "").trim() || null,
          frequency,
          category_id: catName ? (catByName.get(catName) ?? null) : null,
          site_id: siteName ? (siteByName.get(siteName) ?? null) : null,
          is_active: true,
        });
      });

      if (toInsert.length) {
        const { error } = await supabase.from("maintenance_tasks").insert(toInsert);
        if (error) throw error;
      }
      qc.invalidateQueries({ queryKey: ["wsm-tasks"] });
      await logAudit({ action: `Импорт состава работ (${toInsert.length})`, module: "work-scope" });
      toast({
        title: `Импортировано: ${toInsert.length}`,
        description: errors.length ? `Пропущено строк: ${errors.length}` : "Все строки добавлены",
      });
    } catch (e) {
      toast({ title: "Ошибка импорта", description: e instanceof Error ? e.message : "—", variant: "destructive" });
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function downloadTemplate() {
    const wb = XLSX.utils.book_new();
    const data = [
      { "Наименование": "Контроль состояния", "Описание": "Визуальный осмотр", "Периодичность": "ежедневно", "Категория": "ИБП", "ЦОД": "" },
      { "Наименование": "ТО ИБП", "Описание": "Очистка фильтров", "Периодичность": "квартально", "Категория": "ИБП", "ЦОД": "" },
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Состав работ");
    XLSX.writeFile(wb, "work-scope-template.xlsx");
  }

  function exportCurrent() {
    const data = filtered.map((t) => ({
      "Наименование": t.title,
      "Описание": t.description ?? "",
      "Периодичность": frequencyLabels[t.frequency],
      "Категория": categories.find((c: any) => c.id === t.category_id)?.name ?? "",
      "ЦОД": sites.find((s: any) => s.id === t.site_id)?.name ?? "",
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Состав работ");
    XLSX.writeFile(wb, `work-scope-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  if (isLoading) return <p className="text-muted-foreground">Загрузка...</p>;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Поиск..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={filterFreq} onValueChange={setFilterFreq}>
              <SelectTrigger className="w-[180px]"><Filter className="h-3 w-3 mr-1" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все периодичности</SelectItem>
                {FREQS.map((f) => <SelectItem key={f} value={f}>{frequencyLabels[f]}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterCat} onValueChange={setFilterCat}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Категория" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все категории</SelectItem>
                {categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterSite} onValueChange={setFilterSite}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="ЦОД" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все ЦОД</SelectItem>
                <SelectItem value="__none__">Без привязки</SelectItem>
                {sites.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {canEdit && (
              <>
                <Button onClick={openCreate} className="gap-1"><Plus className="h-4 w-4" />Добавить</Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImport(f); }}
                />
                <Button variant="outline" onClick={() => fileRef.current?.click()} className="gap-1">
                  <Upload className="h-4 w-4" />Импорт XLSX
                </Button>
                <Button variant="ghost" onClick={downloadTemplate} className="gap-1">
                  <FileDown className="h-4 w-4" />Шаблон
                </Button>
                <Button variant="ghost" onClick={exportCurrent} className="gap-1">
                  <FileDown className="h-4 w-4" />Экспорт
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedIds.size > 0 && canEdit && (
        <Card className="border-primary/40">
          <CardContent className="py-2.5 flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">Выбрано: {selectedIds.size}</span>
            <Button size="sm" variant="outline" className="gap-1.5"
              onClick={() => bulkUpdate.mutate({ ids: Array.from(selectedIds), patch: { include_in_protocol: true } })}>
              <FileCheck2 className="h-3.5 w-3.5" /> Включить в протокол
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5"
              onClick={() => bulkUpdate.mutate({ ids: Array.from(selectedIds), patch: { include_in_protocol: false } })}>
              <FileX2 className="h-3.5 w-3.5" /> Исключить из протокола
            </Button>
            <Button size="sm" variant="outline"
              onClick={() => bulkUpdate.mutate({ ids: Array.from(selectedIds), patch: { is_active: true } })}>
              Активировать
            </Button>
            <Button size="sm" variant="outline"
              onClick={() => bulkUpdate.mutate({ ids: Array.from(selectedIds), patch: { is_active: false } })}>
              Деактивировать
            </Button>
            <Button size="sm" variant="outline" className="text-destructive"
              onClick={() => { if (confirm(`Удалить ${selectedIds.size} работ?`)) bulkDelete.mutate(Array.from(selectedIds)); }}>
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Удалить
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>Снять выделение</Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {canEdit && (
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={filtered.length > 0 && filtered.every((t) => selectedIds.has(t.id))}
                      onCheckedChange={(v) => {
                        if (v) setSelectedIds(new Set(filtered.map((t) => t.id)));
                        else setSelectedIds(new Set());
                      }}
                    />
                  </TableHead>
                )}
                <TableHead>Наименование</TableHead>
                <TableHead className="w-[140px]">Периодичность</TableHead>
                <TableHead className="w-[180px]">Категория</TableHead>
                <TableHead className="w-[160px]">Привязка</TableHead>
                <TableHead className="w-[120px]">Покрытие</TableHead>
                <TableHead className="w-[120px]">В протокол</TableHead>
                {canEdit && <TableHead className="w-[100px]"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => {
                const cat = categories.find((c: any) => c.id === t.category_id);
                const site = sites.find((s: any) => s.id === t.site_id);
                const eq = equipment.find((e: any) => e.id === t.equipment_id);
                return (
                  <TableRow key={t.id} className={cn(!t.is_active && "opacity-50")}>
                    {canEdit && (
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(t.id)}
                          onCheckedChange={(v) => {
                            setSelectedIds((prev) => {
                              const next = new Set(prev);
                              if (v) next.add(t.id); else next.delete(t.id);
                              return next;
                            });
                          }}
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="font-medium text-sm">{t.title}</div>
                      {t.description && <div className="text-xs text-muted-foreground">{t.description}</div>}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-xs", frequencyColors[t.frequency]?.bg, frequencyColors[t.frequency]?.text)}>
                        {frequencyLabels[t.frequency]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{cat?.name ?? "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {(() => {
                        const ids = (t.equipment_ids ?? []).filter(Boolean);
                        if (ids.length > 1) {
                          return `🖥 ${ids.length} ед.`;
                        }
                        if (ids.length === 1) {
                          const e = equipment.find((x: any) => x.id === ids[0]);
                          return e ? `🖥 ${e.name}` : "—";
                        }
                        return eq ? `🖥 ${eq.name}` : site ? `🏢 ${site.name}` : "—";
                      })()}
                    </TableCell>
                    <TableCell>
                      {canEdit ? (
                        <Checkbox
                          checked={t.include_in_protocol}
                          onCheckedChange={(v) =>
                            bulkUpdate.mutate({ ids: [t.id], patch: { include_in_protocol: !!v } })
                          }
                        />
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          {t.include_in_protocol ? "Да" : "Нет"}
                        </Badge>
                      )}
                    </TableCell>
                    {canEdit && (
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(t)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7"
                            onClick={() => { if (confirm(`Удалить «${t.title}»?`)) deleteMutation.mutate(t.id); }}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={canEdit ? 7 : 5} className="text-center text-muted-foreground py-8">Ничего не найдено</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Редактировать работу" : "Новая работа"}</DialogTitle>
            <DialogDescription>Регламентная работа выполняется по периодичности и может быть привязана к категории, ЦОД или конкретному оборудованию.</DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Наименование *</Label>
                <Input value={editing.title ?? ""} onChange={(e) => setEditing((p) => ({ ...p!, title: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Описание</Label>
                <Textarea rows={2} value={editing.description ?? ""} onChange={(e) => setEditing((p) => ({ ...p!, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Периодичность *</Label>
                  <Select value={editing.frequency ?? "monthly"} onValueChange={(v) => setEditing((p) => ({ ...p!, frequency: v as Frequency }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{FREQS.map((f) => <SelectItem key={f} value={f}>{frequencyLabels[f]}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Категория оборудования</Label>
                  <Select value={editing.category_id ?? "__none__"} onValueChange={(v) => setEditing((p) => ({ ...p!, category_id: v === "__none__" ? null : v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— Не привязано —</SelectItem>
                      {categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>ЦОД (опционально)</Label>
                  <Select value={editing.site_id ?? "__none__"} onValueChange={(v) => setEditing((p) => ({ ...p!, site_id: v === "__none__" ? null : v, equipment_id: null }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— Все ЦОД —</SelectItem>
                      {sites.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Оборудование (множ. выбор)</Label>
                  {(() => {
                    const list = (equipment as any[]).filter((e) => !editing.site_id || e.site_id === editing.site_id)
                      .filter((e) => !editing.category_id || e.category_id === editing.category_id);
                    const selectedIds = new Set((editing.equipment_ids ?? (editing.equipment_id ? [editing.equipment_id] : [])).filter(Boolean) as string[]);
                    const allSelected = list.length > 0 && list.every((e: any) => selectedIds.has(e.id));
                    const toggleAll = () => {
                      const next = allSelected ? [] : list.map((e: any) => e.id);
                      setEditing((p) => ({ ...p!, equipment_ids: next, equipment_id: null }));
                    };
                    const toggleOne = (id: string) => {
                      const next = new Set(selectedIds);
                      if (next.has(id)) next.delete(id); else next.add(id);
                      setEditing((p) => ({ ...p!, equipment_ids: Array.from(next), equipment_id: null }));
                    };
                    return (
                      <div className="border rounded-md">
                        <div className="flex items-center gap-2 px-2 py-1.5 border-b text-xs">
                          <Checkbox checked={allSelected} onCheckedChange={toggleAll} id="ws-all-eq" />
                          <label htmlFor="ws-all-eq" className="cursor-pointer">
                            Выбрать все ({list.length}) {selectedIds.size > 0 && `· выбрано: ${selectedIds.size}`}
                          </label>
                        </div>
                        <ScrollArea className="h-[140px]">
                          <div className="p-1">
                            {list.length === 0 ? (
                              <div className="text-xs text-muted-foreground py-3 text-center">
                                Нет оборудования по выбранным фильтрам
                              </div>
                            ) : list.map((e: any) => (
                              <label key={e.id} className="flex items-center gap-2 px-2 py-1 text-xs hover:bg-muted/50 rounded cursor-pointer">
                                <Checkbox checked={selectedIds.has(e.id)} onCheckedChange={() => toggleOne(e.id)} />
                                <span className="truncate">{e.name}</span>
                              </label>
                            ))}
                          </div>
                        </ScrollArea>
                        <p className="text-[10px] text-muted-foreground px-2 py-1 border-t">
                          Пусто = применять ко всему оборудованию выбранной категории/ЦОД.
                        </p>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
          {editing && (
            <div className="flex items-center gap-2 mt-2 pt-3 border-t">
              <Checkbox
                id="ws-include"
                checked={editing.include_in_protocol ?? true}
                onCheckedChange={(v) => setEditing((p) => ({ ...p!, include_in_protocol: !!v }))}
              />
              <Label htmlFor="ws-include" className="cursor-pointer text-sm">
                Включать в протокол ТО
              </Label>
              <span className="text-xs text-muted-foreground ml-2">
                Снимите, если работа должна быть в составе, но не попадать в протокол.
              </span>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Отмена</Button>
            <Button onClick={() => saveMutation.mutate(editing!)} disabled={!editing?.title || !editing?.frequency || saveMutation.isPending}>
              {saveMutation.isPending ? "Сохранение..." : "Сохранить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}