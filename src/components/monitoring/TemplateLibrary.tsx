import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Library, Search, Loader2, Eye, Server, Activity, Link2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { logAudit } from "@/lib/audit";

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

interface ZbxHost {
  hostid: string;
  name: string;
  groups?: { name: string }[];
}

export default function TemplateLibrary() {
  const { toast } = useToast();
  const { isStaff } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(new Set());
  const [bulkLinkOpen, setBulkLinkOpen] = useState(false);
  const [hostSearch, setHostSearch] = useState("");
  const [chosenHosts, setChosenHosts] = useState<Set<string>>(new Set());

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

  const { data: hosts = [] } = useQuery({
    queryKey: ["zabbix", "getHosts"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("zabbix-proxy", {
        body: { action: "getHosts" },
      });
      if (error) throw error;
      return (data?.result ?? []) as ZbxHost[];
    },
    enabled: bulkLinkOpen,
    staleTime: 60000,
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return templates;
    const q = search.toLowerCase();
    return templates.filter(
      (t) => t.name.toLowerCase().includes(q) || t.host.toLowerCase().includes(q)
    );
  }, [templates, search]);

  const filteredHosts = useMemo(() => {
    if (!hostSearch.trim()) return hosts;
    const q = hostSearch.toLowerCase();
    return hosts.filter((h) => h.name.toLowerCase().includes(q));
  }, [hosts, hostSearch]);

  const toggleTemplate = (id: string) => {
    const next = new Set(selectedTemplates);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedTemplates(next);
  };

  const toggleHost = (id: string) => {
    const next = new Set(chosenHosts);
    if (next.has(id)) next.delete(id); else next.add(id);
    setChosenHosts(next);
  };

  // Bulk link mutation: link selected templates to selected hosts
  const bulkLink = useMutation({
    mutationFn: async () => {
      const tplIds = [...selectedTemplates];
      const hostIds = [...chosenHosts];
      const results: { hostid: string; ok: boolean; error?: string }[] = [];
      for (const hostid of hostIds) {
        try {
          const { data, error } = await supabase.functions.invoke("zabbix-proxy", {
            body: {
              action: "updateHostTemplates",
              params: { hostid, templateids: tplIds, mode: "link" },
            },
          });
          if (error) throw error;
          if (data?.error) throw new Error(data.error);
          results.push({ hostid, ok: true });
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          results.push({ hostid, ok: false, error: msg });
        }
      }
      return results;
    },
    onSuccess: async (results) => {
      const ok = results.filter((r) => r.ok).length;
      const fail = results.length - ok;
      await logAudit({
        action: "Массовая привязка шаблонов Zabbix",
        module: "monitoring",
        details: `Шаблонов: ${selectedTemplates.size}, Хостов: ${chosenHosts.size}, Успешно: ${ok}, Ошибок: ${fail}`,
      });
      toast({
        title: `Привязка завершена: ${ok}/${results.length}`,
        description: fail > 0 ? `Ошибок: ${fail}` : undefined,
        variant: fail > 0 ? "destructive" : "default",
      });
      setBulkLinkOpen(false);
      setSelectedTemplates(new Set());
      setChosenHosts(new Set());
      qc.invalidateQueries({ queryKey: ["zbx-host-detail"] });
      qc.invalidateQueries({ queryKey: ["zabbix", "getHosts"] });
    },
    onError: (e: Error) =>
      toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  });

  // Import template items into item_aliases
  const importMutation = useMutation({
    mutationFn: async (tpl: TemplateDetail) => {
      const items = tpl.items || [];
      if (items.length === 0) throw new Error("В шаблоне нет элементов данных");
      const { data: { user } } = await supabase.auth.getUser();
      const rows = items.map((it) => ({
        item_key: it.key_,
        display_name: it.name,
        category: tpl.name,
        description: `Импортировано из шаблона ${tpl.name}`,
      }));
      // upsert by item_key (no host) — fallback: insert and ignore conflict
      const { error } = await supabase
        .from("item_aliases")
        .upsert(rows, { onConflict: "item_key", ignoreDuplicates: false });
      if (error) throw error;
      return { count: rows.length, user: user?.id };
    },
    onSuccess: async (res, tpl) => {
      await logAudit({
        action: "Импорт шаблона Zabbix в портал",
        module: "monitoring",
        details: `Шаблон: ${tpl.name}, Элементов: ${res.count}`,
      });
      toast({
        title: "Шаблон импортирован",
        description: `Добавлено/обновлено ${res.count} псевдонимов метрик. Теперь можно настроить пороги.`,
      });
      qc.invalidateQueries({ queryKey: ["item_aliases"] });
    },
    onError: (e: Error) =>
      toast({ title: "Ошибка импорта", description: e.message, variant: "destructive" }),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Library className="h-4 w-4" />
          Библиотека шаблонов Zabbix
          <Badge variant="outline" className="ml-1">{templates.length}</Badge>
        </CardTitle>
        <div className="flex items-center gap-2">
          {isStaff && selectedTemplates.size > 0 && (
            <Button size="sm" onClick={() => setBulkLinkOpen(true)}>
              <Link2 className="h-3.5 w-3.5 mr-1" />
              Привязать к хостам ({selectedTemplates.size})
            </Button>
          )}
          <div className="relative w-72">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Поиск по имени или ключу..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
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
                  {isStaff && <TableHead className="w-10"></TableHead>}
                  <TableHead>Название</TableHead>
                  <TableHead className="w-48">Технический ключ</TableHead>
                  <TableHead className="w-24 text-right">Действие</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.slice(0, 300).map((tpl) => (
                  <TableRow key={tpl.templateid}>
                    {isStaff && (
                      <TableCell>
                        <Checkbox
                          checked={selectedTemplates.has(tpl.templateid)}
                          onCheckedChange={() => toggleTemplate(tpl.templateid)}
                        />
                      </TableCell>
                    )}
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
                    <TableCell colSpan={isStaff ? 4 : 3} className="text-center text-xs text-muted-foreground">
                      Показано 300 из {filtered.length}. Уточните поиск.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>

      {/* Detail dialog */}
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

              {isStaff && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => importMutation.mutate(detail)}
                    disabled={importMutation.isPending || !detail.items?.length}
                  >
                    {importMutation.isPending
                      ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                      : <Download className="h-3.5 w-3.5 mr-1" />}
                    Импортировать в портал ({detail.items?.length ?? 0})
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedTemplates(new Set([detail.templateid]));
                      setSelectedId(null);
                      setBulkLinkOpen(true);
                    }}
                  >
                    <Link2 className="h-3.5 w-3.5 mr-1" />
                    Привязать к хостам
                  </Button>
                </div>
              )}

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

      {/* Bulk link dialog */}
      <Dialog open={bulkLinkOpen} onOpenChange={setBulkLinkOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Массовая привязка шаблонов
            </DialogTitle>
            <DialogDescription>
              Выбрано шаблонов: <Badge variant="default">{selectedTemplates.size}</Badge>.
              Выберите хосты, к которым нужно их привязать.
            </DialogDescription>
          </DialogHeader>

          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Поиск хоста..."
              value={hostSearch}
              onChange={(e) => setHostSearch(e.target.value)}
              className="pl-8"
            />
          </div>

          <ScrollArea className="flex-1 border rounded h-80">
            <Table>
              <TableBody>
                {filteredHosts.map((h) => (
                  <TableRow
                    key={h.hostid}
                    className="cursor-pointer"
                    onClick={() => toggleHost(h.hostid)}
                  >
                    <TableCell className="w-10 py-2">
                      <Checkbox checked={chosenHosts.has(h.hostid)} onCheckedChange={() => toggleHost(h.hostid)} />
                    </TableCell>
                    <TableCell className="py-2">
                      <p className="text-sm">{h.name}</p>
                      {h.groups && h.groups.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {h.groups.map((g) => g.name).join(", ")}
                        </p>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredHosts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-xs text-muted-foreground py-6">
                      Хосты не найдены
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>

          <DialogFooter>
            <p className="text-xs text-muted-foreground mr-auto self-center">
              Выбрано хостов: <Badge variant="outline">{chosenHosts.size}</Badge>
            </p>
            <Button variant="outline" onClick={() => setBulkLinkOpen(false)}>Отмена</Button>
            <Button
              onClick={() => bulkLink.mutate()}
              disabled={bulkLink.isPending || chosenHosts.size === 0 || selectedTemplates.size === 0}
            >
              {bulkLink.isPending && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
              Привязать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
