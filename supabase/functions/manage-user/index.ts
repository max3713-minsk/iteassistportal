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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Проверяем, что вызывающий – администратор
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const { data: roles } = await callerClient.from("user_roles").select("role").eq("user_id", caller.id);
    if (!roles?.some(r => r.role === "admin")) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
    }

    const adminClient = createClient(supabaseUrl, serviceKey);
    const body = await req.json();
    const { action } = body;

    if (action === "update") {
      const { user_id, full_name, organization, phone, position, roles: newRoles } = body;
      if (!user_id) {
        return new Response(JSON.stringify({ error: "user_id required" }), { status: 400, headers: corsHeaders });
      }

      // Обновляем профиль
      await adminClient.from("profiles").update({ full_name, organization, phone, position }).eq("user_id", user_id);
      if (full_name) {
        await adminClient.auth.admin.updateUserById(user_id, { user_metadata: { full_name } });
      }

      // Обновляем роли
      if (newRoles !== undefined) {
        await adminClient.from("user_roles").delete().eq("user_id", user_id);
        if (Array.isArray(newRoles) && newRoles.length) {
          const rows = newRoles.map(role => ({ user_id, role }));
          await adminClient.from("user_roles").insert(rows);
        }
      }

      return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
    }

    if (action === "list") {
      const { data } = await adminClient.from("profiles").select("user_id, full_name, email");
      return new Response(JSON.stringify(data || []), { status: 200, headers: corsHeaders });
    }

    if (action === "delete") {
      const { user_id } = body;
      if (!user_id) {
        return new Response(JSON.stringify({ error: "user_id required" }), { status: 400, headers: corsHeaders });
      }
      await adminClient.from("profiles").delete().eq("user_id", user_id);
      await adminClient.from("user_roles").delete().eq("user_id", user_id);
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(user_id);
      if (deleteError) throw deleteError;
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
    }

    // ДОБАВЛЯЕМ СБРОС ПАРОЛЯ
    if (action === "reset_password") {
      const { user_id } = body;
      if (!user_id) {
        return new Response(JSON.stringify({ error: "user_id required" }), { status: 400, headers: corsHeaders });
      }

      // Получаем email пользователя
      const { data: userData, error: userError } = await adminClient.auth.admin.getUserById(user_id);
      if (userError) throw userError;
      const email = userData.user.email;
      if (!email) {
        return new Response(JSON.stringify({ error: "User email not found" }), { status: 400, headers: corsHeaders });
      }

      // Генерируем ссылку для сброса пароля (тип 'recovery')
      const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: { redirectTo: "https://10.11.12.243/update-password" }
      });
      if (linkError) throw linkError;

      // Возвращаем ссылку (можете также отправить письмо, но это требует настройки SMTP)
      // Фронтенд может показать ссылку администратору, либо отправить письмо через бэкенд
      return new Response(JSON.stringify({ success: true, recovery_link: linkData.properties.action_link }), { status: 200, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: corsHeaders });
  } catch (err) {
    console.error("❌ manage-user error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
}
