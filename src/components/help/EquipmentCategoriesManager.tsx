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
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
      setOpen(false);
      setEditing(null);
      toast({ title: "Сохранено" });
    },
    onError: (e: any) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("equipment_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["eq-cats-manager"] });
      qc.invalidateQueries({ queryKey: ["wsm-categories"] });
      toast({ title: "Удалено" });
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
            Используются для группировки работ и привязки регламента к классу оборудования.
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
                <TableHead>Наименование</TableHead>
                <TableHead>Описание</TableHead>
                <TableHead className="w-[120px]">Работ</TableHead>
                {canEdit && <TableHead className="w-[100px]"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {cats.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium text-sm">{c.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{c.description ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{counts[c.id] ?? 0}</Badge>
                  </TableCell>
                  {canEdit && (
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditing(c); setOpen(true); }}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon" variant="ghost" className="h-7 w-7"
                          onClick={() => {
                            if ((counts[c.id] ?? 0) > 0) {
                              toast({ title: "Категория используется", description: "Сначала отвяжите работы.", variant: "destructive" });
                              return;
                            }
                            if (confirm(`Удалить категорию «${c.name}»?`)) remove.mutate(c.id);
                          }}
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
                  <TableCell colSpan={canEdit ? 4 : 3} className="text-center text-muted-foreground py-8 text-sm">
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
    </Card>
  );
}