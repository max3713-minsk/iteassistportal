import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hidden kill-switch UI. Activation:
 *   1. Click the brand logo 7 times within 3 seconds.
 *   2. Enter the codeword (server-side validated).
 *   3. 60-second cancellable countdown.
 *   4. Re-enter your account password.
 * Nothing about this exists in the navigation, search, or any visible UI.
 */
export function useLogoKillTrigger() {
  const counterRef = useRef<{ count: number; first: number }>({ count: 0, first: 0 });
  const [open, setOpen] = useState(false);

  function onLogoClick() {
    const now = Date.now();
    const c = counterRef.current;
    if (now - c.first > 3000) { c.count = 0; c.first = now; }
    c.count += 1;
    if (c.count >= 7) {
      c.count = 0; c.first = 0;
      setOpen(true);
    }
  }

  return { onLogoClick, open, setOpen };
}

type Stage = "code" | "armed" | "password" | "running";

export default function KillSwitch({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { toast } = useToast();
  const [stage, setStage] = useState<Stage>("code");
  const [codeword, setCodeword] = useState("");
  const [password, setPassword] = useState("");
  const [countdown, setCountdown] = useState(60);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) {
      setStage("code"); setCodeword(""); setPassword(""); setCountdown(60);
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    }
  }, [open]);

  useEffect(() => {
    if (stage !== "armed") return;
    setCountdown(60);
    timerRef.current = window.setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
          setStage("password");
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    };
  }, [stage]);

  function handleCodeword() {
    if (!codeword.trim()) return;
    setStage("armed");
  }

  function cancel() {
    onOpenChange(false);
  }

  async function execute() {
    setStage("running");
    try {
      const { data, error } = await supabase.functions.invoke("system-purge", {
        body: { codeword: codeword.trim(), password, confirm: "PURGE" },
      });
      if (error) throw new Error(error.message);
      if ((data as { error?: string })?.error) throw new Error((data as { error?: string }).error);
      toast({ title: "Выполнено" });
      // Hard reload so all caches are cleared
      setTimeout(() => { window.location.href = "/"; window.location.reload(); }, 800);
    } catch (e) {
      toast({ title: "Ошибка", description: e instanceof Error ? e.message : "—", variant: "destructive" });
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-destructive">Сервисный режим</DialogTitle>
          <DialogDescription>
            Вы вошли в защищённый служебный режим. Будьте предельно внимательны.
          </DialogDescription>
        </DialogHeader>

        {stage === "code" && (
          <div className="space-y-3">
            <Label>Кодовое слово</Label>
            <Input
              type="password"
              autoFocus
              value={codeword}
              onChange={(e) => setCodeword(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleCodeword(); }}
              placeholder="••••••••"
            />
            <DialogFooter>
              <Button variant="outline" onClick={cancel}>Отмена</Button>
              <Button onClick={handleCodeword} disabled={!codeword.trim()}>Далее</Button>
            </DialogFooter>
          </div>
        )}

        {stage === "armed" && (
          <div className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              Запуск через <span className="font-heading text-3xl text-destructive">{countdown}</span> с.
            </p>
            <p className="text-xs text-muted-foreground">
              Нажмите «Отмена», чтобы прервать. По истечении таймера потребуется подтверждение паролем.
            </p>
            <DialogFooter>
              <Button variant="default" onClick={cancel}>Отмена</Button>
            </DialogFooter>
          </div>
        )}

        {stage === "password" && (
          <div className="space-y-3">
            <p className="text-sm text-destructive">
              Финальное подтверждение. Это удалит все бизнес-данные системы. Действие необратимо.
            </p>
            <Label>Пароль вашей учётной записи</Label>
            <Input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && password) execute(); }}
            />
            <DialogFooter>
              <Button variant="outline" onClick={cancel}>Отмена</Button>
              <Button variant="destructive" onClick={execute} disabled={!password}>
                Подтвердить
              </Button>
            </DialogFooter>
          </div>
        )}

        {stage === "running" && (
          <div className="py-6 text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-destructive mx-auto" />
            <p className="text-sm text-muted-foreground">Выполнение...</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}