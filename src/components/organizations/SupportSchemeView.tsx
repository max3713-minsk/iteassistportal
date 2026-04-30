import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/users/ConfirmDialog";
import {
  Phone, Smartphone, Headphones, Sun, Moon, ArrowDown, ArrowRight, Plus, Pencil, Trash2,
  ShieldCheck, User2, Network, Workflow, Copy, Check, Building2, AlertCircle, Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Scheme = any;
type Line = any;

const LINE_PALETTE: Record<string, { ring: string; tint: string; label: string }> = {
  primary:   { ring: "ring-primary/40 border-primary/30", tint: "bg-primary/5",   label: "Primary" },
  emerald:   { ring: "ring-emerald-500/40 border-emerald-500/30", tint: "bg-emerald-500/5", label: "Emerald" },
  amber:     { ring: "ring-amber-500/40 border-amber-500/30",     tint: "bg-amber-500/5",   label: "Amber" },
  rose:      { ring: "ring-rose-500/40 border-rose-500/30",       tint: "bg-rose-500/5",    label: "Rose" },
  violet:    { ring: "ring-violet-500/40 border-violet-500/30",   tint: "bg-violet-500/5",  label: "Violet" },
  sky:       { ring: "ring-sky-500/40 border-sky-500/30",         tint: "bg-sky-500/5",     label: "Sky" },
};

function CopyButton({ value }: { value?: string | null }) {
  const [done, setDone] = useState(false);
  if (!value) return null;
  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      className="h-6 w-6 text-muted-foreground hover:text-foreground"
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(value);
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
      title="Скопировать"
    >
      {done ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  );
}

function PhoneLink({ phone }: { phone?: string | null }) {
  if (!phone) return <span className="text-muted-foreground text-sm">—</span>;
  const tel = phone.replace(/[^\d+]/g, "");
  return (
    <a href={`tel:${tel}`} className="font-mono text-sm hover:text-primary transition-colors">
      {phone}
    </a>
  );
}

export default function SupportSchemeView({ organizationId, organizationName }: { organizationId: string; organizationName?: string }) {
  const { hasRole } = useAuth();
  const isAdmin = hasRole("admin");
  const { toast } = useToast();
  const qc = useQueryClient();

  const [editSchemeOpen, setEditSchemeOpen] = useState(false);
  const [lineDialogOpen, setLineDialogOpen] = useState(false);
  const [editingLine, setEditingLine] = useState<Line | null>(null);
  const [confirmDeleteLine, setConfirmDeleteLine] = useState<Line | null>(null);

  const { data: scheme, isLoading } = useQuery({
    queryKey: ["support-scheme", organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_schemes")
        .select("*")
        .eq("organization_id", organizationId)
        .maybeSingle();
      if (error) throw error;
      return data as Scheme | null;
    },
    enabled: !!organizationId,
  });

  const { data: lines = [] } = useQuery({
    queryKey: ["support-scheme-lines", scheme?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_scheme_lines")
        .select("*")
        .eq("scheme_id", scheme!.id)
        .order("position");
      if (error) throw error;
      return data as Line[];
    },
    enabled: !!scheme?.id,
  });

  const createScheme = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("support_schemes").insert({
        organization_id: organizationId,
        title: "Схема технической поддержки",
        subtitle: organizationName ? `Тех. сопровождение: ${organizationName}` : undefined,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["support-scheme", organizationId] });
      toast({ title: "Схема создана. Заполните контакты." });
      setEditSchemeOpen(true);
    },
    onError: (e: any) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  });

  const deleteLine = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("support_scheme_lines").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["support-scheme-lines", scheme?.id] });
      setConfirmDeleteLine(null);
      toast({ title: "Линия удалена" });
    },
  });

  if (isLoading) return <p className="text-muted-foreground py-10 text-center">Загрузка…</p>;

  if (!scheme) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-16 text-center space-y-4">
          <Workflow className="h-12 w-12 mx-auto text-muted-foreground/40" />
          <div>
            <p className="font-medium">Схема поддержки ещё не настроена</p>
            <p className="text-sm text-muted-foreground mt-1">
              Создайте интерактивную схему, чтобы заказчик мог быстро найти контакты дежурных и порядок эскалации.
            </p>
          </div>
          {isAdmin && (
            <Button onClick={() => createScheme.mutate()} disabled={createScheme.isPending}>
              <Plus className="h-4 w-4 mr-2" />Создать схему поддержки
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
            <Workflow className="h-3.5 w-3.5" /> Схема поддержки
          </div>
          <h2 className="font-heading text-2xl font-bold mt-1">{scheme.title}</h2>
          {scheme.subtitle && <p className="text-sm text-muted-foreground mt-0.5">{scheme.subtitle}</p>}
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditSchemeOpen(true)}>
              <Pencil className="h-3.5 w-3.5 mr-1.5" />Изменить шапку
            </Button>
            <Button size="sm" onClick={() => { setEditingLine(null); setLineDialogOpen(true); }}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />Добавить линию
            </Button>
          </div>
        )}
      </div>

      {/* SLA reference */}
      {scheme.sla_note && (
        <Card className="border-l-4 border-l-primary">
          <CardContent className="py-4 flex gap-3 items-start">
            <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-primary mb-1">Алгоритм по SLA</p>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{scheme.sla_note}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Hotline */}
      <SchemeStep step={1} title="Обращение на горячую линию" icon={<Headphones className="h-5 w-5" />}>
        <div className="grid sm:grid-cols-2 gap-3">
          <ContactBlock
            icon={<Phone className="h-4 w-4" />}
            label="Городской номер"
            value={scheme.hotline_city}
            highlight
          />
          <ContactBlock
            icon={<Smartphone className="h-4 w-4" />}
            label="Мобильный (A1)"
            value={scheme.hotline_mobile}
            highlight
          />
        </div>
      </SchemeStep>

      <Connector />

      {/* Step 2: IVR routing */}
      <SchemeStep step={2} title="IVR маршрутизация" icon={<Network className="h-5 w-5" />}>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-300 mb-1">
              <Sun className="h-4 w-4" /><span className="text-xs font-medium uppercase tracking-wider">Будни</span>
            </div>
            <p className="font-mono text-sm font-semibold">{scheme.ivr_business_hours || "—"}</p>
            <p className="text-xs text-muted-foreground mt-1">Звонок маршрутизируется на дежурную группу инженеров</p>
          </div>
          <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/5 p-4">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-300 mb-1">
              <Moon className="h-4 w-4" /><span className="text-xs font-medium uppercase tracking-wider">Вне рабочего времени</span>
            </div>
            <p className="font-mono text-sm font-semibold">{scheme.ivr_after_hours || "—"}</p>
            <p className="text-xs text-muted-foreground mt-1">Вечер, ночь, выходные и праздничные дни</p>
          </div>
        </div>
      </SchemeStep>

      <Connector />

      {/* Step 3: Engineering lines */}
      <SchemeStep step={3} title="Линии технической поддержки" icon={<Layers className="h-5 w-5" />}>
        {lines.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center border border-dashed rounded-lg">
            Линии не настроены. {isAdmin && "Нажмите «Добавить линию» сверху."}
          </p>
        ) : (
          <div className={cn("grid gap-3", lines.length >= 3 ? "lg:grid-cols-3" : lines.length === 2 ? "sm:grid-cols-2" : "")}>
            {lines.map((line) => (
              <LineCard
                key={line.id}
                line={line}
                isAdmin={isAdmin}
                onEdit={() => { setEditingLine(line); setLineDialogOpen(true); }}
                onDelete={() => setConfirmDeleteLine(line)}
              />
            ))}
          </div>
        )}
      </SchemeStep>

      {(scheme.escalation_name || scheme.escalation_phone) && (
        <>
          <Connector label="Эскалация при отсутствии ответа" />
          <SchemeStep step={4} title="Эскалация — старший дежурный" icon={<AlertCircle className="h-5 w-5" />} accent="rose">
            <ResponsibleCard
              role={scheme.escalation_role}
              name={scheme.escalation_name}
              phone={scheme.escalation_phone}
              tone="rose"
            />
          </SchemeStep>
        </>
      )}

      {/* Responsible persons */}
      <Card className="border-2 border-dashed">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User2 className="h-4 w-4 text-primary" />
            Ответственные лица
          </CardTitle>
          <CardDescription>Контакты для согласований и управления договором</CardDescription>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-3">
          <ResponsibleCard
            role={scheme.contractor_responsible_role}
            name={scheme.contractor_responsible_name}
            phone={scheme.contractor_responsible_phone}
            tone="primary"
          />
          <ResponsibleCard
            role={scheme.customer_responsible_role}
            name={scheme.customer_responsible_name}
            phone={scheme.customer_responsible_phone}
            tone="emerald"
          />
        </CardContent>
      </Card>

      {/* Edit scheme header dialog */}
      {editSchemeOpen && (
        <SchemeHeaderDialog
          scheme={scheme}
          onClose={() => setEditSchemeOpen(false)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ["support-scheme", organizationId] });
            setEditSchemeOpen(false);
          }}
        />
      )}

      {/* Line dialog */}
      {lineDialogOpen && (
        <LineDialog
          schemeId={scheme.id}
          editing={editingLine}
          nextPosition={lines.length}
          onClose={() => { setLineDialogOpen(false); setEditingLine(null); }}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ["support-scheme-lines", scheme.id] });
            setLineDialogOpen(false);
            setEditingLine(null);
          }}
        />
      )}

      <ConfirmDialog
        open={!!confirmDeleteLine}
        title="Удалить линию?"
        description={`Линия «${confirmDeleteLine?.line_name}» будет удалена из схемы.`}
        variant="destructive"
        loading={deleteLine.isPending}
        onConfirm={() => confirmDeleteLine && deleteLine.mutate(confirmDeleteLine.id)}
        onCancel={() => setConfirmDeleteLine(null)}
      />
    </div>
  );
}

/* ─── Sub-components ─── */

function SchemeStep({ step, title, icon, children, accent = "primary" }: any) {
  const accentMap: Record<string, string> = {
    primary: "bg-primary text-primary-foreground",
    rose: "bg-rose-500 text-white",
  };
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className={cn("h-9 w-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0", accentMap[accent])}>
            {step}
          </div>
          <div className="flex items-center gap-2 text-foreground">
            {icon}
            <CardTitle className="text-base">{title}</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function Connector({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-1 py-1">
      {label && <span className="text-xs text-muted-foreground italic">{label}</span>}
      <ArrowDown className="h-5 w-5 text-muted-foreground/50" />
    </div>
  );
}

function ContactBlock({ icon, label, value, highlight }: any) {
  return (
    <div className={cn(
      "rounded-lg border p-4 flex items-center gap-3 transition-colors",
      highlight ? "border-primary/30 bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/50"
    )}>
      <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shrink-0", highlight ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground")}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
        <div className="flex items-center gap-1">
          <PhoneLink phone={value} />
          <CopyButton value={value} />
        </div>
      </div>
    </div>
  );
}

function LineCard({ line, isAdmin, onEdit, onDelete }: any) {
  const palette = LINE_PALETTE[line.color] ?? LINE_PALETTE.primary;
  return (
    <div className={cn("relative rounded-xl border p-4 transition-shadow hover:shadow-lg", palette.tint, palette.ring.split(" ")[1])}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          {line.line_number && (
            <span className={cn("h-7 w-7 rounded-md flex items-center justify-center text-sm font-bold", palette.ring.split(" ")[0].replace("ring", "bg").replace("/40", "/15"))}>
              {line.line_number}
            </span>
          )}
          <div>
            <p className="font-semibold leading-tight">{line.line_name}</p>
            {line.description && <p className="text-xs text-muted-foreground">{line.description}</p>}
          </div>
        </div>
        {isAdmin && (
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onEdit}><Pencil className="h-3.5 w-3.5" /></Button>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={onDelete}><Trash2 className="h-3.5 w-3.5" /></Button>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="rounded-md bg-background/60 backdrop-blur px-3 py-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Дежурный инженер</p>
          <p className="text-sm font-medium">{line.primary_engineer_name || "—"}</p>
          <div className="flex items-center gap-1">
            <PhoneLink phone={line.primary_engineer_phone} />
            <CopyButton value={line.primary_engineer_phone} />
          </div>
        </div>
        {(line.fallback_engineer_name || line.fallback_engineer_phone) && (
          <div className="rounded-md bg-background/40 px-3 py-2 border border-dashed">
            <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
              <ArrowRight className="h-3 w-3" /> При недозвоне
            </div>
            <p className="text-sm font-medium">{line.fallback_engineer_name || "—"}</p>
            <div className="flex items-center gap-1">
              <PhoneLink phone={line.fallback_engineer_phone} />
              <CopyButton value={line.fallback_engineer_phone} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ResponsibleCard({ role, name, phone, tone = "primary" }: any) {
  const toneMap: Record<string, string> = {
    primary: "border-primary/30 bg-primary/5",
    emerald: "border-emerald-500/30 bg-emerald-500/5",
    rose: "border-rose-500/30 bg-rose-500/5",
  };
  if (!name && !phone) {
    return (
      <div className={cn("rounded-lg border-dashed border p-4 text-sm text-muted-foreground", toneMap[tone])}>
        <p className="text-xs uppercase tracking-wider">{role || "Ответственный"}</p>
        <p className="mt-1 italic">Не указан</p>
      </div>
    );
  }
  return (
    <div className={cn("rounded-lg border p-4", toneMap[tone])}>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{role || "Ответственный"}</p>
      <p className="font-semibold mt-1">{name || "—"}</p>
      <div className="flex items-center gap-1 mt-0.5">
        <PhoneLink phone={phone} />
        <CopyButton value={phone} />
      </div>
    </div>
  );
}

/* ─── Dialogs ─── */

function SchemeHeaderDialog({ scheme, onClose, onSaved }: any) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    title: scheme.title || "",
    subtitle: scheme.subtitle || "",
    hotline_city: scheme.hotline_city || "",
    hotline_mobile: scheme.hotline_mobile || "",
    ivr_business_hours: scheme.ivr_business_hours || "",
    ivr_after_hours: scheme.ivr_after_hours || "",
    sla_note: scheme.sla_note || "",
    customer_responsible_role: scheme.customer_responsible_role || "",
    customer_responsible_name: scheme.customer_responsible_name || "",
    customer_responsible_phone: scheme.customer_responsible_phone || "",
    contractor_responsible_role: scheme.contractor_responsible_role || "",
    contractor_responsible_name: scheme.contractor_responsible_name || "",
    contractor_responsible_phone: scheme.contractor_responsible_phone || "",
    escalation_role: scheme.escalation_role || "",
    escalation_name: scheme.escalation_name || "",
    escalation_phone: scheme.escalation_phone || "",
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("support_schemes").update(form).eq("id", scheme.id);
    setSaving(false);
    if (error) return toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    toast({ title: "Сохранено" });
    onSaved();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Параметры схемы поддержки</DialogTitle>
          <DialogDescription>Заполните данные горячей линии, IVR и ответственных лиц</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Заголовок</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Подзаголовок</Label><Input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} /></div>
          </div>

          <div className="rounded-lg border p-3 space-y-3">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Горячая линия</p>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Городской</Label><Input value={form.hotline_city} onChange={(e) => setForm({ ...form, hotline_city: e.target.value })} placeholder="+375 17 336 60 45" /></div>
              <div><Label>Мобильный</Label><Input value={form.hotline_mobile} onChange={(e) => setForm({ ...form, hotline_mobile: e.target.value })} placeholder="+375 29 336 60 45" /></div>
            </div>
          </div>

          <div className="rounded-lg border p-3 space-y-3">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">IVR расписание</p>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Будни</Label><Input value={form.ivr_business_hours} onChange={(e) => setForm({ ...form, ivr_business_hours: e.target.value })} /></div>
              <div><Label>Вне рабочего времени</Label><Input value={form.ivr_after_hours} onChange={(e) => setForm({ ...form, ivr_after_hours: e.target.value })} /></div>
            </div>
          </div>

          <div><Label>Алгоритм по SLA (заметка)</Label><Textarea rows={2} value={form.sla_note} onChange={(e) => setForm({ ...form, sla_note: e.target.value })} placeholder="Алгоритм реагирования на события П1 по таблице SLA" /></div>

          <div className="rounded-lg border p-3 space-y-3">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Эскалация (старший дежурный)</p>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Роль</Label><Input value={form.escalation_role} onChange={(e) => setForm({ ...form, escalation_role: e.target.value })} /></div>
              <div><Label>ФИО</Label><Input value={form.escalation_name} onChange={(e) => setForm({ ...form, escalation_name: e.target.value })} /></div>
              <div><Label>Телефон</Label><Input value={form.escalation_phone} onChange={(e) => setForm({ ...form, escalation_phone: e.target.value })} /></div>
            </div>
          </div>

          <div className="rounded-lg border p-3 space-y-3">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Ответственный от Исполнителя</p>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Роль</Label><Input value={form.contractor_responsible_role} onChange={(e) => setForm({ ...form, contractor_responsible_role: e.target.value })} /></div>
              <div><Label>ФИО</Label><Input value={form.contractor_responsible_name} onChange={(e) => setForm({ ...form, contractor_responsible_name: e.target.value })} /></div>
              <div><Label>Телефон</Label><Input value={form.contractor_responsible_phone} onChange={(e) => setForm({ ...form, contractor_responsible_phone: e.target.value })} /></div>
            </div>
          </div>

          <div className="rounded-lg border p-3 space-y-3">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Ответственный от Заказчика</p>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Роль</Label><Input value={form.customer_responsible_role} onChange={(e) => setForm({ ...form, customer_responsible_role: e.target.value })} /></div>
              <div><Label>ФИО</Label><Input value={form.customer_responsible_name} onChange={(e) => setForm({ ...form, customer_responsible_name: e.target.value })} /></div>
              <div><Label>Телефон</Label><Input value={form.customer_responsible_phone} onChange={(e) => setForm({ ...form, customer_responsible_phone: e.target.value })} /></div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Сохранение…" : "Сохранить"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LineDialog({ schemeId, editing, nextPosition, onClose, onSaved }: any) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    line_number: editing?.line_number ?? String(nextPosition + 1),
    line_name: editing?.line_name ?? "",
    description: editing?.description ?? "",
    primary_engineer_name: editing?.primary_engineer_name ?? "",
    primary_engineer_phone: editing?.primary_engineer_phone ?? "",
    fallback_engineer_name: editing?.fallback_engineer_name ?? "",
    fallback_engineer_phone: editing?.fallback_engineer_phone ?? "",
    color: editing?.color ?? "primary",
    position: editing?.position ?? nextPosition,
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.line_name.trim()) return toast({ title: "Укажите название линии", variant: "destructive" });
    setSaving(true);
    const payload = { ...form, scheme_id: schemeId };
    const { error } = editing
      ? await supabase.from("support_scheme_lines").update(payload).eq("id", editing.id)
      : await supabase.from("support_scheme_lines").insert(payload);
    setSaving(false);
    if (error) return toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    toast({ title: editing ? "Линия обновлена" : "Линия добавлена" });
    onSaved();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Изменить линию" : "Новая линия поддержки"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Номер</Label><Input value={form.line_number} onChange={(e) => setForm({ ...form, line_number: e.target.value })} /></div>
            <div className="col-span-2"><Label>Название *</Label><Input value={form.line_name} onChange={(e) => setForm({ ...form, line_name: e.target.value })} placeholder="Администрирование" /></div>
          </div>
          <div><Label>Описание</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="ОС, AD, бэкапы…" /></div>

          <div className="rounded-lg border p-3 space-y-3">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Дежурный инженер</p>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>ФИО</Label><Input value={form.primary_engineer_name} onChange={(e) => setForm({ ...form, primary_engineer_name: e.target.value })} /></div>
              <div><Label>Телефон</Label><Input value={form.primary_engineer_phone} onChange={(e) => setForm({ ...form, primary_engineer_phone: e.target.value })} /></div>
            </div>
          </div>

          <div className="rounded-lg border p-3 space-y-3">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">При недозвоне</p>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>ФИО</Label><Input value={form.fallback_engineer_name} onChange={(e) => setForm({ ...form, fallback_engineer_name: e.target.value })} /></div>
              <div><Label>Телефон</Label><Input value={form.fallback_engineer_phone} onChange={(e) => setForm({ ...form, fallback_engineer_phone: e.target.value })} /></div>
            </div>
          </div>

          <div>
            <Label>Цвет</Label>
            <Select value={form.color} onValueChange={(v) => setForm({ ...form, color: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(LINE_PALETTE).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Сохранение…" : "Сохранить"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}