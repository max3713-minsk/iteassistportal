import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { invokeZabbix } from "@/lib/zabbix-invoke";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, BarChart3, Loader2, X } from "lucide-react";
import MetricGraphDialog from "@/components/monitoring/MetricGraphDialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface MetricBinding {
  hostid: string;
  host_name: string;
  itemid: string;
  item_key: string;
  item_name: string;
  units?: string;
  time_range?: string;     // 1h | 6h | 1d | 1w | 1m
  aggregation?: "avg" | "min" | "max";
  chart_type?: "line" | "area" | "bar";
}

const RANGES = [
  { value: "1h", label: "1 час" },
  { value: "6h", label: "6 часов" },
  { value: "1d", label: "1 день" },
  { value: "1w", label: "1 неделя" },
  { value: "1m", label: "1 месяц" },
];

interface Props {
  bindings: MetricBinding[];
  onChange: (next: MetricBinding[]) => void;
}

export default function TaskMetricBindings({ bindings, onChange }: Props) {
  const [adding, setAdding] = useState(false);
  const [pickHost, setPickHost] = useState<string>("");
  const [pickItem, setPickItem] = useState<string>("");
  const [pickRange, setPickRange] = useState<string>("1d");
  const [search, setSearch] = useState("");
  const [graphFor, setGraphFor] = useState<MetricBinding | null>(null);

  const { data: hosts = [], isLoading: hostsLoading } = useQuery({
    queryKey: ["zabbix-hosts-for-binding"],
    queryFn: async () => {
      const { data, error } = await invokeZabbix({ body: { action: "getHosts" } });
      if (error) throw error;
      return ((data?.result ?? []) as any[]).map((h) => ({
        hostid: h.hostid, name: h.name ?? h.host,
      }));
    },
    enabled: adding,
  });

  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ["zabbix-items-for-binding", pickHost],
    queryFn: async () => {
      if (!pickHost) return [];
      const { data, error } = await invokeZabbix({
        body: { action: "getItemsByHost", params: { hostid: pickHost } },
      });
      if (error) throw error;
      return ((data?.result ?? []) as any[]).map((i) => ({
        itemid: i.itemid, key_: i.key_, name: i.name, units: i.units,
      }));
    },
    enabled: !!pickHost,
  });

  const filteredItems = items.filter((i: any) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return i.name.toLowerCase().includes(q) || i.key_.toLowerCase().includes(q);
  }).slice(0, 200);

  function commitAdd() {
    if (!pickHost || !pickItem) return;
    const h = hosts.find((x: any) => x.hostid === pickHost);
    const i = items.find((x: any) => x.itemid === pickItem);
    if (!h || !i) return;
    const exists = bindings.some((b) => b.hostid === h.hostid && b.itemid === i.itemid);
    if (exists) {
      setAdding(false); return;
    }
    onChange([
      ...bindings,
      {
        hostid: h.hostid, host_name: h.name,
        itemid: i.itemid, item_key: i.key_, item_name: i.name, units: i.units,
        time_range: pickRange, aggregation: "avg", chart_type: "line",
      },
    ]);
    setPickItem(""); setSearch(""); setAdding(false);
  }

  function removeAt(idx: number) {
    onChange(bindings.filter((_, i) => i !== idx));
  }

  function updateRange(idx: number, range: string) {
    onChange(bindings.map((b, i) => i === idx ? { ...b, time_range: range } : b));
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm">Привязка метрик Zabbix</Label>
        {!adding && (
          <Button type="button" variant="outline" size="sm" onClick={() => setAdding(true)} className="gap-1">
            <Plus className="h-3.5 w-3.5" /> Добавить
          </Button>
        )}
      </div>

      {bindings.length === 0 && !adding && (
        <p className="text-xs text-muted-foreground">
          Метрики не привязаны. Привяжите item с хоста Zabbix, чтобы пункт регламента считался покрытым автоматическим контролем.
        </p>
      )}

      {bindings.length > 0 && (
        <div className="border rounded-md divide-y">
          {bindings.map((b, idx) => (
            <div key={`${b.hostid}:${b.itemid}`} className="flex items-center gap-2 px-2 py-1.5 text-xs">
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{b.item_name}</p>
                <p className="text-muted-foreground font-mono truncate">{b.host_name} · {b.item_key}{b.units ? ` · ${b.units}` : ""}</p>
              </div>
              <Select value={b.time_range ?? "1d"} onValueChange={(v) => updateRange(idx, v)}>
                <SelectTrigger className="h-7 w-[110px] text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RANGES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => setGraphFor(b)} title="График">
                <BarChart3 className="h-3.5 w-3.5" />
              </Button>
              <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeAt(idx)} title="Удалить">
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {adding && (
        <div className="border rounded-md p-2 space-y-2 bg-muted/20">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium">Новая привязка</p>
            <Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={() => { setAdding(false); setPickHost(""); setPickItem(""); }}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[11px]">Хост</Label>
              <Select value={pickHost} onValueChange={(v) => { setPickHost(v); setPickItem(""); }}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder={hostsLoading ? "Загрузка..." : "Выберите хост"} />
                </SelectTrigger>
                <SelectContent>
                  {hosts.map((h: any) => <SelectItem key={h.hostid} value={h.hostid}>{h.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">Период по умолчанию</Label>
              <Select value={pickRange} onValueChange={setPickRange}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RANGES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {pickHost && (
            <div className="space-y-1">
              <Label className="text-[11px]">Метрика (item)</Label>
              <Input
                value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск по имени или ключу..." className="h-8 text-xs"
              />
              <ScrollArea className="h-[180px] border rounded-md bg-background">
                {itemsLoading ? (
                  <div className="p-3 text-xs text-muted-foreground flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" /> Загрузка метрик...
                  </div>
                ) : filteredItems.length === 0 ? (
                  <p className="p-3 text-xs text-muted-foreground">Нет метрик</p>
                ) : (
                  <div className="p-1">
                    {filteredItems.map((i: any) => (
                      <button
                        key={i.itemid}
                        type="button"
                        onClick={() => setPickItem(i.itemid)}
                        className={`w-full text-left px-2 py-1 rounded text-xs hover:bg-muted ${pickItem === i.itemid ? "bg-primary/15 text-primary" : ""}`}
                      >
                        <p className="font-medium truncate">{i.name}</p>
                        <p className="font-mono text-[10px] text-muted-foreground truncate">{i.key_}{i.units ? ` · ${i.units}` : ""}</p>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" size="sm" variant="ghost" onClick={() => setAdding(false)}>Отмена</Button>
            <Button type="button" size="sm" disabled={!pickHost || !pickItem} onClick={commitAdd}>Привязать</Button>
          </div>
        </div>
      )}

      {graphFor && (
        <MetricGraphDialog
          open={!!graphFor}
          onClose={() => setGraphFor(null)}
          metric={{
            itemid: graphFor.itemid,
            name: graphFor.item_name,
            key_: graphFor.item_key,
            units: graphFor.units,
            hostid: graphFor.hostid,
            hostName: graphFor.host_name,
            zabbixHostId: graphFor.hostid,
          }}
        />
      )}
    </div>
  );
}