import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { buildProtocolDocxBlob } from "@/lib/export-protocol-docx";
import { fetchProtocolDocxData } from "@/lib/protocol-docx-data";
import { sendToSeafile } from "@/lib/seafile";
import { saveAs } from "file-saver";
import { format } from "date-fns";
import { isTaskScheduledOnDate, buildHolidayMap, type HolidayEntry } from "@/lib/schedule-utils";
import { SCHEDULED_FREQUENCIES, FREQ_LABELS, getPeriod, type Frequency } from "./useQuickReportPreview";

export type StepStatus = "pending" | "running" | "done" | "error" | "skipped";

export interface ReportStep {
  id: string;
  label: string;
  status: StepStatus;
  detail?: string;
  protocolId?: string;
}

export interface QuickReportOptions {
  siteIds: string[];
  saveLocal: boolean;
  sendSeafile: boolean;
  seafileEnabled: boolean;
  executorUserId?: string;
  responsibleUserId?: string;
  note?: string;
}

export function useQuickReport() {
  const { session } = useAuth();
  const qc = useQueryClient();
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<ReportStep[]>([]);
  const [done, setDone] = useState(false);
  const [hasErrors, setHasErrors] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);

  const patchStep = useCallback((id: string, patch: Partial<ReportStep>) => {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }, []);

  const run = useCallback(
    async (opts: QuickReportOptions) => {
      setRunning(true);
      setDone(false);
      setHasErrors(false);
      setSteps([]);
      setStartedAt(Date.now());
      setFinishedAt(null);

      const uid = session?.user.id;
      const today = new Date();
      const todayStr = format(today, "yyyy-MM-dd");

      const [{ data: holidaysData }, { data: allSites }, { data: profiles }] = await Promise.all([
        supabase.from("holidays").select("date, name, day_type").eq("country_code", "BY"),
        supabase.from("sites").select("id, name, organization_id"),
        supabase.from("profiles").select("user_id, full_name"),
      ]);

      const holidayMap = buildHolidayMap((holidaysData ?? []) as HolidayEntry[]);
      const sites = (allSites ?? []).filter(
        (s) => opts.siteIds.length === 0 || opts.siteIds.includes(s.id)
      );

      const scheduledFreqs = SCHEDULED_FREQUENCIES.filter((f) =>
        isTaskScheduledOnDate(f, today, undefined, holidayMap)
      );

      if (scheduledFreqs.length === 0 || sites.length === 0) {
        setSteps([
          { id: "nothing", label: "Нет запланированных работ на сегодня", status: "skipped" },
        ]);
        setDone(true);
        setRunning(false);
        setFinishedAt(Date.now());
        return;
      }

      const { data: existingProtos } = await supabase
        .from("maintenance_protocols")
        .select("id, site_id, frequency, period_start, period_end, status")
        .eq("report_date", todayStr);

      type PlanItem = {
        siteId: string;
        siteName: string;
        freq: Frequency;
        period: { start: string; end: string };
        existingId?: string;
      };
      const plannedSteps: ReportStep[] = [];
      const plan: PlanItem[] = [];

      for (const site of sites) {
        for (const freq of scheduledFreqs) {
          const period = getPeriod(freq, today);
          const existing = (existingProtos ?? []).find(
            (p) =>
              p.site_id === site.id &&
              p.frequency === freq &&
              p.period_start === period.start &&
              p.period_end === period.end
          );
          const stepId = `${site.id}_${freq}`;
          const freqLabel = FREQ_LABELS[freq];
          plannedSteps.push({
            id: stepId,
            label: `${freqLabel} · ${site.name}`,
            status: "pending",
            detail: existing ? "протокол уже существует" : undefined,
            protocolId: existing?.id,
          });
          plan.push({
            siteId: site.id,
            siteName: site.name,
            freq,
            period,
            existingId: existing?.id,
          });
        }
      }
      setSteps(plannedSteps);

      const executorName =
        profiles?.find((p) => p.user_id === opts.executorUserId)?.full_name ?? "";
      const responsibleName =
        profiles?.find((p) => p.user_id === opts.responsibleUserId)?.full_name ?? "";

      let errorCount = 0;

      for (const item of plan) {
        const stepId = `${item.siteId}_${item.freq}`;
        patchStep(stepId, { status: "running" });

        try {
          let protocolId = item.existingId;

          if (!protocolId) {
            const { data: proto, error: pErr } = await supabase
              .from("maintenance_protocols")
              .insert({
                site_id: item.siteId,
                frequency: item.freq,
                period_start: item.period.start,
                period_end: item.period.end,
                report_date: todayStr,
                status: "completed",
                notes: opts.note || null,
                created_by: uid,
                completed_at: new Date().toISOString(),
                completed_by: uid,
                executor_user_id: opts.executorUserId || null,
                executor_name: executorName || null,
                responsible_user_id: opts.responsibleUserId || null,
                responsible_name: responsibleName || null,
              } as any)
              .select("id")
              .single();

            if (pErr || !proto) throw new Error(pErr?.message ?? "Ошибка создания протокола");
            protocolId = proto.id;

            const [{ data: equipment }, { data: tasks }] = await Promise.all([
              supabase
                .from("equipment")
                .select("id, name, model, serial_number, category_id, equipment_categories(name)")
                .eq("site_id", item.siteId),
              supabase
                .from("maintenance_tasks")
                .select("id, category_id, equipment_id, equipment_ids")
                .eq("frequency", item.freq)
                .eq("is_active", true)
                .eq("include_in_protocol", true),
            ]);

            const items: any[] = [];
            for (const eq of equipment ?? []) {
              for (const task of tasks ?? []) {
                const ids = (task as any).equipment_ids as string[] | null;
                let match = true;
                if (ids && ids.length > 0) match = ids.includes((eq as any).id);
                else if ((task as any).equipment_id) match = (task as any).equipment_id === (eq as any).id;
                else if (task.category_id) match = task.category_id === (eq as any).category_id;
                if (match) {
                  items.push({
                    protocol_id: protocolId,
                    equipment_id: eq.id,
                    task_id: task.id,
                    status: "completed",
                    completed_by: uid,
                    completed_at: new Date().toISOString(),
                    equipment_snapshot: {
                      name: (eq as any).name,
                      model: (eq as any).model,
                      serial_number: (eq as any).serial_number,
                      category: (eq as any).equipment_categories?.name ?? null,
                    },
                  });
                }
              }
            }
            if (items.length > 0) {
              await supabase.from("protocol_items").insert(items);
            }
          } else {
            const existing = existingProtos?.find((p) => p.id === protocolId);
            if (existing?.status !== "completed") {
              await supabase
                .from("maintenance_protocols")
                .update({
                  status: "completed",
                  completed_at: new Date().toISOString(),
                  completed_by: uid,
                } as any)
                .eq("id", protocolId);
              await supabase
                .from("protocol_items")
                .update({
                  status: "completed",
                  completed_at: new Date().toISOString(),
                  completed_by: uid,
                } as any)
                .eq("protocol_id", protocolId)
                .eq("status", "pending");
            }
          }

          patchStep(stepId, { detail: "генерация DOCX...", protocolId });
          const docxData = await fetchProtocolDocxData(protocolId);
          const blob = await buildProtocolDocxBlob(docxData);
          const filename = `Протокол_${FREQ_LABELS[item.freq]}_${item.siteName}_${todayStr}.docx`.replace(
            /[/\\:*?"<>|]/g,
            "_"
          );

          if (opts.saveLocal) {
            saveAs(blob, filename);
            patchStep(stepId, { detail: "скачан локально" });
          }

          if (opts.sendSeafile) {
            if (!opts.seafileEnabled) {
              patchStep(stepId, {
                status: "skipped",
                detail: "Seafile не настроен — пропущен",
              });
              continue;
            }
            patchStep(stepId, { detail: "отправка в Seafile..." });
            await sendToSeafile({
              kind: "protocol",
              blob,
              filename,
              meta: {
                protocol_id: protocolId,
                site: item.siteName,
                frequency: item.freq,
                period_start: item.period.start,
                period_end: item.period.end,
              },
            });
            patchStep(stepId, {
              status: "done",
              detail: opts.saveLocal ? "локально + Seafile ✓" : "Seafile ✓",
            });
          } else {
            patchStep(stepId, {
              status: "done",
              detail: opts.saveLocal ? "сохранён локально" : "создан",
            });
          }
        } catch (err: any) {
          patchStep(stepId, { status: "error", detail: err?.message ?? "ошибка" });
          errorCount++;
        }
      }

      qc.invalidateQueries({ queryKey: ["protocols"] });
      qc.invalidateQueries({ queryKey: ["protocols-today"] });
      setHasErrors(errorCount > 0);
      setDone(true);
      setRunning(false);
      setFinishedAt(Date.now());
    },
    [session, patchStep, qc]
  );

  const reset = useCallback(() => {
    setSteps([]);
    setDone(false);
    setHasErrors(false);
    setStartedAt(null);
    setFinishedAt(null);
  }, []);

  return { run, running, steps, done, hasErrors, reset, startedAt, finishedAt };
}