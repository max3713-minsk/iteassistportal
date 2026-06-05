import { supabase } from "@/integrations/supabase/client";

export interface ProtocolUploadRecord {
  protocol_id: string;
  storage?: string;
  url?: string | null;
  filename?: string | null;
  folder?: string | null;
  meta?: Record<string, any> | null;
}

/** Записать факт отправки протокола в облако. Не бросает — только логирует. */
export async function recordProtocolUpload(rec: ProtocolUploadRecord) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("protocol_uploads").insert({
      protocol_id: rec.protocol_id,
      uploaded_by: user.id,
      storage: rec.storage ?? "seafile",
      url: rec.url ?? null,
      filename: rec.filename ?? null,
      folder: rec.folder ?? null,
      meta: rec.meta ?? null,
    } as any);
  } catch (e) {
    console.warn("recordProtocolUpload failed", e);
  }
}

/** Вернуть protocol_id, для которых уже есть запись об отправке в облако. */
export async function findUploadedProtocolIds(ids: string[]): Promise<Set<string>> {
  if (ids.length === 0) return new Set();
  const { data } = await supabase
    .from("protocol_uploads")
    .select("protocol_id")
    .in("protocol_id", ids);
  return new Set((data ?? []).map((r: any) => r.protocol_id));
}

export async function isProtocolUploaded(id: string): Promise<boolean> {
  const { data } = await supabase
    .from("protocol_uploads")
    .select("id")
    .eq("protocol_id", id)
    .limit(1)
    .maybeSingle();
  return !!data;
}