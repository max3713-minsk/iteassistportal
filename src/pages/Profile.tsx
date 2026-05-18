import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import SignatureUpload from "@/components/SignatureUpload";
import { User } from "lucide-react";

export default function Profile() {
  const { session, user } = useAuth();
  const { toast } = useToast();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [organization, setOrganization] = useState("");
  const [position, setPosition] = useState("");
  const [saving, setSaving] = useState(false);

  const userId = session?.user?.id;

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, phone, organization, position")
        .eq("user_id", userId)
        .maybeSingle();
      if (data) {
        setFullName(data.full_name ?? "");
        setPhone(data.phone ?? "");
        setOrganization(data.organization ?? "");
        setPosition((data as any).position ?? "");
      }
    })();
  }, [userId]);

  if (!userId) return null;

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName || null, phone: phone || null, organization: organization || null, position: position || null })
      .eq("user_id", userId);
    setSaving(false);
    if (error) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Профиль сохранён" });
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
        <User className="h-6 w-6 text-primary" /> Мой профиль
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Основные данные</CardTitle>
          <CardDescription>{user?.email}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label>ФИО</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Телефон</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Организация</Label>
              <Input value={organization} onChange={(e) => setOrganization(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Должность</Label>
            <Input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="например, Инженер сервисной поддержки" />
            <p className="text-xs text-muted-foreground">Если указана — отображается в протоколах рядом с ФИО.</p>
          </div>
          <Button onClick={save} disabled={saving}>{saving ? "Сохранение…" : "Сохранить"}</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Факсимиле (электронная подпись)</CardTitle>
          <CardDescription>
            Используется для автоматической вставки в протоколы как изображение подписи.
            Юридически приравнено к собственноручной подписи не является.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignatureUpload userId={userId} />
        </CardContent>
      </Card>
    </div>
  );
}