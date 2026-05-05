import { createContext, useContext, useEffect, useMemo, useState, ReactNode, useCallback } from "react";
import { invokeZabbix } from "@/lib/zabbix-invoke";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ZabbixConnection = {
  id: string;
  name: string;
  organization_id: string;
  is_active: boolean;
  is_default: boolean;
  zabbix_url: string;
  organizations?: { name: string } | null;
};

type Ctx = {
  connections: ZabbixConnection[];
  activeId: string | null;
  active: ZabbixConnection | null;
  setActiveId: (id: string | null) => void;
  isLoading: boolean;
};

const ZabbixConnectionContext = createContext<Ctx>({
  connections: [],
  activeId: null,
  active: null,
  setActiveId: () => {},
  isLoading: true,
});

const STORAGE_KEY = "zabbix.activeConnectionId";

export function ZabbixConnectionProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [activeId, setActiveIdState] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(STORAGE_KEY);
  });

  const { data: connections = [], isLoading } = useQuery({
    queryKey: ["zabbix-connections-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("zabbix_connections")
        .select("id, name, organization_id, is_active, is_default, zabbix_url, organizations(name)")
        .eq("is_active", true)
        .order("is_default", { ascending: false })
        .order("name");
      if (error) throw error;
      return (data ?? []) as unknown as ZabbixConnection[];
    },
  });

  // Pick a sensible default if nothing is selected or stored id is gone.
  useEffect(() => {
    if (!connections.length) return;
    const stored = activeId && connections.find((c) => c.id === activeId);
    if (stored) return;
    const def = connections.find((c) => c.is_default) ?? connections[0];
    if (def) {
      setActiveIdState(def.id);
      try { localStorage.setItem(STORAGE_KEY, def.id); } catch { /* ignore */ }
    }
  }, [connections, activeId]);

  const setActiveId = useCallback((id: string | null) => {
    setActiveIdState(id);
    try {
      if (id) localStorage.setItem(STORAGE_KEY, id);
      else localStorage.removeItem(STORAGE_KEY);
    } catch { /* ignore */ }
    // Refresh anything that may depend on the active connection.
    // Conservative invalidation: anything whose first key segment
    // contains "zabbix" or "monitoring".
    qc.invalidateQueries({
      predicate: (q) => {
        const k = q.queryKey?.[0];
        return typeof k === "string" && (k.includes("zabbix") || k.includes("monitoring") || k.includes("hosts") || k.includes("problems") || k.includes("events"));
      },
    });
  }, [qc]);

  const active = useMemo(
    () => connections.find((c) => c.id === activeId) ?? null,
    [connections, activeId],
  );

  return (
    <ZabbixConnectionContext.Provider value={{ connections, activeId, active, setActiveId, isLoading }}>
      {children}
    </ZabbixConnectionContext.Provider>
  );
}

export function useZabbixConnection() {
  return useContext(ZabbixConnectionContext);
}

/**
 * Helper to inject the active connection id into edge function payloads.
 * Use as: invokeZabbix( withZabbixConn(activeId, { action: "..." }))
 */
export function withZabbixConn<T extends object>(connectionId: string | null, body: T): { body: T & { connection_id?: string } } {
  return { body: { ...body, ...(connectionId ? { connection_id: connectionId } : {}) } };
}