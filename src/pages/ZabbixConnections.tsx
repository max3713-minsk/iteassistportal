import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { invokeZabbix } from "@/lib/zabbix-invoke";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Server, Plus, Trash2, Eye, EyeOff, Star, CheckCircle2, XCircle,
  Loader2, ChevronDown, Pencil, Wifi, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Conn = {
  id: string;
  name: string;
  organization_id: string;
  zabbix_url: string;
  zabbix_user: string;
  vpn_info: string | null;
  is_active: boolean;
  is_default: boolean;
  organizations?: { name: string } | null;
};

const EMPTY_FORM = {
  name: "", organization_id: "", zabbix_url: "", zabbix_user: "", zabbix_password: "",
  vpn_info: "", is_active: true, is_default: false,
};

/* ─────────────────────── Wizard ─────────────────────── */
function ConnectionWizard({
  open, onOpenChange, editing, orgs, onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Conn | null;
  orgs: Array<{ id: string; name: string }>;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showPwd, setShowPwd] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [test, setTest] = useState<{ status: "idle" | "loading" | "ok" | "fail"; msg?: string; version?: string }>({ status: "idle" });
  const [saving, setSaving] = useState(false);

  // Reset on open
  const reset = () => {
    setForm(editing ? {
      name: editing.name,
      organization_id: editing.organization_id,
      zabbix_url: editing.zabbix_url,
      zabbix_user: editing.zabbix_user,
      zabbix_password: "",
      vpn_info: editing.vpn_info ?? "",
      is_active: editing.is_active,
      is_default: editing.is_default,
    } : EMPTY_FORM);
    setStep(1);
    setShowPwd(false);
    setShowAdvanced(false);
    setTest({ status: "idle" });
  };

  // initialise when dialog opens
  if (open && step === 1 && form.name === "" && form.zabbix_url === "" && editing) {
    // editing started — populate
    setForm({
      name: editing.name,
      organization_id: editing.organization_id,
      zabbix_url: editing.zabbix_url,
      zabbix_user: editing.zabbix_user,
      zabbix_password: "",
      vpn_info: editing.vpn_info ?? "",
      is_active: editing.is_active,
      is_default: editing.is_default,
    });
  }

  const close = () => { onOpenChange(false); setTimeout(reset, 200); };

  /* live connection test — saves a temp row, calls testConnection, can update existing row */
  const runTest = async () => {
    if (!form.zabbix_url || !form.zabbix_user || (!editing && !form.zabbix_password)) {
      toast({ title: "Заполните URL, логин и пароль", variant: "destructive" });
      return;
    }
    setTest({ status: "loading" });
    try {
      // Persist into edit row first so the proxy uses the latest values.
      const payload: any = {
        name: form.name || `Тестовое (${new Date().toLocaleTimeString("ru-RU")})`,
        organization_id: form.organization_id || (orgs[0]?.id ?? null),
        zabbix_url: form.zabbix_url.replace(/\/+$/, ""),
        zabbix_user: form.zabbix_user,
        vpn_info: form.vpn_info,
        is_active: true,
        is_default: form.is_default,
      };
      if (form.zabbix_password) payload.zabbix_password = form.zabbix_password;

      let connId = editing?.id ?? null;
      if (editing) {
        await supabase.from("zabbix_connections").update(payload).eq("id", editing.id);
      } else {
        if (!payload.organization_id) {
          setTest({ status: "fail", msg: "Сначала создайте хотя бы одну организацию." });
          return;
        }
        const { data, error } = await supabase.from("zabbix_connections").insert(payload).select("id").single();
        if (error) throw error;
        connId = data.id;
      }

      const { data, error } = await invokeZabbix({ body: { action: "testConnection", connection_id: connId } });
      if (error) throw new Error((error as any).message ?? String(error));
      const r = data as { ok: boolean; data?: { version: string }; message?: string; error?: string };
      if (r.ok) {
        setTest({ status: "ok", version: r.data?.version });
        // If new connection just got created, treat dialog as edit so 2nd save updates it
      } else {
        setTest({ status: "fail", msg: r.message ?? r.error ?? "Не удалось подключиться" });
      }
    } catch (e: any) {
      setTest({ status: "fail", msg: e.message ?? String(e) });
    }
  };

  const save = async () => {
    if (!form.name || !form.organization_id) {
      toast({ title: "Заполните название и организацию", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        name: form.name,
        organization_id: form.organization_id,
        zabbix_url: form.zabbix_url.replace(/\/+$/, ""),
        zabbix_user: form.zabbix_user,
        vpn_info: form.vpn_info,
        is_active: form.is_active,
        is_default: form.is_default,
      };
      if (form.zabbix_password) payload.zabbix_password = form.zabbix_password;

      if (editing) {
        const { error } = await supabase.from("zabbix_connections").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        if (!form.zabbix_password) throw new Error("Укажите пароль");
        const { error } = await supabase.from("zabbix_connections").insert(payload);
        if (error) throw error;
      }
      toast({ title: editing ? "Подключение обновлено" : "Подключение создано" });
      onSaved();
      close();
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => v ? onOpenChange(true) : close()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Изменить подключение" : "Новое подключение Zabbix"}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2 pt-1">
            <span className={cn("flex items-center gap-1.5", step === 1 ? "font-medium text-foreground" : "text-muted-foreground")}>
              <span className={cn("flex h-5 w-5 items-center justify-center rounded-full text-xs",
                step === 1 ? "bg-primary text-primary-foreground" : "bg-muted")}>
                {test.status === "ok" ? <CheckCircle2 className="h-3 w-3" /> : "1"}
              </span>
              Доступ
            </span>
            <span className="h-px flex-1 bg-border" />
            <span className={cn("flex items-center gap-1.5", step === 2 ? "font-medium text-foreground" : "text-muted-foreground")}>
              <span className={cn("flex h-5 w-5 items-center justify-center rounded-full text-xs",
                step === 2 ? "bg-primary text-primary-foreground" : "bg-muted")}>2</span>
              Привязка
            </span>
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-3">
            <div>
              <Label>URL Zabbix *</Label>
              <Input
                placeholder="http://10.11.12.240/zabbix"
                value={form.zabbix_url}
                onChange={(e) => { setForm({ ...form, zabbix_url: e.target.value }); setTest({ status: "idle" }); }}
              />
              <p className="text-[11px] text-muted-foreground mt-1">Без /api_jsonrpc.php в конце.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Логин *</Label>
                <Input
                  value={form.zabbix_user}
                  onChange={(e) => { setForm({ ...form, zabbix_user: e.target.value }); setTest({ status: "idle" }); }}
                />
              </div>
              <div>
                <Label>Пароль {editing && <span className="text-[11px] text-muted-foreground">(оставьте пустым)</span>}</Label>
                <div className="relative">
                  <Input
                    type={showPwd ? "text" : "password"}
                    value={form.zabbix_password}
                    onChange={(e) => { setForm({ ...form, zabbix_password: e.target.value }); setTest({ status: "idle" }); }}
                    className="pr-10"
                  />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full" onClick={() => setShowPwd(!showPwd)}>
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>

            {test.status !== "idle" && (
              <div className={cn(
                "flex items-start gap-2 text-sm p-3 rounded-md",
                test.status === "ok" && "bg-green-500/10 text-green-600 dark:text-green-400",
                test.status === "fail" && "bg-red-500/10 text-red-600 dark:text-red-400",
                test.status === "loading" && "bg-muted text-muted-foreground",
              )}>
                {test.status === "ok" && <><CheckCircle2 className="h-4 w-4 mt-0.5" /><span>Подключено. Версия Zabbix: <strong>{test.version}</strong></span></>}
                {test.status === "fail" && <><XCircle className="h-4 w-4 mt-0.5" /><span>{test.msg}</span></>}
                {test.status === "loading" && <><Loader2 className="h-4 w-4 mt-0.5 animate-spin" /><span>Проверка соединения…</span></>}
              </div>
            )}

            <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-between -ml-2 px-2 text-muted-foreground">
                  <span className="text-xs">Дополнительно (VPN)</span>
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showAdvanced && "rotate-180")} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <Label className="text-xs">VPN-туннель (BelVPN) — заметка</Label>
                <Textarea
                  rows={2}
                  placeholder="Адрес шлюза, подсети, контакт и т.д."
                  value={form.vpn_info}
                  onChange={(e) => setForm({ ...form, vpn_info: e.target.value })}
                />
              </CollapsibleContent>
            </Collapsible>

            <DialogFooter className="gap-2 sm:justify-between">
              <Button
                type="button" variant="outline"
                onClick={runTest}
                disabled={test.status === "loading"}
              >
                {test.status === "loading"
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Проверка…</>
                  : <><Wifi className="h-4 w-4 mr-2" />Проверить</>}
              </Button>
              <Button
                onClick={() => setStep(2)}
                disabled={!form.zabbix_url || !form.zabbix_user || (!editing && !form.zabbix_password)}
              >
                Далее →
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <div>
              <Label>Название *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Zabbix Брестэнерго"
              />
            </div>
            <div>
              <Label>Организация *</Label>
              <select
                className="w-full h-10 px-3 rounded-md border bg-background"
                value={form.organization_id}
                onChange={(e) => setForm({ ...form, organization_id: e.target.value })}
              >
                <option value="">— выбрать —</option>
                {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
            <div className="flex gap-6 pt-1">
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                <Label className="text-sm">Активно</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_default} onCheckedChange={(v) => setForm({ ...form, is_default: v })} />
                <Label className="text-sm">По умолчанию</Label>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:justify-between">
              <Button variant="ghost" onClick={() => setStep(1)}>← Назад</Button>
              <Button onClick={save} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Сохранить
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────────────── Connection card ─────────────────────── */
function ConnectionCard({
  conn, onEdit, onDelete,
}: {
  conn: Conn;
  onEdit: () => void;
  onDelete: () => void;
}) {
  // Live-status: only checked for active connections, lazy on mount.
  const status = useQuery({
    queryKey: ["zabbix-conn-status", conn.id],
    queryFn: async () => {
      const { data, error } = await invokeZabbix({ body: { action: "testConnection", connection_id: conn.id } });
      if (error) return { ok: false as const, msg: (error as any).message ?? "сбой вызова" };
      const r = data as { ok: boolean; data?: { version: string }; message?: string };
      return r.ok ? { ok: true as const, version: r.data?.version } : { ok: false as const, msg: r.message };
    },
    enabled: conn.is_active,
    staleTime: 60_000,
    refetchInterval: 60_000,
    retry: false,
  });

  const dot =
    !conn.is_active ? "bg-muted-foreground" :
    status.isLoading ? "bg-amber-400 animate-pulse" :
    status.data?.ok ? "bg-green-500" : "bg-red-500";
  const label =
    !conn.is_active ? "Выключено" :
    status.isLoading ? "Проверка…" :
    status.data?.ok ? `Подключено · v${status.data.version}` : `Ошибка: ${status.data?.msg ?? "нет связи"}`;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-primary shrink-0" />
              <h3 className="font-medium truncate">{conn.name}</h3>
              {conn.is_default && <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0" />}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {conn.organizations?.name ?? "—"}
            </p>
          </div>
          <div className="flex gap-1 shrink-0">
            <Button size="icon" variant="ghost" onClick={onEdit} className="h-8 w-8">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="ghost" onClick={onDelete} className="h-8 w-8 text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <div className="text-[11px] font-mono text-muted-foreground truncate">
          {conn.zabbix_url} · {conn.zabbix_user}
        </div>
        <div className="flex items-center justify-between border-t pt-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className={cn("h-2 w-2 rounded-full shrink-0", dot)} />
            <span className="text-xs text-muted-foreground truncate" title={label}>{label}</span>
          </div>
          {conn.is_active && (
            <Button
              size="sm" variant="ghost"
              onClick={() => status.refetch()}
              disabled={status.isFetching}
              className="h-7 px-2"
              title="Перепроверить подключение"
            >
              <RefreshCw className={cn("h-3 w-3", status.isFetching && "animate-spin")} />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─────────────────────── Page ─────────────────────── */
export default function ZabbixConnections() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole("admin");
  const { toast } = useToast();
  const qc = useQueryClient();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Conn | null>(null);

  const { data: orgs = [] } = useQuery({
    queryKey: ["organizations"],
    queryFn: async () => (await supabase.from("organizations").select("id, name").order("name")).data ?? [],
  });

  const { data: conns = [], isLoading } = useQuery({
    queryKey: ["zabbix-connections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("zabbix_connections")
        .select("id, name, organization_id, zabbix_url, zabbix_user, vpn_info, is_active, is_default, organizations(name)")
        .order("is_default", { ascending: false })
        .order("name");
      if (error) throw error;
      return (data ?? []) as unknown as Conn[];
    },
    enabled: isAdmin,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("zabbix_connections").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["zabbix-connections"] });
      qc.invalidateQueries({ queryKey: ["zabbix-connections-active"] });
      toast({ title: "Подключение удалено" });
    },
  });

  const onSaved = () => {
    qc.invalidateQueries({ queryKey: ["zabbix-connections"] });
    qc.invalidateQueries({ queryKey: ["zabbix-connections-active"] });
    qc.invalidateQueries({ queryKey: ["zabbix-conn-status"] });
    qc.invalidateQueries({ queryKey: ["sidebar-zabbix-status"] });
    qc.invalidateQueries({ queryKey: ["zabbix-connections-any-active"] });
  };

  const openNew = () => { setEditing(null); setOpen(true); };
  const openEdit = (c: Conn) => { setEditing(c); setOpen(true); };

  if (!isAdmin) {
    return (
      <Card><CardContent className="py-10 text-center text-muted-foreground">
        Только администраторы.
      </CardContent></Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Server className="h-4 w-4 text-primary" />
              Подключения к серверам Zabbix заказчиков
            </CardTitle>
            <CardDescription className="mt-1">
              Каждое подключение привязано к одной организации. Хосты, метрики и графики этого Zabbix
              отображаются в её контексте. Сервер Zabbix должен быть доступен по сети
              (VPN-туннель организуется отдельно на стороне заказчика).
            </CardDescription>
          </div>
          <Button onClick={openNew} className="shrink-0">
            <Plus className="h-4 w-4 mr-2" />Новое
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[0, 1].map((i) => <Skeleton key={i} className="h-32" />)}
            </div>
          ) : conns.length === 0 ? (
            <EmptyState
              icon={Server}
              title="Подключений ещё нет"
              description="Добавьте первое подключение к Zabbix-серверу заказчика. Достаточно URL, логина и пароля — мы сразу проверим связь."
              action={{ label: "Добавить подключение", onClick: openNew }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {conns.map((c) => (
                <ConnectionCard
                  key={c.id}
                  conn={c}
                  onEdit={() => openEdit(c)}
                  onDelete={() => {
                    if (confirm(`Удалить подключение "${c.name}"?`)) remove.mutate(c.id);
                  }}
                />
              ))}
            </div>
          )}
          {conns.length > 0 && (
            <p className="text-[11px] text-muted-foreground mt-3 flex items-center gap-1.5">
              <Badge variant="secondary" className="px-1.5 py-0 h-4 text-[10px]">tip</Badge>
              Активное подключение помечено зелёной точкой. Кружок справа — обновить статус.
            </p>
          )}
        </CardContent>
      </Card>

      <ConnectionWizard
        open={open}
        onOpenChange={setOpen}
        editing={editing}
        orgs={orgs as any}
        onSaved={onSaved}
      />
    </div>
  );
}