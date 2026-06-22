import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Server, Pencil, Trash2, Filter, Activity, FolderArchive, PlayCircle, Loader2, Tag } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useEquipmentHealth } from "@/hooks/useEquipmentHealth";
import { HealthIndicator } from "@/components/equipment/HealthIndicator";
import { HEALTH_GRADE_CONFIG } from "@/lib/health-score";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import EquipmentMonitoringMetrics from "@/components/monitoring/EquipmentMonitoringMetrics";
import EquipmentCategoriesManager, { CategoryIcon } from "@/components/help/EquipmentCategoriesManager";

const BACKUP_STATUS_LABEL: Record<string, { label: string; variant: any }> = {
  ok: { label: "OK", variant: "success" },
  stale: { label: "Устарел", variant: "warning" },
  missing: { label: "Нет файла", variant: "destructive" },
  checksum_mismatch: { label: "MD5 ✗", variant: "destructive" },
  error: { label: "Ошибка", variant: "destructive" },
};

const EQUIPMENT_STATUSES = [
  { value: "active", label: "Активно" },
  { value: "maintenance", label: "На обслуживании" },
  { value: "decommissioned", label: "Выведено" },
  { value: "faulty", label: "Неисправно" },
];

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "warning"> = {
  active: "success",
  maintenance: "warning",
  decommissioned: "outline",
  faulty: "destructive",
};

interface EquipForm {
  name: string;
  model: string;
  site_id: string;
  category_id: string;
  serial_number: string;
  os_info: string;
  quantity: number;
  description: string;
  status: string;
  backup_storage_id: string;
  backup_path: string;
  backup_filename_pattern: string;
  backup_extensions: string;
  backup_max_age_hours: number;
  backup_min_size_kb: number;
  backup_md5_source: "sidecar" | "stored" | "none";
  backup_md5_expected: string;
}

const empty: EquipForm = {
  name: "", model: "", site_id: "", category_id: "", serial_number: "", os_info: "",
  quantity: 1, description: "", status: "active",
  backup_storage_id: "", backup_path: "", backup_filename_pattern: "", backup_extensions: "",
  backup_max_age_hours: 24, backup_min_size_kb: 1,
  backup_md5_source: "sidecar", backup_md5_expected: "",
};

export default function Equipment() {
  const { isStaff, hasRole } = useAuth();
  const isAdmin = hasRole("admin");
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<EquipForm>(empty);
  const [filterSite, setFilterSite] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [catsOpen, setCatsOpen] = useState(false);

  const { data: equipment = [], isLoading } = useQuery({
    queryKey: ["equipment"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("equipment")
        .select("*, sites(name), equipment_categories(name, icon)")
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

  const { data: categories = [] } = useQuery({
    queryKey: ["equipment-categories"],
    queryFn: async () => {
      const { data } = await supabase.from("equipment_categories").select("*").order("name");
      return data ?? [];
    },
  });

  const { data: hostLinks = [] } = useQuery({
    queryKey: ["monitoring-host-links"],
    queryFn: async () => {
      const { data } = await supabase.from("monitoring_host_links").select("equipment_id, host_name, zabbix_host_id");
      return data ?? [];
    },
  });

  const { data: backupStorages = [] } = useQuery({
    queryKey: ["backup-storages-options"],
    queryFn: async () => {
      const { data } = await supabase.from("backup_storage_connections" as any).select("id,name,enabled").order("name");
      return (data ?? []) as any[];
    },
  });

  const { data: lastBackupChecks = [] } = useQuery({
    queryKey: ["last-backup-checks"],
    queryFn: async () => {
      const { data } = await supabase.from("equipment_backup_checks" as any)
        .select("equipment_id,status,checked_at,message,file_path")
        .order("checked_at", { ascending: false }).limit(500);
      return (data ?? []) as any[];
    },
  });
  const lastBackupByEq = useMemo(() => {
    const map = new Map<string, any>();
    for (const c of lastBackupChecks) if (!map.has(c.equipment_id)) map.set(c.equipment_id, c);
    return map;
  }, [lastBackupChecks]);

  const [runningCheck, setRunningCheck] = useState<string | null>(null);
  const runBackupCheck = async (equipment_id: string) => {
    setRunningCheck(equipment_id);
    try {
      const { data, error } = await supabase.functions.invoke("backup-storage-check", {
        body: { action: "check_equipment", equipment_id, triggered_by: "manual" },
      });
      if (error) throw error;
      const r = data?.results?.[0];
      toast({
        title: r ? `Бэкап: ${BACKUP_STATUS_LABEL[r.status]?.label ?? r.status}` : "Проверка завершена",
        description: r?.message ?? r?.file_path ?? "",
        variant: r?.status === "ok" ? "default" : "destructive",
      });
      qc.invalidateQueries({ queryKey: ["last-backup-checks"] });
    } catch (e: any) {
      toast({ title: "Ошибка проверки", description: e.message, variant: "destructive" });
    } finally { setRunningCheck(null); }
  };

  const linkByEqId = useMemo(() => {
    const map = new Map<string, { host_name: string; zabbix_host_id: string }>();
    for (const l of hostLinks) map.set(l.equipment_id, l);
    return map;
  }, [hostLinks]);

  const saveMutation = useMutation({
    mutationFn: async (f: EquipForm) => {
      const payload = {
        name: f.name,
        model: f.model || null,
        site_id: f.site_id,
        category_id: f.category_id || null,
        serial_number: f.serial_number || null,
        os_info: f.os_info || null,
        quantity: f.quantity,
        description: f.description || null,
        status: f.status,
        backup_storage_id: f.backup_storage_id || null,
        backup_path: f.backup_path || null,
        backup_filename_pattern: f.backup_filename_pattern || null,
        backup_extensions: f.backup_extensions
          ? f.backup_extensions.split(",").map((s) => s.trim()).filter(Boolean)
          : null,
        backup_max_age_hours: f.backup_max_age_hours || null,
        backup_min_size_kb: f.backup_min_size_kb || null,
        backup_md5_source: f.backup_md5_source,
        backup_md5_expected: f.backup_md5_expected || null,
      } as any;
      if (editing) {
        const { error } = await supabase.from("equipment").update(payload).eq("id", editing);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("equipment").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["equipment"] });
      qc.invalidateQueries({ queryKey: ["equipment-count"] });
      setOpen(false);
      setEditing(null);
      setForm(empty);
      toast({ title: editing ? "Оборудование обновлено" : "Оборудование добавлено" });
    },
    onError: (e: any) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("equipment").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["equipment"] });
      qc.invalidateQueries({ queryKey: ["equipment-count"] });
      toast({ title: "Оборудование удалено" });
    },
  });

  const openEdit = (eq: any) => {
    setForm({
      name: eq.name,
      model: eq.model ?? "",
      site_id: eq.site_id,
      category_id: eq.category_id ?? "",
      serial_number: eq.serial_number ?? "",
      os_info: eq.os_info ?? "",
      quantity: eq.quantity ?? 1,
      description: eq.description ?? "",
      status: eq.status ?? "active",
      backup_storage_id: eq.backup_storage_id ?? "",
      backup_path: eq.backup_path ?? "",
      backup_filename_pattern: eq.backup_filename_pattern ?? "",
      backup_extensions: Array.isArray(eq.backup_extensions) ? eq.backup_extensions.join(", ") : "",
      backup_max_age_hours: eq.backup_max_age_hours ?? 24,
      backup_min_size_kb: eq.backup_min_size_kb ?? 1,
      backup_md5_source: (eq.backup_md5_source as any) ?? "sidecar",
      backup_md5_expected: eq.backup_md5_expected ?? "",
    });
    setEditing(eq.id);
    setOpen(true);
  };

  const filteredEquipment = useMemo(() => {
    return equipment.filter((eq: any) => {
      if (filterSite !== "all" && eq.site_id !== filterSite) return false;
      if (filterCategory !== "all" && eq.category_id !== filterCategory) return false;
      return true;
    });
  }, [equipment, filterSite, filterCategory]);

  const { data: healthMap = {} } = useEquipmentHealth(filteredEquipment);
  const avgHealth = useMemo(() => {
    const vals = Object.values(healthMap);
    if (vals.length === 0) return null;
    return Math.round(vals.reduce((s, h) => s + h.score, 0) / vals.length);
  }, [healthMap]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h1 className="font-heading text-2xl font-bold">Оборудование</h1>
          {avgHealth !== null && (
            <Badge
              variant="outline"
              className="gap-1.5"
              style={{
                color: HEALTH_GRADE_CONFIG[
                  avgHealth >= 85 ? "excellent" : avgHealth >= 70 ? "good" : avgHealth >= 50 ? "fair" : avgHealth >= 30 ? "poor" : "critical"
                ].color,
                borderColor: "currentColor",
              }}
            >
              Health Score · {avgHealth}/100
            </Badge>
          )}
        </div>
        {isStaff && (
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button variant="outline" onClick={() => setCatsOpen(true)}>
                <Tag className="h-4 w-4 mr-2" /> Категории
              </Button>
            )}
            <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditing(null); setForm(empty); } }}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" />Добавить</Button>
              </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editing ? "Редактировать" : "Новое оборудование"}</DialogTitle>
                <DialogDescription>Укажите параметры единицы оборудования</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                <div className="space-y-2">
                  <Label>Название</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Huawei FusionServer 1288H V6" />
                </div>
                <div className="space-y-2">
                  <Label>Модель</Label>
                  <Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Площадка</Label>
                  <Select value={form.site_id} onValueChange={(v) => setForm({ ...form, site_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Выберите площадку" /></SelectTrigger>
                    <SelectContent>
                      {sites.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Категория</Label>
                  <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Выберите категорию" /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>
                          <span className="inline-flex items-center gap-2">
                            <CategoryIcon name={c.icon} className="h-3.5 w-3.5 text-muted-foreground" />
                            {c.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Серийный №</Label>
                    <Input value={form.serial_number} onChange={(e) => setForm({ ...form, serial_number: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Кол-во</Label>
                    <Input type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>ОС / ПО</Label>
                  <Input value={form.os_info} onChange={(e) => setForm({ ...form, os_info: e.target.value })} placeholder="VMware ESXi 7.0" />
                </div>
                <div className="space-y-2">
                  <Label>Описание</Label>
                  <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
                </div>
                <div className="space-y-2">
                  <Label>Статус</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue placeholder="Выберите статус" /></SelectTrigger>
                    <SelectContent>
                      {EQUIPMENT_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="rounded-md border p-3 space-y-3 bg-muted/20">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <FolderArchive className="h-4 w-4 text-primary" /> Резервное копирование
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Хранилище</Label>
                    <Select
                      value={form.backup_storage_id || "none"}
                      onValueChange={(v) => setForm({ ...form, backup_storage_id: v === "none" ? "" : v })}
                    >
                      <SelectTrigger><SelectValue placeholder="Не используется" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— Не используется —</SelectItem>
                        {backupStorages.map((s: any) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}{s.enabled ? "" : " (откл.)"}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {form.backup_storage_id && (
                    <>
                      <div className="space-y-1">
                        <Label className="text-xs">Путь относительно базового</Label>
                        <Input value={form.backup_path}
                          onChange={(e) => setForm({ ...form, backup_path: e.target.value })}
                          placeholder="cisco/{name}/  или оставьте пустым для корня" />
                        <p className="text-xs text-muted-foreground">
                          Подстановки: <code>{"{name}"}</code>, <code>{"{model}"}</code>, <code>{"{serial}"}</code>.
                          Пусто или каталог (на /) — берётся свежайший файл; иначе — точный путь к файлу.
                        </p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Шаблон имени файла (glob)</Label>
                        <Input value={form.backup_filename_pattern}
                          onChange={(e) => setForm({ ...form, backup_filename_pattern: e.target.value })}
                          placeholder="{name}_config_*.zip" />
                        <p className="text-xs text-muted-foreground">
                          Если задан — ищем в каталоге файл с именем по шаблону (<code>*</code>, <code>?</code>,
                          подстановки <code>{"{name}"}</code>/<code>{"{model}"}</code>/<code>{"{serial}"}</code>).
                          Берётся самый свежий совпавший файл.
                        </p>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Расширения</Label>
                          <Input value={form.backup_extensions}
                            onChange={(e) => setForm({ ...form, backup_extensions: e.target.value })}
                            placeholder=".cfg, .tar.gz" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Возраст, ч</Label>
                          <Input type="number" min={1} value={form.backup_max_age_hours}
                            onChange={(e) => setForm({ ...form, backup_max_age_hours: Number(e.target.value) || 24 })} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Мин. размер, КБ</Label>
                          <Input type="number" min={0} value={form.backup_min_size_kb}
                            onChange={(e) => setForm({ ...form, backup_min_size_kb: Number(e.target.value) || 0 })} />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Проверка MD5</Label>
                        <Select value={form.backup_md5_source}
                          onValueChange={(v: any) => setForm({ ...form, backup_md5_source: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sidecar">Рядом лежит файл .md5</SelectItem>
                            <SelectItem value="stored">Эталон сохранён в портале</SelectItem>
                            <SelectItem value="none">Не проверять MD5</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {form.backup_md5_source === "stored" && (
                        <div className="space-y-1">
                          <Label className="text-xs">Эталонный MD5</Label>
                          <Input value={form.backup_md5_expected}
                            onChange={(e) => setForm({ ...form, backup_md5_expected: e.target.value })}
                            placeholder="d41d8cd98f00b204e9800998ecf8427e" />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => saveMutation.mutate(form)} disabled={!form.name || !form.site_id || saveMutation.isPending}>
                  {saveMutation.isPending ? "Сохранение..." : "Сохранить"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="w-56">
          <Select value={filterSite} onValueChange={setFilterSite}>
            <SelectTrigger>
              <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Все площадки" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все ЦОД</SelectItem>
              {sites.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="w-56">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger>
              <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Все категории" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все категории</SelectItem>
              {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Загрузка...</p>
      ) : filteredEquipment.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Server className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">Оборудование ещё не добавлено</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Модель</TableHead>
                <TableHead>ЦОД</TableHead>
                <TableHead className="hidden md:table-cell">Категория</TableHead>
                <TableHead className="hidden lg:table-cell">ОС</TableHead>
                <TableHead>Кол-во</TableHead>
                <TableHead>Мониторинг</TableHead>
                <TableHead>Бэкап</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Здоровье</TableHead>
                {isStaff && <TableHead className="w-24">Действия</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEquipment.map((eq: any) => {
                const monLink = linkByEqId.get(eq.id);
                const row = (
                  <TableRow key={eq.id}>
                    <TableCell className="font-medium">{eq.name}</TableCell>
                    <TableCell className="text-muted-foreground">{eq.model ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{eq.sites?.name ?? "—"}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {eq.equipment_categories?.name ? (
                        <span className="inline-flex items-center gap-1.5">
                          <CategoryIcon name={eq.equipment_categories?.icon} className="h-3.5 w-3.5" />
                          {eq.equipment_categories.name}
                        </span>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{eq.os_info ?? "—"}</TableCell>
                    <TableCell>{eq.quantity}</TableCell>
                    <TableCell>
                      {monLink ? (
                        <div className="flex flex-col gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="success" className="gap-1 cursor-help w-fit">
                                <Activity className="h-3 w-3" />
                                {monLink.host_name}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>Связано с Zabbix-хостом #{monLink.zabbix_host_id}</TooltipContent>
                          </Tooltip>
                          <EquipmentMonitoringMetrics zabbixHostId={monLink.zabbix_host_id} />
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">Не подключён</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {eq.backup_storage_id ? (
                        <div className="flex items-center gap-1">
                          {(() => {
                            const lc = lastBackupByEq.get(eq.id);
                            if (!lc) return <Badge variant="secondary">Не проверялся</Badge>;
                            const cfg = BACKUP_STATUS_LABEL[lc.status] ?? { label: lc.status, variant: "outline" };
                            return (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge variant={cfg.variant} className="cursor-help">{cfg.label}</Badge>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <div className="text-xs">
                                    <div>{new Date(lc.checked_at).toLocaleString("ru-RU")}</div>
                                    {lc.file_path && <div className="text-muted-foreground truncate">{lc.file_path}</div>}
                                    {lc.message && <div className="mt-1">{lc.message}</div>}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            );
                          })()}
                          {isStaff && (
                            <Button variant="ghost" size="icon" title="Проверить сейчас"
                              onClick={() => runBackupCheck(eq.id)} disabled={runningCheck === eq.id}>
                              {runningCheck === eq.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlayCircle className="h-3.5 w-3.5" />}
                            </Button>
                          )}
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">—</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[eq.status ?? "active"] ?? "outline"}>
                        {EQUIPMENT_STATUSES.find((s) => s.value === (eq.status ?? "active"))?.label ?? eq.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {healthMap[eq.id] ? <HealthIndicator result={healthMap[eq.id]} compact /> : <span className="text-xs text-muted-foreground">—</span>}
                    </TableCell>
                    {isStaff && (
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(eq)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(eq.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
                if (eq.description) {
                  return (
                    <Tooltip key={eq.id}>
                      <TooltipTrigger asChild>{row}</TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p>{eq.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                }
                return row;
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={catsOpen} onOpenChange={setCatsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Управление категориями оборудования</DialogTitle>
            <DialogDescription>
              Добавляйте, переименовывайте и удаляйте категории. При удалении категории
              с привязанным оборудованием можно перенести его в другую категорию.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto">
            <EquipmentCategoriesManager />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
