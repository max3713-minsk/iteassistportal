import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import GraphBuilder from "./GraphBuilder";
import SavedGraphsLibrary from "./SavedGraphsLibrary";

interface Props {
  hosts: any[];
  graphs: any[];
  connectionError: boolean;
}

export default function MonitoringGraphs({ hosts, connectionError }: Props) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const hostsArr = Array.isArray(hosts) ? hosts : [];

  if (connectionError) {
    return (
      <Card className="border-amber-500/50 bg-amber-500/5">
        <CardContent className="py-8 text-center">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-amber-500" />
          <p className="text-sm text-muted-foreground">
            Подключите Zabbix в разделе «Настройка» для построения графиков
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleSync = () => {
    qc.invalidateQueries({ queryKey: ["zabbix"] });
    qc.invalidateQueries({ queryKey: ["graph-data"] });
    qc.invalidateQueries({ queryKey: ["saved-graphs"] });
    qc.invalidateQueries({ queryKey: ["zabbix-items-for-host"] });
    toast({ title: "Обновление графиков и метрик из Zabbix..." });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleSync}>
          <RefreshCw className="h-3.5 w-3.5 mr-1" />
          Синхронизация с Zabbix
        </Button>
      </div>
      <GraphBuilder hosts={hostsArr} />
      <SavedGraphsLibrary />
    </div>
  );
}
