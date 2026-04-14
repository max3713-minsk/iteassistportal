import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { frequencyLabels, frequencyColors, type FrequencyType } from "@/lib/schedule-utils";
import { Search, Filter } from "lucide-react";

const FREQ_ORDER: FrequencyType[] = ["daily", "weekly", "monthly", "quarterly", "semi_annual", "on_request"];

export default function WorkScopeReference() {
  const [filterFrequency, setFilterFrequency] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data: categories = [] } = useQuery({
    queryKey: ["equipment-categories-all"],
    queryFn: async () => {
      const { data } = await supabase
        .from("equipment_categories")
        .select("id, name, description")
        .order("name");
      return data ?? [];
    },
  });

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["maintenance-tasks-all-ref"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_tasks")
        .select("id, title, description, frequency, category_id, equipment_categories(name)")
        .order("title");
      if (error) throw error;
      return (data ?? []).map((t: any) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        frequency: t.frequency as FrequencyType,
        category_id: t.category_id,
        categoryName: t.equipment_categories?.name ?? "Без категории",
      }));
    },
  });

  const filtered = useMemo(() => {
    let result = tasks;
    if (filterFrequency !== "all") {
      result = result.filter((t) => t.frequency === filterFrequency);
    }
    if (filterCategory !== "all") {
      result = result.filter((t) => t.category_id === filterCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q))
      );
    }
    return result;
  }, [tasks, filterFrequency, filterCategory, search]);

  // Group by category
  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const t of filtered) {
      const key = t.categoryName;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    // Sort tasks within each group by frequency order, then title
    for (const [, items] of map) {
      items.sort((a, b) => {
        const fi = FREQ_ORDER.indexOf(a.frequency);
        const fj = FREQ_ORDER.indexOf(b.frequency);
        if (fi !== fj) return fi - fj;
        return a.title.localeCompare(b.title, "ru");
      });
    }
    return map;
  }, [filtered]);

  // Stats
  const stats = useMemo(() => {
    const byFreq: Record<string, number> = {};
    for (const t of tasks) {
      byFreq[t.frequency] = (byFreq[t.frequency] || 0) + 1;
    }
    return byFreq;
  }, [tasks]);

  if (isLoading) {
    return <p className="text-muted-foreground">Загрузка...</p>;
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {FREQ_ORDER.map((f) => (
          <Card
            key={f}
            className={cn(
              "cursor-pointer transition-all hover:ring-2 ring-primary/30",
              filterFrequency === f && "ring-2 ring-primary"
            )}
            onClick={() => setFilterFrequency(filterFrequency === f ? "all" : f)}
          >
            <CardContent className="p-3 text-center">
              <div className={cn("text-2xl font-bold", frequencyColors[f]?.text)}>
                {stats[f] || 0}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">{frequencyLabels[f]}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по названию..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[260px]">
            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Все категории" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все категории</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterFrequency} onValueChange={setFilterFrequency}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Все периодичности" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все периодичности</SelectItem>
            {FREQ_ORDER.map((f) => (
              <SelectItem key={f} value={f}>
                {frequencyLabels[f]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground">
        Показано: {filtered.length} из {tasks.length} работ
      </p>

      {/* Grouped tables */}
      {Array.from(grouped.entries()).map(([categoryName, items]) => (
        <Card key={categoryName}>
          <CardHeader className="py-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span>{categoryName}</span>
              <Badge variant="secondary">{items.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Наименование работы</TableHead>
                  <TableHead className="w-[160px]">Периодичность</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((t, idx) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-muted-foreground text-xs">{idx + 1}</TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">{t.title}</div>
                      {t.description && t.description !== t.title && (
                        <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {t.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          frequencyColors[t.frequency]?.bg,
                          frequencyColors[t.frequency]?.text
                        )}
                      >
                        {frequencyLabels[t.frequency]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}

      {/* Periodicity notes */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base">Уточнения по периодичности</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p><strong>По запросу</strong> — срок реагирования на запрос Заказчика — до 1 часа.</p>
          <p><strong>Еженедельно</strong> — по средам.</p>
          <p><strong>Ежемесячно</strong> — 1-й рабочий день месяца.</p>
          <p><strong>Ежеквартально</strong> — 1-й рабочий день квартала.</p>
          <p><strong>Раз в полгода</strong> — 1-й рабочий день полугодия.</p>
        </CardContent>
      </Card>
    </div>
  );
}
