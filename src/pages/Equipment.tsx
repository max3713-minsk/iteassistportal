import { useState } from "react";
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
import { Plus, Server, Pencil, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
interface EquipForm {
  name: string;
  model: string;
  site_id: string;
  category_id: string;
  serial_number: string;
  os_info: string;
  quantity: number;
  description: string;
}

const empty: EquipForm = { name: "", model: "", site_id: "", category_id: "", serial_number: "", os_info: "", quantity: 1, description: "" };

export default function Equipment() {
  const { isStaff } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<EquipForm>(empty);

  const { data: equipment = [], isLoading } = useQuery({
    queryKey: ["equipment"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("equipment")
        .select("*, sites(name), equipment_categories(name)")
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
      };
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
    });
    setEditing(eq.id);
    setOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-bold">Оборудование</h1>
        {isStaff && (
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
                      {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
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
              </div>
              <DialogFooter>
                <Button onClick={() => saveMutation.mutate(form)} disabled={!form.name || !form.site_id || saveMutation.isPending}>
                  {saveMutation.isPending ? "Сохранение..." : "Сохранить"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Загрузка...</p>
      ) : equipment.length === 0 ? (
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
                <TableHead>Площадка</TableHead>
                <TableHead className="hidden md:table-cell">Категория</TableHead>
                <TableHead className="hidden lg:table-cell">ОС</TableHead>
                <TableHead>Кол-во</TableHead>
                {isStaff && <TableHead className="w-24">Действия</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {equipment.map((eq: any) => {
                const row = (
                  <TableRow key={eq.id}>
                    <TableCell className="font-medium">{eq.name}</TableCell>
                    <TableCell className="text-muted-foreground">{eq.model ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{eq.sites?.name ?? "—"}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{eq.equipment_categories?.name ?? "—"}</TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{eq.os_info ?? "—"}</TableCell>
                    <TableCell>{eq.quantity}</TableCell>
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
    </div>
  );
}
