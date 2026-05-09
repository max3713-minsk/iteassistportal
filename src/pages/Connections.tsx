import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plug, Activity, GitBranch, FolderArchive } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import ZabbixConnections from "@/pages/ZabbixConnections";
import Integrations from "@/pages/Integrations";

/**
 * Unified "Подключения" page.
 * Reuses the original Zabbix and Integrations pages as embedded panels.
 * Tab can be preselected via ?tab=zabbix|gitlab|seafile.
 */
export default function Connections() {
  const { hasRole } = useAuth();
  const [params, setParams] = useSearchParams();
  const initial = params.get("tab") === "gitlab" || params.get("tab") === "seafile" ? "integrations" : "zabbix";

  if (!hasRole("admin")) {
    return (
      <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">
        Доступ только для администраторов
      </CardContent></Card>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
        <Plug className="h-6 w-6 text-primary" /> Подключения
      </h1>
      <Tabs
        defaultValue={initial}
        onValueChange={(v) => {
          const next = new URLSearchParams(params);
          next.set("tab", v);
          setParams(next, { replace: true });
        }}
      >
        <TabsList>
          <TabsTrigger value="zabbix" className="gap-1.5">
            <Activity className="h-3.5 w-3.5" /> Zabbix
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-1.5">
            <GitBranch className="h-3.5 w-3.5" /> GitLab / <FolderArchive className="h-3.5 w-3.5" /> Seafile
          </TabsTrigger>
        </TabsList>
        <TabsContent value="zabbix" className="mt-4">
          <ZabbixConnections />
        </TabsContent>
        <TabsContent value="integrations" className="mt-4">
          <Integrations />
        </TabsContent>
      </Tabs>
    </div>
  );
}