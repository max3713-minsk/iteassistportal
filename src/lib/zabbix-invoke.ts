import { supabase } from "@/integrations/supabase/client";

/**
 * Reads the currently selected Zabbix connection id from localStorage.
 * The provider in src/hooks/useZabbixConnection.tsx writes this value.
 * Reading from storage (instead of context) lets non-React code and
 * legacy invocations participate without a refactor.
 */
function activeConnectionId(): string | null {
  try {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("zabbix.activeConnectionId");
  } catch {
    return null;
  }
}

/**
 * Drop-in replacement for `invokeZabbix( { body })`
 * that automatically injects `connection_id` from the global picker.
 */
export function invokeZabbix<T = unknown>(payload: { body?: Record<string, unknown> } = {}) {
  const id = activeConnectionId();
  const nextBody = { ...(payload.body ?? {}), ...(id ? { connection_id: id } : {}) };
  return supabase.functions.invoke<T>("zabbix-proxy", { body: nextBody });
}