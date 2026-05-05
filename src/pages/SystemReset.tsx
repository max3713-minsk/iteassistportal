import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, ShieldAlert, Download, Loader2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const TABLES_TO_EXPORT = [
  "organizations", "sites", "equipment", "equipment_categories",
  "tickets", "ticket_comments", "ticket_status_history",
  "maintenance_tasks", "maintenance_schedules", "maintenance_protocols", "protocol_items",
  "documents", "contracts",
  "zabbix_connections", "monitored_hosts", "monitoring_host_links",
  "infrastructure_maps", "audit_logs",
] as const;

export default function SystemReset() {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const isAdmin = hasRole("admin");

  const [exporting, setExporting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [codeword, setCodeword] = useState("");
  const [password, setPassword] = useState("");
  const [purging, setPurging] = useState(false);
  const [hasExported, setHasExported] = useState(false);

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

  async function executePurge() {
    if (!codeword.trim() || !password) return;
    setPurging(true);
    try {
      const { data, error } = await supabase.functions.invoke("system-purge", {
        body: { codeword: codeword.trim(), password, confirm: "PURGE" },
      });
      if (error) throw new Error(error.message);
      if ((data as { error?: string })?.error) throw new Error((data as { error?: string }).error);
      toast({ title: "Портал сброшен", description: "Сейчас произойдёт перезагрузка." });
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
              Резервная копия сохранена. Восстановление из файла на текущем этапе выполняется вручную при участии администратора платформы.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" /> Сброс портала «как из коробки»
          </CardTitle>
          <CardDescription>
            Удаляет все бизнес-данные: заявки, протоколы, оборудование, ЦОД, организации, подключения, карты инфраструктуры и журналы.
            Учётные записи пользователей и их роли остаются. Действие необратимо.
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

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Кодовое слово сервисного режима</Label>
              <Input
                type="password"
                value={codeword}
                onChange={(e) => setCodeword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label>Пароль вашей учётной записи</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <Button
            variant="destructive"
            disabled={!codeword.trim() || !password || purging}
            onClick={() => setConfirmOpen(true)}
            className="gap-2"
          >
            {purging ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
            Сбросить портал
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Подтвердите сброс</AlertDialogTitle>
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