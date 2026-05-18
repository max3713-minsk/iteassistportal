import { useState } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Loader2, FolderArchive, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
    try {
      const payload = await getPayload();
      const res = await sendToSeafile({ kind, ...payload });
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