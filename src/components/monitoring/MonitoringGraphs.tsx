import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import GraphBuilder from "./GraphBuilder";
import SavedGraphsLibrary from "./SavedGraphsLibrary";

interface Props {
  hosts: any[];
  graphs: any[];
  connectionError: boolean;
}

export default function MonitoringGraphs({ hosts, connectionError }: Props) {
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

  return (
    <div className="space-y-4">
      <GraphBuilder hosts={hostsArr} />
      <SavedGraphsLibrary />
    </div>
  );
}
