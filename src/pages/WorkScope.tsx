import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { ListChecks, Tag, Lightbulb, BarChart3 } from "lucide-react";
import WorkScopeManager from "@/components/help/WorkScopeManager";
import EquipmentCategoriesManager from "@/components/help/EquipmentCategoriesManager";
import WorkScopeCoverage from "@/components/monitoring/WorkScopeCoverage";
import { useAuth } from "@/hooks/useAuth";

export default function WorkScope() {
  const { hasRole } = useAuth();
  const canManage = hasRole("admin") || hasRole("engineer");

  const { data: tasksCount = 0 } = useQuery({
    queryKey: ["ws-tasks-count"],
    queryFn: async () => {
      const { count } = await supabase.from("maintenance_tasks").select("id", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
          <ListChecks className="h-6 w-6 text-primary" /> Регламент работ
        </h1>
      </div>

      <Tabs defaultValue="scope">
        <TabsList>
          <TabsTrigger value="scope" className="gap-1.5">
            <ListChecks className="h-3.5 w-3.5" /> Состав работ
          </TabsTrigger>
          <TabsTrigger value="cats" className="gap-1.5">
            <Tag className="h-3.5 w-3.5" /> Категории
          </TabsTrigger>
          <TabsTrigger value="coverage" className="gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" /> Покрытие работ
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scope" className="space-y-4 mt-4">
          {tasksCount === 0 && canManage && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="pt-4 flex gap-3 items-start">
                <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Загрузите Excel-файл с перечнем работ</p>
                  <p className="text-muted-foreground mt-1">
                    Система автоматически разобьёт работы по регламентам и создаст шаблоны для протоколов
                    обслуживания. Колонки: <strong>Наименование</strong>, <strong>Описание</strong>,
                    <strong> Периодичность</strong>, <strong>Категория</strong>, <strong>ЦОД</strong>.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          <WorkScopeManager />
        </TabsContent>

        <TabsContent value="cats" className="space-y-4 mt-4">
          <EquipmentCategoriesManager />
        </TabsContent>

        <TabsContent value="coverage" className="space-y-4 mt-4">
          <WorkScopeCoverage />
        </TabsContent>
      </Tabs>
    </div>
  );
}