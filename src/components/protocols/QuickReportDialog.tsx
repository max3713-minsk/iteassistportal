import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Zap,
  Circle,
  Loader2,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Play,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { useQuickReport, type ReportStep } from "@/hooks/useQuickReport";
import { useQuickReportPreview } from "@/hooks/useQuickReportPreview";

const STORAGE_KEY = "quick_report_defaults";

interface QuickReportDefaults {
  saveLocal: boolean;
  sendSeafile: boolean;
  executorUserId: string;
  responsibleUserId: string;
  note: string;
  siteIds: string[];
}

const DEFAULT_SETTINGS: QuickReportDefaults = {
  saveLocal: true,
  sendSeafile: false,
  executorUserId: "",
  responsibleUserId: "",
  note: "",
  siteIds: [],
};

function loadDefaults(): QuickReportDefaults {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULT_SETTINGS };
}

function StepIcon({ status }: { status: ReportStep["status"] }) {
  switch (status) {
    case "pending":
      return <Circle className="h-4 w-4 text-muted-foreground" />;
    case "running":
      return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
    case "done":
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    case "error":
      return <XCircle className="h-4 w-4 text-destructive" />;
    case "skipped":
      return <MinusCircle className="h-4 w-4 text-muted-foreground" />;
  }
}

export default function QuickReportDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<QuickReportDefaults>(DEFAULT_SETTINGS);
  const { run, running, steps, done, hasErrors, reset, startedAt, finishedAt } =
    useQuickReport();

  useEffect(() => {
    if (open) {
      setSettings(loadDefaults());
      reset();
    }
  }, [open, reset]);

  // Seafile enabled?
  const { data: seafileSetting } = useQuery({
    queryKey: ["integration-settings", "seafile"],
    queryFn: async () => {
      const { data } = await supabase
        .from("integration_settings")
        .select("enabled")
        .eq("key", "seafile")
        .maybeSingle();
      return data;
    },
  });
  const seafileEnabled = !!seafileSetting?.enabled;

  // Engineers/profiles
  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles-quick-report"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .order("full_name");
      return data ?? [];
    },
  });

  const { previewItems, scheduledCount, today } = useQuickReportPreview(
    settings.siteIds
  );

  const totalCount = steps.length;
  const doneCount = steps.filter(
    (s) => s.status === "done" || s.status === "skipped"
  ).length;

  const elapsed = useMemo(() => {
    if (!startedAt) return "";
    const end = finishedAt ?? Date.now();
    const sec = Math.round((end - startedAt) / 1000);
    const mm = String(Math.floor(sec / 60)).padStart(2, "0");
    const ss = String(sec % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  }, [startedAt, finishedAt]);

  const handleRun = async () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {}
    await run({
      siteIds: settings.siteIds,
      saveLocal: settings.saveLocal,
      sendSeafile: settings.sendSeafile,
      seafileEnabled,
      executorUserId: settings.executorUserId || undefined,
      responsibleUserId: settings.responsibleUserId || undefined,
      note: settings.note,
    });
  };

  const inProgress = running || steps.length > 0;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!running) onOpenChange(v); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            {!inProgress
              ? `Быстрый отчёт · ${format(today, "d MMMM yyyy (EEEE)", { locale: ru })}`
              : done
                ? hasErrors
                  ? `Завершено с ошибками — ${steps.filter((s) => s.status === "error").length} из ${totalCount}`
                  : `Готово — ${doneCount} протоколов за ${elapsed}`
                : "Выполняется..."}
          </DialogTitle>
          {!inProgress && (
            <DialogDescription>
              Создание регламентных протоколов одной кнопкой со статусом «всё OK».
            </DialogDescription>
          )}
        </DialogHeader>

        {!inProgress ? (
          <div className="space-y-4">
            {/* Preview */}
            <div className="border rounded-md p-3 bg-muted/30">
              <div className="text-sm font-medium mb-2">Будет создано:</div>
              {previewItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Нет запланированных работ на сегодня
                </p>
              ) : (
                <ScrollArea className="max-h-48">
                  <div className="space-y-1">
                    {previewItems.map((item) => (
                      <div
                        key={`${item.siteId}_${item.freq}`}
                        className="flex items-center gap-2 text-sm"
                      >
                        {item.exists ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Circle className="h-3.5 w-3.5 text-primary" />
                        )}
                        <span className="flex-1">
                          {item.freqLabel} · {item.siteName}
                        </span>
                        {item.exists && (
                          <span className="text-xs text-muted-foreground">
                            уже существует
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
              {scheduledCount > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Все пункты будут отмечены как «Выполнено».
                </p>
              )}
            </div>

            {/* Executor / Responsible */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Исполнитель</Label>
                <Select
                  value={settings.executorUserId || "_none"}
                  onValueChange={(v) =>
                    setSettings({ ...settings, executorUserId: v === "_none" ? "" : v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">— не указан —</SelectItem>
                    {profiles.map((p) => (
                      <SelectItem key={p.user_id} value={p.user_id}>
                        {p.full_name || p.user_id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Ответственный</Label>
                <Select
                  value={settings.responsibleUserId || "_none"}
                  onValueChange={(v) =>
                    setSettings({ ...settings, responsibleUserId: v === "_none" ? "" : v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">— не указан —</SelectItem>
                    {profiles.map((p) => (
                      <SelectItem key={p.user_id} value={p.user_id}>
                        {p.full_name || p.user_id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <Label className="text-xs">Действия после создания</Label>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={settings.saveLocal}
                    onCheckedChange={(v) =>
                      setSettings({ ...settings, saveLocal: !!v })
                    }
                  />
                  Скачать DOCX локально
                </label>
                <label
                  className={cn(
                    "flex items-center gap-2 text-sm cursor-pointer",
                    !seafileEnabled && "text-muted-foreground"
                  )}
                >
                  <Checkbox
                    checked={settings.sendSeafile && seafileEnabled}
                    disabled={!seafileEnabled}
                    onCheckedChange={(v) =>
                      setSettings({ ...settings, sendSeafile: !!v })
                    }
                  />
                  Отправить в Seafile
                  {!seafileEnabled && (
                    <span className="text-xs">(не настроен)</span>
                  )}
                </label>
              </div>
            </div>

            {/* Note */}
            <div>
              <Label className="text-xs">Примечание (необязательно)</Label>
              <Input
                value={settings.note}
                onChange={(e) => setSettings({ ...settings, note: e.target.value })}
                placeholder="Инфраструктура работает штатно"
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Отмена
              </Button>
              <Button onClick={handleRun} disabled={scheduledCount === 0 && previewItems.every((i) => i.exists)}>
                <Play className="h-4 w-4 mr-2" />
                Пуск
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-3">
            <ScrollArea className="max-h-[360px]">
              <div className="space-y-0.5">
                {steps.map((step) => (
                  <div
                    key={step.id}
                    className="flex items-center gap-3 py-1.5 px-3 rounded-md hover:bg-muted/30"
                  >
                    <StepIcon status={step.status} />
                    <span
                      className={cn(
                        "flex-1 text-sm",
                        step.status === "error" && "text-destructive"
                      )}
                    >
                      {step.label}
                    </span>
                    {step.detail && (
                      <span className="text-xs text-muted-foreground max-w-[220px] truncate">
                        {step.detail}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>

            {totalCount > 0 && (
              <div className="flex items-center gap-2">
                <Progress
                  value={totalCount > 0 ? (doneCount / totalCount) * 100 : 0}
                  className="flex-1 h-1.5"
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {doneCount} / {totalCount}
                </span>
              </div>
            )}

            <DialogFooter className="gap-2">
              {done && hasErrors && (
                <Button
                  variant="outline"
                  onClick={handleRun}
                  disabled={running}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Повторить
                </Button>
              )}
              {done && (
                <Button
                  variant="outline"
                  onClick={() => {
                    onOpenChange(false);
                    navigate("/protocols");
                  }}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Открыть протоколы
                </Button>
              )}
              <Button
                onClick={() => onOpenChange(false)}
                disabled={running}
              >
                Закрыть
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}