import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { DoorOpen, FileDown, Send, Loader2, AlertTriangle, CheckCircle2, Activity, Calendar, Clock } from "lucide-react";
import { format, startOfDay, startOfWeek } from "date-fns";
import { ru } from "date-fns/locale";
import { Document, Packer, Paragraph, HeadingLevel, TextRun, AlignmentType } from "docx";
import { saveAs } from "file-saver";
import { logAudit } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { invokeZabbix } from "@/lib/zabbix-invoke";

export function ShiftHandoverDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  const todayISO = startOfDay(new Date()).toISOString();
  const weekISO = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString();

  const { data: myOpenTickets = [] } = useQuery({
    queryKey: ["handover-tickets", user?.id],
    enabled: !!user && open,
    queryFn: async () => {
      const { data } = await supabase.from("tickets")
        .select("id, title, priority, incident_category, status, sla_deadline, created_at")
        .eq("assigned_to", user!.id)
        .in("status", ["assigned", "in_progress", "waiting"])
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: todayActions = [] } = useQuery({
    queryKey: ["handover-audit", user?.id, todayISO],
    enabled: !!user && open,
    queryFn: async () => {
      const { data } = await supabase.from("audit_logs")
        .select("action, module, created_at")
        .eq("user_id", user!.id)
        .gte("created_at", todayISO)
        .order("created_at", { ascending: false }).limit(30);
      return data ?? [];
    },
  });

  const { data: pendingProtocols = [] } = useQuery({
    queryKey: ["handover-protocols", weekISO],
    enabled: open,
    queryFn: async () => {
      const { data } = await supabase.from("maintenance_protocols")
        .select("id, frequency, status, period_end, sites:site_id(name), protocol_items(status)")
        .eq("status", "in_progress")
        .gte("period_start", weekISO);
      return data ?? [];
    },
  });

  const { data: zabbixProblems = [] } = useQuery({
    queryKey: ["handover-zabbix"],
    enabled: open,
    queryFn: async () => {
      try {
        const { data } = await invokeZabbix({ body: { action: "getProblems" } });
        return Array.isArray((data as any)?.result) ? (data as any).result : [];
      } catch { return []; }
    },
  });

  async function downloadDocx() {
    setBusy(true);
    try {
      const dateStr = format(new Date(), "dd MMMM yyyy, HH:mm", { locale: ru });
      const sectionTitle = (t: string) =>
        new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 },
          children: [new TextRun({ text: t, bold: true })] });
      const item = (t: string) => new Paragraph({ children: [new TextRun({ text: "• " + t })], spacing: { after: 60 } });

      const children: any[] = [
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 },
          children: [new TextRun({ text: "ПЕРЕДАЧА СМЕНЫ", bold: true, size: 40 })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 },
          children: [new TextRun({ text: dateStr, size: 22 })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 320 },
          children: [new TextRun({ text: `Сдающий: ${profile?.full_name ?? user?.email ?? "—"}`, size: 22, italics: true })] }),

        sectionTitle(`Открытые заявки на мне (${myOpenTickets.length})`),
        ...(myOpenTickets.length === 0 ? [item("нет")] : myOpenTickets.map((t: any) =>
          item(`#${t.id.slice(0, 8)} · ${t.incident_category || t.priority || "—"} · "${t.title}"${t.sla_deadline ? ` · SLA до ${format(new Date(t.sla_deadline), "dd.MM HH:mm")}` : ""}`))),

        sectionTitle(`Выполнено сегодня (${todayActions.length})`),
        ...(todayActions.length === 0 ? [item("нет действий")] : todayActions.slice(0, 15).map((a: any) =>
          item(`${format(new Date(a.created_at), "HH:mm")} · ${a.action}`))),

        sectionTitle(`Активные проблемы Zabbix (${zabbixProblems.length})`),
        ...(zabbixProblems.length === 0 ? [item("проблем нет")] : zabbixProblems.slice(0, 10).map((p: any) =>
          item(`${p.name || p.description || "—"} · severity ${p.severity ?? "—"}`))),

        sectionTitle(`Незакрытые протоколы недели (${pendingProtocols.length})`),
        ...(pendingProtocols.length === 0 ? [item("нет")] : pendingProtocols.map((p: any) => {
          const items = p.protocol_items ?? [];
          const done = items.filter((i: any) => i.status === "done").length;
          const pct = items.length ? Math.round((done / items.length) * 100) : 0;
          return item(`${p.frequency} · ${p.sites?.name ?? "—"} · до ${p.period_end} · ${pct}% выполнен`);
        })),
      ];

      const doc = new Document({ creator: "Assist Portal", title: "Передача смены", sections: [{ properties: {}, children }] });
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `Передача_смены_${format(new Date(), "yyyy-MM-dd_HHmm")}.docx`);
      await logAudit({ action: "Сдача смены: скачан DOCX", module: "handover" });
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    } finally { setBusy(false); }
  }

  async function sendNotification() {
    setBusy(true);
    try {
      const { data: staffRoles } = await supabase.from("user_roles")
        .select("user_id").in("role", ["admin", "engineer"]);
      const ids = Array.from(new Set((staffRoles ?? []).map((r: any) => r.user_id))).filter((id) => id !== user?.id);
      notify({
        event_type: "handover.shift",
        priority: "info",
        title: `Передача смены — ${profile?.full_name ?? user?.email ?? ""}`,
        body: `Открытых заявок: ${myOpenTickets.length} · Активных проблем Zabbix: ${zabbixProblems.length} · Незакрытых протоколов: ${pendingProtocols.length}`,
        payload: { actor: user?.id, sent_at: new Date().toISOString() },
        target_user_ids: ids,
      });
      await logAudit({ action: "Сдача смены: отправлено уведомление", module: "handover" });
      toast({ title: "Уведомление отправлено", description: `Получателей: ${ids.length}` });
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    } finally { setBusy(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DoorOpen className="h-5 w-5 text-primary" />Передача смены
          </DialogTitle>
          <DialogDescription>
            {format(new Date(), "dd MMMM yyyy, HH:mm", { locale: ru })} · {profile?.full_name ?? user?.email}
          </DialogDescription>
        </DialogHeader>

        <Accordion type="multiple" defaultValue={["tickets", "problems"]} className="w-full">
          <AccordionItem value="tickets">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" />Открытые заявки на мне<Badge variant="outline">{myOpenTickets.length}</Badge></span>
            </AccordionTrigger>
            <AccordionContent>
              {myOpenTickets.length === 0 ? <p className="text-sm text-muted-foreground py-2">Заявок нет</p> : (
                <ul className="space-y-1.5">
                  {myOpenTickets.map((t: any) => (
                    <li key={t.id} className="text-sm flex items-start gap-2 border-l-2 border-destructive/40 pl-2">
                      <Badge variant="outline" className="text-xs">{t.incident_category || t.priority || "—"}</Badge>
                      <span className="flex-1 min-w-0 truncate">{t.title}</span>
                      {t.sla_deadline && <span className="text-xs text-muted-foreground"><Clock className="inline h-3 w-3 mr-1" />до {format(new Date(t.sla_deadline), "HH:mm")}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="done">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" />Выполнено сегодня<Badge variant="outline">{todayActions.length}</Badge></span>
            </AccordionTrigger>
            <AccordionContent>
              {todayActions.length === 0 ? <p className="text-sm text-muted-foreground py-2">Нет действий за сегодня</p> : (
                <ul className="space-y-1 max-h-48 overflow-y-auto">
                  {todayActions.map((a: any, i) => (
                    <li key={i} className="text-xs flex gap-2">
                      <span className="font-mono text-muted-foreground shrink-0">{format(new Date(a.created_at), "HH:mm")}</span>
                      <span>{a.action}</span>
                    </li>
                  ))}
                </ul>
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="problems">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2"><Activity className="h-4 w-4 text-amber-500" />Активные проблемы Zabbix<Badge variant="outline">{zabbixProblems.length}</Badge></span>
            </AccordionTrigger>
            <AccordionContent>
              {zabbixProblems.length === 0 ? <p className="text-sm text-muted-foreground py-2">Проблем нет</p> : (
                <ul className="space-y-1 max-h-48 overflow-y-auto">
                  {zabbixProblems.slice(0, 20).map((p: any, i) => (
                    <li key={i} className="text-sm border-l-2 border-amber-500/40 pl-2">{p.name || p.description || "—"}</li>
                  ))}
                </ul>
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="protocols">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" />Незакрытые протоколы недели<Badge variant="outline">{pendingProtocols.length}</Badge></span>
            </AccordionTrigger>
            <AccordionContent>
              {pendingProtocols.length === 0 ? <p className="text-sm text-muted-foreground py-2">Нет</p> : (
                <ul className="space-y-1.5">
                  {pendingProtocols.map((p: any) => {
                    const items = p.protocol_items ?? [];
                    const done = items.filter((i: any) => i.status === "done").length;
                    const pct = items.length ? Math.round((done / items.length) * 100) : 0;
                    return (
                      <li key={p.id} className="text-sm border-l-2 border-primary/40 pl-2">
                        <span className="font-medium">{p.frequency}</span> · {p.sites?.name ?? "—"} · до {p.period_end} · <span className="text-muted-foreground">{pct}% выполнен</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="flex flex-wrap gap-2 pt-3 border-t">
          <Button onClick={downloadDocx} disabled={busy} className="gap-2">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}Скачать DOCX
          </Button>
          <Button variant="outline" onClick={sendNotification} disabled={busy} className="gap-2">
            <Send className="h-4 w-4" />Отправить уведомление
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Закрыть</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}