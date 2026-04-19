// Notification dispatcher: enqueue + send via webhooks (Telegram, Mattermost, Email-webhook, SMS-webhook)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type EventInput = {
  event_type: string;
  priority?: string | null;
  title: string;
  body?: string;
  payload?: Record<string, unknown>;
  // Optional: target specific users; otherwise dispatch to all subscribed
  target_user_ids?: string[];
  // For testing a single channel
  test_channel_id?: string;
};

const PRIORITY_RANK: Record<string, number> = {
  P1: 4, critical: 4,
  P2: 3, high: 3,
  P3: 2, normal: 2, medium: 2,
  P4: 1, low: 1,
  info: 0,
};

function meetsPriority(eventPriority: string | null | undefined, minPriority: string | null | undefined): boolean {
  if (!minPriority) return true;
  const e = PRIORITY_RANK[eventPriority ?? "info"] ?? 0;
  const m = PRIORITY_RANK[minPriority] ?? 0;
  return e >= m;
}

function isCritical(p?: string | null) {
  return (PRIORITY_RANK[p ?? ""] ?? 0) >= 3;
}

function nowInTz(tz: string): { hhmm: string; dow: number } {
  // dow: 0 = Sunday ... 6 = Saturday
  const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", weekday: "short", hour12: false });
  const parts = fmt.formatToParts(new Date());
  const hh = parts.find((p) => p.type === "hour")?.value ?? "00";
  const mm = parts.find((p) => p.type === "minute")?.value ?? "00";
  const wk = parts.find((p) => p.type === "weekday")?.value ?? "Mon";
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return { hhmm: `${hh}:${mm}`, dow: map[wk] ?? 1 };
}

function inQuietWindow(prefs: any): boolean {
  if (!prefs?.quiet_hours_enabled) return false;
  const tz = prefs.timezone || "Europe/Minsk";
  const { hhmm, dow } = nowInTz(tz);
  const days: number[] = Array.isArray(prefs.quiet_days) ? prefs.quiet_days : [];
  if (days.length > 0 && !days.includes(dow)) return false;
  const s = prefs.quiet_hours_start as string | null;
  const e = prefs.quiet_hours_end as string | null;
  if (!s || !e) return false;
  // HH:MM:SS -> HH:MM
  const ss = s.slice(0, 5);
  const ee = e.slice(0, 5);
  if (ss <= ee) return hhmm >= ss && hhmm < ee;
  // Wraps midnight
  return hhmm >= ss || hhmm < ee;
}

function renderTemplate(tpl: string | undefined, data: { title: string; body?: string; event_type: string; priority?: string | null; payload?: Record<string, unknown> }): string {
  const base = tpl ?? "{{title}}\n{{body}}";
  const flat: Record<string, string> = {
    title: data.title,
    body: data.body ?? "",
    event_type: data.event_type,
    priority: data.priority ?? "",
  };
  for (const [k, v] of Object.entries(data.payload ?? {})) {
    flat[k] = typeof v === "string" ? v : JSON.stringify(v);
  }
  return base.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, k) => flat[k] ?? "");
}

async function sendTelegram(cfg: any, message: string) {
  const token = cfg.bot_token;
  const chatId = cfg.chat_id;
  if (!token || !chatId) throw new Error("Telegram: bot_token и chat_id обязательны");
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: cfg.parse_mode || undefined, disable_web_page_preview: true }),
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, body: text };
}

async function sendMattermost(cfg: any, message: string, title: string) {
  const url = cfg.webhook_url;
  if (!url) throw new Error("Mattermost: webhook_url обязателен");
  const body: any = { text: message };
  if (cfg.channel) body.channel = cfg.channel;
  if (cfg.username) body.username = cfg.username;
  if (cfg.icon_url) body.icon_url = cfg.icon_url;
  if (cfg.use_attachments) {
    body.attachments = [{ fallback: title, title, text: message, color: cfg.color || "#3b82f6" }];
    body.text = undefined;
  }
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, body: text };
}

async function sendWebhook(cfg: any, message: string, title: string, event: EventInput) {
  const url = cfg.webhook_url;
  if (!url) throw new Error("Webhook URL обязателен");
  const method = (cfg.method || "POST").toUpperCase();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (cfg.headers && typeof cfg.headers === "object") {
    for (const [k, v] of Object.entries(cfg.headers)) headers[k] = String(v);
  }
  let body: string | undefined;
  if (method !== "GET") {
    if (cfg.body_template) {
      body = renderTemplate(cfg.body_template, { title, body: message, event_type: event.event_type, priority: event.priority, payload: event.payload });
      // Try parse as JSON (preserve content-type), else send raw
    } else {
      body = JSON.stringify({
        title, message, event_type: event.event_type, priority: event.priority, payload: event.payload, recipient: cfg.recipient || cfg.email || cfg.phone,
      });
    }
  }
  const res = await fetch(url, { method, headers, body });
  const text = await res.text();
  return { ok: res.ok, status: res.status, body: text };
}

async function deliverToChannel(supabase: any, userId: string, channel: any, event: EventInput) {
  const message = renderTemplate(channel.config?.message_template, {
    title: event.title, body: event.body, event_type: event.event_type, priority: event.priority, payload: event.payload,
  });
  let result: { ok: boolean; status: number; body: string };
  try {
    if (channel.channel_type === "telegram") result = await sendTelegram(channel.config, message);
    else if (channel.channel_type === "mattermost") result = await sendMattermost(channel.config, message, event.title);
    else result = await sendWebhook(channel.config, message, event.title, event);

    await supabase.from("notification_log").insert({
      user_id: userId, channel_id: channel.id, channel_type: channel.channel_type,
      event_type: event.event_type, priority: event.priority ?? null,
      title: event.title, body: event.body ?? null, payload: event.payload ?? null,
      status: result.ok ? "sent" : "failed", attempts: 1,
      error: result.ok ? null : result.body.slice(0, 1000),
      http_status: result.status, sent_at: result.ok ? new Date().toISOString() : null,
    });
    return result;
  } catch (e: any) {
    await supabase.from("notification_log").insert({
      user_id: userId, channel_id: channel.id, channel_type: channel.channel_type,
      event_type: event.event_type, priority: event.priority ?? null,
      title: event.title, body: event.body ?? null, payload: event.payload ?? null,
      status: "failed", attempts: 1, error: String(e?.message ?? e).slice(0, 1000),
    });
    return { ok: false, status: 0, body: String(e?.message ?? e) };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const event = (await req.json()) as EventInput;
    if (!event?.event_type || !event?.title) {
      return new Response(JSON.stringify({ error: "event_type и title обязательны" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Test mode: send to a single channel
    if (event.test_channel_id) {
      const { data: ch } = await supabase.from("notification_channels").select("*").eq("id", event.test_channel_id).maybeSingle();
      if (!ch) return new Response(JSON.stringify({ error: "Канал не найден" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const r = await deliverToChannel(supabase, ch.user_id, ch, event);
      if (r.ok) {
        await supabase.from("notification_channels").update({
          verified: true, last_test_at: new Date().toISOString(), last_test_status: "ok", last_test_error: null,
        }).eq("id", ch.id);
      } else {
        await supabase.from("notification_channels").update({
          last_test_at: new Date().toISOString(), last_test_status: "failed", last_test_error: r.body.slice(0, 500),
        }).eq("id", ch.id);
      }
      return new Response(JSON.stringify(r), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Find subscribers
    const { data: subs } = await supabase
      .from("notification_subscriptions")
      .select("*")
      .eq("event_type", event.event_type)
      .eq("enabled", true);

    let candidates = subs ?? [];
    if (event.target_user_ids?.length) {
      candidates = candidates.filter((s: any) => event.target_user_ids!.includes(s.user_id));
    }

    let delivered = 0, queued = 0, skipped = 0;

    for (const sub of candidates) {
      if (!meetsPriority(event.priority, sub.min_priority)) { skipped++; continue; }

      const { data: prefs } = await supabase.from("notification_preferences").select("*").eq("user_id", sub.user_id).maybeSingle();
      const critical = isCritical(event.priority);

      if (prefs?.dnd_enabled && !(critical && prefs.quiet_bypass_critical)) { skipped++; continue; }

      const inQuiet = prefs ? inQuietWindow(prefs) : false;
      const bypass = critical && (prefs?.quiet_bypass_critical ?? true);
      const mode = prefs?.delivery_mode || "instant";
      const shouldDigest = mode === "digest" || (mode === "instant_critical_digest_rest" && !critical) || (inQuiet && !bypass);

      if (shouldDigest) {
        await supabase.from("notification_queue").insert({
          user_id: sub.user_id, event_type: event.event_type, priority: event.priority ?? null,
          title: event.title, body: event.body ?? null, payload: event.payload ?? {},
        });
        queued++;
        continue;
      }

      // Instant: deliver to chosen channels
      const chIds: string[] = Array.isArray(sub.channel_ids) ? sub.channel_ids : [];
      if (chIds.length === 0) { skipped++; continue; }
      const { data: channels } = await supabase
        .from("notification_channels").select("*").in("id", chIds).eq("enabled", true);
      for (const ch of channels ?? []) {
        const r = await deliverToChannel(supabase, sub.user_id, ch, event);
        if (r.ok) delivered++;
      }
    }

    return new Response(JSON.stringify({ delivered, queued, skipped, candidates: candidates.length }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("notification-dispatch error", e);
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
