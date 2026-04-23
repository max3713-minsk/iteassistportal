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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Server, Plus, Trash2, Eye, EyeOff, Star } from "lucide-react";

export default function ZabbixConnections() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole("admin");
  const { toast } = useToast();
  const qc = useQueryClient();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [showPwd, setShowPwd] = useState(false);
  const [form, setForm] = useState({
    name: "", organization_id: "", zabbix_url: "", zabbix_user: "", zabbix_password: "",
    vpn_info: "", is_active: true, is_default: false,
  });

  const { data: orgs = [] } = useQuery({
    queryKey: ["organizations"],
    queryFn: async () => (await supabase.from("organizations").select("id, name").order("name")).data ?? [],
  });

  const { data: conns = [], isLoading } = useQuery({
    queryKey: ["zabbix-connections"],
    queryFn: async () => {
      const { data, error } = await supabase.from("zabbix_connections").select("*, organizations(name)").order("created_at");
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.name || !form.organization_id || !form.zabbix_url || !form.zabbix_user) throw new Error("Заполните обязательные поля");
      const payload: any = {
        name: form.name,
        organization_id: form.organization_id,
        zabbix_url: form.zabbix_url.replace(/\/+$/, ""),
        zabbix_user: form.zabbix_user,
        zabbix_password: form.zabbix_password,
        vpn_info: form.vpn_info,
        is_active: form.is_active,
        is_default: form.is_default,
      };
      if (editing) {
        if (!form.zabbix_password) delete payload.zabbix_password;
        const { error } = await supabase.from("zabbix_connections").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("zabbix_connections").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["zabbix-connections"] });
      reset();
      toast({ title: editing ? "Подключение обновлено" : "Подключение создано" });
    },
    onError: (e: any) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("zabbix_connections").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["zabbix-connections"] });
      toast({ title: "Подключение удалено" });
    },
  });

  const reset = () => {
    setOpen(false);
    setEditing(null);
    setForm({ name: "", organization_id: "", zabbix_url: "", zabbix_user: "", zabbix_password: "", vpn_info: "", is_active: true, is_default: false });
  };

  const openEdit = (c: any) => {
    setEditing(c);
    setForm({
      name: c.name, organization_id: c.organization_id,
      zabbix_url: c.zabbix_url, zabbix_user: c.zabbix_user, zabbix_password: "",
      vpn_info: c.vpn_info || "", is_active: c.is_active, is_default: c.is_default,
    });
    setOpen(true);
  };

  if (!isAdmin) {
    return <Card><CardContent className="py-10 text-center text-muted-foreground">Только администраторы.</CardContent></Card>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
          <Server className="h-6 w-6 text-primary" /> Подключения Zabbix
        </h1>
        <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); else setOpen(true); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2"/>Новое подключение</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editing ? "Изменить подключение" : "Новое подключение Zabbix"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Название *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Zabbix Брестэнерго"/></div>
              <div>
                <Label>Организация *</Label>
                <select className="w-full h-10 px-3 rounded-md border bg-background" value={form.organization_id} onChange={(e) => setForm({ ...form, organization_id: e.target.value })}>
                  <option value="">— выбрать —</option>
                  {orgs.map((o: any) => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
              <div><Label>URL Zabbix *</Label><Input value={form.zabbix_url} onChange={(e) => setForm({ ...form, zabbix_url: e.target.value })} placeholder="http://10.11.12.240/zabbix"/></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Логин *</Label><Input value={form.zabbix_user} onChange={(e) => setForm({ ...form, zabbix_user: e.target.value })}/></div>
                <div>
                  <Label>Пароль {editing && <span className="text-xs text-muted-foreground">(оставьте пустым)</span>}</Label>
                  <div className="relative">
                    <Input type={showPwd ? "text" : "password"} value={form.zabbix_password} onChange={(e) => setForm({ ...form, zabbix_password: e.target.value })} className="pr-10"/>
                    <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full" onClick={() => setShowPwd(!showPwd)}>
                      {showPwd ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                    </Button>
                  </div>
                </div>
              </div>
              <div><Label>VPN-информация</Label><Textarea rows={2} value={form.vpn_info} onChange={(e) => setForm({ ...form, vpn_info: e.target.value })}/></div>
              <div className="flex gap-6">
                <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })}/><Label>Активно</Label></div>
                <div className="flex items-center gap-2"><Switch checked={form.is_default} onCheckedChange={(v) => setForm({ ...form, is_default: v })}/><Label>По умолчанию</Label></div>
              </div>
            </div>
            <DialogFooter><Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>Сохранить</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Список подключений</CardTitle>
          <CardDescription>Каждое подключение привязано к одной организации. Хосты, метрики и графики из этого Zabbix будут показаны в контексте этой организации.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? <p className="text-muted-foreground">Загрузка...</p> : conns.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Подключений пока нет.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>Организация</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Логин</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conns.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">
                      {c.is_default && <Star className="h-3.5 w-3.5 inline mr-1 text-amber-500 fill-amber-500"/>}
                      {c.name}
                    </TableCell>
                    <TableCell>{c.organizations?.name ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-sm font-mono">{c.zabbix_url}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{c.zabbix_user}</TableCell>
                    <TableCell>{c.is_active ? <Badge>Активно</Badge> : <Badge variant="secondary">Выкл</Badge>}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(c)}>Изменить</Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteMutation.mutate(c.id)}>
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
    </div>
  );
}
