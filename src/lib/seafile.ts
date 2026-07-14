import { supabase } from "@/integrations/supabase/client";

export type SeafileKind = "protocol" | "graph" | "report" | "document" | "map" | "audit" | "ticket";

export interface SendToSeafileOptions {
  kind: SeafileKind;
  blob: Blob;
  filename: string;
  meta?: Record<string, string | number | null | undefined>;
}

export interface SeafileResult {
  ok: boolean;
  folder: string;
  filename: string;
  viewUrl?: string;
  dry_run?: boolean;
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export async function sendToSeafile(opts: SendToSeafileOptions): Promise<SeafileResult> {
  const blob_base64 = await blobToBase64(opts.blob);
  const { data, error } = await supabase.functions.invoke("seafile-upload-typed", {
    body: {
      kind: opts.kind,
      blob_base64,
      filename: opts.filename,
      mime: opts.blob.type || "application/octet-stream",
      meta: opts.meta || {},
    },
  });
  if (error) throw new Error(error.message || "Seafile upload failed");
  if (!data?.ok) throw new Error(data?.error || "Seafile upload failed");
  return data as SeafileResult;
}

export async function previewSeafilePath(kind: SeafileKind, meta: Record<string, any>, filename = "preview.bin"): Promise<SeafileResult> {
  const { data, error } = await supabase.functions.invoke("seafile-upload-typed", {
    body: { kind, filename, mime: "application/octet-stream", meta, dry_run: true, blob_base64: "" },
  });
  if (error) throw new Error(error.message);
  return data as SeafileResult;
}

/** Upload a tiny test text file using the configured folder template for the given kind. */
export async function sendSeafileTestFile(kind: SeafileKind): Promise<SeafileResult> {
  const stamp = new Date().toISOString();
  const text = `Assist Portal — тестовая выгрузка\nТип: ${kind}\nВремя: ${stamp}\n`;
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  return sendToSeafile({
    kind,
    blob,
    filename: `test_${kind}.txt`,
    meta: {
      org: "Тест_интеграции",
      category: "test",
      frequency: "monthly",
      frequency_ru: "Тест",
      period: stamp.slice(0, 10),
      name: "test",
    },
  });
}