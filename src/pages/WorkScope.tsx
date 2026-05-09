import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ListChecks, Zap, FileText, ArrowRight, Lightbulb } from "lucide-react";
import WorkScopeManager from "@/components/help/WorkScopeManager";
import CreateProtocolDialog from "@/components/protocols/CreateProtocolDialog";
import { frequencyLabels, FrequencyType } from "@/lib/schedule-utils";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";

const FREQS: FrequencyType[] = ["daily", "weekly", "monthly", "quarterly", "semi_annual"];

export default function WorkScope() {
  const { hasRole } = useAuth();
  const canManage = hasRole("admin") || hasRole("engineer");

  const [filterSite, setFilterSite] = useState("all");
  const [filterFreq, setFilterFreq] = useState<FrequencyType>("daily");
  const [filterDate, setFilterDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const { data: sites = [] } = useQuery({
    queryKey: ["ws-sites"],
    queryFn: async () => (await supabase.from("sites").select("id, name").order("name")).data ?? [],
  });

  const { data: protocols = [], refetch } = useQuery({
    queryKey: ["ws-protocols", filterSite, filterFreq, filterDate],
    queryFn: async () => {
      let q = supabase
        .from("maintenance_protocols")
        .select("id, status, period_start, period_end, frequency, sites(name), site_id")
        .eq("frequency", filterFreq)
        .lte("period_start", filterDate)
        .gte("period_end", filterDate);
      if (filterSite !== "all") q = q.eq("site_id", filterSite);
      const { data } = await q.order("created_at", { ascending: false });
      return data ?? [];
    },
  });

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
          <TabsTrigger value="quick" className="gap-1.5">
            <Zap className="h-3.5 w-3.5" /> Быстрый отчёт
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
                    обслуживания. Ожидаемые колонки: <strong>Наименование</strong>, <strong>Описание</strong>,
                    <strong> Периодичность</strong> (Ежедневно / Еженедельно / Ежемесячно / Ежеквартально /
                    Раз в полгода / По запросу), <strong>Категория</strong>, <strong>ЦОД</strong>.
                    Воспользуйтесь кнопкой «Шаблон» ниже, чтобы скачать пустой XLSX.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          <WorkScopeManager />
        </TabsContent>

        <TabsContent value="quick" className="space-y-4 mt-4">
          <Card>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                <div className="space-y-1.5">
                  <Label>ЦОД</Label>
                  <Select value={filterSite} onValueChange={setFilterSite}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все ЦОД</SelectItem>
                      {sites.map((s: any) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Регламент</Label>
                  <Select value={filterFreq} onValueChange={(v) => setFilterFreq(v as FrequencyType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FREQS.map((f) => (
                        <SelectItem key={f} value={f}>{frequencyLabels[f]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Дата</Label>
                  <Input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
                </div>
                {canManage && (
                  <CreateProtocolDialog defaultDate={filterDate} />
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="text-sm font-medium mb-3">
                Найдено протоколов: {protocols.length}
              </div>
              {protocols.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  Нет существующих протоколов под выбранные параметры. Нажмите «Создать протокол» выше,
                  чтобы сформировать новый.
                </p>
              ) : (
                <div className="space-y-2">
                  {protocols.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border hover:border-primary/40 transition-colors">
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">
                          {p.sites?.name ?? "—"} · {frequencyLabels[p.frequency]}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {p.period_start} — {p.period_end} · статус: {p.status}
                        </div>
                      </div>
                      <Link to={`/protocols`}>
                        <Button size="sm" variant="outline" className="gap-1">
                          Открыть <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Завершённые протоколы можно отправить в Seafile или GitLab из карточки протокола
                  (раздел «Протоколы»). Проверьте, что соответствующая интеграция настроена в
                  <Link to="/connections" className="text-primary underline mx-1">Подключениях</Link>.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}