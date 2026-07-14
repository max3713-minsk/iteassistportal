import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function clientFor(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "list_agents",
  title: "List monitoring agents",
  description: "List installed AP Agent instances (hostname, OS, version, last seen).",
  inputSchema: {
    online_only: z.boolean().default(false).describe("Only agents seen in the last 5 minutes."),
    limit: z.number().int().min(1).max(200).default(100),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ online_only, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const { data, error } = await clientFor(ctx)
      .from("agent_registrations")
      .select("id, agent_id, hostname, os_type, os_version, agent_version, last_seen_at, is_active")
      .order("last_seen_at", { ascending: false, nullsFirst: false })
      .limit(limit);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const rows = online_only
      ? (data ?? []).filter((a: any) => a.last_seen_at && Date.now() - new Date(a.last_seen_at).getTime() < 5 * 60 * 1000)
      : data ?? [];
    return {
      content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
      structuredContent: { rows },
    };
  },
});