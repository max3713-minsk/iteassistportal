import { toPng, toSvg } from "html-to-image";
import jsPDF from "jspdf";

function sanitize(name: string) {
  return (name || "map").replace(/[^a-zA-Z0-9а-яА-Я_\-]+/g, "_").slice(0, 80);
}

function findCanvas(root: HTMLElement): HTMLElement {
  return (root.querySelector(".react-flow") as HTMLElement) || root;
}

const filter = (node: HTMLElement) => {
  const cls = (node.className && typeof node.className === "string") ? node.className : "";
  if (cls.includes("react-flow__minimap")) return false;
  if (cls.includes("react-flow__controls")) return false;
  if (cls.includes("react-flow__attribution")) return false;
  return true;
};

function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export async function exportMapAsPng(root: HTMLElement, name: string) {
  const target = findCanvas(root);
  const dataUrl = await toPng(target, {
    pixelRatio: 2,
    backgroundColor: getComputedStyle(document.body).backgroundColor || "#0a0a0a",
    filter: filter as any,
    cacheBust: true,
  });
  downloadDataUrl(dataUrl, `${sanitize(name)}.png`);
}

export async function exportMapAsSvg(root: HTMLElement, name: string) {
  const target = findCanvas(root);
  const dataUrl = await toSvg(target, {
    backgroundColor: getComputedStyle(document.body).backgroundColor || "#0a0a0a",
    filter: filter as any,
    cacheBust: true,
  });
  downloadDataUrl(dataUrl, `${sanitize(name)}.svg`);
}

export async function exportMapAsPdf(root: HTMLElement, name: string) {
  const target = findCanvas(root);
  const dataUrl = await toPng(target, {
    pixelRatio: 2,
    backgroundColor: "#ffffff",
    filter: filter as any,
    cacheBust: true,
  });
  const img = new Image();
  img.src = dataUrl;
  await new Promise((res) => { img.onload = res; });
  const orientation = img.width >= img.height ? "landscape" : "portrait";
  const pdf = new jsPDF({ orientation, unit: "pt", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const ratio = Math.min(pageW / img.width, pageH / img.height);
  const w = img.width * ratio;
  const h = img.height * ratio;
  pdf.addImage(dataUrl, "PNG", (pageW - w) / 2, (pageH - h) / 2, w, h);
  pdf.save(`${sanitize(name)}.pdf`);
}
