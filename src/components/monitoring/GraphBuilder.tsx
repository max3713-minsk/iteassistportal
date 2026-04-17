import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Save, Plus, X, Loader2, Search } from "lucide-react";
import GraphChart from "./GraphChart";

interface Props {
  hosts: any[];
  initialHostId?: string;
  initialItemIds?: string[];
  onSaved?: () => void;
}

interface SelectedItem {
  hostid: string;
  hostName: string;
  itemid: string;
  itemName: string;
  itemKey: string;
  units?: string;
}

export default function GraphBuilder({ hosts, initialHostId, initialItemIds = [], onSaved }: Props) {
  const { toast } = useToast();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [selectedHost, setSelectedHost] = useState(initialHostId || "");
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [chartType, setChartType] = useState<"line" | "area" | "bar">("line");
  const [timeRange, setTimeRange] = useState("1h");
  const [aggregation, setAggregation] = useState<"avg" | "min" | "max">("avg");
  const [search, setSearch] = useState("");
  const [saveOpen, setSaveOpen] = useState(false);
  const [graphName, setGraphName] = useState("");
  const [graphDesc, setGraphDesc] = useState("");
  const [isShared, setIsShared] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Fetch items for selected host
  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ["zabbix-items-for-host", selectedHost],
    queryFn: async () => {
      if (!selectedHost) return [];
      const { data, error } = await supabase.functions.invoke("zabbix-proxy", {
        body: { action: "getItems", params: { hostids: [selectedHost], filter: { status: 0 } } },
      });
      if (error) throw error;
      return data?.result ?? [];
    },
    enabled: !!selectedHost,
  });

  // Auto-select initial items once items are loaded
  useEffect(() => {
    if (initialItemIds.length && items.length && selectedItems.length === 0) {
      const matched = items
        .filter((it: any) => initialItemIds.includes(it.itemid))
        .map((it: any) => ({
          hostid: it.hosts?.[0]?.hostid || selectedHost,
          hostName: it.hosts?.[0]?.name || "",
          itemid: it.itemid,
          itemName: it.name,
          itemKey: it.key_,
          units: it.units,
        }));
      if (matched.length) setSelectedItems(matched);
    }
  }, [items, initialItemIds]);

  const filteredItems = useMemo(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter((it: any) => it.name?.toLowerCase().includes(q) || it.key_?.toLowerCase().includes(q));
  }, [items, search]);

  const addItem = (item: any) => {
    const host = hosts.find((h) => h.hostid === selectedHost);
    if (selectedItems.some((s) => s.itemid === item.itemid)) return;
    setSelectedItems([
      ...selectedItems,
      {
        hostid: selectedHost,
        hostName: host?.name || "",
        itemid: item.itemid,
        itemName: item.name,
        itemKey: item.key_,
        units: item.units,
      },
    ]);
  };

  const removeItem = (itemid: string) => {
    setSelectedItems(selectedItems.filter((s) => s.itemid !== itemid));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Не авторизован");
      if (!graphName.trim()) throw new Error("Укажите название графика");
      const { error } = await supabase.from("saved_graphs").insert({
        user_id: user.id,
        name: graphName,
        description: graphDesc || null,
        chart_type: chartType,
        time_range: timeRange,
        aggregation,
        host_ids: selectedItems.map((s) => s.hostid),
        item_keys: selectedItems.map((s) => ({
          itemid: s.itemid,
          item_key: s.itemKey,
          name: s.itemName,
          units: s.units,
          hostid: s.hostid,
          hostName: s.hostName,
        })),
        is_shared: isShared,
        is_template: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["saved-graphs"] });
      toast({ title: "График сохранён", description: graphName });
      setSaveOpen(false);
      setGraphName("");
      setGraphDesc("");
      setIsShared(false);
      onSaved?.();
    },
    onError: (e: Error) => toast({ title: "Ошибка сохранения", description: e.message, variant: "destructive" }),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Конструктор графика</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[220px]">
            <Label className="text-xs">Хост</Label>
            <Select value={selectedHost} onValueChange={(v) => { setSelectedHost(v); setSelectedItems([]); }}>
              <SelectTrigger><SelectValue placeholder="Выберите хост" /></SelectTrigger>
              <SelectContent>
                {hosts.map((h) => (
                  <SelectItem key={h.hostid} value={h.hostid}>{h.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Период</Label>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">1 час</SelectItem>
                <SelectItem value="6h">6 часов</SelectItem>
                <SelectItem value="1d">1 день</SelectItem>
                <SelectItem value="1w">1 неделя</SelectItem>
                <SelectItem value="1m">1 месяц</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Тип</Label>
            <Select value={chartType} onValueChange={(v: any) => setChartType(v)}>
              <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="line">Линейный</SelectItem>
                <SelectItem value="area">Область</SelectItem>
                <SelectItem value="bar">Столбцы</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Агрегация (тренды)</Label>
            <Select value={aggregation} onValueChange={(v: any) => setAggregation(v)}>
              <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="avg">Среднее</SelectItem>
                <SelectItem value="min">Минимум</SelectItem>
                <SelectItem value="max">Максимум</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={!selectedHost}>
                <Plus className="h-4 w-4 mr-1" /> Добавить метрику
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Выбор метрик</DialogTitle>
              </DialogHeader>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск по имени или ключу..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              <ScrollArea className="h-[400px] pr-3">
                {itemsLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
                ) : filteredItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Метрики не найдены</p>
                ) : (
                  <div className="space-y-1">
                    {filteredItems.slice(0, 200).map((it: any) => {
                      const isSelected = selectedItems.some((s) => s.itemid === it.itemid);
                      return (
                        <div
                          key={it.itemid}
                          className={`flex items-center justify-between p-2 rounded hover:bg-muted/50 cursor-pointer ${isSelected ? "bg-primary/10" : ""}`}
                          onClick={() => isSelected ? removeItem(it.itemid) : addItem(it)}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{it.name}</p>
                            <p className="text-xs text-muted-foreground truncate font-mono">{it.key_}</p>
                          </div>
                          <div className="flex items-center gap-2 ml-2">
                            {it.lastvalue && (
                              <Badge variant="outline" className="text-xs">
                                {it.lastvalue} {it.units}
                              </Badge>
                            )}
                            <Checkbox checked={isSelected} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
              <DialogFooter>
                <Button onClick={() => setPickerOpen(false)}>Готово ({selectedItems.length})</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
            <DialogTrigger asChild>
              <Button disabled={selectedItems.length === 0}>
                <Save className="h-4 w-4 mr-1" /> Сохранить
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Сохранить график в библиотеку</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Название *</Label>
                  <Input value={graphName} onChange={(e) => setGraphName(e.target.value)} placeholder="CPU нагрузка БД" />
                </div>
                <div>
                  <Label>Описание</Label>
                  <Textarea value={graphDesc} onChange={(e) => setGraphDesc(e.target.value)} rows={2} />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="shared" checked={isShared} onCheckedChange={(c) => setIsShared(c === true)} />
                  <Label htmlFor="shared" className="text-sm font-normal">Поделиться со всеми (общий график)</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSaveOpen(false)}>Отмена</Button>
                <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  Сохранить
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Selected metrics chips */}
        {selectedItems.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedItems.map((s) => (
              <Badge key={s.itemid} variant="secondary" className="gap-1 pr-1">
                <span className="text-xs">{s.hostName}: {s.itemName}</span>
                <Button size="icon" variant="ghost" className="h-4 w-4 ml-1" onClick={() => removeItem(s.itemid)}>
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        )}

        {/* Chart */}
        <GraphChart
          series={selectedItems.map((s) => ({
            hostid: s.hostid,
            hostName: s.hostName,
            itemid: s.itemid,
            itemName: s.itemName,
            units: s.units,
          }))}
          timeRange={timeRange}
          chartType={chartType}
          aggregation={aggregation}
          height={400}
          exportable
          graphName={graphName || "preview"}
        />
      </CardContent>
    </Card>
  );
}
