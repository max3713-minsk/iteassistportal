import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, HeadingLevel, BorderStyle, WidthType, ShadingType,
  Header, Footer, PageNumber,
} from "docx";
import { saveAs } from "file-saver";
import { format } from "date-fns";
import { frequencyLabels } from "@/lib/schedule-utils";

interface ProtocolData {
  siteName: string;
  frequency: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  notes: string | null;
  items: {
    equipmentName: string;
    taskTitle: string;
    status: string;
    notes: string | null;
    completedAt: string | null;
  }[];
}

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
        children: [new TextRun({ text, bold: opts?.bold, size: 20, font: "Arial" })],
      }),
    ],
  });
}

export async function exportProtocolDocx(data: ProtocolData) {
  const freq = frequencyLabels[data.frequency] ?? data.frequency;
  const period = `${format(new Date(data.periodStart), "dd.MM.yyyy")} — ${format(new Date(data.periodEnd), "dd.MM.yyyy")}`;

  // Group items by equipment
  const groups = new Map<string, typeof data.items>();
  for (const item of data.items) {
    if (!groups.has(item.equipmentName)) groups.set(item.equipmentName, []);
    groups.get(item.equipmentName)!.push(item);
  }

  const children: any[] = [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "Протокол технического обслуживания", bold: true, size: 28, font: "Arial" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
      children: [new TextRun({ text: `${data.siteName} • ${freq} • ${period}`, size: 22, font: "Arial", color: "666666" })],
    }),
  ];

  const colWidths = [600, 4000, 1800, 2000, 1600];
  const totalWidth = colWidths.reduce((a, b) => a + b, 0);

  for (const [eqName, eqItems] of groups) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 100 },
        children: [new TextRun({ text: eqName, bold: true, size: 24, font: "Arial" })],
      })
    );

    const headerRow = new TableRow({
      children: [
        makeCell("№", { bold: true, shading: "D9E2F3", width: colWidths[0] }),
        makeCell("Задача", { bold: true, shading: "D9E2F3", width: colWidths[1] }),
        makeCell("Статус", { bold: true, shading: "D9E2F3", width: colWidths[2] }),
        makeCell("Примечания", { bold: true, shading: "D9E2F3", width: colWidths[3] }),
        makeCell("Дата", { bold: true, shading: "D9E2F3", width: colWidths[4] }),
      ],
    });

    const rows = eqItems.map((it, idx) => {
      const statusText = it.status === "completed" ? "Выполнено" : "Не выполнено";
      const dateText = it.completedAt ? format(new Date(it.completedAt), "dd.MM.yyyy HH:mm") : "";
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

    children.push(
      new Table({
        width: { size: totalWidth, type: WidthType.DXA },
        columnWidths: colWidths,
        rows: [headerRow, ...rows],
      })
    );
  }

  // Signature area
  children.push(
    new Paragraph({ spacing: { before: 600 }, children: [] }),
    new Paragraph({
      children: [
        new TextRun({ text: "Исполнитель: ________________________", size: 22, font: "Arial" }),
      ],
    }),
    new Paragraph({ spacing: { before: 300 }, children: [
      new TextRun({ text: "Ответственный: ________________________", size: 22, font: "Arial" }),
    ]}),
  );

  const doc = new Document({
    styles: {
      default: { document: { run: { font: "Arial", size: 22 } } },
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
            children: [new TextRun({ text: "Протокол ТО", size: 16, font: "Arial", color: "999999" })],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "Страница ", size: 16, font: "Arial", color: "999999" }),
              new TextRun({ children: [PageNumber.CURRENT], size: 16, font: "Arial", color: "999999" }),
            ],
          })],
        }),
      },
      children,
    }],
  });

  const buffer = await Packer.toBlob(doc);
  saveAs(buffer, `protocol_${data.siteName}_${data.frequency}_${data.periodStart}.docx`);
}
