import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface Props {
  protocolId: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export default function ProtocolSignersDialog({ protocolId, open, onOpenChange }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [executorId, setExecutorId] = useState<string>("");
  const [responsibleId, setResponsibleId] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles-signers"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name, position")
        .eq("is_active", true)
        .order("full_name");
      return data ?? [];
    },
  });

  const { data: protocol } = useQuery({
    queryKey: ["protocol-signers", protocolId],
    enabled: !!protocolId && open,
    queryFn: async () => {
      const { data } = await supabase
        .from("maintenance_protocols")
        .select("executor_user_id, responsible_user_id, executor_signature_user_id, responsible_signature_user_id")
        .eq("id", protocolId!)
        .single();
      return data;
    },
  });

  useEffect(() => {
    if (protocol) {
      setExecutorId((protocol as any).executor_signature_user_id || (protocol as any).executor_user_id || "");
      setResponsibleId((protocol as any).responsible_signature_user_id || (protocol as any).responsible_user_id || "");
    }
  }, [protocol]);

  const save = async () => {
    if (!protocolId) return;
    if (!executorId || !responsibleId) {
      toast({ title: "Выберите подписантов", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const exec = profiles.find((p: any) => p.user_id === executorId);
      const resp = profiles.find((p: any) => p.user_id === responsibleId);
      const { error } = await supabase
        .from("maintenance_protocols")
        .update({
          executor_user_id: executorId,
          executor_signature_user_id: executorId,
          executor_name: exec?.full_name ?? null,
          responsible_user_id: responsibleId,
          responsible_signature_user_id: responsibleId,
          responsible_name: resp?.full_name ?? null,
        } as any)
        .eq("id", protocolId);
      if (error) throw error;
      toast({ title: "Подписанты сохранены" });
      qc.invalidateQueries({ queryKey: ["protocols"] });
      qc.invalidateQueries({ queryKey: ["protocol", protocolId] });
      qc.invalidateQueries({ queryKey: ["protocol-signers", protocolId] });
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Ошибка сохранения", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Подписанты протокола</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Выполнил</Label>
            <Select value={executorId} onValueChange={setExecutorId}>
              <SelectTrigger><SelectValue placeholder="Выберите сотрудника" /></SelectTrigger>
              <SelectContent>
                {profiles.map((p: any) => (
                  <SelectItem key={p.user_id} value={p.user_id}>
                    {p.full_name}{p.position ? ` — ${p.position}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Ответственный</Label>
            <Select value={responsibleId} onValueChange={setResponsibleId}>
              <SelectTrigger><SelectValue placeholder="Выберите сотрудника" /></SelectTrigger>
              <SelectContent>
                {profiles.map((p: any) => (
                  <SelectItem key={p.user_id} value={p.user_id}>
                    {p.full_name}{p.position ? ` — ${p.position}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">
            Подпись (факсимиле) и должность подтянутся автоматически из профиля выбранного пользователя.
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Отмена</Button>
          <Button onClick={save} disabled={saving}>Сохранить</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}