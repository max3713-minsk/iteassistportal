import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, FileUp, ExternalLink } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Frequency = Database["public"]["Enums"]["maintenance_frequency"];

const FREQ_LABEL: Record<string, string> = {
  daily: "Ежедневные", weekly: "Еженедельные", monthly: "Ежемесячные",
  quarterly: "Ежеквартальные", semi_annual: "Полугодовые", on_request: "По запросу",
};

interface FormState {
  id?: string;
  name: string;
  description: string;
  frequency: Frequency | "";
  organization_id: string;
  site_id: string;
  default_executor_id: string;
  default_responsible_id: string;
  signatory_executor_label: string;
  signatory_responsible_label: string;
  template_file_path?: string | null;
  template_file_name?: string | null;
}

const empty: FormState = {
  name: "", description: "", frequency: "", organization_id: "", site_id: "",
  default_executor_id: "", default_responsible_id: "",
  signatory_executor_label: "Исполнитель", signatory_responsible_label: "Ответственный",
};

export default function ProtocolTemplatesManager() {
  const { session } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(empty);
  const [file, setFile] = useState<File | null>(null);

  const { data: templates = [] } = useQuery({
    queryKey: ["protocol_templates_admin"],
    queryFn: async () => {
      const { data } = await supabase.from("protocol_templates").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });
  const { data: orgs = [] } = useQuery({
    queryKey: ["orgs-min"],
    queryFn: async () => (await supabase.from("organizations").select("id, name").order("name")).data ?? [],
  });
  const { data: sites = [] } = useQuery({
    queryKey: ["sites-min"],
    queryFn: async () => (await supabase.from("sites").select("id, name, organization_id").order("name")).data ?? [],
  });
  const { data: users = [] } = useQuery({
    queryKey: ["users-min"],
    queryFn: async () => (await supabase.from("profiles").select("user_id, full_name").eq("is_active", true).order("full_name")).data ?? [],
  });

  const reset = () => { setForm(empty); setFile(null); };

  const save = useMutation({
    mutationFn: async () => {
      if (!form.name.trim()) throw new Error("Укажите название");
      let template_file_path = form.template_file_path ?? null;
      let template_file_name = form.template_file_name ?? null;
      if (file) {
        const path = `protocol-templates/${Date.now()}_${file.name}`;
        const { error } = await supabase.storage.from("documents").upload(path, file, { upsert: false });
        if (error) throw error;
        template_file_path = path;
        template_file_name = file.name;
      }
      const payload: any = {
        name: form.name,
        description: form.description || null,
        frequency: form.frequency || null,
        organization_id: form.organization_id || null,
        site_id: form.site_id || null,
        default_executor_id: form.default_executor_id || null,
        default_responsible_id: form.default_responsible_id || null,
        signatory_executor_label: form.signatory_executor_label || "Исполнитель",
        signatory_responsible_label: form.signatory_responsible_label || "Ответственный",
        template_file_path, template_file_name,
        is_active: true,
      };
      if (form.id) {
        const { error } = await supabase.from("protocol_templates").update(payload).eq("id", form.id);
        if (error) throw error;
      } else {
        payload.created_by = session?.user.id;
        const { error } = await supabase.from("protocol_templates").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["protocol_templates_admin"] });
      qc.invalidateQueries({ queryKey: ["protocol-templates"] });
      toast({ title: "Шаблон сохранён" });
      setOpen(false); reset();
    },
    onError: (e: any) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("protocol_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["protocol_templates_admin"] });
      toast({ title: "Шаблон удалён" });
    },
  });

  const openEdit = (t: any) => {
    setForm({
      id: t.id, name: t.name, description: t.description ?? "",
      frequency: t.frequency ?? "", organization_id: t.organization_id ?? "",
      site_id: t.site_id ?? "",
      default_executor_id: t.default_executor_id ?? "",
      default_responsible_id: t.default_responsible_id ?? "",
      signatory_executor_label: t.signatory_executor_label ?? "Исполнитель",
      signatory_responsible_label: t.signatory_responsible_label ?? "Ответственный",
      template_file_path: t.template_file_path, template_file_name: t.template_file_name,
    });
    setFile(null);
    setOpen(true);
  };

  const downloadFile = async (path: string) => {
    const { data } = await supabase.storage.from("documents").createSignedUrl(path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Шаблоны протоколов</CardTitle>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
          <DialogTrigger asChild>
            <Button onClick={reset}><Plus className="h-4 w-4 mr-2" />Новый шаблон</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{form.id ? "Изменить шаблон" : "Новый шаблон"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Название *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Описание</Label>
                <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Регламент</Label>
                  <Select value={form.frequency || "__any__"} onValueChange={(v) => setForm({ ...form, frequency: v === "__any__" ? "" : (v as Frequency) })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__any__">— Любой —</SelectItem>
                      {Object.entries(FREQ_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Организация</Label>
                  <Select value={form.organization_id || "__any__"} onValueChange={(v) => setForm({ ...form, organization_id: v === "__any__" ? "" : v, site_id: "" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__any__">— Любая —</SelectItem>
                      {orgs.map((o: any) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>ЦОД</Label>
                <Select value={form.site_id || "__any__"} onValueChange={(v) => setForm({ ...form, site_id: v === "__any__" ? "" : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__any__">— Любой —</SelectItem>
                    {sites.filter((s: any) => !form.organization_id || s.organization_id === form.organization_id).map((s: any) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Исполнитель по умолчанию</Label>
                  <Select value={form.default_executor_id || "__none__"} onValueChange={(v) => setForm({ ...form, default_executor_id: v === "__none__" ? "" : v })}>
                    <SelectTrigger><SelectValue placeholder="Не указан" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— Не указан —</SelectItem>
                      {users.map((u: any) => <SelectItem key={u.user_id} value={u.user_id}>{u.full_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Ответственный по умолчанию</Label>
                  <Select value={form.default_responsible_id || "__none__"} onValueChange={(v) => setForm({ ...form, default_responsible_id: v === "__none__" ? "" : v })}>
                    <SelectTrigger><SelectValue placeholder="Не указан" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— Не указан —</SelectItem>
                      {users.map((u: any) => <SelectItem key={u.user_id} value={u.user_id}>{u.full_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Подпись «Исполнитель»</Label>
                  <Input value={form.signatory_executor_label} onChange={(e) => setForm({ ...form, signatory_executor_label: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Подпись «Ответственный»</Label>
                  <Input value={form.signatory_responsible_label} onChange={(e) => setForm({ ...form, signatory_responsible_label: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Файл формы (опционально)</Label>
                <div className="flex items-center gap-2">
                  <Input type="file" accept=".pdf,.docx,.doc,.xlsx,.xls" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                  {form.template_file_name && !file && (
                    <Button type="button" size="sm" variant="outline" onClick={() => downloadFile(form.template_file_path!)} className="gap-1">
                      <ExternalLink className="h-3.5 w-3.5" /> {form.template_file_name}
                    </Button>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">PDF / DOCX / XLSX. Заменяется при загрузке нового файла.</p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => save.mutate()} disabled={save.isPending} className="gap-2">
                <FileUp className="h-4 w-4" />{save.isPending ? "Сохранение..." : "Сохранить"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Название</TableHead>
              <TableHead>Регламент</TableHead>
              <TableHead>Область</TableHead>
              <TableHead>Подписанты</TableHead>
              <TableHead>Файл</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.map((t: any) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.name}{t.description && <div className="text-xs text-muted-foreground">{t.description}</div>}</TableCell>
                <TableCell>{t.frequency ? <Badge variant="secondary">{FREQ_LABEL[t.frequency]}</Badge> : <span className="text-muted-foreground">—</span>}</TableCell>
                <TableCell className="text-xs">
                  {t.organization_id ? orgs.find((o: any) => o.id === t.organization_id)?.name : "Все организации"}
                  {t.site_id && <div>{sites.find((s: any) => s.id === t.site_id)?.name}</div>}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {t.signatory_executor_label} / {t.signatory_responsible_label}
                </TableCell>
                <TableCell>
                  {t.template_file_path ? (
                    <Button size="sm" variant="ghost" className="gap-1 h-7" onClick={() => downloadFile(t.template_file_path)}>
                      <ExternalLink className="h-3.5 w-3.5" />{t.template_file_name ?? "файл"}
                    </Button>
                  ) : <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(t)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => { if (confirm("Удалить шаблон?")) remove.mutate(t.id); }}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {templates.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Шаблонов пока нет</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}