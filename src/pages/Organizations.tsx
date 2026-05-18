import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/users/ConfirmDialog";
import { Building2, Plus, FileText, Download, Trash2, AlertTriangle, Calendar as CalendarIcon, Workflow, MapPin } from "lucide-react";
import { logAudit } from "@/lib/audit";
import SupportSchemeView from "@/components/organizations/SupportSchemeView";
import { ClientReportWizard } from "@/components/organizations/ClientReportWizard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSearchParams } from "react-router-dom";
import OrganizationSitesPanel from "@/components/organizations/OrganizationSitesPanel";

export default function Organizations() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole("admin");
  const { toast } = useToast();
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const validTabs = ["orgs", "contracts", "sites", "support", "reports"];
  const tab = validTabs.includes(tabParam ?? "") ? (tabParam as string) : "orgs";
  const setTab = (v: string) => {
    const next = new URLSearchParams(searchParams);
    if (v === "orgs") next.delete("tab"); else next.set("tab", v);
    setSearchParams(next, { replace: true });
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          Только администраторы могут управлять организациями и договорами.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
          <Building2 className="h-6 w-6 text-primary" />
          Организации и Договоры
        </h1>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="orgs">Организации</TabsTrigger>
          <TabsTrigger value="contracts">Договоры</TabsTrigger>
          <TabsTrigger value="sites"><MapPin className="h-3.5 w-3.5 mr-1.5" />ЦОД</TabsTrigger>
          <TabsTrigger value="support"><Workflow className="h-3.5 w-3.5 mr-1.5" />Схема поддержки</TabsTrigger>
          <TabsTrigger value="reports"><FileText className="h-3.5 w-3.5 mr-1.5" />Отчёты</TabsTrigger>
        </TabsList>
        <TabsContent value="orgs">
          <OrganizationsTab toast={toast} qc={qc} />
        </TabsContent>
        <TabsContent value="contracts">
          <ContractsTab toast={toast} qc={qc} />
        </TabsContent>
        <TabsContent value="sites">
          <OrganizationSitesPanel />
        </TabsContent>
        <TabsContent value="support">
          <SupportTab />
        </TabsContent>
        <TabsContent value="reports">
          <ClientReportWizard />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ─── Support Scheme Tab ─── */
function SupportTab() {
  const { data: orgs = [] } = useQuery({
    queryKey: ["organizations-for-support"],
    queryFn: async () => (await supabase.from("organizations").select("id, name").eq("is_active", true).order("name")).data ?? [],
  });
  const [orgId, setOrgId] = useState<string>("");
  const active = orgs.find((o: any) => o.id === orgId) ?? orgs[0];

  if (orgs.length === 0) {
    return (
      <Card><CardContent className="py-10 text-center text-muted-foreground">
        Сначала создайте организацию во вкладке «Организации».
      </CardContent></Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Организация:</span>
        <Select value={active?.id ?? ""} onValueChange={setOrgId}>
          <SelectTrigger className="w-[360px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {orgs.map((o: any) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {active && <SupportSchemeView organizationId={active.id} organizationName={active.name} />}
    </div>
  );
}

/* ─── Organizations Tab ─── */
function OrganizationsTab({ toast, qc }: any) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({
    name: "", short_name: "", legal_full_name: "", inn: "",
    contact_email: "", contact_phone: "", address: "", notes: "", executor_default: "",
  });

  const { data: orgs = [], isLoading } = useQuery({
    queryKey: ["organizations"],
    queryFn: async () => {
      const { data, error } = await supabase.from("organizations").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.name.trim()) throw new Error("Название обязательно");
      if (editing) {
        const { error } = await supabase.from("organizations").update(form).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("organizations").insert(form);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["organizations"] });
      setOpen(false);
      setEditing(null);
      setForm({ name: "", short_name: "", legal_full_name: "", inn: "", contact_email: "", contact_phone: "", address: "", notes: "", executor_default: "" });
      toast({ title: editing ? "Организация обновлена" : "Организация создана" });
    },
    onError: (e: any) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  });

  const openEdit = (org: any) => {
    setEditing(org);
    setForm({
      name: org.name || "",
      short_name: org.short_name || "",
      legal_full_name: org.legal_full_name || "",
      inn: org.inn || "",
      contact_email: org.contact_email || "",
      contact_phone: org.contact_phone || "",
      address: org.address || "",
      notes: org.notes || "",
      executor_default: org.executor_default || "",
    });
    setOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle>Организации</CardTitle>
          <CardDescription>Заказчики, под каждого ведётся отдельный календарь и протоколы</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditing(null); setForm({ name: "", short_name: "", legal_full_name: "", inn: "", contact_email: "", contact_phone: "", address: "", notes: "", executor_default: "" }); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Добавить организацию</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? "Изменить организацию" : "Новая организация"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div><Label>Название *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="РУП «Брестэнерго»" /></div>
              <div><Label>Полное юридическое наименование</Label><Input value={form.legal_full_name} onChange={(e) => setForm({ ...form, legal_full_name: e.target.value })} placeholder="Республиканское унитарное предприятие «Брестэнерго»" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Краткое название</Label><Input value={form.short_name} onChange={(e) => setForm({ ...form, short_name: e.target.value })} /></div>
                <div><Label>УНП / ИНН</Label><Input value={form.inn} onChange={(e) => setForm({ ...form, inn: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Email</Label><Input value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} /></div>
                <div><Label>Телефон</Label><Input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} /></div>
              </div>
              <div><Label>Адрес</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
              <div>
                <Label>Исполнитель по умолчанию (для шапки протокола)</Label>
                <Input value={form.executor_default} onChange={(e) => setForm({ ...form, executor_default: e.target.value })} placeholder="ООО «ИТ-Ассист»" />
                <p className="text-[11px] text-muted-foreground mt-1">Используется в протоколах как «Исполнитель», если в договоре не указано иное.</p>
              </div>
              <div><Label>Примечания</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
            </div>
            <DialogFooter>
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>Сохранить</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? <p className="text-muted-foreground">Загрузка...</p> : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>УНП</TableHead>
                <TableHead>Контакты</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orgs.map((o: any) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">
                    {o.name}
                    {o.short_name && <span className="text-muted-foreground text-xs ml-1">({o.short_name})</span>}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{o.inn || "—"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {o.contact_email || "—"}<br/>{o.contact_phone || ""}
                  </TableCell>
                  <TableCell>{o.is_active ? <Badge>Активна</Badge> : <Badge variant="secondary">Архив</Badge>}</TableCell>
                  <TableCell><Button size="sm" variant="ghost" onClick={() => openEdit(o)}>Изменить</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Contracts Tab ─── */
function ContractsTab({ toast, qc }: any) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [confirmReset, setConfirmReset] = useState<any | null>(null);
  const [form, setForm] = useState({
    organization_id: "",
    contract_number: "",
    title: "",
    start_date: "",
    end_date: "",
    notes: "",
  });
  const [scanFile, setScanFile] = useState<File | null>(null);

  const { data: orgs = [] } = useQuery({
    queryKey: ["organizations"],
    queryFn: async () => (await supabase.from("organizations").select("id, name").order("name")).data ?? [],
  });

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ["contracts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contracts").select("*, organizations(name)").order("start_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.organization_id || !form.contract_number || !form.start_date) throw new Error("Заполните обязательные поля");

      let scan_path: string | null = null;
      let scan_name: string | null = null;
      if (scanFile) {
        const ext = scanFile.name.split(".").pop();
        const path = `contracts/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("documents").upload(path, scanFile);
        if (upErr) throw upErr;
        scan_path = path;
        scan_name = scanFile.name;
      }

      const payload: any = {
        organization_id: form.organization_id,
        contract_number: form.contract_number,
        title: form.title || null,
        start_date: form.start_date,
        end_date: form.end_date || null,
        notes: form.notes || null,
      };
      if (scan_path) { payload.scan_path = scan_path; payload.scan_name = scan_name; }

      if (editing) {
        const { error } = await supabase.from("contracts").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        payload.created_by = session?.user.id;
        const { error } = await supabase.from("contracts").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contracts"] });
      resetForm();
      toast({ title: editing ? "Договор обновлён" : "Договор добавлен. Календарь перестроен от даты старта." });
      logAudit({ action: editing ? "Изменение договора" : "Создание договора", module: "contracts", details: form.contract_number });
    },
    onError: (e: any) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  });

  const resetMutation = useMutation({
    mutationFn: async (contract: any) => {
      // Delete protocols/items linked to this contract
      const { data: prots } = await supabase.from("maintenance_protocols").select("id").eq("contract_id", contract.id);
      const protIds = (prots ?? []).map((p) => p.id);
      if (protIds.length) {
        await supabase.from("protocol_items").delete().in("protocol_id", protIds);
        await supabase.from("maintenance_protocols").delete().in("id", protIds);
      }
      // Delete tickets created before contract.start_date for this org
      await supabase.from("tickets").delete().eq("organization_id", contract.organization_id).lt("created_at", contract.start_date);
      logAudit({ action: "Сброс данных периода до старта договора", module: "contracts", entityId: contract.id, details: contract.contract_number });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contracts"] });
      qc.invalidateQueries({ queryKey: ["maintenance-protocols"] });
      qc.invalidateQueries({ queryKey: ["tickets"] });
      setConfirmReset(null);
      toast({ title: "Период до старта договора очищен" });
    },
    onError: (e: any) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  });

  const resetForm = () => {
    setOpen(false);
    setEditing(null);
    setScanFile(null);
    setForm({ organization_id: "", contract_number: "", title: "", start_date: "", end_date: "", notes: "" });
  };

  const openEdit = (c: any) => {
    setEditing(c);
    setForm({
      organization_id: c.organization_id,
      contract_number: c.contract_number,
      title: c.title || "",
      start_date: c.start_date,
      end_date: c.end_date || "",
      notes: c.notes || "",
    });
    setScanFile(null);
    setOpen(true);
  };

  const downloadScan = (c: any) => {
    if (!c.scan_path) return;
    const { data } = supabase.storage.from("documents").getPublicUrl(c.scan_path);
    window.open(data.publicUrl, "_blank");
  };

  return (
    <>
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Договоры</CardTitle>
            <CardDescription>Дата старта договора управляет календарём ТО и протоколами</CardDescription>
          </div>
          <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); else setOpen(true); }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Добавить договор</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editing ? "Изменить договор" : "Новый договор"}</DialogTitle>
                <DialogDescription>Скан подписанного договора будет привязан и доступен для скачивания</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Организация *</Label>
                  <select className="w-full h-10 px-3 rounded-md border bg-background" value={form.organization_id} onChange={(e) => setForm({ ...form, organization_id: e.target.value })}>
                    <option value="">— выбрать —</option>
                    {orgs.map((o: any) => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Номер договора *</Label><Input value={form.contract_number} onChange={(e) => setForm({ ...form, contract_number: e.target.value })} placeholder="№ 12-ТО/2026" /></div>
                  <div><Label>Название</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Техобслуживание ЦОД" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Дата старта работ *</Label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
                  <div><Label>Дата окончания</Label><Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
                </div>
                <div>
                  <Label>Скан подписанного договора {editing?.scan_path && <span className="text-xs text-muted-foreground">(уже загружен — выберите файл, чтобы заменить)</span>}</Label>
                  <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setScanFile(e.target.files?.[0] ?? null)} />
                </div>
                <div><Label>Примечания</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
              </div>
              <DialogFooter>
                <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>{saveMutation.isPending ? "Сохранение..." : "Сохранить"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {isLoading ? <p className="text-muted-foreground">Загрузка...</p> : contracts.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Договоров пока нет. Добавьте первый — календарь автоматически начнётся с даты старта.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Номер</TableHead>
                  <TableHead>Организация</TableHead>
                  <TableHead>Старт работ</TableHead>
                  <TableHead>Окончание</TableHead>
                  <TableHead>Скан</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.contract_number}{c.title && <div className="text-xs text-muted-foreground">{c.title}</div>}</TableCell>
                    <TableCell>{c.organizations?.name ?? "—"}</TableCell>
                    <TableCell><Badge variant="outline" className="gap-1"><CalendarIcon className="h-3 w-3"/>{c.start_date}</Badge></TableCell>
                    <TableCell className="text-muted-foreground text-sm">{c.end_date || "—"}</TableCell>
                    <TableCell>
                      {c.scan_path ? (
                        <Button size="sm" variant="ghost" onClick={() => downloadScan(c)} className="gap-1">
                          <FileText className="h-3.5 w-3.5"/> {c.scan_name || "Скачать"}
                        </Button>
                      ) : <span className="text-muted-foreground text-xs">не загружен</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(c)}>Изменить</Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setConfirmReset(c)} title="Очистить данные до старта">
                          <Trash2 className="h-4 w-4"/>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!confirmReset}
        title="Очистить период до старта договора?"
        description={`Будут удалены ВСЕ протоколы, отметки и заявки этой организации, созданные ДО ${confirmReset?.start_date}. Действие необратимо.`}
        variant="destructive"
        loading={resetMutation.isPending}
        onConfirm={() => confirmReset && resetMutation.mutate(confirmReset)}
        onCancel={() => setConfirmReset(null)}
      />
    </>
  );
}
