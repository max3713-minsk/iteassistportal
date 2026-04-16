import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

interface ResetPasswordDialogProps {
  open: boolean;
  userName: string;
  newPassword: string | null;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ResetPasswordDialog({ open, userName, newPassword, loading, onConfirm, onClose }: ResetPasswordDialogProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (newPassword) {
      navigator.clipboard.writeText(newPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Сброс пароля</DialogTitle>
          <DialogDescription>
            {newPassword
              ? `Новый пароль для "${userName}" сгенерирован. Скопируйте его — он показывается однократно.`
              : `Сгенерировать новый пароль для "${userName}"?`}
          </DialogDescription>
        </DialogHeader>
        {newPassword && (
          <div className="flex gap-2 items-center">
            <Input value={newPassword} readOnly className="font-mono text-sm" />
            <Button variant="outline" size="icon" onClick={handleCopy} title="Скопировать">
              {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        )}
        <DialogFooter>
          {newPassword ? (
            <Button onClick={onClose}>Закрыть</Button>
          ) : (
            <>
              <Button variant="outline" onClick={onClose}>Отмена</Button>
              <Button onClick={onConfirm} disabled={loading}>
                {loading ? "Генерация..." : "Сбросить пароль"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
