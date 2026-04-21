import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Trash2, Pencil, Plus, CheckCircle2, XCircle, AlertCircle, MessageSquare, Mail, Phone } from "lucide-react";
import { testChannel } from "@/lib/notify";

type ChannelType = "telegram" | "mattermost" | "email" | "sms" | "mts_sms" | "a1_sms";

const TYPE_META: Record<ChannelType, { label: string; icon: any; color: string }> = {
  telegram: { label: "Telegram", icon: Send, color: "text-sky-500" },
  mattermost: { label: "Mattermost", icon: MessageSquare, color: "text-indigo-500" },
  email: { label: "Email (webhook)", icon: Mail, color: "text-emerald-500" },
  sms: { label: "SMS (webhook)", icon: Phone, color: "text-amber-500" },
  mts_sms: { label: "МТС SMS (JSONv2)", icon: Phone, color: "text-red-500" },
  a1_sms: { label: "А1 SMS (smart-sender)", icon: Phone, color: "text-orange-500" },
};

export function NotificationChannels() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [editing, setEditing] = useState<any | null>(null);
  const [open, setOpen] = useState(false);

  const { data: channels = [], isLoading } = useQuery({
    queryKey: ["notif-channels", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("notification_channels").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notification_channels").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notif-channels"] });
      toast({ title: "Канал удалён" });
    },
  });

  const toggleMut = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase.from("notification_channels").update({ enabled }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notif-channels"] }),
  });

  async function handleTest(id: string) {
    toast({ title: "Отправляю тест..." });
    const r = await testChannel(id);
    if (r.ok) toast({ title: "Тест отправлен", description: "Проверьте канал доставки" });
    else toast({ title: "Ошибка теста", description: r.error, variant: "destructive" });
    qc.invalidateQueries({ queryKey: ["notif-channels"] });
  }

  function openCreate() { setEditing(null); setOpen(true); }
  function openEdit(ch: any) { setEditing(ch); setOpen(true); }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading text-lg">Каналы доставки</h3>
          <p className="text-sm text-muted-foreground">Настройте webhooks для получения уведомлений</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Добавить канал</Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Загрузка...</p>
      ) : channels.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">
          У вас пока нет настроенных каналов. Добавьте первый, чтобы начать получать уведомления.
        </CardContent></Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {channels.map((ch: any) => {
            const meta = TYPE_META[ch.channel_type as ChannelType];
            const Icon = meta?.icon ?? Send;
            return (
              <Card key={ch.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon className={`h-5 w-5 shrink-0 ${meta?.color}`} />
                      <div className="min-w-0">
                        <CardTitle className="text-base truncate">{ch.name}</CardTitle>
                        <CardDescription className="text-xs">{meta?.label}</CardDescription>
                      </div>
                    </div>
                    <Switch checked={ch.enabled} onCheckedChange={(v) => toggleMut.mutate({ id: ch.id, enabled: v })} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-xs">
                    {ch.verified ? (
                      <Badge variant="outline" className="gap-1 border-emerald-500/40 text-emerald-600">
                        <CheckCircle2 className="h-3 w-3" />Проверен
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 border-amber-500/40 text-amber-600">
                        <AlertCircle className="h-3 w-3" />Не проверен
                      </Badge>
                    )}
                    {ch.last_test_status === "failed" && (
                      <Badge variant="outline" className="gap-1 border-destructive/40 text-destructive">
                        <XCircle className="h-3 w-3" />Последний тест: ошибка
                      </Badge>
                    )}
                  </div>
                  {ch.last_test_error && (
                    <p className="text-xs text-destructive line-clamp-2">{ch.last_test_error}</p>
                  )}
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleTest(ch.id)}>
                      <Send className="h-3.5 w-3.5 mr-1" />Тест
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openEdit(ch)}>
                      <Pencil className="h-3.5 w-3.5 mr-1" />Изменить
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive ml-auto"
                      onClick={() => { if (confirm("Удалить канал?")) deleteMut.mutate(ch.id); }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ChannelDialog open={open} onOpenChange={setOpen} editing={editing} userId={user?.id ?? ""} />
    </div>
  );
}

function ChannelDialog({ open, onOpenChange, editing, userId }: { open: boolean; onOpenChange: (v: boolean) => void; editing: any; userId: string }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [type, setType] = useState<ChannelType>(editing?.channel_type ?? "telegram");
  const [name, setName] = useState(editing?.name ?? "");
  const [config, setConfig] = useState<any>(editing?.config ?? {});

  // reset on open
  function onOpen(v: boolean) {
    if (v) {
      setType(editing?.channel_type ?? "telegram");
      setName(editing?.name ?? "");
      setConfig(editing?.config ?? {});
    }
    onOpenChange(v);
  }

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("Введите название канала");
      const payload = { user_id: userId, channel_type: type, name: name.trim(), config };
      if (editing) {
        const { error } = await supabase.from("notification_channels").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("notification_channels").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notif-channels"] });
      toast({ title: editing ? "Канал обновлён" : "Канал создан" });
      onOpen(false);
    },
    onError: (e: any) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Редактирование канала" : "Новый канал"}</DialogTitle>
          <DialogDescription>Заполните поля для подключения. Формат указан в подсказке для каждого типа.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-2">
            <Label>Тип канала</Label>
            <Select value={type} onValueChange={(v) => { setType(v as ChannelType); setConfig({}); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(TYPE_META) as ChannelType[]).map((k) => (
                  <SelectItem key={k} value={k}>{TYPE_META[k].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Название</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Например, Мой Telegram" />
          </div>

          {type === "telegram" && <TelegramFields config={config} setConfig={setConfig} />}
          {type === "mattermost" && <MattermostFields config={config} setConfig={setConfig} />}
          {type === "email" && <EmailWebhookFields config={config} setConfig={setConfig} />}
          {type === "sms" && <SmsWebhookFields config={config} setConfig={setConfig} />}
          {type === "mts_sms" && <MtsSmsFields config={config} setConfig={setConfig} />}
          {type === "a1_sms" && <A1SmsFields config={config} setConfig={setConfig} />}

          <div className="grid gap-2">
            <Label>Шаблон сообщения (опционально)</Label>
            <Textarea
              rows={3}
              value={config.message_template ?? ""}
              onChange={(e) => setConfig({ ...config, message_template: e.target.value })}
              placeholder={"По умолчанию: {{title}}\\n{{body}}\\n\\nДоступные переменные: {{title}}, {{body}}, {{event_type}}, {{priority}}, и любые поля из payload"}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpen(false)}>Отмена</Button>
          <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
            {saveMut.isPending ? "Сохранение..." : "Сохранить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TelegramFields({ config, setConfig }: any) {
  return (
    <div className="space-y-3 rounded-md border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">
        1) Создайте бота в <a className="underline" href="https://t.me/BotFather" target="_blank" rel="noreferrer">@BotFather</a> командой <code>/newbot</code> — получите <b>токен</b>.<br />
        2) Откройте чат с ботом и отправьте любое сообщение.<br />
        3) Получите ваш <b>chat_id</b> через <a className="underline" href="https://t.me/userinfobot" target="_blank" rel="noreferrer">@userinfobot</a> или <code>https://api.telegram.org/bot&lt;TOKEN&gt;/getUpdates</code>.
      </p>
      <div className="grid gap-2">
        <Label>Bot token</Label>
        <Input value={config.bot_token ?? ""} onChange={(e) => setConfig({ ...config, bot_token: e.target.value })} placeholder="123456789:ABCdefGhIJKlmNoPQRstUVwxyz" />
      </div>
      <div className="grid gap-2">
        <Label>Chat ID</Label>
        <Input value={config.chat_id ?? ""} onChange={(e) => setConfig({ ...config, chat_id: e.target.value })} placeholder="123456789 или -1001234567890 (для группы)" />
      </div>
      <div className="grid gap-2">
        <Label>Parse mode (опционально)</Label>
        <Select value={config.parse_mode ?? "none"} onValueChange={(v) => setConfig({ ...config, parse_mode: v === "none" ? undefined : v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Без форматирования</SelectItem>
            <SelectItem value="HTML">HTML</SelectItem>
            <SelectItem value="MarkdownV2">MarkdownV2</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function MattermostFields({ config, setConfig }: any) {
  return (
    <div className="space-y-3 rounded-md border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">
        В Mattermost: <b>Integrations → Incoming Webhooks → Add</b> — создайте webhook и скопируйте URL.
      </p>
      <div className="grid gap-2">
        <Label>Webhook URL</Label>
        <Input value={config.webhook_url ?? ""} onChange={(e) => setConfig({ ...config, webhook_url: e.target.value })} placeholder="https://mattermost.example.com/hooks/xxxxxxxx" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="grid gap-2">
          <Label>Канал (опц.)</Label>
          <Input value={config.channel ?? ""} onChange={(e) => setConfig({ ...config, channel: e.target.value })} placeholder="#alerts" />
        </div>
        <div className="grid gap-2">
          <Label>Имя бота (опц.)</Label>
          <Input value={config.username ?? ""} onChange={(e) => setConfig({ ...config, username: e.target.value })} placeholder="ITE Assist" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={!!config.use_attachments} onCheckedChange={(v) => setConfig({ ...config, use_attachments: v })} />
        <Label className="cursor-pointer">Отправлять как rich attachment (с заголовком и цветом)</Label>
      </div>
    </div>
  );
}

function EmailWebhookFields({ config, setConfig }: any) {
  return (
    <div className="space-y-3 rounded-md border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">
        Укажите webhook вашего SMTP-relay / Make / n8n / Zapier. На него POST'нется JSON с полями <code>title</code>, <code>message</code>, <code>recipient</code>.
      </p>
      <div className="grid gap-2">
        <Label>Webhook URL</Label>
        <Input value={config.webhook_url ?? ""} onChange={(e) => setConfig({ ...config, webhook_url: e.target.value })} placeholder="https://hook.example.com/email" />
      </div>
      <div className="grid gap-2">
        <Label>Email получателя</Label>
        <Input type="email" value={config.recipient ?? ""} onChange={(e) => setConfig({ ...config, recipient: e.target.value })} placeholder="user@company.com" />
      </div>
      <CommonWebhookExtras config={config} setConfig={setConfig} />
    </div>
  );
}

function SmsWebhookFields({ config, setConfig }: any) {
  return (
    <div className="space-y-3 rounded-md border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">
        Укажите webhook вашего SMS-провайдера (SMS.by, SMSC.ru, Twilio relay, и т.п.) или прокси-эндпоинт.
      </p>
      <div className="grid gap-2">
        <Label>Webhook URL</Label>
        <Input value={config.webhook_url ?? ""} onChange={(e) => setConfig({ ...config, webhook_url: e.target.value })} placeholder="https://sms.example.com/send" />
      </div>
      <div className="grid gap-2">
        <Label>Номер телефона</Label>
        <Input value={config.recipient ?? ""} onChange={(e) => setConfig({ ...config, recipient: e.target.value })} placeholder="+375291234567" />
      </div>
      <CommonWebhookExtras config={config} setConfig={setConfig} />
    </div>
  );
}

function CommonWebhookExtras({ config, setConfig }: any) {
  const [headersText, setHeadersText] = useState(() => {
    try { return config.headers ? JSON.stringify(config.headers, null, 2) : ""; } catch { return ""; }
  });
  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <div className="grid gap-2">
          <Label>HTTP метод</Label>
          <Select value={config.method ?? "POST"} onValueChange={(v) => setConfig({ ...config, method: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="POST">POST</SelectItem>
              <SelectItem value="PUT">PUT</SelectItem>
              <SelectItem value="GET">GET</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-2">
        <Label>Доп. заголовки (JSON, опц.)</Label>
        <Textarea
          rows={3} value={headersText}
          onChange={(e) => {
            setHeadersText(e.target.value);
            try { setConfig({ ...config, headers: e.target.value ? JSON.parse(e.target.value) : undefined }); } catch { /* ignore */ }
          }}
          placeholder={'{ "Authorization": "Bearer ..." }'}
        />
      </div>
      <div className="grid gap-2">
        <Label>Шаблон тела запроса (опц.)</Label>
        <Textarea
          rows={3}
          value={config.body_template ?? ""}
          onChange={(e) => setConfig({ ...config, body_template: e.target.value })}
          placeholder={'{ "to": "{{recipient}}", "text": "{{title}}: {{body}}" } — переменные {{title}}, {{body}}, {{priority}}, {{event_type}}'}
        />
      </div>
    </>
  );
}
