import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, HeadingLevel, BorderStyle, WidthType, ShadingType,
  Header, Footer, PageNumber, ImageRun,
} from "docx";
import { saveAs } from "file-saver";
import { format } from "date-fns";
import type { ProtocolDocxData } from "@/lib/protocol-docx-data";

const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: "999999" };
const borders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };
const cellMargins = { top: 60, bottom: 60, left: 100, right: 100 };

function makeCell(text: string, opts?: { bold?: boolean; shading?: string; width?: number }) {
  return new TableCell({
    borders,
    width: opts?.width ? { size: opts.width, type: WidthType.DXA } : undefined,
    margins: cellMargins,
    shading: opts?.shading ? { fill: opts.shading, type: ShadingType.CLEAR } : undefined,
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold: opts?.bold, size: 24, font: "Times New Roman" })],
      }),
    ],
  });
}

function pngFromBase64(b64: string): Uint8Array | null {
  try {
    const pure = b64.includes(",") ? b64.split(",")[1] : b64;
    return Uint8Array.from(atob(pure), (c) => c.charCodeAt(0));
  } catch {
    return null;
  }
}

export async function buildProtocolDocxBlob(data: ProtocolDocxData): Promise<Blob> {
  const h = data.header;
  const period = `${format(new Date(h.periodStart), "dd.MM.yyyy")} — ${format(new Date(h.periodEnd), "dd.MM.yyyy")}`;

  const children: any[] = [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: h.title, bold: true, size: 28, font: "Times New Roman" })],
    }),
    new Paragraph({ spacing: { after: 200 }, children: [] }),
  ];

  // Header info table
  const infoCol = [3000, 6360];
  const infoRows: { k: string; v: string }[] = [
    { k: "Заказчик", v: h.customerName },
    { k: "Исполнитель", v: h.executorName },
    { k: "Объект (ЦОД)", v: h.objectName },
    { k: "Регламент (тип работ)", v: h.frequencyLabel },
    { k: "Период работ", v: period },
    { k: "Дата отчёта", v: h.reportDate },
  ];
  if (h.contractNumber) infoRows.push({ k: "Договор", v: h.contractNumber });
  children.push(
    new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: infoCol,
      rows: infoRows.map((r) => new TableRow({
        children: [
          makeCell(r.k, { bold: true, shading: "F2F2F2", width: infoCol[0] }),
          makeCell(r.v, { width: infoCol[1] }),
        ],
      })),
    }),
    new Paragraph({ spacing: { after: 200 }, children: [] }),
  );

  // Equipment groups
  const colWidths = [500, 4200, 1800, 1860, 1000];
  const totalWidth = colWidths.reduce((a, b) => a + b, 0);

  for (const group of data.groups) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 100 },
        children: [new TextRun({ text: group.categoryName, bold: true, size: 26, font: "Times New Roman" })],
      })
    );
    for (const unit of group.units) {
      const meta = [
        unit.model ? `Модель: ${unit.model}` : null,
        unit.serial ? `S/N: ${unit.serial}` : null,
        unit.siteName ? `ЦОД: ${unit.siteName}` : null,
      ].filter(Boolean).join(" • ");
      children.push(
        new Paragraph({
          spacing: { before: 200, after: 60 },
          children: [new TextRun({ text: unit.name, bold: true, size: 24, font: "Times New Roman" })],
        }),
      );
      if (meta) {
        children.push(new Paragraph({
          spacing: { after: 80 },
          children: [new TextRun({ text: meta, size: 22, font: "Times New Roman", color: "666666" })],
        }));
      }
      const headerRow = new TableRow({
        children: [
          makeCell("№", { bold: true, shading: "D9E2F3", width: colWidths[0] }),
          makeCell("Наименование работы", { bold: true, shading: "D9E2F3", width: colWidths[1] }),
          makeCell("Статус", { bold: true, shading: "D9E2F3", width: colWidths[2] }),
          makeCell("Примечания", { bold: true, shading: "D9E2F3", width: colWidths[3] }),
          makeCell("Дата", { bold: true, shading: "D9E2F3", width: colWidths[4] }),
        ],
      });
      const rows = unit.items.map((it, idx) => {
        const statusText = it.status === "completed" ? "Выполнено" : "Не выполнено";
        const dateText = it.completedAt ? format(new Date(it.completedAt), "dd.MM.yyyy") : "";
        return new TableRow({
          children: [
            makeCell(String(idx + 1), { width: colWidths[0] }),
            makeCell(it.taskTitle, { width: colWidths[1] }),
            makeCell(statusText, { width: colWidths[2] }),
            makeCell(it.notes ?? "", { width: colWidths[3] }),
            makeCell(dateText, { width: colWidths[4] }),
          ],
        });
      });
      children.push(new Table({
        width: { size: totalWidth, type: WidthType.DXA },
        columnWidths: colWidths,
        rows: [headerRow, ...rows],
      }));
    }
  }

  // Tickets summary
  if (data.tickets.length > 0) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 100 },
        children: [new TextRun({ text: `Заявки заказчика за ${data.ticketsMonthLabel}`, bold: true, size: 26, font: "Times New Roman" })],
      })
    );
    const tCols = [900, 4200, 1500, 1260, 1500];
    const tHeader = new TableRow({
      children: [
        makeCell("№", { bold: true, shading: "D9E2F3", width: tCols[0] }),
        makeCell("Тема", { bold: true, shading: "D9E2F3", width: tCols[1] }),
        makeCell("Приоритет", { bold: true, shading: "D9E2F3", width: tCols[2] }),
        makeCell("Статус", { bold: true, shading: "D9E2F3", width: tCols[3] }),
        makeCell("Создана", { bold: true, shading: "D9E2F3", width: tCols[4] }),
      ],
    });
    const tRows = data.tickets.map((t) => new TableRow({
      children: [
        makeCell(t.number, { width: tCols[0] }),
        makeCell(t.title, { width: tCols[1] }),
        makeCell(t.priority ?? "—", { width: tCols[2] }),
        makeCell(t.status, { width: tCols[3] }),
        makeCell(format(new Date(t.createdAt), "dd.MM.yyyy"), { width: tCols[4] }),
      ],
    }));
    children.push(new Table({
      width: { size: tCols.reduce((a, b) => a + b, 0), type: WidthType.DXA },
      columnWidths: tCols,
      rows: [tHeader, ...tRows],
    }));
  }

  // Embedded monitoring graphs
  if (data.graphs && data.graphs.length > 0) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 100 },
        children: [new TextRun({ text: "Графики мониторинга", bold: true, size: 26, font: "Times New Roman" })],
      })
    );
    for (const g of data.graphs) {
      try {
        const base64 = g.pngBase64.split(",")[1] || g.pngBase64;
        const bin = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
        const ratio = g.heightPx / Math.max(1, g.widthPx);
        const w = 600;
        const h = Math.round(w * ratio);
        children.push(
          new Paragraph({
            spacing: { before: 200 },
            children: [new TextRun({ text: g.name, bold: true, size: 24, font: "Times New Roman" })],
          }),
          new Paragraph({
            children: [new ImageRun({ data: bin, transformation: { width: w, height: h }, type: "png" } as any)],
          })
        );
      } catch {
        /* skip broken image */
      }
    }
  }

  // Signatures with facsimile (internal document — only executor side)
  children.push(new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 600, after: 100 },
    children: [new TextRun({ text: "Подписи", bold: true, size: 26, font: "Times New Roman" })],
  }));
  for (const [label, sig] of [
    ["Выполнил (инженер)", data.signatures.executor],
    ["Ответственный (проверяющий, исполнитель)", data.signatures.responsible],
  ] as const) {
    children.push(new Paragraph({
      spacing: { before: 300 },
      children: [new TextRun({ text: `${label}: ${sig.name}`, size: 24, font: "Times New Roman", bold: true })],
    }));
    if (sig.pngBase64) {
      const bin = pngFromBase64(sig.pngBase64);
      if (bin) {
        children.push(new Paragraph({
          children: [new ImageRun({ data: bin, transformation: { width: 180, height: 70 }, type: "png" } as any)],
        }));
      }
    } else {
      children.push(new Paragraph({
        children: [new TextRun({ text: "_______________________________", size: 24, font: "Times New Roman" })],
      }));
    }
    if (sig.signedAt) {
      children.push(new Paragraph({
        children: [new TextRun({ text: `Подписано: ${format(new Date(sig.signedAt), "dd.MM.yyyy HH:mm")}`, size: 22, font: "Times New Roman", color: "666666" })],
      }));
    }
  }

  const doc = new Document({
    styles: {
      default: { document: { run: { font: "Times New Roman", size: 24 } } },
    },
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1134, right: 850, bottom: 1134, left: 1701 },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: `${h.title} — ${h.frequencyLabel}`, size: 18, font: "Times New Roman", color: "999999" })],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: "Страница ", size: 18, font: "Times New Roman", color: "999999" }),
                new TextRun({ children: [PageNumber.CURRENT], size: 18, font: "Times New Roman", color: "999999" }),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({
                text: `Сформировано: ${format(new Date(data.exportMeta.exportedAt), "dd.MM.yyyy HH:mm")} • ${data.exportMeta.exportedByName} (${data.exportMeta.exportedByLogin})`,
                size: 18, font: "Times New Roman", color: "999999",
              })],
            }),
          ],
        }),
      },
      children,
    }],
  });

  return await Packer.toBlob(doc);
}

const freqSlug: Record<string, string> = {
  daily: "daily",
  weekly: "weekly",
  monthly: "monthly",
  quarterly: "quarterly",
  semi_annual: "semiannual",
  annual: "annual",
  on_request: "onrequest",
};

export async function exportProtocolDocx(data: ProtocolDocxData) {
  const blob = await buildProtocolDocxBlob(data);
  const safe = (s: string) => s.replace(/[\/\\:*?"<>|]/g, "_").slice(0, 60);
  // Try to infer frequency slug from the human label (russian) by matching back
  const labelToSlug: Record<string, string> = {
    "Ежедневные работы": "daily",
    "Еженедельные работы": "weekly",
    "Ежемесячные работы": "monthly",
    "Квартальные работы": "quarterly",
    "Полугодовые работы": "semiannual",
    "Годовые работы": "annual",
    "Работы по заявке": "onrequest",
  };
  const slug = labelToSlug[data.header.frequencyLabel] ?? "protocol";
  saveAs(
    blob,
    `Протокол_${slug}_${safe(data.header.objectName)}_${data.header.periodStart}.docx`,
  );
}
