import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { WEEKDAYS } from "@/lib/notification-events";

const DEFAULT_PREFS = {
  delivery_mode: "instant" as const,
  dnd_enabled: false,
  quiet_hours_enabled: false,
  quiet_hours_start: "22:00",
  quiet_hours_end: "08:00",
  quiet_days: [] as number[],
  quiet_bypass_critical: true,
  digest_schedule: "daily_09",
  timezone: "Europe/Minsk",
};

export function NotificationPreferences() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [prefs, setPrefs] = useState<any>(DEFAULT_PREFS);

  const { data, isLoading } = useQuery({
    queryKey: ["notif-prefs", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("notification_preferences").select("*").eq("user_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (data) {
      setPrefs({
        ...DEFAULT_PREFS,
        ...data,
        quiet_hours_start: (data.quiet_hours_start ?? "22:00:00").slice(0, 5),
        quiet_hours_end: (data.quiet_hours_end ?? "08:00:00").slice(0, 5),
        quiet_days: Array.isArray(data.quiet_days) ? data.quiet_days : [],
      });
    }
  }, [data]);

  const saveMut = useMutation({
    mutationFn: async () => {
      const payload = {
        user_id: user!.id,
        delivery_mode: prefs.delivery_mode,
        dnd_enabled: prefs.dnd_enabled,
        quiet_hours_enabled: prefs.quiet_hours_enabled,
        quiet_hours_start: prefs.quiet_hours_enabled ? prefs.quiet_hours_start : null,
        quiet_hours_end: prefs.quiet_hours_enabled ? prefs.quiet_hours_end : null,
        quiet_days: prefs.quiet_days,
        quiet_bypass_critical: prefs.quiet_bypass_critical,
        digest_schedule: prefs.digest_schedule,
        timezone: prefs.timezone,
      };
      const { error } = await supabase.from("notification_preferences").upsert(payload, { onConflict: "user_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notif-prefs"] });
      toast({ title: "Настройки сохранены" });
    },
    onError: (e: any) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  });

  function toggleDay(d: number) {
    const days: number[] = prefs.quiet_days ?? [];
    setPrefs({ ...prefs, quiet_days: days.includes(d) ? days.filter((x) => x !== d) : [...days, d] });
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Загрузка...</p>;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-heading text-lg">Режим доставки</h3>
        <p className="text-sm text-muted-foreground">Как и когда вы хотите получать уведомления</p>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Основной режим</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>Способ доставки</Label>
            <Select value={prefs.delivery_mode} onValueChange={(v) => setPrefs({ ...prefs, delivery_mode: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="instant">Мгновенно — каждое событие сразу</SelectItem>
                <SelectItem value="instant_critical_digest_rest">Критика мгновенно, остальное — дайджестом</SelectItem>
                <SelectItem value="digest">Только дайджест</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {prefs.delivery_mode !== "instant" && (
            <div className="grid gap-2">
              <Label>Расписание дайджеста</Label>
              <Select value={prefs.digest_schedule} onValueChange={(v) => setPrefs({ ...prefs, digest_schedule: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Каждый час</SelectItem>
                  <SelectItem value="every_4h">Каждые 4 часа</SelectItem>
                  <SelectItem value="daily_09">Ежедневно в 09:00</SelectItem>
                  <SelectItem value="daily_18">Ежедневно в 18:00</SelectItem>
                  <SelectItem value="weekly_mon_09">Еженедельно (Пн 09:00)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-2">
            <Label>Часовой пояс</Label>
            <Select value={prefs.timezone} onValueChange={(v) => setPrefs({ ...prefs, timezone: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Europe/Minsk">Europe/Minsk (UTC+3)</SelectItem>
                <SelectItem value="Europe/Moscow">Europe/Moscow (UTC+3)</SelectItem>
                <SelectItem value="Europe/Kaliningrad">Europe/Kaliningrad (UTC+2)</SelectItem>
                <SelectItem value="Europe/Warsaw">Europe/Warsaw (UTC+1/+2)</SelectItem>
                <SelectItem value="Asia/Yekaterinburg">Asia/Yekaterinburg (UTC+5)</SelectItem>
                <SelectItem value="UTC">UTC</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Не беспокоить</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="cursor-pointer">Полный режим «Не беспокоить»</Label>
              <p className="text-xs text-muted-foreground">Все уведомления будут заблокированы</p>
            </div>
            <Switch checked={prefs.dnd_enabled} onCheckedChange={(v) => setPrefs({ ...prefs, dnd_enabled: v })} />
          </div>

          <div className="flex items-center justify-between border-t pt-4">
            <div>
              <Label className="cursor-pointer">Тихие часы</Label>
              <p className="text-xs text-muted-foreground">В указанное время уведомления уходят в дайджест</p>
            </div>
            <Switch checked={prefs.quiet_hours_enabled} onCheckedChange={(v) => setPrefs({ ...prefs, quiet_hours_enabled: v })} />
          </div>

          {prefs.quiet_hours_enabled && (
            <div className="space-y-3 pl-1 border-l-2 border-primary/30 ml-1 pl-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label>С</Label>
                  <Input type="time" value={prefs.quiet_hours_start} onChange={(e) => setPrefs({ ...prefs, quiet_hours_start: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>До</Label>
                  <Input type="time" value={prefs.quiet_hours_end} onChange={(e) => setPrefs({ ...prefs, quiet_hours_end: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Дни недели (пусто = все дни)</Label>
                <div className="flex gap-2 flex-wrap">
                  {WEEKDAYS.map((d) => {
                    const active = (prefs.quiet_days ?? []).includes(d.value);
                    return (
                      <button
                        key={d.value} type="button" onClick={() => toggleDay(d.value)}
                        className={`px-3 py-1 rounded-md border text-sm transition-colors ${
                          active ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"
                        }`}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 border-t pt-4">
            <Checkbox checked={prefs.quiet_bypass_critical} onCheckedChange={(v) => setPrefs({ ...prefs, quiet_bypass_critical: !!v })} id="bypass" />
            <Label htmlFor="bypass" className="cursor-pointer">
              Пропускать критические события (P1) даже в режиме «Не беспокоить» и тихих часов
            </Label>
          </div>
        </CardContent>
      </Card>

      <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
        {saveMut.isPending ? "Сохранение..." : "Сохранить настройки"}
      </Button>
    </div>
  );
}
