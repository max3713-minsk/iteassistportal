// Periodic scan: for each active ticket with sla_deadline in the future,
// dispatch ticket.sla_warning to subscribed users at their configured offsets
// (e.g. 5/10/20/30 minutes before deadline). Deduplicates via notification_log.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface Ticket {
  id: string;
  title: string;
  status: string;
  priority: string;
  sla_deadline: string | null;
  created_by: string;
  assigned_to: string | null;
  site_id: string | null;
  product_code: string | null;
  request_type: string | null;
}

const ACTIVE_STATUSES = ["open", "assigned", "in_progress", "waiting"];
const DEFAULT_OFFSETS = [30, 20, 10, 5]; // minutes before deadline

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supa = createClient(SUPABASE_URL, SERVICE_KEY);

  // Pull active tickets with future deadlines
  const { data: tickets, error: tErr } = await supa
    .from("tickets")
    .select("id,title,status,priority,sla_deadline,created_by,assigned_to,site_id,product_code,request_type")
    .in("status", ACTIVE_STATUSES)
    .not("sla_deadline", "is", null);

  if (tErr) {
    return new Response(JSON.stringify({ error: tErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const now = Date.now();
  const summary = { scanned: tickets?.length ?? 0, dispatched: 0, skipped: 0 };

  // Pull subscribers for ticket.sla_warning
  const { data: subs } = await supa
    .from("notification_subscriptions")
    .select("user_id,filters,enabled")
    .eq("event_type", "ticket.sla_warning")
    .eq("enabled", true);

  if (!subs?.length) {
    return new Response(JSON.stringify({ ...summary, note: "no subscribers" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  for (const t of (tickets as Ticket[] | null) ?? []) {
    if (!t.sla_deadline) continue;
    const deadlineMs = new Date(t.sla_deadline).getTime();
    const minutesLeft = Math.round((deadlineMs - now) / 60000);
    if (minutesLeft <= 0) continue; // expired handled separately

    for (const sub of subs) {
      const offsets: number[] = Array.isArray(sub.filters?.sla_reminder_offsets)
        ? sub.filters.sla_reminder_offsets.map(Number).filter((n: number) => n > 0)
        : DEFAULT_OFFSETS;
      // Find any offset whose window matches (offset-1 < minutesLeft <= offset)
      const matched = offsets.find((o) => minutesLeft <= o && minutesLeft > o - 5);
      if (!matched) continue;

      // Dedup: skip if already logged this offset for this ticket+user
      const dedupKey = `sla_warn_${t.id}_${matched}`;
      const { data: existing } = await supa
        .from("notification_log")
        .select("id")
        .eq("user_id", sub.user_id)
        .eq("event_type", "ticket.sla_warning")
        .contains("payload", { dedup_key: dedupKey })
        .limit(1)
        .maybeSingle();
      if (existing) {
        summary.skipped++;
        continue;
      }

      // Dispatch via notification-dispatch
      const url = `${SUPABASE_URL}/functions/v1/notification-dispatch`;
      const body = {
        event_type: "ticket.sla_warning",
        priority: t.priority,
        title: `⏱ SLA: ${minutesLeft} мин до дедлайна — ${t.title}`,
        body: `Заявка ${t.title} истекает через ${minutesLeft} минут (приоритет ${t.priority}).`,
        target_user_ids: [sub.user_id],
        payload: {
          ticket_id: t.id,
          status: t.status,
          priority: t.priority,
          assigned_to: t.assigned_to,
          created_by: t.created_by,
          site_id: t.site_id,
          product_code: t.product_code,
          request_type: t.request_type,
          minutes_left: minutesLeft,
          offset_minutes: matched,
          dedup_key: dedupKey,
          url: `${SUPABASE_URL.replace("supabase.co", "lovable.app")}/tickets?id=${t.id}`,
        },
      };
      try {
        await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SERVICE_KEY}`,
          },
          body: JSON.stringify(body),
        });
        summary.dispatched++;
      } catch (e) {
        console.error("dispatch failed", e);
      }
    }
  }

  return new Response(JSON.stringify(summary), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
