import { supabase } from "@/integrations/supabase/client";

export async function logAudit(params: {
  action: string;
  module: string;
  entityId?: string;
  details?: string;
}) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, organization")
      .eq("user_id", session.user.id)
      .single();

    await supabase.from("audit_logs").insert({
      user_id: session.user.id,
      user_name: profile?.full_name || session.user.email || "—",
      organization: profile?.organization || null,
      action: params.action,
      module: params.module,
      entity_id: params.entityId,
      details: params.details,
    } as any);
  } catch (e) {
    console.error("Audit log error:", e);
  }
}
