import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Save, Star, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useFavoriteMetrics } from "@/hooks/useFavoriteMetrics";
import { useMetricTranslations } from "@/hooks/useMetricTranslations";
import GraphChart from "./GraphChart";

interface Props {
  open: boolean;
  onClose: () => void;
  metric: {
    itemid: string;
    name: string;
    key_: string;
    units?: string;
    hostid: string;
    hostName: string;
    zabbixHostId?: string | null;
  } | null;
}

const RANGES = [
  { value: "1h", label: "1 час" },
  { value: "6h", label: "6 часов" },
  { value: "1d", label: "1 день" },
  { value: "1w", label: "1 неделя" },
  { value: "1m", label: "1 месяц" },
];

const CHART_TYPES = [
  { value: "line", label: "Линейный" },
  { value: "area", label: "Область" },
  { value: "bar", label: "Столбцы" },
];

const AGGREGATIONS = [
  { value: "avg", label: "Среднее" },
  { value: "min", label: "Минимум" },
  { value: "max", label: "Максимум" },
];

export default function MetricGraphDialog({ open, onClose, metric }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { translate } = useMetricTranslations(metric?.zabbixHostId);
  const { favoriteItemIds, toggle: toggleFav } = useFavoriteMetrics();

  const [timeRange, setTimeRange] = useState("1h");
  const [chartType, setChartType] = useState<"line" | "area" | "bar">("line");
  const [aggregation, setAggregation] = useState<"avg" | "min" | "max">("avg");
  const [savingName, setSavingName] = useState("");
  const [saveOpen, setSaveOpen] = useState(false);

  const saveGraph = useMutation({
    mutationFn: async () => {
      if (!user || !metric) throw new Error("Нет данных");
      if (!savingName.trim()) throw new Error("Укажите название");
      const { error } = await supabase.from("saved_graphs").insert({
        user_id: user.id,
        name: savingName,
        chart_type: chartType,
        time_range: timeRange,
        aggregation,
        host_ids: [metric.hostid],
        item_keys: [{
          itemid: metric.itemid,
          item_key: metric.key_,
          name: metric.name,
          units: metric.units,
          hostid: metric.hostid,
          hostName: metric.hostName,
        }],
        is_shared: false,
        is_template: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["saved-graphs"] });
      toast({ title: "График сохранён в библиотеку", description: savingName });
      setSavingName("");
      setSaveOpen(false);
    },
    onError: (e: Error) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  });

  if (!metric) return null;

  const displayName = translate({ key_: metric.key_, name: metric.name });
  const isFav = favoriteItemIds.has(metric.itemid);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 pr-6">
            <span className="truncate">{displayName}</span>
            <Badge variant="outline" className="font-mono text-xs shrink-0">{metric.hostName}</Badge>
          </DialogTitle>
          <p className="text-xs font-mono text-muted-foreground">{metric.key_}</p>
        </DialogHeader>

        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <Label className="text-xs">Период</Label>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {RANGES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Тип графика</Label>
            <Select value={chartType} onValueChange={(v: any) => setChartType(v)}>
              <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CHART_TYPES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Дискретность (тренды)</Label>
            <Select value={aggregation} onValueChange={(v: any) => setAggregation(v)}>
              <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {AGGREGATIONS.map((a) => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1" />

          <Button
            variant={isFav ? "default" : "outline"}
            size="sm"
            onClick={() => toggleFav({
              zabbix_host_id: metric.zabbixHostId || metric.hostid,
              host_name: metric.hostName,
              itemid: metric.itemid,
              item_key: metric.key_,
              item_name: displayName,
              units: metric.units || null,
            })}
            title={isFav ? "Убрать с дашборда" : "На дашборд"}
          >
            <Star className={`h-4 w-4 mr-1 ${isFav ? "fill-current" : ""}`} />
            {isFav ? "На дашборде" : "На дашборд"}
          </Button>

          <Button variant="outline" size="sm" onClick={() => { setSavingName(displayName); setSaveOpen(true); }}>
            <Save className="h-4 w-4 mr-1" />
            В библиотеку
          </Button>
        </div>

        <GraphChart
          series={[{
            hostid: metric.hostid,
            hostName: metric.hostName,
            itemid: metric.itemid,
            itemName: displayName,
            units: metric.units,
          }]}
          timeRange={timeRange}
          chartType={chartType}
          aggregation={aggregation}
          height={380}
          exportable
          graphName={displayName}
        />

        {saveOpen && (
          <div className="border-t pt-3 space-y-2">
            <Label>Название графика для библиотеки</Label>
            <div className="flex gap-2">
              <Input value={savingName} onChange={(e) => setSavingName(e.target.value)} />
              <Button onClick={() => saveGraph.mutate()} disabled={saveGraph.isPending}>
                {saveGraph.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Сохранить"}
              </Button>
              <Button variant="ghost" onClick={() => setSaveOpen(false)}>Отмена</Button>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Закрыть</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}