import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Filter } from "lucide-react";
import { NOTIFICATION_EVENTS, EVENT_MODULES, PRIORITY_OPTIONS } from "@/lib/notification-events";
import { PRODUCTS, REQUEST_TYPE_LABELS } from "@/lib/ticket-categories";

export function NotificationSubscriptions() {
  const { user, roles } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: channels = [] } = useQuery({
    queryKey: ["notif-channels", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("notification_channels").select("id,name,channel_type,enabled");
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: subs = [] } = useQuery({
    queryKey: ["notif-subs", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("notification_subscriptions").select("*");
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: sites = [] } = useQuery({
    queryKey: ["notif-sites"],
    queryFn: async () => {
      const { data } = await supabase.from("sites").select("id,name").order("name");
      return data ?? [];
    },
    enabled: !!user,
  });

  const subMap = useMemo(() => {
    const m = new Map<string, any>();
    for (const s of subs) m.set(s.event_type, s);
    return m;
  }, [subs]);

  const upsertMut = useMutation({
    mutationFn: async (sub: any) => {
      const payload = { ...sub, user_id: user!.id };
      const { error } = await supabase
        .from("notification_subscriptions")
        .upsert(payload, { onConflict: "user_id,event_type" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notif-subs"] }),
    onError: (e: any) => toast({ title: "Ошибка сохранения", description: e.message, variant: "destructive" }),
  });

  function update(eventKey: string, patch: Partial<{ enabled: boolean; min_priority: string | null; channel_ids: string[] }>) {
    const existing = subMap.get(eventKey) ?? { event_type: eventKey, enabled: true, min_priority: null, channel_ids: [] };
    upsertMut.mutate({ ...existing, ...patch });
  }

  function updateFilters(eventKey: string, patch: Record<string, any>) {
    const existing = subMap.get(eventKey) ?? { event_type: eventKey, enabled: true, min_priority: null, channel_ids: [], filters: {} };
    const filters = { ...(existing.filters ?? {}), ...patch };
    // Clean undefined / empty arrays
    for (const k of Object.keys(filters)) {
      if (filters[k] === undefined || filters[k] === null) delete filters[k];
      if (Array.isArray(filters[k]) && filters[k].length === 0) delete filters[k];
    }
    upsertMut.mutate({ ...existing, filters });
  }

  function toggleChannel(eventKey: string, channelId: string, on: boolean) {
    const existing = subMap.get(eventKey) ?? { event_type: eventKey, enabled: true, min_priority: null, channel_ids: [] };
    const ids: string[] = Array.isArray(existing.channel_ids) ? existing.channel_ids : [];
    const next = on ? Array.from(new Set([...ids, channelId])) : ids.filter((x) => x !== channelId);
    upsertMut.mutate({ ...existing, channel_ids: next });
  }

  // Group events by module, filter by audience (show all to admins)
  const isAdmin = roles.includes("admin");
  const visibleEvents = NOTIFICATION_EVENTS.filter((e) =>
    isAdmin ? true : e.audience.some((a) => roles.includes(a as any))
  );
  const grouped = useMemo(() => {
    const g: Record<string, typeof NOTIFICATION_EVENTS> = {};
    for (const e of visibleEvents) (g[e.module] ??= []).push(e);
    return g;
  }, [visibleEvents]);

  const enabledChannels = channels.filter((c: any) => c.enabled);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-heading text-lg">Подписки на события</h3>
        <p className="text-sm text-muted-foreground">
          Выберите события и каналы для каждого. Используются только включённые каналы.
        </p>
      </div>

      {enabledChannels.length === 0 && (
        <Card><CardContent className="py-6 text-sm text-amber-600">
          У вас нет активных каналов. Добавьте хотя бы один канал на вкладке «Каналы», иначе уведомления не будут отправляться.
        </CardContent></Card>
      )}

      {Object.entries(grouped).map(([mod, events]) => (
        <Card key={mod}>
          <CardHeader className="pb-3"><CardTitle className="text-base">{EVENT_MODULES[mod] ?? mod}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {events.map((ev) => {
              const sub = subMap.get(ev.key);
              const enabled = sub?.enabled ?? false;
              const chIds: string[] = Array.isArray(sub?.channel_ids) ? sub!.channel_ids : [];
              return (
                <div key={ev.key} className="rounded-md border p-3 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{ev.label}</span>
                        {ev.defaultPriority && <Badge variant="outline" className="text-[10px]">{ev.defaultPriority}</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">{ev.description}</p>
                    </div>
                    <Switch checked={enabled} onCheckedChange={(v) => update(ev.key, { enabled: v })} />
                  </div>

                  {enabled && (
                    <div className="grid gap-3 md:grid-cols-2 pt-2 border-t">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Минимальный приоритет</p>
                        <Select value={sub?.min_priority ?? "info"} onValueChange={(v) => update(ev.key, { min_priority: v === "info" ? null : v })}>
                          <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {PRIORITY_OPTIONS.map((p) => (<SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Каналы доставки</p>
                        <div className="flex flex-wrap gap-2">
                          {enabledChannels.length === 0 && <span className="text-xs text-muted-foreground">Нет каналов</span>}
                          {enabledChannels.map((c: any) => (
                            <label key={c.id} className="flex items-center gap-1.5 text-xs cursor-pointer rounded-md border px-2 py-1 hover:bg-muted/50">
                              <Checkbox
                                checked={chIds.includes(c.id)}
                                onCheckedChange={(v) => toggleChannel(ev.key, c.id, !!v)}
                              />
                              <span>{c.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
