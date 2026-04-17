import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Library, Search, Loader2, Eye, Server, Activity } from "lucide-react";

interface ZabbixTemplate {
  templateid: string;
  host: string;
  name: string;
  description?: string;
}

interface TemplateDetail extends ZabbixTemplate {
  items?: { itemid: string; name: string; key_: string }[];
  triggers?: { triggerid: string; description: string; priority: string }[];
  hosts?: { hostid: string; name: string }[];
}

export default function TemplateLibrary() {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["zbx-all-templates"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("zabbix-proxy", {
        body: { action: "getTemplates" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return (data?.result ?? []) as ZabbixTemplate[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ["zbx-template-detail", selectedId],
    queryFn: async () => {
      if (!selectedId) return null;
      const { data, error } = await supabase.functions.invoke("zabbix-proxy", {
        body: { action: "getTemplateDetail", params: { templateid: selectedId } },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data?.result as TemplateDetail | null;
    },
    enabled: !!selectedId,
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return templates;
    const q = search.toLowerCase();
    return templates.filter(
      (t) => t.name.toLowerCase().includes(q) || t.host.toLowerCase().includes(q)
    );
  }, [templates, search]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Library className="h-4 w-4" />
          Библиотека шаблонов Zabbix
          <Badge variant="outline" className="ml-1">{templates.length}</Badge>
        </CardTitle>
        <div className="relative w-72">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Поиск по имени или ключу..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground text-sm">
            Шаблоны не найдены
          </p>
        ) : (
          <ScrollArea className="h-[420px]">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead className="w-48">Технический ключ</TableHead>
                  <TableHead className="w-24 text-right">Действие</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.slice(0, 300).map((tpl) => (
                  <TableRow key={tpl.templateid}>
                    <TableCell className="font-medium text-sm">
                      {tpl.name}
                      {tpl.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {tpl.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {tpl.host}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => setSelectedId(tpl.templateid)}>
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        Детали
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length > 300 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-xs text-muted-foreground">
                      Показано 300 из {filtered.length}. Уточните поиск.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>

      <Dialog open={!!selectedId} onOpenChange={(o) => !o && setSelectedId(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Library className="h-4 w-4" />
              {detail?.name || "Шаблон"}
            </DialogTitle>
            <DialogDescription className="font-mono text-xs">{detail?.host}</DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : detail ? (
            <div className="flex-1 overflow-auto space-y-4">
              {detail.description && (
                <p className="text-sm text-muted-foreground">{detail.description}</p>
              )}

              <div className="grid grid-cols-3 gap-3">
                <Card>
                  <CardContent className="py-3 text-center">
                    <Activity className="h-4 w-4 mx-auto mb-1 text-primary" />
                    <p className="text-2xl font-bold">{detail.items?.length ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Элементов данных</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="py-3 text-center">
                    <Activity className="h-4 w-4 mx-auto mb-1 text-amber-500" />
                    <p className="text-2xl font-bold">{detail.triggers?.length ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Триггеров</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="py-3 text-center">
                    <Server className="h-4 w-4 mx-auto mb-1 text-emerald-500" />
                    <p className="text-2xl font-bold">{detail.hosts?.length ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Привязанных хостов</p>
                  </CardContent>
                </Card>
              </div>

              {detail.items && detail.items.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Элементы данных
                  </p>
                  <ScrollArea className="h-48 border rounded">
                    <Table>
                      <TableBody>
                        {detail.items.slice(0, 100).map((it) => (
                          <TableRow key={it.itemid}>
                            <TableCell className="py-1.5 text-sm">{it.name}</TableCell>
                            <TableCell className="py-1.5 font-mono text-xs text-muted-foreground">
                              {it.key_}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              )}

              {detail.hosts && detail.hosts.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Привязанные хосты
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {detail.hosts.map((h) => (
                      <Badge key={h.hostid} variant="secondary">{h.name}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
