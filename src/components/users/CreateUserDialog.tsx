import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, RefreshCw } from "lucide-react";
import { logAudit } from "@/lib/audit";

type AppRole = "admin" | "engineer" | "customer";

const roleLabels: Record<AppRole, string> = {
  admin: "Администратор",
  engineer: "Инженер",
  customer: "Заказчик",
};

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizations?: string[];
}

function generatePassword(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => chars[b % chars.length]).join("");
}

export function CreateUserDialog({ open, onOpenChange, organizations = [] }: CreateUserDialogProps) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [fullName, setFullName] = useState("");
  const [organization, setOrganization] = useState("");
  const [customOrg, setCustomOrg] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<AppRole[]>([]);

  const createUser = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Не авторизован");

      // Create user for each selected role (first role used, rest added after)
      const res = await supabase.functions.invoke("create-user", {
        body: {
          email,
          password,
          full_name: fullName || undefined,
          organization: (organization === "__custom" ? customOrg : organization) || undefined,
          phone: phone || undefined,
          role: selectedRoles[0] || undefined,
        },
      });

      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);

      // Add additional roles
      if (selectedRoles.length > 1 && res.data?.user_id) {
        for (let i = 1; i < selectedRoles.length; i++) {
          await supabase.from("user_roles").insert({ user_id: res.data.user_id, role: selectedRoles[i] });
        }
      }

      await logAudit({
        action: "Создание пользователя",
        module: "users",
        entityId: res.data?.user_id,
        details: `Email: ${email}, Роли: ${selectedRoles.join(", ")}`,
      });

      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "Пользователь создан" });
      resetForm();
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setFullName("");
    setOrganization("");
    setCustomOrg("");
    setPhone("");
    setSelectedRoles([]);
    setShowPw(false);
  };

  const toggleRole = (role: AppRole) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const isValid = email && password.length >= 6 && selectedRoles.length > 0;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Создание пользователя</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Email *</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" />
          </div>
          <div className="space-y-2">
            <Label>Пароль * <span className="text-xs text-muted-foreground">(мин. 6 символов)</span></Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Минимум 6 символов"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPw(!showPw)}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Button variant="outline" size="icon" onClick={() => setPassword(generatePassword())} title="Сгенерировать пароль">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>ФИО</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Организация</Label>
            <Select value={organization || "__empty"} onValueChange={(v) => { setOrganization(v === "__empty" ? "" : v); if (v !== "__custom") setCustomOrg(""); }}>
              <SelectTrigger><SelectValue placeholder="Выберите организацию" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__empty">Не выбрана</SelectItem>
                {organizations.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                <SelectItem value="__custom">Добавить новую...</SelectItem>
              </SelectContent>
            </Select>
            {organization === "__custom" && (
              <Input value={customOrg} onChange={(e) => setCustomOrg(e.target.value)} placeholder="Название новой организации" className="mt-2" />
            )}
          </div>
          <div className="space-y-2">
            <Label>Телефон</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+375 (__) ___-__-__" />
          </div>
          <div className="space-y-2">
            <Label>Роли *</Label>
            <div className="space-y-2">
              {(["admin", "engineer", "customer"] as AppRole[]).map((role) => (
                <div key={role} className="flex items-center gap-2">
                  <Checkbox
                    id={`create-role-${role}`}
                    checked={selectedRoles.includes(role)}
                    onCheckedChange={() => toggleRole(role)}
                  />
                  <label htmlFor={`create-role-${role}`} className="text-sm cursor-pointer">{roleLabels[role]}</label>
                </div>
              ))}
            </div>
            {selectedRoles.length === 0 && (
              <p className="text-xs text-destructive">Выберите хотя бы одну роль</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button>
          <Button onClick={() => createUser.mutate()} disabled={!isValid || createUser.isPending}>
            {createUser.isPending ? "Создание..." : "Создать"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
