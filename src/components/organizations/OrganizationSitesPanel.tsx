import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, MapPin, Building2 } from "lucide-react";
import { ConfirmDialog } from "@/components/users/ConfirmDialog";

interface SiteForm {
  name: string;
  organization_id: string;
  organization: string;
  city: string;
  address: string;
  description: string;
}
const empty: SiteForm = { name: "", organization_id: "", organization: "", city: "", address: "", description: "" };

export default function OrganizationSitesPanel() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<SiteForm>(empty);
  const [confirmDel, setConfirmDel] = useState<any | null>(null);
  const [filterOrg, setFilterOrg] = useState("all");

  const { data: orgs = [] } = useQuery({
    queryKey: ["organizations-for-sites"],
    queryFn: async () => (await supabase.from("organizations").select("id, name").eq("is_active", true).order("name")).data ?? [],
  });

  const { data: sites = [], isLoading } = useQuery({
    queryKey: ["sites-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sites")
        .select("*, organizations(name)")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = filterOrg === "all" ? sites : sites.filter((s: any) => s.organization_id === filterOrg);

  const save = useMutation({
    mutationFn: async () => {
      if (!form.name) throw new Error("Название обязательно");
      if (!form.organization_id) throw new Error("Выберите организацию");
      const org = orgs.find((o: any) => o.id === form.organization_id);
      const payload: any = {
        name: form.name,
        organization_id: form.organization_id,
        organization: org?.name ?? form.organization ?? "",
        city: form.city || null,
        address: form.address || null,
        description: form.description || null,
      };
      if (editing) {
        const { error } = await supabase.from("sites").update(payload).eq("id", editing);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("sites").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sites-all"] });
      qc.invalidateQueries({ queryKey: ["sites"] });
      setOpen(false); setEditing(null); setForm(empty);
      toast({ title: editing ? "ЦОД обновлён" : "ЦОД добавлен" });
    },
    onError: (e: any) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sites").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sites-all"] });
      qc.invalidateQueries({ queryKey: ["sites"] });
      setConfirmDel(null);
      toast({ title: "ЦОД удалён" });
    },
    onError: (e: any) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  });

  const openEdit = (s: any) => {
    setEditing(s.id);
    setForm({
      name: s.name,
      organization_id: s.organization_id ?? "",
      organization: s.organization ?? "",
      city: s.city ?? "",
      address: s.address ?? "",
      description: s.description ?? "",
    });
    setOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>ЦОД</CardTitle>
            <CardDescription>Центры обработки данных, привязанные к организациям</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={filterOrg} onValueChange={setFilterOrg}>
              <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все организации</SelectItem>
                {orgs.map((o: any) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditing(null); setForm(empty); } }}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" />Добавить ЦОД</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editing ? "Изменить ЦОД" : "Новый ЦОД"}</DialogTitle>
                  <DialogDescription>Привязка к организации обязательна — это попадает в шапку протокола.</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>Организация *</Label>
                    <Select value={form.organization_id} onValueChange={(v) => setForm({ ...form, organization_id: v })}>
                      <SelectTrigger><SelectValue placeholder="— выбрать —" /></SelectTrigger>
                      <SelectContent>
                        {orgs.map((o: any) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Название ЦОД *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Площадка №1, Брест" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Город</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
                    <div><Label>Адрес</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
                  </div>
                  <div><Label>Описание</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
                </div>
                <DialogFooter>
                  <Button onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? "Сохранение…" : "Сохранить"}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? <p className="text-muted-foreground">Загрузка...</p> : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-muted-foreground">
              <Building2 className="h-10 w-10 opacity-40 mb-2" />
              ЦОД ещё не добавлены
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>Организация</TableHead>
                  <TableHead>Город</TableHead>
                  <TableHead className="hidden md:table-cell">Адрес</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.organizations?.name ?? s.organization ?? "—"}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {s.city ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{s.address ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setConfirmDel(s)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
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
        open={!!confirmDel}
        title="Удалить ЦОД?"
        description={`«${confirmDel?.name}» и связанные с ним оборудование/протоколы могут остаться без ссылки. Действие необратимо.`}
        variant="destructive"
        loading={del.isPending}
        onConfirm={() => confirmDel && del.mutate(confirmDel.id)}
        onCancel={() => setConfirmDel(null)}
      />
    </>
  );
}