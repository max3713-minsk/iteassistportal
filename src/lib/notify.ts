// Helper to dispatch a notification event from anywhere in the app.
// Fire-and-forget: never throws, never blocks.
import { supabase } from "@/integrations/supabase/client";

export type DispatchEvent = {
  event_type: string;
  priority?: "P1" | "P2" | "P3" | "P4" | "info" | string | null;
  title: string;
  body?: string;
  payload?: Record<string, unknown>;
  target_user_ids?: string[];
};

export function notify(event: DispatchEvent): void {
  // Best-effort: do not await, do not surface errors to the user
  supabase.functions
    .invoke("notification-dispatch", { body: event })
    .catch((e) => console.warn("notify failed", event.event_type, e));
}

export async function testChannel(channelId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke("notification-dispatch", {
      body: {
        test_channel_id: channelId,
        event_type: "test.channel",
        priority: "info",
        title: "Тестовое уведомление",
        body: "Если вы видите это сообщение — канал настроен корректно. Источник: ITE Assist Portal.",
      },
    });
    if (error) return { ok: false, error: error.message };
    if (data && (data as any).ok === false) return { ok: false, error: (data as any).body || "Ошибка отправки" };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? String(e) };
  }
}
