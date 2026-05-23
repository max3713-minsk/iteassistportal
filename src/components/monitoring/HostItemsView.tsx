import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Pencil, BarChart3, Thermometer, Fan, Zap, Network, Cpu, HardDrive, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { formatItemValue } from "./formatMetric";
import { Star } from "lucide-react";
import { useFavoriteMetrics } from "@/hooks/useFavoriteMetrics";
import { useMetricTranslations } from "@/hooks/useMetricTranslations";
import MetricGraphDialog from "./MetricGraphDialog";
import MetricLanguageToggle from "./MetricLanguageToggle";

interface ItemAlias {
  id: string;
  item_key: string;
  display_name: string;
  description: string | null;
  category: string | null;
}

interface ZabbixItem {
  itemid: string;
  name: string;
  key_: string;
  lastvalue: string;
  lastclock: string;
  units: string;
  state?: string;
}

interface Props {
  hostId: string;
  zabbixHostId: string | null;
  items: ZabbixItem[];
}

function categorizeItem(key: string, name: string): string {
  const k = (key + " " + name).toLowerCase();
  if (k.match(/temp|термо|температур/)) return "Температура";
  if (k.match(/fan|вентилятор/)) return "Вентиляторы";
  if (k.match(/volt|напряж|p\dv\d|p\dv/)) return "Напряжения";
  if (k.match(/power|psu|питани/)) return "Питание";
  if (k.match(/icmp|ping|net\.|сеть|interface|bandwidth/)) return "Сеть";
  if (k.match(/cpu|processor|загрузк/)) return "Процессор";
  if (k.match(/mem|memory|ram|памят/)) return "Память";
  if (k.match(/disk|vfs|storage|smart|диск/)) return "Диски";
  if (k.match(/state|status|presence|chassis/)) return "Состояние компонентов";
  return "Прочее";
}

const categoryIcons: Record<string, typeof Cpu> = {
  "Температура": Thermometer,
  "Вентиляторы": Fan,
  "Напряжения": Zap,
  "Питание": Zap,
  "Сеть": Network,
  "Процессор": Cpu,
  "Память": Activity,
  "Диски": HardDrive,
  "Состояние компонентов": Activity,
  "Прочее": Activity,
};

export default function HostItemsView({ hostId, zabbixHostId, items }: Props) {
  const { toast } = useToast();
  const { isStaff } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});
  const [editingAlias, setEditingAlias] = useState<{ key: string; name: string; display: string; desc: string } | null>(null);
  const [graphMetric, setGraphMetric] = useState<any>(null);
  const { favoriteItemIds, toggle: toggleFav } = useFavoriteMetrics();
  const { translate, isOriginal } = useMetricTranslations(zabbixHostId);

  const { data: aliases } = useQuery({
    queryKey: ["item-aliases", hostId],
    queryFn: async () => {
      const { data } = await supabase
        .from("item_aliases")
        .select("*")
        .eq("host_id", hostId);
      return (data as ItemAlias[]) || [];
    },
    enabled: !!hostId,
  });

  const aliasMap = useMemo(() => {
    const m = new Map<string, ItemAlias>();
    (aliases || []).forEach((a) => m.set(a.item_key, a));
    return m;
  }, [aliases]);

  const grouped = useMemo(() => {
    const filtered = search
      ? items.filter((i) =>
          i.name.toLowerCase().includes(search.toLowerCase()) ||
          i.key_.toLowerCase().includes(search.toLowerCase()))
      : items;

    const groups: Record<string, ZabbixItem[]> = {};
    for (const it of filtered) {
      const alias = aliasMap.get(it.key_);
      const cat = alias?.category || categorizeItem(it.key_, it.name);
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(it);
    }
    return groups;
  }, [items, search, aliasMap]);

  const saveAlias = useMutation({
    mutationFn: async () => {
      if (!editingAlias) return;
      const existing = aliasMap.get(editingAlias.key);
      if (existing) {
        await supabase.from("item_aliases").update({
          display_name: editingAlias.display,
          description: editingAlias.desc || null,
        }).eq("id", existing.id);
      } else {
        await supabase.from("item_aliases").insert({
          host_id: hostId,
          zabbix_host_id: zabbixHostId,
          item_key: editingAlias.key,
          display_name: editingAlias.display,
          description: editingAlias.desc || null,
          category: categorizeItem(editingAlias.key, editingAlias.name),
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["item-aliases", hostId] });
      toast({ title: "Алиас сохранён" });
      setEditingAlias(null);
    },
    onError: (e: Error) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  });

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Нет данных. Убедитесь, что хост настроен в Zabbix и собирает метрики.
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Поиск по имени или ключу..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <MetricLanguageToggle />
        </div>

        {Object.entries(grouped).map(([category, list]) => {
          const Icon = categoryIcons[category] || Activity;
          const isExpanded = !!expandedCats[category];
          const visibleList = isExpanded ? list : list.slice(0, 30);
          return (
            <Card key={category}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary" />
                  {category} <Badge variant="outline" className="ml-1 text-xs">{list.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {visibleList.map((it) => {
                  const alias = aliasMap.get(it.key_);
                  const display = isOriginal
                    ? it.name
                    : translate({ key_: it.key_, name: it.name });
                  const isFav = favoriteItemIds.has(it.itemid);
                  return (
                    <div
                      key={it.itemid}
                      className="flex items-center gap-3 p-2 rounded hover:bg-muted/40 group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{display}</p>
                          {alias && !isOriginal && <Badge variant="secondary" className="text-[10px] h-4 px-1">алиас</Badge>}
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p className="text-xs text-muted-foreground font-mono truncate cursor-help">
                              {it.key_}
                            </p>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-md">
                            <p className="font-mono text-xs">{it.key_}</p>
                            {it.name && it.name !== display && (
                              <p className="text-xs mt-1 opacity-70">Оригинал: {it.name}</p>
                            )}
                            {alias?.description && <p className="text-xs mt-1">{alias.description}</p>}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-sm font-medium">
                          {formatItemValue(it)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {it.lastclock ? new Date(parseInt(it.lastclock) * 1000).toLocaleTimeString("ru-RU") : "—"}
                        </p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isStaff && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => setEditingAlias({
                              key: it.key_,
                              name: it.name,
                              display: alias?.display_name || it.name,
                              desc: alias?.description || "",
                            })}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className={`h-7 w-7 ${isFav ? "opacity-100 text-amber-500" : ""}`}
                          title={isFav ? "Убрать из избранного" : "В избранное (на дашборд)"}
                          onClick={() => toggleFav({
                            zabbix_host_id: zabbixHostId || hostId,
                            host_name: "",
                            itemid: it.itemid,
                            item_key: it.key_,
                            item_name: display,
                            units: it.units || null,
                          })}
                        >
                          <Star className={`h-3.5 w-3.5 ${isFav ? "fill-current" : ""}`} />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          title="Открыть график"
                          onClick={() => setGraphMetric({
                            itemid: it.itemid,
                            name: it.name,
                            key_: it.key_,
                            units: it.units,
                            hostid: zabbixHostId || hostId,
                            hostName: "",
                            zabbixHostId: zabbixHostId,
                          })}
                        >
                          <BarChart3 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
                {list.length > 30 && (
                  <div className="text-center pt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => setExpandedCats((p) => ({ ...p, [category]: !p[category] }))}
                    >
                      {isExpanded ? "Свернуть" : `Показать все (+ ещё ${list.length - 30})`}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        <Dialog open={!!editingAlias} onOpenChange={(o) => !o && setEditingAlias(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Редактирование отображаемого имени</DialogTitle>
            </DialogHeader>
            {editingAlias && (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Ключ Zabbix</Label>
                  <p className="font-mono text-xs text-muted-foreground">{editingAlias.key}</p>
                </div>
                <div>
                  <Label>Отображаемое имя</Label>
                  <Input
                    value={editingAlias.display}
                    onChange={(e) => setEditingAlias({ ...editingAlias, display: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Описание</Label>
                  <Input
                    value={editingAlias.desc}
                    onChange={(e) => setEditingAlias({ ...editingAlias, desc: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setEditingAlias(null)}>Отмена</Button>
                  <Button onClick={() => saveAlias.mutate()} disabled={saveAlias.isPending}>Сохранить</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <MetricGraphDialog
          open={!!graphMetric}
          onClose={() => setGraphMetric(null)}
          metric={graphMetric}
        />
      </div>
    </TooltipProvider>
  );
}
