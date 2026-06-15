import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { LogResultView, type LogAnalysis } from "./LogResultView";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  equipmentId: string | null;
  protocolItemId?: string | null;
  protocolId?: string | null;
  equipmentName?: string;
  taskTitle?: string;
}

export default function LogAnalysisDialog({
  open, onOpenChange, equipmentId, protocolItemId, protocolId, equipmentName, taskTitle,
}: Props) {
  const [text, setText] = useState("");
  const [filename, setFilename] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LogAnalysis | null>(null);

  const onFile = async (f: File | null) => {
    if (!f) return;
    setFilename(f.name);
    setText(await f.text());
  };

  const reset = () => { setText(""); setFilename(""); setResult(null); };

  const analyze = async () => {
    if (!text.trim()) {
      toast({ title: "Лог пуст", description: "Загрузите файл или вставьте текст", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-log", {
        body: { text, filename },
      });
      if (error) throw error;
      const analysis: LogAnalysis = (data as any)?.analysis ?? data;
      setResult(analysis);

      if (equipmentId) {
        await supabase.from("equipment_logs").insert({
          equipment_id: equipmentId,
          protocol_item_id: protocolItemId ?? null,
          protocol_id: protocolId ?? null,
          filename: filename || "log.txt",
          source: "manual",
          analysis,
          size_bytes: new Blob([text]).size,
        } as any);
      }
      toast({ title: "Готово", description: "Лог проанализирован" });
    } catch (e: any) {
      toast({ title: "Ошибка анализа", description: e?.message ?? String(e), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Анализ лога{equipmentName ? ` · ${equipmentName}` : ""}</DialogTitle>
          {taskTitle && <p className="text-xs text-muted-foreground">Пункт регламента: {taskTitle}</p>}
        </DialogHeader>

        {!result ? (
          <div className="space-y-3">
            <div>
              <Label htmlFor="logfile" className="text-xs">Файл лога</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input id="logfile" type="file" accept=".log,.txt,.out,text/plain"
                  onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
                <Upload className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div>
              <Label htmlFor="logtext" className="text-xs">Или вставьте текст</Label>
              <Textarea id="logtext" rows={10} value={text} onChange={(e) => setText(e.target.value)}
                placeholder="Вставьте содержимое лога…" className="font-mono text-xs mt-1" />
            </div>
          </div>
        ) : (
          <LogResultView analysis={result} />
        )}

        <DialogFooter>
          {result ? (
            <>
              <Button variant="outline" onClick={reset}>Ещё лог</Button>
              <Button onClick={() => onOpenChange(false)}>Закрыть</Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button>
              <Button onClick={analyze} disabled={loading || !text.trim()}>
                {loading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1.5" />}
                Анализировать
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}