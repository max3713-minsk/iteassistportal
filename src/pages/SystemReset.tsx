import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, ShieldAlert, Download, Loader2, Upload, Check, X, Clock } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";

const TABLES_TO_EXPORT = [
  "organizations", "sites", "equipment", "equipment_categories",
  "tickets", "ticket_comments", "ticket_status_history",
  "maintenance_tasks", "maintenance_schedules", "maintenance_protocols", "protocol_items", "protocol_templates",
  "documents", "contracts",
  "zabbix_connections", "monitored_hosts", "monitoring_host_links",
  "infrastructure_maps", "audit_logs", "support_schemes", "support_scheme_lines",
  "alert_thresholds", "item_aliases", "metric_translations",
  "tz_requirements", "tz_coverage", "holidays",
] as const;

export default function SystemReset() {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const isAdmin = hasRole("admin");

  const [exporting, setExporting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const restoreInputRef = useRef<HTMLInputElement>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [codeword, setCodeword] = useState("");
  const [password, setPassword] = useState("");
  const [purging, setPurging] = useState(false);
  const [hasExported, setHasExported] = useState(false);
  const [reason, setReason] = useState("");
  const [creatingRequest, setCreatingRequest] = useState(false);

  const { data: requests = [] } = useQuery({
    queryKey: ["factory-reset-requests"],
    queryFn: async () => {
      const { data } = await supabase
        .from("factory_reset_requests" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      return (data ?? []) as any[];
    },
    enabled: isAdmin,
    refetchInterval: 15_000,
  });

  const myActiveRequest = requests.find(
    (r: any) => r.requested_by === user?.id && (r.status === "pending" || r.status === "approved"),
  );
  const pendingForOthers = requests.filter(
    (r: any) => r.status === "pending" && r.requested_by !== user?.id,
  );

  if (!isAdmin) {
    return (
      <Card><CardContent className="py-12 text-center text-muted-foreground">
        Доступ только для администраторов.
      </CardContent></Card>
    );
  }

  async function exportData() {
    setExporting(true);
    try {
      const result: Record<string, unknown[]> = {};
      for (const t of TABLES_TO_EXPORT) {
        // RLS will restrict what's visible. Export what the admin sees.
        const { data, error } = await supabase.from(t as any).select("*");
        if (error) {
          console.warn(`[backup] ${t}:`, error.message);
          result[t] = [];
        } else {
          result[t] = data ?? [];
        }
      }
      const payload = {
        exported_at: new Date().toISOString(),
        exported_by: user?.email ?? null,
        portal: "ITE Assist Portal",
        version: 1,
        tables: result,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `iteassist-backup-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.json`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      setHasExported(true);
      toast({ title: "Резервная копия скачана", description: "Сохраните файл в надёжном месте перед сбросом." });
    } catch (e) {
      toast({ title: "Ошибка экспорта", description: e instanceof Error ? e.message : "—", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  }

  async function handleRestoreFile(file: File, mode: "merge" | "replace") {
    setRestoring(true);
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      if (!payload?.tables) throw new Error("Файл не содержит секцию tables");
      const { data, error } = await supabase.functions.invoke("system-restore", {
        body: { payload, mode },
      });
      if (error) throw new Error(error.message);
      if ((data as any)?.error) throw new Error((data as any).error);
      const results = (data as any)?.results ?? {};
      const total = Object.values(results).reduce((s: number, r: any) => s + (r.inserted || 0), 0);
      toast({ title: "Восстановление завершено", description: `Загружено записей: ${total}` });
      qc.invalidateQueries();
    } catch (e) {
      toast({ title: "Ошибка восстановления", description: e instanceof Error ? e.message : "—", variant: "destructive" });
    } finally {
      setRestoring(false);
      if (restoreInputRef.current) restoreInputRef.current.value = "";
    }
  }

  async function createResetRequest() {
    setCreatingRequest(true);
    try {
      const { error } = await supabase.from("factory_reset_requests" as any).insert({
        requested_by: user!.id,
        requested_by_email: user!.email,
        reason: reason || null,
      } as any);
      if (error) throw error;
      toast({ title: "Заявка создана", description: "Дождитесь подтверждения другого администратора." });
      setReason("");
      qc.invalidateQueries({ queryKey: ["factory-reset-requests"] });
    } catch (e) {
      toast({ title: "Ошибка", description: e instanceof Error ? e.message : "—", variant: "destructive" });
    } finally {
      setCreatingRequest(false);
    }
  }

  async function approveRequest(id: string) {
    const { error } = await supabase.from("factory_reset_requests" as any)
      .update({ status: "approved", approved_by: user!.id, approved_by_email: user!.email, approved_at: new Date().toISOString() } as any)
      .eq("id", id);
    if (error) toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    else { toast({ title: "Заявка подтверждена" }); qc.invalidateQueries({ queryKey: ["factory-reset-requests"] }); }
  }
  async function rejectRequest(id: string) {
    const { error } = await supabase.from("factory_reset_requests" as any)
      .update({ status: "rejected", approved_by: user!.id, approved_by_email: user!.email, approved_at: new Date().toISOString() } as any)
      .eq("id", id);
    if (error) toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    else { toast({ title: "Заявка отклонена" }); qc.invalidateQueries({ queryKey: ["factory-reset-requests"] }); }
  }

  async function executePurge() {
    if (!codeword.trim() || !password || !myActiveRequest || myActiveRequest.status !== "approved") return;
    setPurging(true);
    try {
      const { data, error } = await supabase.functions.invoke("system-purge", {
        body: { codeword: codeword.trim(), password, confirm: "PURGE", request_id: myActiveRequest.id },
      });
      if (error) throw new Error(error.message);
      if ((data as { error?: string })?.error) throw new Error((data as { error?: string }).error);
      toast({ title: "Factory reset выполнен", description: "Сейчас произойдёт перезагрузка." });
      setTimeout(() => { window.location.href = "/"; window.location.reload(); }, 1200);
    } catch (e) {
      toast({ title: "Ошибка сброса", description: e instanceof Error ? e.message : "—", variant: "destructive" });
      setPurging(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <ShieldAlert className="h-6 w-6 text-destructive" />
        <h1 className="font-heading text-2xl font-bold">Сервисные операции</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Download className="h-5 w-5 text-primary" /> Резервная копия данных</CardTitle>
          <CardDescription>
            Сохраняет содержимое основных таблиц портала в один JSON-файл. Файлы из хранилища документов в копию не попадают —
            при необходимости скачайте их вручную из раздела «Документация».
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={exportData} disabled={exporting} className="gap-2">
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {exporting ? "Подготовка..." : "Скачать резервную копию"}
          </Button>
          {hasExported && (
            <p className="text-xs text-muted-foreground">
              Резервная копия сохранена. Файл можно загрузить обратно через карточку «Восстановление».
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5 text-primary" /> Восстановление из резервной копии</CardTitle>
          <CardDescription>
            Загрузите ранее сохранённый JSON-файл. В режиме «Слияние» уже существующие записи обновляются по идентификатору, новые — добавляются.
            В режиме «Полная замена» сначала очищаются соответствующие таблицы.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <input
            ref={restoreInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const mode = (e.target.dataset.mode as "merge" | "replace") || "merge";
              handleRestoreFile(f, mode);
            }}
          />
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" disabled={restoring} className="gap-2"
              onClick={() => { if (restoreInputRef.current) { restoreInputRef.current.dataset.mode = "merge"; restoreInputRef.current.click(); } }}>
              <Upload className="h-4 w-4" /> Восстановить (слияние)
            </Button>
            <Button variant="destructive" disabled={restoring} className="gap-2"
              onClick={() => {
                if (!confirm("В режиме полной замены будут удалены все текущие записи в перечисленных таблицах. Продолжить?")) return;
                if (restoreInputRef.current) { restoreInputRef.current.dataset.mode = "replace"; restoreInputRef.current.click(); }
              }}>
              <Upload className="h-4 w-4" /> Полная замена
            </Button>
            {restoring && <span className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /> Загрузка...</span>}
          </div>
        </CardContent>
      </Card>

      {/* Pending approval from others */}
      {pendingForOthers.length > 0 && (
        <Card className="border-amber-500/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-500">
              <Clock className="h-5 w-5" /> Ожидают вашего подтверждения
            </CardTitle>
            <CardDescription>Заявки других администраторов на Factory reset.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingForOthers.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between gap-3 p-3 border rounded-md">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{r.requested_by_email}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(r.created_at), "dd.MM.yyyy HH:mm")}</p>
                  {r.reason && <p className="text-xs mt-1">{r.reason}</p>}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="default" onClick={() => approveRequest(r.id)} className="gap-1"><Check className="h-3 w-3" />Подтвердить</Button>
                  <Button size="sm" variant="ghost" onClick={() => rejectRequest(r.id)} className="gap-1"><X className="h-3 w-3" />Отклонить</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" /> Factory reset
          </CardTitle>
          <CardDescription>
            Удаляет все бизнес-данные: заявки, протоколы, оборудование, ЦОД, организации, подключения, карты инфраструктуры и журналы.
            Учётные записи пользователей и их роли остаются. Действие необратимо. Требует подтверждения другим администратором.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Перед сбросом обязательно скачайте резервную копию.</AlertTitle>
            <AlertDescription>
              После подтверждения восстановить данные средствами портала будет невозможно.
            </AlertDescription>
          </Alert>

          {!myActiveRequest && (
            <div className="space-y-2 p-3 border rounded-md">
              <Label>Шаг 1. Создайте заявку на сброс</Label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="Кратко опишите причину (опционально)" />
              <Button onClick={createResetRequest} disabled={creatingRequest} variant="outline" className="gap-2">
                <ShieldAlert className="h-4 w-4" /> Запросить Factory reset
              </Button>
            </div>
          )}

          {myActiveRequest && (
            <Alert className={myActiveRequest.status === "approved" ? "border-emerald-500/40" : "border-amber-500/40"}>
              <AlertTitle className="flex items-center gap-2">
                {myActiveRequest.status === "approved"
                  ? <><Check className="h-4 w-4 text-emerald-500" /> Заявка подтверждена</>
                  : <><Clock className="h-4 w-4 text-amber-500" /> Заявка ожидает подтверждения</>
                }
                <Badge variant="outline" className="ml-auto">
                  {myActiveRequest.status === "approved"
                    ? `Подтвердил: ${myActiveRequest.approved_by_email}`
                    : "Нужен второй администратор"}
                </Badge>
              </AlertTitle>
              <AlertDescription className="text-xs">
                Создана {format(new Date(myActiveRequest.created_at), "dd.MM.yyyy HH:mm")}. Действительна 24 часа.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Кодовое слово сервисного режима</Label>
              <Input
                type="password"
                value={codeword}
                onChange={(e) => setCodeword(e.target.value)}
                placeholder="••••••••"
                disabled={!myActiveRequest || myActiveRequest.status !== "approved"}
              />
            </div>
            <div className="space-y-2">
              <Label>Пароль вашей учётной записи</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={!myActiveRequest || myActiveRequest.status !== "approved"}
              />
            </div>
          </div>

          <Button
            variant="destructive"
            disabled={!codeword.trim() || !password || purging || !myActiveRequest || myActiveRequest.status !== "approved"}
            onClick={() => setConfirmOpen(true)}
            className="gap-2"
          >
            {purging ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
            Выполнить Factory reset
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Подтвердите Factory reset</AlertDialogTitle>
            <AlertDialogDescription>
              {hasExported
                ? "Резервная копия скачана. Все бизнес-данные будут безвозвратно удалены."
                : "Вы НЕ скачали резервную копию. Все бизнес-данные будут удалены без возможности восстановления через портал. Продолжить?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { setConfirmOpen(false); executePurge(); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Да, сбросить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}