import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, Trash2, ImageOff } from "lucide-react";

interface Props {
  userId: string;
  /** When provided, used to skip an extra profile fetch. */
  initialPath?: string | null;
  /** Hint: каноничный путь {userId}/signature.png — пользователь видит свой ЛИБО админ. */
  readonly?: boolean;
}

const MAX_BYTES = 500 * 1024; // 500KB

export default function SignatureUpload({ userId, initialPath, readonly }: Props) {
  const { toast } = useToast();
  const [path, setPath] = useState<string | null>(initialPath ?? null);
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Resolve current path if not provided
  useEffect(() => {
    if (initialPath !== undefined) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("signature_path")
        .eq("user_id", userId)
        .maybeSingle();
      setPath((data as any)?.signature_path ?? null);
    })();
  }, [userId, initialPath]);

  // Resolve signed URL for current path (bucket is private)
  useEffect(() => {
    if (!path) { setUrl(null); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase.storage.from("signatures").createSignedUrl(path, 60 * 60);
      if (!cancelled) setUrl(data?.signedUrl ?? null);
    })();
    return () => { cancelled = true; };
  }, [path]);

  async function onPick(file: File) {
    if (file.size > MAX_BYTES) {
      toast({ title: "Файл слишком большой", description: "Максимум 500 КБ.", variant: "destructive" });
      return;
    }
    if (!/^image\/(png|jpe?g)$/i.test(file.type)) {
      toast({ title: "Неподдерживаемый формат", description: "PNG или JPG.", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const ext = file.type.includes("png") ? "png" : "jpg";
      const newPath = `${userId}/signature.${ext}`;
      const { error: upErr } = await supabase.storage.from("signatures").upload(newPath, file, {
        upsert: true,
        contentType: file.type,
      });
      if (upErr) throw upErr;
      // Update profile
      const { error: pErr } = await supabase.from("profiles").update({ signature_path: newPath }).eq("user_id", userId);
      if (pErr) throw pErr;
      setPath(newPath);
      toast({ title: "Подпись загружена" });
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  async function onRemove() {
    if (!path) return;
    setBusy(true);
    try {
      await supabase.storage.from("signatures").remove([path]);
      await supabase.from("profiles").update({ signature_path: null }).eq("user_id", userId);
      setPath(null);
      toast({ title: "Подпись удалена" });
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="h-20 w-44 rounded-md border bg-muted/30 flex items-center justify-center overflow-hidden">
          {url ? (
            <img src={url} alt="Факсимиле" className="max-h-full max-w-full object-contain" />
          ) : (
            <div className="flex flex-col items-center text-muted-foreground text-xs">
              <ImageOff className="h-5 w-5 mb-1" />
              нет подписи
            </div>
          )}
        </div>
        {!readonly && (
          <div className="flex flex-col gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) onPick(f); e.target.value = ""; }}
            />
            <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={busy}>
              <Upload className="h-3.5 w-3.5 mr-1.5" /> {path ? "Заменить" : "Загрузить"}
            </Button>
            {path && (
              <Button size="sm" variant="ghost" className="text-destructive" onClick={onRemove} disabled={busy}>
                <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Удалить
              </Button>
            )}
          </div>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground">
        PNG/JPG, до 500 КБ. Прозрачный фон желателен. Используется в подписи протоколов как факсимиле.
      </p>
    </div>
  );
}