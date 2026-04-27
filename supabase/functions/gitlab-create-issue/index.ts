import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateIssuePayload {
  ticket_id: string;
  title: string;
  description?: string;
  priority?: string;          // P1..P4
  request_type?: string;
  subcategory?: string;
  assignee_username?: string; // override assignee
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const body = (await req.json()) as CreateIssuePayload;
    if (!body.ticket_id || !body.title) {
      return new Response(JSON.stringify({ error: "ticket_id and title required" }), { status: 400, headers: corsHeaders });
    }

    // Service role for settings access (RLS-bypass)
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: setting } = await admin
      .from("integration_settings")
      .select("config, enabled")
      .eq("key", "gitlab")
      .maybeSingle();

    if (!setting?.enabled) {
      return new Response(JSON.stringify({ error: "GitLab integration is disabled" }), { status: 400, headers: corsHeaders });
    }
    const cfg = setting.config as Record<string, any>;
    const baseUrl = (cfg.base_url || "").replace(/\/$/, "");
    const token = cfg.token as string;
    const projectId = cfg.project_id as string;
    if (!baseUrl || !token || !projectId) {
      return new Response(JSON.stringify({ error: "GitLab not fully configured (base_url, token, project_id)" }), { status: 400, headers: corsHeaders });
    }

    // Build labels and assignee from mapping
    const labels: string[] = [];
    if (body.priority) labels.push(`priority:${body.priority}`);
    if (body.request_type) labels.push(`type:${body.request_type}`);
    if (body.subcategory) labels.push(`category:${body.subcategory}`);
    const mapping = (cfg.label_mapping || {}) as Record<string, string>;
    Object.entries(mapping).forEach(([k, v]) => {
      if (body.priority === k || body.request_type === k || body.subcategory === k) labels.push(v);
    });
    const assigneeMapping = (cfg.assignee_mapping || {}) as Record<string, string>;
    const assignee = body.assignee_username
      || (body.priority && assigneeMapping[body.priority])
      || (body.subcategory && assigneeMapping[body.subcategory])
      || cfg.default_assignee;

    // Create GitLab issue
    const issueRes = await fetch(`${baseUrl}/api/v4/projects/${encodeURIComponent(projectId)}/issues`, {
      method: "POST",
      headers: { "PRIVATE-TOKEN": token, "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `[ITEA-${body.ticket_id.slice(0, 8)}] ${body.title}`,
        description: body.description || "",
        labels: labels.join(","),
        assignee_ids: assignee ? undefined : undefined, // assignee resolved by username below
      }),
    });
    if (!issueRes.ok) {
      const text = await issueRes.text();
      return new Response(JSON.stringify({ error: `GitLab API ${issueRes.status}: ${text}` }), { status: 502, headers: corsHeaders });
    }
    const issue = await issueRes.json();

    // Optional: assign by username via separate call
    if (assignee) {
      try {
        const u = await fetch(`${baseUrl}/api/v4/users?username=${encodeURIComponent(assignee)}`, {
          headers: { "PRIVATE-TOKEN": token },
        });
        const users = await u.json();
        if (Array.isArray(users) && users[0]?.id) {
          await fetch(`${baseUrl}/api/v4/projects/${encodeURIComponent(projectId)}/issues/${issue.iid}`, {
            method: "PUT",
            headers: { "PRIVATE-TOKEN": token, "Content-Type": "application/json" },
            body: JSON.stringify({ assignee_ids: [users[0].id] }),
          });
        }
      } catch (_) { /* non-fatal */ }
    }

    // Save link
    await admin.from("gitlab_ticket_links").insert({
      ticket_id: body.ticket_id,
      project_id: projectId,
      issue_iid: issue.iid,
      issue_url: issue.web_url,
      issue_state: issue.state,
      created_by: user.id,
    });

    return new Response(JSON.stringify({ ok: true, issue_iid: issue.iid, issue_url: issue.web_url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: corsHeaders });
  }
});