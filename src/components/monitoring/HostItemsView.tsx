import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Copy, Star, StarOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatMetricValue, getMetricAge } from "@/lib/zabbix-helpers";

type Metric = {
  itemid: string;
  name: string;
  key_: string;
  lastvalue?: string;
  lastclock?: string;
  units?: string;
};

interface Props {
  hostId: string;
  zabbixHostId: string;
  items: Metric[];
  isLoading?: boolean;
}

export default function HostItemsView({ items, isLoading }: Props) {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});

  const filteredItems = search
    ? items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || i.key_.toLowerCase().includes(search.toLowerCase()))
    : items;

  // Группировка по категориям
  const categories: Record<string, Metric[]> = {};
  for (const item of filteredItems) {
    let cat = "Прочее";
    const key = item.key_.toLowerCase();
    if (key.includes("cpu")) cat = "CPU";
    else if (key.includes("mem")) cat = "Память";
    else if (key.includes("disk")) cat = "Диски";
    else if (key.includes("net")) cat = "Сеть";
    else if (key.includes("temp")) cat = "Температура";
    else if (key.includes("fan")) cat = "Вентиляторы";
    else if (key.includes("power") || key.includes("psu")) cat = "Питание";
    else if (key.includes("vmware")) cat = "VMware";
    else if (key.includes("ipmi")) cat = "IPMI";
    categories[cat] = categories[cat] || [];
    categories[cat].push(item);
  }

  if (isLoading) return <div className="p-4 text-center">Загрузка метрик...</div>;
  if (items.length === 0) return <div className="p-4 text-center text-muted-foreground">Нет метрик</div>;

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Поиск по имени или ключу..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-8"
        />
      </div>
      <div className="space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto pr-2">
        {Object.entries(categories).map(([cat, list]) => {
          const isExpanded = expandedCats[cat] || false;
          const visibleList = isExpanded ? list : list.slice(0, 30);
          const hasMore = list.length > 30;
          return (
            <div key={cat} className="border rounded-md p-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {cat} <Badge variant="outline" className="ml-1 text-xs">{list.length}</Badge>
                </span>
                {hasMore && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => setExpandedCats(p => ({ ...p, [cat]: !p[cat] }))}
                  >
                    {isExpanded ? "Свернуть" : `Показать все (+ ещё ${list.length - 30})`}
                  </Button>
                )}
              </div>
              <div className="mt-2 space-y-1">
                {visibleList.map(item => (
                  <div key={item.itemid} className="flex items-center justify-between p-2 rounded hover:bg-muted/40 group">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{item.name}</div>
                      <code className="text-xs text-muted-foreground font-mono truncate block">{item.key_}</code>
                    </div>
                    <div className="text-right ml-2">
                      <div className="font-mono text-sm">{formatMetricValue(item.lastvalue, item.units)}</div>
                      <div className="text-[10px] text-muted-foreground">{getMetricAge(item.lastclock)}</div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 ml-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => navigator.clipboard.writeText(item.key_).then(() => toast({ title: "Ключ скопирован" }))}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
