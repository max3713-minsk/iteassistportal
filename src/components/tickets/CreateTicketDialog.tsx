import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format as formatDate } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { logAudit } from "@/lib/audit";
import { notify } from "@/lib/notify";
import {
  PRODUCTS,
  REQUEST_TYPES,
  INCIDENT_CATEGORIES,
  getAutoSLA,
  type RequestType,
} from "@/lib/ticket-categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function CreateTicketDialog({ open, onOpenChange }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [productCode, setProductCode] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [requestType, setRequestType] = useState<RequestType | "">("");
  const [incidentCategory, setIncidentCategory] = useState("");
  const [siteId, setSiteId] = useState("");
  const [equipmentId, setEquipmentId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const product = PRODUCTS.find((p) => p.code === productCode);
  const showIncidentCategory = requestType === "incident";
  const sla = requestType
    ? getAutoSLA(requestType as RequestType, incidentCategory || undefined)
    : null;

  const { data: sites = [] } = useQuery({
    queryKey: ["sites"],
    queryFn: async () => {
      const { data } = await supabase.from("sites").select("id, name").order("name");
      return data ?? [];
    },
  });

  const { data: equipment = [] } = useQuery({
    queryKey: ["equipment-list"],
    queryFn: async () => {
      const { data } = await supabase.from("equipment").select("id, name, model, site_id").order("name");
      return data ?? [];
    },
  });

  const filteredEquipment = siteId
    ? equipment.filter((e: any) => e.site_id === siteId)
    : equipment;

  const resetForm = () => {
    setProductCode("");
    setSubcategory("");
    setRequestType("");
    setIncidentCategory("");
    setSiteId("");
    setEquipmentId("");
    setTitle("");
    setDescription("");
  };

  const canSubmit =
    !!productCode &&
    !!requestType &&
    !!title.trim() &&
    (!showIncidentCategory || !!incidentCategory);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!sla) return;
      const now = new Date();
      const slaDeadline = new Date(now.getTime() + sla.slaMinutes * 60 * 1000);

      const { data: ticket, error } = await supabase
        .from("tickets")
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          priority: sla.priority as any,
          site_id: siteId || null,
          equipment_id: equipmentId || null,
          created_by: user!.id,
          sla_deadline: slaDeadline.toISOString(),
          product_code: productCode,
          subcategory: subcategory || null,
          request_type: requestType,
          incident_category: showIncidentCategory ? incidentCategory : null,
        } as any)
        .select("id, site_id")
        .single();
      if (error) throw error;

      // Auto-create on_request protocol
      if (ticket && ticket.site_id) {
        const todayStr = formatDate(new Date(), "yyyy-MM-dd");
        await supabase.from("maintenance_protocols").insert({
          site_id: ticket.site_id,
          frequency: "on_request" as any,
          period_start: todayStr,
          period_end: todayStr,
          status: "in_progress",
          created_by: user!.id,
          ticket_id: ticket.id,
          notes: `Заявка: ${title.trim()}`,
        });
      }

      // Log status history
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user!.id)
        .single();

      await supabase.from("ticket_status_history").insert({
        ticket_id: ticket.id,
        old_status: null,
        new_status: "open",
        changed_by: user!.id,
        changed_by_name: profile?.full_name || user!.email,
        comment: "Заявка создана",
      } as any);

      await logAudit({
        action: "Создание заявки",
        module: "tickets",
        entityId: ticket.id,
        details: `${title.trim()} | ${productCode} | ${requestType}`,
      });

      // Fire notification (fire-and-forget) — обогащённый payload
      const siteName = sites.find((s: any) => s.id === siteId)?.name ?? null;
      const equipmentName = equipment.find((e: any) => e.id === equipmentId)?.name ?? null;
      const productName = PRODUCTS.find((p) => p.code === productCode)?.name ?? productCode;
      const requestTypeLabel = REQUEST_TYPES.find((rt) => rt.value === requestType)?.label ?? requestType;
      const url = `${window.location.origin}/tickets?id=${ticket.id}`;
      notify({
        event_type: "ticket.created",
        priority: sla.priority,
        title: title.trim(),
        body: description.trim() ? description.trim().slice(0, 600) : `Тип: ${requestTypeLabel} • SLA ${sla.slaMinutes} мин.`,
        payload: {
          ticket_id: ticket.id,
          created_by: user!.id,
          created_by_name: profile?.full_name || user!.email,
          assigned_to: null,
          priority: sla.priority,
          request_type: requestType,
          request_type_label: requestTypeLabel,
          product_code: productCode,
          product_name: productName,
          subcategory: subcategory || null,
          site_id: siteId || null,
          site_name: siteName,
          equipment_name: equipmentName,
          status: "open",
          status_label: "Новая",
          sla_minutes: sla.slaMinutes,
          sla_deadline_label: slaDeadline.toLocaleString("ru-RU", { timeZone: "Europe/Minsk" }),
          url,
        },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tickets"] });
      qc.invalidateQueries({ queryKey: ["open-tickets-count"] });
      qc.invalidateQueries({ queryKey: ["protocols"] });
      onOpenChange(false);
      resetForm();
      toast({ title: "Заявка создана", description: "Протокол обслуживания создан автоматически" });
    },
    onError: (e: any) =>
      toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) resetForm();
      }}
    >
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Новая заявка</DialogTitle>
          <DialogDescription>Заполните поля шаг за шагом</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Step 1: Product */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              1. Выберите продукт <span className="text-destructive">*</span>
            </Label>
            <Select
              value={productCode}
              onValueChange={(v) => {
                setProductCode(v);
                setSubcategory("");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Продукт / Система" />
              </SelectTrigger>
              <SelectContent>
                {PRODUCTS.map((p) => (
                  <SelectItem key={p.code} value={p.code}>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs font-mono">{p.code}</Badge>
                      {p.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Step 2: Subcategory (conditional) */}
          {product && product.subcategories.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                2. Уточните компонент <span className="text-muted-foreground">(опционально)</span>
              </Label>
              <Select value={subcategory} onValueChange={setSubcategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите компонент" />
                </SelectTrigger>
                <SelectContent>
                  {product.subcategories.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Step 3: Request type */}
          {productCode && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                3. Тип обращения <span className="text-destructive">*</span>
              </Label>
              <RadioGroup
                value={requestType}
                onValueChange={(v) => {
                  setRequestType(v as RequestType);
                  if (v !== "incident") setIncidentCategory("");
                }}
                className="grid grid-cols-2 gap-2"
              >
                {REQUEST_TYPES.map((rt) => (
                  <label
                    key={rt.value}
                    className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                      requestType === rt.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <RadioGroupItem value={rt.value} />
                    <div>
                      <div className="text-sm font-medium">{rt.label}</div>
                    </div>
                  </label>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Step 4: Incident category (conditional) */}
          {showIncidentCategory && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                4. Категория инцидента <span className="text-destructive">*</span>
              </Label>
              <Select value={incidentCategory} onValueChange={setIncidentCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите категорию" />
                </SelectTrigger>
                <SelectContent>
                  {INCIDENT_CATEGORIES.map((ic) => (
                    <SelectItem key={ic.value} value={ic.value}>
                      <div>
                        <span className="font-medium">{ic.label}</span>
                        <span className="text-muted-foreground ml-2 text-xs">({ic.description})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {sla && (
                <div className="flex items-center gap-2 text-sm bg-muted/50 p-2 rounded-md">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Приоритет: <Badge variant="outline">{sla.priority}</Badge> • Время реакции:{" "}
                    <strong>{sla.slaMinutes} мин.</strong>
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Non-incident SLA info */}
          {requestType && requestType !== "incident" && sla && (
            <div className="flex items-center gap-2 text-sm bg-muted/50 p-2 rounded-md">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>
                Приоритет: <Badge variant="outline">{sla.priority}</Badge> • Время реакции:{" "}
                <strong>{sla.slaMinutes} мин.</strong>
              </span>
            </div>
          )}

          {/* Step 5: Site/Equipment */}
          {requestType && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">5. Оборудование</Label>
              <div className="grid grid-cols-2 gap-2">
                <Select value={siteId} onValueChange={(v) => { setSiteId(v); setEquipmentId(""); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="ЦОД" />
                  </SelectTrigger>
                  <SelectContent>
                    {sites.map((s: any) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={equipmentId} onValueChange={setEquipmentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Оборудование" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredEquipment.map((e: any) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.name}{e.model ? ` (${e.model})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 6: Title */}
          {requestType && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                6. Тема <span className="text-destructive">*</span>
              </Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder='Например: "Не открывается схема ПС 110кВ"'
              />
            </div>
          )}

          {/* Step 7: Description */}
          {requestType && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">7. Описание</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Подробно опишите проблему или задачу..."
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => { onOpenChange(false); resetForm(); }}>
            Отмена
          </Button>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!canSubmit || createMutation.isPending}
          >
            {createMutation.isPending ? "Создание..." : "Создать заявку"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
