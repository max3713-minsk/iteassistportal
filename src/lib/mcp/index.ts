import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listOrganizations from "./tools/list-organizations";
import listTickets from "./tools/list-tickets";
import listAgents from "./tools/list-agents";
import listEquipment from "./tools/list-equipment";

// See app-mcp-server-authoring: derive issuer from project ref only.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "ite-assist-portal-mcp",
  title: "ITE Assist Portal",
  version: "0.1.0",
  instructions:
    "Read-only tools for the ITE Assist Portal: organizations, tickets, monitoring agents, and equipment. All queries run as the signed-in user with RLS enforced.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listOrganizations, listTickets, listAgents, listEquipment],
});