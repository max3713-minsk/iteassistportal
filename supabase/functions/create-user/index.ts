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
    // Извлекаем поля, игнорируем organization_id, если есть
    const { email, password, full_name, organization, phone, position, role } = body;

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email and password required" }), { status: 400, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    // Проверяем, существует ли пользователь с таким email
    const { data: existingUsers, error: listError } = await adminClient.auth.admin.listUsers();
    if (listError) throw listError;
    const existing = existingUsers.users.find(u => u.email === email);
    if (existing) {
      return new Response(JSON.stringify({ error: "User with this email already exists" }), { status: 409, headers: corsHeaders });
    }

    // Создаём пользователя в Auth
    const { data: user, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: full_name || "", organization: organization || "", phone: phone || "", position: position || "" },
    });
    if (createError) throw createError;

    const userId = user.user.id;

    // Подготовка профиля: используем только текстовое поле organization
    const profileData: any = {
      user_id: userId,
      full_name: full_name || null,
      phone: phone || null,
      position: position || null,
    };
    if (organization !== undefined && organization !== null && organization !== "") {
      profileData.organization = organization;
    }

    // Вставляем профиль (upsert, чтобы избежать дублирования)
    const { error: profileError } = await adminClient
      .from("profiles")
      .upsert(profileData, { onConflict: "user_id" });

    if (profileError) throw profileError;

    // Назначаем роль
    const userRole = role || "customer";
    const { error: roleError } = await adminClient
      .from("user_roles")
      .upsert({ user_id: userId, role: userRole }, { onConflict: "user_id,role" });

    if (roleError) throw roleError;

    return new Response(JSON.stringify({ success: true, user: user.user }), { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error("❌ create-user error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
}
