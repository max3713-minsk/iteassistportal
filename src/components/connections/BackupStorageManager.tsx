import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, FolderArchive, Pencil, Trash2, PlugZap, Loader2 } from "lucide-react";

type Conn = {
  id?: string; name: string; host: string; port: number; username: string;
  auth_method: "password" | "key"; password: string; private_key: string;
  base_path: string; enabled: boolean; notes: string;
  last_checked_at?: string | null; last_status?: string | null; last_error?: string | null;
};
const empty: Conn = {
  name: "", host: "", port: 22, username: "", auth_method: "password",
  password: "", private_key: "", base_path: "/srv/tftp", enabled: true, notes: "",
};

export default function BackupStorageManager() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Conn>(empty);
  const [testingId, setTestingId] = useState<string | null>(null);

  const { data: list = [] } = useQuery({
    queryKey: ["backup-storages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("backup_storage_connections" as any)
        .select("*").order("name");
      if (error) throw error;
      return (data ?? []) as any as Conn[];
    },
  });

  const save = useMutation({
    mutationFn: async (c: Conn) => {
      const payload: any = {
        name: c.name, host: c.host, port: c.port, username: c.username,
        auth_method: c.auth_method,
        password: c.auth_method === "password" ? c.password || null : null,
        private_key: c.auth_method === "key" ? c.private_key || null : null,
        base_path: c.base_path || "/", enabled: c.enabled, notes: c.notes || null,
      };
      if (c.id) {
        // не перетираем пустым паролем при редактировании
        if (c.auth_method === "password" && !c.password) delete payload.password;
        if (c.auth_method === "key" && !c.private_key) delete payload.private_key;
        const { error } = await supabase.from("backup_storage_connections" as any).update(payload).eq("id", c.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("backup_storage_connections" as any).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["backup-storages"] });
      setOpen(false); setForm(empty);
      toast({ title: "Сохранено" });
    },
    onError: (e: any) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("backup_storage_connections" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["backup-storages"] }),
  });

  const testConnection = async (id: string) => {
    setTestingId(id);
    try {
      const { data, error } = await supabase.functions.invoke("backup-storage-check", {
        body: { action: "test", storage_id: id },
      });
      if (error) throw error;
      if (data?.ok) toast({ title: "Подключение успешно", description: `Файлов в каталоге: ${data.entries}` });
      else toast({ title: "Ошибка подключения", description: data?.error ?? "—", variant: "destructive" });
      qc.invalidateQueries({ queryKey: ["backup-storages"] });
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    } finally {
      setTestingId(null);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-lg font-semibold flex items-center gap-2">
              <FolderArchive className="h-5 w-5 text-primary" /> Файловые хранилища (SFTP / TFTP-root)
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Подключение к серверу, где лежат бэкапы устройств. Используется SFTP поверх SSH —
              на стороне tftp-сервера достаточно запустить sshd, права на чтение каталога tftp-root.
            </p>
          </div>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setForm(empty); }}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1.5" />Добавить</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{form.id ? "Редактировать" : "Новое хранилище"}</DialogTitle>
                <DialogDescription>Доступ по SFTP. TFTP по UDP edge-функцией не читается — нужен SSH на тот же хост.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                <div><Label>Название</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="TFTP Минск" /></div>
                <div className="grid grid-cols-[1fr_120px] gap-3">
                  <div><Label>Хост</Label><Input value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })} placeholder="10.11.12.50" /></div>
                  <div><Label>Порт</Label><Input type="number" value={form.port} onChange={(e) => setForm({ ...form, port: Number(e.target.value) || 22 })} /></div>
                </div>
                <div><Label>Логин SSH</Label><Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></div>
                <div>
                  <Label>Способ авторизации</Label>
                  <Select value={form.auth_method} onValueChange={(v: "password" | "key") => setForm({ ...form, auth_method: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="password">Пароль</SelectItem>
                      <SelectItem value="key">Приватный ключ (OpenSSH)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {form.auth_method === "password" ? (
                  <div><Label>Пароль</Label>
                    <Input type="password" value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder={form.id ? "(оставьте пустым, чтобы не менять)" : ""} />
                  </div>
                ) : (
                  <div><Label>Приватный ключ</Label>
                    <Textarea rows={6} value={form.private_key}
                      onChange={(e) => setForm({ ...form, private_key: e.target.value })}
                      placeholder={form.id ? "(оставьте пустым, чтобы не менять)" : "-----BEGIN OPENSSH PRIVATE KEY-----"} />
                  </div>
                )}
                <div><Label>Базовый путь (tftp-root)</Label>
                  <Input value={form.base_path} onChange={(e) => setForm({ ...form, base_path: e.target.value })} placeholder="/srv/tftp" />
                </div>
                <div className="flex items-center gap-2"><Switch checked={form.enabled} onCheckedChange={(v) => setForm({ ...form, enabled: v })} /><Label>Активно</Label></div>
                <div><Label>Заметки</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              </div>
              <DialogFooter>
                <Button onClick={() => save.mutate(form)} disabled={!form.name || !form.host || !form.username || save.isPending}>
                  {save.isPending ? "Сохранение..." : "Сохранить"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {list.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Подключений пока нет</p>
        ) : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Название</TableHead><TableHead>Хост</TableHead>
              <TableHead>Путь</TableHead><TableHead>Статус</TableHead>
              <TableHead className="w-32">Действия</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {list.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground">{c.username}@{c.host}:{c.port}</TableCell>
                  <TableCell className="text-muted-foreground"><code className="text-xs">{c.base_path}</code></TableCell>
                  <TableCell>
                    {!c.enabled
                      ? <Badge variant="outline">Отключено</Badge>
                      : c.last_status === "ok"
                        ? <Badge variant="success">OK</Badge>
                        : c.last_status === "error"
                          ? <Badge variant="destructive" title={c.last_error ?? ""}>Ошибка</Badge>
                          : <Badge variant="secondary">Не проверялось</Badge>}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" title="Проверить подключение"
                        onClick={() => c.id && testConnection(c.id)} disabled={testingId === c.id}>
                        {testingId === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlugZap className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { setForm({ ...empty, ...c, password: "", private_key: "" }); setOpen(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => c.id && del.mutate(c.id)}>
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
  );
}