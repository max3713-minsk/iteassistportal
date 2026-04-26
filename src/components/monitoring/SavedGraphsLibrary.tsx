import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Star, Trash2, Users, FileText, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import GraphChart from "./GraphChart";

interface SavedGraph {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  chart_type: string;
  time_range: string;
  aggregation: string | null;
  host_ids: any;
  item_keys: any;
  is_shared: boolean;
  is_template: boolean;
  tz_requirement_codes: any;
}

export default function SavedGraphsLibrary() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [view, setView] = useState("mine");

  const { data: graphs = [], isLoading } = useQuery({
    queryKey: ["saved-graphs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_graphs")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as SavedGraph[]) || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("saved_graphs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["saved-graphs"] });
      toast({ title: "График удалён" });
    },
    onError: (e: Error) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  });

  const filtered = graphs.filter((g) => {
    if (view === "mine") return g.user_id === user?.id && !g.is_template;
    if (view === "shared") return g.is_shared && !g.is_template;
    if (view === "templates") return g.is_template;
    return true;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Star className="h-4 w-4 text-primary" />
          Библиотека графиков
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={view} onValueChange={setView}>
          <TabsList>
            <TabsTrigger value="mine">Мои ({graphs.filter((g) => g.user_id === user?.id && !g.is_template).length})</TabsTrigger>
            <TabsTrigger value="shared"><Users className="h-3 w-3 mr-1" /> Общие ({graphs.filter((g) => g.is_shared && !g.is_template).length})</TabsTrigger>
            <TabsTrigger value="templates"><FileText className="h-3 w-3 mr-1" /> Шаблоны ТЗ ({graphs.filter((g) => g.is_template).length})</TabsTrigger>
          </TabsList>

          <TabsContent value={view} className="mt-4">
            {isLoading ? (
              <p className="text-sm text-muted-foreground text-center py-8">Загрузка...</p>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12">
                <BarChart3 className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm text-muted-foreground">
                  {view === "mine" ? "Сохраните график через конструктор выше" : view === "shared" ? "Нет общих графиков" : "Нет шаблонов ТЗ"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filtered.map((g) => {
                  const items = Array.isArray(g.item_keys) ? g.item_keys : [];
                  return (
                    <Card key={g.id}>
                      <CardHeader className="pb-2 flex-row items-start justify-between space-y-0">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-sm flex items-center gap-2">
                            {g.name}
                            {g.is_shared && <Badge variant="outline" className="text-xs">Общий</Badge>}
                            {g.is_template && <Badge className="text-xs">Шаблон</Badge>}
                          </CardTitle>
                          {g.description && <p className="text-xs text-muted-foreground mt-1">{g.description}</p>}
                          <p className="text-xs text-muted-foreground mt-1">
                            {items.length} метрик · период: {g.time_range}
                          </p>
                        </div>
                        {g.user_id === user?.id && (
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteMutation.mutate(g.id)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        )}
                      </CardHeader>
                      <CardContent>
                        <GraphChart
                          series={items.map((it: any) => ({
                            hostid: it.hostid,
                            hostName: it.hostName,
                            itemid: it.itemid,
                            itemName: it.name,
                            units: it.units,
                            color: it.color,
                            ip: it.ip,
                            hostGroup: it.hostGroup,
                          }))}
                          timeRange={g.time_range}
                          chartType={g.chart_type as any}
                          aggregation={(g.aggregation as any) || "avg"}
                          height={220}
                          exportable
                          graphName={g.name}
                        />
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
