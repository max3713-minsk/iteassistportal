import { useState } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Loader2, FolderArchive, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import { sendToSeafile, type SeafileKind } from "@/lib/seafile";

interface Props extends Omit<ButtonProps, "onClick" | "children"> {
  kind: SeafileKind;
  getPayload: () => Promise<{ blob: Blob; filename: string; meta?: Record<string, any> }> | { blob: Blob; filename: string; meta?: Record<string, any> };
  label?: string;
}

export function SeafileSendButton({ kind, getPayload, label = "В Seafile", ...rest }: Props) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  const handle = async () => {
    setBusy(true);
    const tid = sonnerToast.loading("Подготовка файла…", { description: "Формируем документ для отправки" });
    try {
      const payload = await getPayload();
      sonnerToast.loading("Отправка в Seafile…", { id: tid, description: payload.filename });
      const res = await sendToSeafile({ kind, ...payload });
      sonnerToast.success("Файл отправлен в Seafile", { id: tid, description: `${res.folder}/${res.filename}` });
      toast({
        title: "Файл отправлен в Seafile",
        description: (
          <span className="flex items-center gap-1">
            {res.folder}/{res.filename}
            {res.viewUrl && (
              <a href={res.viewUrl} target="_blank" rel="noreferrer" className="inline-flex items-center text-primary hover:underline ml-1">
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </span>
        ),
      });
    } catch (e: any) {
      sonnerToast.error("Ошибка отправки в Seafile", { id: tid, description: e.message });
      toast({ title: "Ошибка отправки в Seafile", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button {...rest} onClick={handle} disabled={busy || rest.disabled}>
      {busy ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <FolderArchive className="h-3.5 w-3.5 mr-1" />}
      {label}
    </Button>
  );
}