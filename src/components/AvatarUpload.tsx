import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AvatarHash } from "@/components/ui/avatar-hash";
import { Upload, Trash2 } from "lucide-react";

interface Props {
  userId: string;
  name?: string | null;
  initialPath?: string | null;
  readonly?: boolean;
}

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

export default function AvatarUpload({ userId, name, initialPath, readonly }: Props) {
  const { toast } = useToast();
  const [path, setPath] = useState<string | null>(initialPath ?? null);
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialPath !== undefined) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("avatar_path" as any)
        .eq("user_id", userId)
        .maybeSingle();
      setPath((data as any)?.avatar_path ?? null);
    })();
  }, [userId, initialPath]);

  useEffect(() => {
    if (!path) { setUrl(null); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase.storage.from("avatars").createSignedUrl(path, 60 * 60);
      if (!cancelled) setUrl(data?.signedUrl ?? null);
    })();
    return () => { cancelled = true; };
  }, [path]);

  async function onPick(file: File) {
    if (file.size > MAX_BYTES) {
      toast({ title: "Файл слишком большой", description: "Максимум 2 МБ.", variant: "destructive" });
      return;
    }
    if (!/^image\/(png|jpe?g|webp)$/i.test(file.type)) {
      toast({ title: "Неподдерживаемый формат", description: "PNG, JPG или WEBP.", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const ext = file.type.includes("png") ? "png" : file.type.includes("webp") ? "webp" : "jpg";
      const newPath = `${userId}/avatar.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(newPath, file, {
        upsert: true,
        contentType: file.type,
      });
      if (upErr) throw upErr;
      const { error: pErr } = await supabase.from("profiles").update({ avatar_path: newPath } as any).eq("user_id", userId);
      if (pErr) throw pErr;
      setPath(newPath);
      // refresh signed URL
      const { data } = await supabase.storage.from("avatars").createSignedUrl(newPath, 60 * 60);
      setUrl(data?.signedUrl ?? null);
      toast({ title: "Аватар обновлён" });
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
      await supabase.storage.from("avatars").remove([path]);
      await supabase.from("profiles").update({ avatar_path: null } as any).eq("user_id", userId);
      setPath(null);
      setUrl(null);
      toast({ title: "Аватар удалён" });
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <AvatarHash name={name ?? "?"} src={url ?? undefined} size="xl" />
      {!readonly && (
        <div className="flex flex-col gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
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
          <p className="text-[11px] text-muted-foreground max-w-[220px]">PNG/JPG/WEBP, до 2 МБ. Квадратное изображение лучше всего.</p>
        </div>
      )}
    </div>
  );
}