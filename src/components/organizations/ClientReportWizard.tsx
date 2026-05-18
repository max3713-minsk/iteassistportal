import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { FileDown, Eye, Loader2, FileText } from "lucide-react";
import { fetchReportData, generateClientReport, type ReportOptions } from "@/lib/generate-client-report";
import { logAudit } from "@/lib/audit";
import { SeafileSendButton } from "@/components/SeafileSendButton";

export function ClientReportWizard() {
  const { toast } = useToast();
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

  const [orgId, setOrgId] = useState<string>("");
  const [start, setStart] = useState(monthAgo);
  const [end, setEnd] = useState(today);
  const [reportType, setReportType] = useState<ReportOptions["reportType"]>("quarterly");
  const [include, setInclude] = useState({ sla: true, tickets: true, protocols: true, infrastructure: true });
  const [busy, setBusy] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [preview, setPreview] = useState<string>("");

  const { data: orgs = [] } = useQuery({
    queryKey: ["report-orgs"],
    queryFn: async () => {
      const { data } = await supabase.from("organizations").select("id, name").eq("is_active", true).order("name");
      return data ?? [];
    },
  });

  const orgName = orgs.find((o: any) => o.id === orgId)?.name ?? "";

  async function buildOpts(): Promise<ReportOptions | null> {
    if (!orgId) {
      toast({ title: "Выберите организацию", variant: "destructive" });
      return null;
    }
    return { organizationId: orgId, organizationName: orgName, startDate: start, endDate: end, reportType, include };
  }

  async function onPreview() {
    const opts = await buildOpts(); if (!opts) return;
    setBusy(true);
    try {
      const data = await fetchReportData(opts);
      const incidents = data.tickets.filter((t) => t.request_type === "incident").length;
      const closed = data.tickets.filter((t) => ["resolved", "closed"].includes(t.status));
      const compliant = closed.filter((t) => t.resolved_at && t.sla_deadline && new Date(t.resolved_at) <= new Date(t.sla_deadline)).length;
      const sla = closed.length ? Math.round((compliant / closed.length) * 100) : 100;
      const lines = [
        `СВОДКА — ${orgName}`,
        `Период: ${start} — ${end}`,
        `Тип: ${reportType}`,
        ``,
        `Заявок всего: ${data.tickets.length}`,
        `  Инциденты: ${incidents}`,
        `Закрытые в срок: ${compliant}/${closed.length} (${sla}%)`,
        `Протоколов: ${data.protocols.length} (выполнено: ${data.protocols.filter((p) => p.status === "completed").length})`,
        `Оборудование: ${data.equipment.length} единиц`,
        `ЦОДы: ${data.sites.map((s: any) => s.name).join(", ") || "—"}`,
      ];
      setPreview(lines.join("\n"));
      setPreviewOpen(true);
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  async function onDownload() {
    const opts = await buildOpts(); if (!opts) return;
    setBusy(true);
    try {
      const data = await fetchReportData(opts);
      await generateClientReport(data);
      await logAudit({ action: `Сформирован отчёт по организации: ${orgName}`, module: "reports", entityId: orgId });
      toast({ title: "Отчёт сформирован" });
    } catch (e: any) {
      toast({ title: "Ошибка генерации", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="h-4 w-4" />
          Мастер генерирует профессиональный DOCX-отчёт за выбранный период.
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Организация</Label>
            <Select value={orgId} onValueChange={setOrgId}>
              <SelectTrigger><SelectValue placeholder="Выберите организацию" /></SelectTrigger>
              <SelectContent>
                {orgs.map((o: any) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Тип отчёта</Label>
            <RadioGroup value={reportType} onValueChange={(v: any) => setReportType(v)} className="flex gap-4 pt-2">
              <div className="flex items-center gap-2"><RadioGroupItem id="rt-m" value="monthly" /><Label htmlFor="rt-m" className="font-normal cursor-pointer">Ежемесячный</Label></div>
              <div className="flex items-center gap-2"><RadioGroupItem id="rt-q" value="quarterly" /><Label htmlFor="rt-q" className="font-normal cursor-pointer">Квартальный</Label></div>
              <div className="flex items-center gap-2"><RadioGroupItem id="rt-h" value="biannual" /><Label htmlFor="rt-h" className="font-normal cursor-pointer">Полугодовой</Label></div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Период с</Label>
            <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Период по</Label>
            <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Включить в отчёт</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {([
              ["sla", "SLA-статистика"],
              ["tickets", "Заявки"],
              ["protocols", "Протоколы ТО"],
              ["infrastructure", "Состояние инфраструктуры"],
            ] as const).map(([k, label]) => (
              <label key={k} className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={include[k]} onCheckedChange={(v) => setInclude((p) => ({ ...p, [k]: !!v }))} />
                {label}
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <Button variant="outline" onClick={onPreview} disabled={busy} className="gap-2">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
            Предпросмотр
          </Button>
          <Button onClick={onDownload} disabled={busy} className="gap-2">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            Скачать DOCX
          </Button>
          <SeafileSendButton
            variant="outline"
            kind="report"
            label="Отправить в Seafile"
            disabled={busy || !orgId}
            getPayload={async () => {
              const opts = await buildOpts();
              if (!opts) throw new Error("Выберите организацию");
              const data = await fetchReportData(opts);
              const blob = await generateClientReport(data, { returnBlob: true });
              return {
                blob,
                filename: `report_${orgName}_${start}_${end}.docx`,
                meta: { org: orgName, date: end, period: `${start}..${end}`, name: `Отчёт_${reportType}` },
              };
            }}
          />
        </div>
      </CardContent>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Предпросмотр отчёта</DialogTitle></DialogHeader>
          <pre className="bg-muted/50 p-4 rounded-lg text-xs whitespace-pre-wrap font-mono max-h-[60vh] overflow-y-auto">{preview}</pre>
        </DialogContent>
      </Dialog>
    </Card>
  );
}