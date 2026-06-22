import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Plus, Pencil, Trash2, Tag, Server, HardDrive, Network, Wifi, Router, Cpu,
  MonitorSmartphone, Database, Cloud, Shield, Power, Thermometer, Camera,
  Printer, Smartphone, Cable, Boxes, Wrench, Layers, Container, Activity,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const ICON_SET: Record<string, LucideIcon> = {
  Server, HardDrive, Network, Wifi, Router, Cpu, MonitorSmartphone, Database,
  Cloud, Shield, Power, Thermometer, Camera, Printer, Smartphone, Cable,
  Boxes, Wrench, Layers, Container, Activity, Tag,
};

export function CategoryIcon({ name, className }: { name?: string | null; className?: string }) {
  const Icon = (name && ICON_SET[name]) || Tag;
  return <Icon className={cn("h-4 w-4", className)} />;
}

interface CatRow {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
}

export default function EquipmentCategoriesManager() {
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const canEdit = hasRole("admin");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<CatRow> | null>(null);
  const [deleting, setDeleting] = useState<CatRow | null>(null);
  const [reassignTo, setReassignTo] = useState<string>("none");

  const { data: cats = [], isLoading } = useQuery({
    queryKey: ["eq-cats-manager"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("equipment_categories")
        .select("id, name, description, icon")
        .order("name");
      if (error) throw error;
      return (data ?? []) as CatRow[];
    },
  });

  const { data: counts = {} } = useQuery({
    queryKey: ["eq-cats-counts"],
    queryFn: async () => {
      const { data: tasks } = await supabase
        .from("maintenance_tasks")
        .select("category_id");
      const map: Record<string, number> = {};
      for (const t of tasks ?? []) {
        if (t.category_id) map[t.category_id] = (map[t.category_id] ?? 0) + 1;
      }
      return map;
    },
  });

  const { data: equipCounts = {} } = useQuery({
    queryKey: ["eq-cats-equip-counts"],
    queryFn: async () => {
      const { data } = await supabase.from("equipment").select("category_id");
      const map: Record<string, number> = {};
      for (const e of data ?? []) {
        if (e.category_id) map[e.category_id] = (map[e.category_id] ?? 0) + 1;
      }
      return map;
    },
  });

  const save = useMutation({
    mutationFn: async (row: Partial<CatRow>) => {
      const payload = {
        name: row.name!.trim(),
        description: row.description?.trim() || null,
        icon: row.icon?.trim() || null,
      };
      if (row.id) {
        const { error } = await supabase.from("equipment_categories").update(payload).eq("id", row.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("equipment_categories").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["eq-cats-manager"] });
      qc.invalidateQueries({ queryKey: ["wsm-categories"] });
      qc.invalidateQueries({ queryKey: ["equipment-categories"] });
      setOpen(false);
      setEditing(null);
      toast({ title: "Сохранено" });
    },
    onError: (e: any) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async ({ id, moveTo }: { id: string; moveTo: string | null }) => {
      const newCat = moveTo && moveTo !== "none" ? moveTo : null;
      const { error: eqErr } = await supabase
        .from("equipment").update({ category_id: newCat }).eq("category_id", id);
      if (eqErr) throw eqErr;
      const { error: tErr } = await supabase
        .from("maintenance_tasks").update({ category_id: newCat }).eq("category_id", id);
      if (tErr) throw tErr;
      const { error } = await supabase.from("equipment_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["eq-cats-manager"] });
      qc.invalidateQueries({ queryKey: ["wsm-categories"] });
      qc.invalidateQueries({ queryKey: ["equipment-categories"] });
      qc.invalidateQueries({ queryKey: ["equipment"] });
      qc.invalidateQueries({ queryKey: ["eq-cats-counts"] });
      qc.invalidateQueries({ queryKey: ["eq-cats-equip-counts"] });
      setDeleting(null);
      setReassignTo("none");
      toast({ title: "Категория удалена" });
    },
    onError: (e: any) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  });

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <Tag className="h-4 w-4 text-primary" /> Категории оборудования
          </CardTitle>
          <CardDescription>
            Группировка оборудования и привязка регламента к классу устройств.
          </CardDescription>
        </div>
        {canEdit && (
          <Button size="sm" onClick={() => { setEditing({}); setOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Категория
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <p className="text-muted-foreground p-4 text-sm">Загрузка...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">Иконка</TableHead>
                <TableHead>Наименование</TableHead>
                <TableHead>Описание</TableHead>
                <TableHead className="w-[110px]">Оборудование</TableHead>
                <TableHead className="w-[110px]">Работ</TableHead>
                {canEdit && <TableHead className="w-[100px]"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {cats.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="h-8 w-8 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                      <CategoryIcon name={c.icon} />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-sm">{c.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{c.description ?? "—"}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{equipCounts[c.id] ?? 0}</Badge></TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{counts[c.id] ?? 0}</Badge></TableCell>
                  {canEdit && (
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditing(c); setOpen(true); }}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon" variant="ghost" className="h-7 w-7"
                          onClick={() => { setDeleting(c); setReassignTo("none"); }}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {cats.length === 0 && (
                <TableRow>
                  <TableCell colSpan={canEdit ? 6 : 5} className="text-center text-muted-foreground py-8 text-sm">
                    Пока нет категорий
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Редактировать категорию" : "Новая категория"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Наименование *</Label>
                <Input value={editing.name ?? ""} onChange={(e) => setEditing((p) => ({ ...p!, name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Описание</Label>
                <Textarea rows={2} value={editing.description ?? ""} onChange={(e) => setEditing((p) => ({ ...p!, description: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Иконка</Label>
                <div className="grid grid-cols-8 gap-1.5 rounded-md border p-2 max-h-48 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => setEditing((p) => ({ ...p!, icon: null }))}
                    title="Без иконки"
                    className={cn(
                      "h-9 w-9 rounded-md flex items-center justify-center text-xs border",
                      !editing.icon ? "border-primary bg-primary/10 text-primary" : "border-transparent text-muted-foreground hover:bg-muted"
                    )}
                  >—</button>
                  {Object.entries(ICON_SET).map(([key, Icon]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setEditing((p) => ({ ...p!, icon: key }))}
                      title={key}
                      className={cn(
                        "h-9 w-9 rounded-md flex items-center justify-center border",
                        editing.icon === key
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-transparent text-muted-foreground hover:bg-muted"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Отмена</Button>
            <Button onClick={() => save.mutate(editing!)} disabled={!editing?.name || save.isPending}>
              {save.isPending ? "Сохранение..." : "Сохранить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleting} onOpenChange={(v) => { if (!v) setDeleting(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Удалить категорию «{deleting?.name}»?</DialogTitle>
            <DialogDescription>
              {deleting && ((equipCounts[deleting.id] ?? 0) > 0 || (counts[deleting.id] ?? 0) > 0) ? (
                <>
                  С категорией связано:{" "}
                  <strong>{equipCounts[deleting.id] ?? 0}</strong> ед. оборудования,{" "}
                  <strong>{counts[deleting.id] ?? 0}</strong> работ регламента.
                  Выберите, куда их перенести.
                </>
              ) : (
                "Эта категория не используется. Удаление безвозвратное."
              )}
            </DialogDescription>
          </DialogHeader>
          {deleting && ((equipCounts[deleting.id] ?? 0) > 0 || (counts[deleting.id] ?? 0) > 0) && (
            <div className="space-y-1.5">
              <Label>Перенести в категорию</Label>
              <Select value={reassignTo} onValueChange={setReassignTo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Без категории —</SelectItem>
                  {cats.filter((x) => x.id !== deleting.id).map((x) => (
                    <SelectItem key={x.id} value={x.id}>{x.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleting(null)}>Отмена</Button>
            <Button
              variant="destructive"
              disabled={remove.isPending}
              onClick={() => deleting && remove.mutate({ id: deleting.id, moveTo: reassignTo })}
            >
              {remove.isPending ? "Удаление..." : "Удалить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}