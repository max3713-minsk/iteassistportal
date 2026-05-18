import {
  Document, Packer, Paragraph, HeadingLevel, AlignmentType, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle,
} from "docx";
import { saveAs } from "file-saver";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

export interface ReportOptions {
  organizationId: string;
  organizationName: string;
  startDate: string; // ISO date
  endDate: string;
  reportType: "monthly" | "quarterly" | "biannual";
  include: {
    sla: boolean;
    tickets: boolean;
    protocols: boolean;
    infrastructure: boolean;
  };
}

export interface ReportData {
  options: ReportOptions;
  tickets: any[];
  protocols: any[];
  equipment: any[];
  sites: any[];
}

const REPORT_TYPE_LABEL: Record<ReportOptions["reportType"], string> = {
  monthly: "Ежемесячный",
  quarterly: "Квартальный",
  biannual: "Полугодовой",
};

export async function fetchReportData(opts: ReportOptions): Promise<ReportData> {
  const { data: sites = [] } = await supabase.from("sites").select("id, name").eq("organization_id", opts.organizationId);
  const siteIds = (sites ?? []).map((s: any) => s.id);

  const ticketsQ = supabase.from("tickets")
    .select("*, sites:site_id(name), equipment:equipment_id(name)")
    .gte("created_at", opts.startDate).lte("created_at", opts.endDate + "T23:59:59");
  const ticketsRes = siteIds.length > 0
    ? await ticketsQ.in("site_id", siteIds)
    : await ticketsQ.eq("organization_id", opts.organizationId);

  const { data: protocols = [] } = await supabase.from("maintenance_protocols")
    .select("*, sites:site_id(name), protocol_items(status)")
    .gte("period_start", opts.startDate).lte("period_end", opts.endDate)
    .in("site_id", siteIds.length > 0 ? siteIds : ["00000000-0000-0000-0000-000000000000"]);

  const { data: equipment = [] } = await supabase.from("equipment")
    .select("id, name, model, status, sites:site_id(name)")
    .in("site_id", siteIds.length > 0 ? siteIds : ["00000000-0000-0000-0000-000000000000"]);

  return { options: opts, tickets: ticketsRes.data ?? [], protocols: protocols ?? [], equipment: equipment ?? [], sites: sites ?? [] };
}

function calcSLA(tickets: any[]) {
  const compliant = tickets.filter((t) =>
    t.resolved_at && t.sla_deadline && new Date(t.resolved_at) <= new Date(t.sla_deadline)
  );
  const rate = tickets.length > 0 ? Math.round((compliant.length / tickets.length) * 100) : 100;
  return { compliant: compliant.length, total: tickets.length, rate };
}

function p(text: string, opts: any = {}): Paragraph {
  return new Paragraph({ children: [new TextRun({ text, ...opts })], spacing: { after: 120 } });
}
function h(text: string, level: (typeof HeadingLevel)[keyof typeof HeadingLevel]): Paragraph {
  return new Paragraph({ heading: level, children: [new TextRun({ text, bold: true })], spacing: { before: 240, after: 160 } });
}
function cell(text: string, bold = false): TableCell {
  return new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text, bold, size: 20 })] })],
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
  });
}
function table(rows: string[][], headerBold = true): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map((r, i) => new TableRow({ children: r.map((t) => cell(t, headerBold && i === 0)) })),
    borders: {
      top:    { style: BorderStyle.SINGLE, size: 4, color: "888888" },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: "888888" },
      left:   { style: BorderStyle.SINGLE, size: 4, color: "888888" },
      right:  { style: BorderStyle.SINGLE, size: 4, color: "888888" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
      insideVertical:   { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
    },
  });
}

export async function generateClientReport(data: ReportData, opts?: { returnBlob?: boolean }): Promise<Blob | void> {
  const { options: o, tickets, protocols, equipment } = data;
  const sla = calcSLA(tickets);
  const incidents = tickets.filter((t) => t.request_type === "incident");
  const requests = tickets.filter((t) => t.request_type === "service_request" || t.request_type === "development_request");
  const consultations = tickets.filter((t) => t.request_type === "consultation");

  const periodStr = `${format(new Date(o.startDate), "dd.MM.yyyy")} — ${format(new Date(o.endDate), "dd.MM.yyyy")}`;

  const children: any[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER, spacing: { before: 1200, after: 400 },
      children: [new TextRun({ text: "ОТЧЁТ", bold: true, size: 56 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER, spacing: { after: 400 },
      children: [new TextRun({
        text: "о выполнении работ по договору технического обслуживания",
        size: 28,
      })],
    }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 },
      children: [new TextRun({ text: o.organizationName, bold: true, size: 32 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 },
      children: [new TextRun({ text: `${REPORT_TYPE_LABEL[o.reportType]} отчёт`, size: 24 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 },
      children: [new TextRun({ text: `Период: ${periodStr}`, size: 24 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 800 },
      children: [new TextRun({ text: `Сформирован: ${format(new Date(), "dd MMMM yyyy", { locale: ru })}`, size: 22, color: "666666" })] }),

    h("Сводка", HeadingLevel.HEADING_1),
    p(`Всего заявок за период: ${tickets.length}`),
    p(`  • Инцидентов: ${incidents.length}`),
    p(`  • Запросов на обслуживание: ${requests.length}`),
    p(`  • Консультаций: ${consultations.length}`),
    p(`Соблюдение SLA: ${sla.rate}% (${sla.compliant} из ${sla.total} закрыто в срок)`),
    p(`Протоколов ТО: ${protocols.filter((pr) => pr.status === "completed").length} из ${protocols.length} запланированных`),
    p(`Общая оценка состояния: ${sla.rate >= 90 ? "Удовлетворительно" : "Требует внимания"}`, { bold: true }),
  ];

  if (o.include.sla || o.include.tickets) {
    children.push(h("1. Заявки и инциденты", HeadingLevel.HEADING_1));

    const byPriority = ["P1", "P2", "P3", "P4"].map((pr) => {
      const grp = tickets.filter((t) => t.incident_category === pr || t.priority === pr);
      const compliant = grp.filter((t) => t.resolved_at && t.sla_deadline && new Date(t.resolved_at) <= new Date(t.sla_deadline)).length;
      return [pr, String(grp.length), `${compliant}/${grp.length}`, grp.length ? `${Math.round((compliant / grp.length) * 100)}%` : "—"];
    });
    children.push(table([["Приоритет", "Всего", "В срок", "% SLA"], ...byPriority]));

    const closed = tickets.filter((t) => ["resolved", "closed"].includes(t.status)).slice(0, 30);
    if (closed.length > 0) {
      children.push(h("Закрытые заявки за период", HeadingLevel.HEADING_2));
      children.push(table([
        ["Дата", "Заголовок", "Приоритет", "В срок"],
        ...closed.map((t) => [
          format(new Date(t.created_at), "dd.MM.yyyy"),
          (t.title || "").slice(0, 60),
          t.incident_category || t.priority || "—",
          t.resolved_at && t.sla_deadline && new Date(t.resolved_at) <= new Date(t.sla_deadline) ? "Да" : "Нет",
        ]),
      ]));
    }
  }

  if (o.include.protocols) {
    children.push(h("2. Техническое обслуживание", HeadingLevel.HEADING_1));
    if (protocols.length > 0) {
      children.push(table([
        ["Дата", "Тип", "ЦОД", "Статус", "% выполнения"],
        ...protocols.map((pr: any) => {
          const items = pr.protocol_items ?? [];
          const done = items.filter((i: any) => i.status === "done").length;
          const total = items.length;
          return [
            format(new Date(pr.period_start), "dd.MM.yyyy"),
            pr.frequency || "—",
            pr.sites?.name || "—",
            pr.status,
            total > 0 ? `${Math.round((done / total) * 100)}%` : "—",
          ];
        }),
      ]));
    } else {
      children.push(p("Протоколы за период не зарегистрированы.", { italics: true }));
    }
  }

  if (o.include.infrastructure) {
    children.push(h("3. Состояние инфраструктуры", HeadingLevel.HEADING_1));
    if (equipment.length > 0) {
      const incCount = (eqId: string) => tickets.filter((t) => t.equipment_id === eqId && t.request_type === "incident").length;
      children.push(table([
        ["Наименование", "Модель", "ЦОД", "Статус", "Инцидентов"],
        ...equipment.slice(0, 50).map((e: any) => [
          e.name, e.model || "—", e.sites?.name || "—", e.status || "—", String(incCount(e.id)),
        ]),
      ]));
    } else {
      children.push(p("Оборудование не зарегистрировано.", { italics: true }));
    }
  }

  children.push(
    h("Подписи сторон", HeadingLevel.HEADING_1),
    new Paragraph({ spacing: { before: 400, after: 100 }, children: [new TextRun({ text: "От Исполнителя:", bold: true })] }),
    p("____________________ / ________________________ /"),
    new Paragraph({ spacing: { before: 400, after: 100 }, children: [new TextRun({ text: "От Заказчика:", bold: true })] }),
    p("____________________ / ________________________ /"),
  );

  const doc = new Document({
    creator: "ITE Assist Portal",
    title: `Отчёт ${o.organizationName}`,
    sections: [{ properties: {}, children }],
  });

  const blob = await Packer.toBlob(doc);
  const fname = `Отчёт_${o.organizationName.replace(/[^\wа-яА-ЯёЁ]+/gu, "_")}_${o.startDate}_${o.endDate}.docx`;
  if (opts?.returnBlob) return blob;
  saveAs(blob, fname);
}