import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export default async function handler(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Определяем ID канала: либо из test_channel_id, либо из активного telegram канала пользователя
    let channelId = body.test_channel_id;
    if (!channelId) {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
      }
      const supabaseUser = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: { user } } = await supabaseUser.auth.getUser();
      if (!user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
      }
      const { data: channel } = await supabaseAdmin
        .from("notification_channels")
        .select("id")
        .eq("user_id", user.id)
        .eq("channel_type", "telegram")
        .eq("enabled", true)
        .maybeSingle();
      if (!channel) {
        return new Response(JSON.stringify({ error: "No active Telegram channel" }), { status: 400, headers: corsHeaders });
      }
      channelId = channel.id;
    }

    // Получаем конфигурацию канала
    const { data: channel, error: channelError } = await supabaseAdmin
      .from("notification_channels")
      .select("config")
      .eq("id", channelId)
      .single();
    if (channelError || !channel) {
      throw new Error("Channel config not found");
    }
    const { bot_token, chat_id } = channel.config as { bot_token: string; chat_id: string };
    if (!bot_token || !chat_id) {
      throw new Error("Telegram bot token or chat_id missing");
    }

    // Формируем текст сообщения
    const title = body.title || body.event_type || "Уведомление";
    const message = body.body || "";
    const text = `${title}\n${message}`.trim();

    // Отправляем запрос к Telegram API
    const tgUrl = `https://api.telegram.org/bot${bot_token}/sendMessage`;
    const tgRes = await fetch(tgUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chat_id,
        text: text,
        parse_mode: "Markdown",
      }),
    });
    const tgData = await tgRes.json();
    if (!tgRes.ok) {
      throw new Error(tgData.description || "Telegram API error");
    }

    // Обновляем статус канала (успешный тест)
    await supabaseAdmin
      .from("notification_channels")
      .update({
        verified: true,
        last_test_at: new Date().toISOString(),
        last_test_status: "success",
        last_test_error: null,
      })
      .eq("id", channelId);

    return new Response(JSON.stringify({ success: true, result: tgData }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("❌ Notification dispatch error:", err);
    // Если есть test_channel_id, обновляем статус ошибки
    const body = await req.json().catch(() => ({}));
    if (body.test_channel_id) {
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      await supabaseAdmin
        .from("notification_channels")
        .update({
          verified: false,
          last_test_at: new Date().toISOString(),
          last_test_status: "error",
          last_test_error: err.message,
        })
        .eq("id", body.test_channel_id);
    }
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}
