import { useState, useMemo } from "react";
import { invokeZabbix } from "@/lib/zabbix-invoke";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, AlertTriangle, XCircle, Edit2, Search, FileText, RefreshCw, Sparkles, Loader2, Wrench, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { logAudit } from "@/lib/audit";

interface TzReq {
  id: string;
  code: string;
  title: string;
  category: string | null;
  check_type: string | null;
  notes: string | null;
}

interface TzCov {
  id: string;
  requirement_id: string;
  host_id: string | null;
  status: string;
  notes: string | null;
  related_items: any;
}

const statusConfig: Record<string, { label: string; icon: typeof CheckCircle2; color: string }> = {
  covered: { label: "Покрыто", icon: CheckCircle2, color: "text-emerald-500" },
  partial: { label: "Частично", icon: AlertTriangle, color: "text-amber-500" },
  none: { label: "Не покрыто", icon: XCircle, color: "text-muted-foreground" },
};

const freqLabels: Record<string, string> = {
  daily: "Ежедневно",
  weekly: "Еженедельно",
  monthly: "Ежемесячно",
  quarterly: "Ежеквартально",
  semi_annual: "Раз в полгода",
};

function parseNotes(notes: string | null): { f?: string; ip?: string[]; i?: string } {
  if (!notes) return {};
  try { return typeof notes === "string" ? JSON.parse(notes) : notes; } catch { return {}; }
}

export default function TZCoverage() {
  const { toast } = useToast();
  const { isStaff } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [freqFilter, setFreqFilter] = useState("all");
  const [editingReq, setEditingReq] = useState<TzReq | null>(null);
  const [editStatus, setEditStatus] = useState("none");
  const [editHostId, setEditHostId] = useState<string>("none");
  const [editNotes, setEditNotes] = useState("");
  const [editTools, setEditTools] = useState<Array<{ name: string; type: string; config: string; responsible: string; status: string }>>([]);

  const { data: reqs } = useQuery({
    queryKey: ["tz-requirements"],
    queryFn: async () => {
      const { data } = await supabase
        .from("tz_requirements").select("*").order("code", { ascending: true });
      return (data as TzReq[]) || [];
    },
  });

  const { data: coverage } = useQuery({
    queryKey: ["tz-coverage"],
    queryFn: async () => {
      const { data } = await supabase.from("tz_coverage").select("*");
      return (data as TzCov[]) || [];
    },
  });

  const { data: hosts } = useQuery({
    queryKey: ["monitored-hosts"],
    queryFn: async () => {
      const { data } = await supabase.from("monitored_hosts").select("id, name, zabbix_host_id").order("name");
      return data || [];
    },
  });

  const { data: zabbixHosts = [] } = useQuery({
    queryKey: ["zabbix", "getHosts"],
    queryFn: async () => {
      const { data, error } = await invokeZabbix( { body: { action: "getHosts" } });
      if (error) throw error;
      return (data?.result ?? []) as any[];
    },
    retry: 1,
  });

  const coverageMap = useMemo(() => {
    const m = new Map<string, TzCov[]>();
    (coverage || []).forEach((c) => {
      const list = m.get(c.requirement_id) || [];
      list.push(c);
      m.set(c.requirement_id, list);
    });
    return m;
  }, [coverage]);

  const reqStatus = (id: string): string => {
    const list = coverageMap.get(id);
    if (!list || list.length === 0) return "none";
    if (list.some((c) => c.status === "covered")) return "covered";
    if (list.some((c) => c.status === "partial")) return "partial";
    return "none";
  };

  const categories = useMemo(() => {
    const s = new Set<string>();
    (reqs || []).forEach((r) => r.category && s.add(r.category));
    return Array.from(s).sort();
  }, [reqs]);

  const filteredReqs = useMemo(() => {
    return (reqs || []).filter((r) => {
      if (search) {
        const q = search.toLowerCase();
        if (!r.code.includes(q) && !r.title.toLowerCase().includes(q)) return false;
      }
      if (categoryFilter !== "all" && r.category !== categoryFilter) return false;
      if (statusFilter !== "all" && reqStatus(r.id) !== statusFilter) return false;
      if (freqFilter !== "all") {
        const f = parseNotes(r.notes).f;
        if (f !== freqFilter) return false;
      }
      return true;
    });
  }, [reqs, search, statusFilter, categoryFilter, freqFilter, coverageMap]);

  const stats = useMemo(() => {
    if (!reqs) return { total: 0, covered: 0, partial: 0, percent: 0 };
    let covered = 0, partial = 0;
    reqs.forEach((r) => {
      const s = reqStatus(r.id);
      if (s === "covered") covered++;
      else if (s === "partial") partial++;
    });
    const percent = Math.round(((covered + partial * 0.5) / reqs.length) * 100);
    return { total: reqs.length, covered, partial, percent };
  }, [reqs, coverageMap]);

  const openEdit = (req: TzReq) => {
    setEditingReq(req);
    const list = coverageMap.get(req.id) || [];
    const first = list[0];
    setEditStatus(first?.status || "none");
    setEditHostId(first?.host_id || "none");
    setEditNotes(first?.notes || "");
    const ri = first?.related_items as any;
    setEditTools(Array.isArray(ri?.tools) ? ri.tools : []);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!editingReq) return;
      const list = coverageMap.get(editingReq.id) || [];
      const existing = list[0];
      const existingRelated = (existing?.related_items as any) || {};
      const payload = {
        requirement_id: editingReq.id,
        host_id: editHostId === "none" ? null : editHostId,
        status: editStatus,
        notes: editNotes || null,
        related_items: { ...existingRelated, tools: editTools } as any,
      };
      if (existing) {
        await supabase.from("tz_coverage").update(payload).eq("id", existing.id);
      } else if (editStatus !== "none" || editHostId !== "none" || editNotes || editTools.length) {
        await supabase.from("tz_coverage").insert(payload);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tz-coverage"] });
      toast({ title: "Сохранено" });
      setEditingReq(null);
    },
    onError: (e: Error) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  });

  // ─── Auto-match: traverse all auto requirements, fetch items per host, match by patterns ───
  const autoMatch = useMutation({
    mutationFn: async () => {
      if (!reqs || zabbixHosts.length === 0) throw new Error("Нет данных Zabbix или ТЗ");

      // Pre-fetch items for each host once
      const hostItems = new Map<string, any[]>();
      for (const h of zabbixHosts) {
        const { data } = await invokeZabbix( {
          body: { action: "getItemsByHost", params: { hostid: h.hostid } },
        });
        hostItems.set(h.hostid, data?.result || []);
      }

      const updates: { req: TzReq; status: string; matched: { hostName: string; keys: string[] }[] }[] = [];

      for (const r of reqs) {
        if (r.check_type !== "auto") continue;
        const meta = parseNotes(r.notes);
        const patterns = (meta.ip || []) as string[];
        if (!patterns.length) continue;

        const matched: { hostName: string; keys: string[] }[] = [];
        for (const [hostid, items] of hostItems.entries()) {
          const hostName = zabbixHosts.find((h: any) => h.hostid === hostid)?.name || hostid;
          const keys: string[] = [];
          for (const it of items) {
            const haystack = `${it.key_ || ""} ${it.name || ""}`.toLowerCase();
            if (patterns.some((p) => haystack.includes(p.toLowerCase()))) {
              keys.push(it.key_);
            }
          }
          if (keys.length > 0) matched.push({ hostName, keys: keys.slice(0, 5) });
        }

        const status = matched.length === 0 ? "none" : matched.length >= zabbixHosts.length / 2 ? "covered" : "partial";
        updates.push({ req: r, status, matched });
      }

      // Apply: upsert one coverage row per req with first matched host (or null), status, related_items list
      for (const u of updates) {
        const existing = coverageMap.get(u.req.id)?.[0];
        const localHost = u.matched[0] ? hosts?.find((h) => h.name === u.matched[0].hostName)?.id : null;
        const payload = {
          requirement_id: u.req.id,
          host_id: localHost || null,
          status: u.status,
          related_items: u.matched as any,
          notes: `Автосопоставление: найдено ${u.matched.length} хост(а/ов) с подходящими метриками`,
        };
        if (existing) {
          await supabase.from("tz_coverage").update(payload).eq("id", existing.id);
        } else {
          await supabase.from("tz_coverage").insert(payload);
        }
      }

      await logAudit({
        action: "Авто-сопоставление ТЗ ↔ Zabbix",
        module: "monitoring",
        details: `Обработано auto-пунктов: ${updates.length}`,
      });

      return updates.length;
    },
    onSuccess: (count) => {
      qc.invalidateQueries({ queryKey: ["tz-coverage"] });
      toast({ title: "Авто-сопоставление завершено", description: `Обновлено пунктов: ${count}` });
    },
    onError: (e: Error) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Покрытие регламентных работ: {stats.percent}%
            </CardTitle>
            {isStaff && (
              <Button
                variant="outline" size="sm"
                onClick={() => autoMatch.mutate()}
                disabled={autoMatch.isPending || zabbixHosts.length === 0}
              >
                {autoMatch.isPending ? (
                  <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />Сопоставление...</>
                ) : (
                  <><Sparkles className="h-3.5 w-3.5 mr-1" />Авто-сопоставление с Zabbix</>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Progress value={stats.percent} className="h-3" />
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <p className="text-2xl font-heading font-bold text-emerald-500">{stats.covered}</p>
              <p className="text-xs text-muted-foreground">Покрыто</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-heading font-bold text-amber-500">{stats.partial}</p>
              <p className="text-xs text-muted-foreground">Частично</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-heading font-bold text-muted-foreground">{stats.total - stats.covered - stats.partial}</p>
              <p className="text-xs text-muted-foreground">Не покрыто</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по номеру или тексту..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value="covered">Покрыто</SelectItem>
            <SelectItem value="partial">Частично</SelectItem>
            <SelectItem value="none">Не покрыто</SelectItem>
          </SelectContent>
        </Select>
        <Select value={freqFilter} onValueChange={setFreqFilter}>
          <SelectTrigger className="w-[170px]"><SelectValue placeholder="Частота" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все частоты</SelectItem>
            {Object.entries(freqLabels).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все категории</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Пункт</TableHead>
                <TableHead>Требование</TableHead>
                <TableHead>Категория</TableHead>
                <TableHead className="w-28">Частота</TableHead>
                <TableHead className="w-24">Тип</TableHead>
                <TableHead className="w-32">Статус</TableHead>
                {isStaff && <TableHead className="text-right w-12"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReqs.slice(0, 200).map((req) => {
                const s = reqStatus(req.id);
                const cfg = statusConfig[s];
                const Icon = cfg.icon;
                const meta = parseNotes(req.notes);
                return (
                  <TableRow key={req.id}>
                    <TableCell className="font-mono text-xs">{req.code}</TableCell>
                    <TableCell className="text-sm max-w-xl">{req.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{req.category || "—"}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {meta.f ? freqLabels[meta.f] || meta.f : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">{req.check_type || "manual"}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1 ${cfg.color}`}>
                        <Icon className="h-3.5 w-3.5" />
                        <span className="text-xs">{cfg.label}</span>
                      </span>
                    </TableCell>
                    {isStaff && (
                      <TableCell className="text-right">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(req)}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {filteredReqs.length > 200 && (
            <p className="text-xs text-muted-foreground text-center pt-3">
              Показано 200 из {filteredReqs.length}. Уточните фильтры.
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editingReq} onOpenChange={(o) => !o && setEditingReq(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Пункт {editingReq?.code}</DialogTitle>
          </DialogHeader>
          {editingReq && (
            <div className="space-y-3">
              <div>
                <Label>Требование</Label>
                <p className="text-sm">{editingReq.title}</p>
              </div>
              {(() => {
                const meta = parseNotes(editingReq.notes);
                return (meta.i || meta.ip?.length) ? (
                  <div className="bg-muted/30 rounded p-2 text-xs space-y-1">
                    {meta.i && <p><b>Инструкция:</b> {meta.i}</p>}
                    {meta.ip?.length ? (
                      <p><b>Шаблоны метрик:</b> {meta.ip.join(", ")}</p>
                    ) : null}
                  </div>
                ) : null;
              })()}
              <div>
                <Label>Статус покрытия</Label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Не покрыто</SelectItem>
                    <SelectItem value="partial">Частично</SelectItem>
                    <SelectItem value="covered">Покрыто</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Связанный хост</Label>
                <Select value={editHostId} onValueChange={setEditHostId}>
                  <SelectTrigger><SelectValue placeholder="Не назначен" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Не назначен</SelectItem>
                    {hosts?.map((h) => (
                      <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Заметки</Label>
                <Textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={2} />
              </div>

              {editStatus !== "covered" && (
                <div className="space-y-2 border-t pt-3">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-1.5">
                      <Wrench className="h-3.5 w-3.5" />
                      Инструменты для закрытия пункта
                    </Label>
                    <Button
                      type="button" size="sm" variant="outline"
                      onClick={() =>
                        setEditTools([
                          ...editTools,
                          { name: "", type: "zabbix", config: "", responsible: "", status: "planned" },
                        ])
                      }
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />Добавить
                    </Button>
                  </div>
                  {editTools.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Опишите, какие инструменты будут использоваться для покрытия этого требования
                      (шаблоны Zabbix, скрипты Ansible, ручные процедуры, внешние системы и т.д.).
                    </p>
                  )}
                  {editTools.map((t, i) => (
                    <div key={i} className="border rounded p-2 space-y-2 bg-muted/20">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Название инструмента"
                          value={t.name}
                          onChange={(e) => {
                            const next = [...editTools]; next[i] = { ...t, name: e.target.value }; setEditTools(next);
                          }}
                          className="flex-1"
                        />
                        <Select
                          value={t.type}
                          onValueChange={(v) => {
                            const next = [...editTools]; next[i] = { ...t, type: v }; setEditTools(next);
                          }}
                        >
                          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="zabbix">Zabbix шаблон/итем</SelectItem>
                            <SelectItem value="ansible">Ansible playbook</SelectItem>
                            <SelectItem value="script">Скрипт</SelectItem>
                            <SelectItem value="manual">Ручная процедура</SelectItem>
                            <SelectItem value="external">Внешняя система</SelectItem>
                            <SelectItem value="other">Другое</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          type="button" size="icon" variant="ghost"
                          onClick={() => setEditTools(editTools.filter((_, j) => j !== i))}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <Textarea
                        placeholder="Конфигурация / ключи метрик / шаги"
                        value={t.config}
                        onChange={(e) => {
                          const next = [...editTools]; next[i] = { ...t, config: e.target.value }; setEditTools(next);
                        }}
                        rows={2}
                        className="text-xs"
                      />
                      <div className="flex gap-2">
                        <Input
                          placeholder="Ответственный"
                          value={t.responsible}
                          onChange={(e) => {
                            const next = [...editTools]; next[i] = { ...t, responsible: e.target.value }; setEditTools(next);
                          }}
                          className="flex-1 text-xs"
                        />
                        <Select
                          value={t.status}
                          onValueChange={(v) => {
                            const next = [...editTools]; next[i] = { ...t, status: v }; setEditTools(next);
                          }}
                        >
                          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="planned">Запланировано</SelectItem>
                            <SelectItem value="in_progress">В работе</SelectItem>
                            <SelectItem value="configured">Настроено</SelectItem>
                            <SelectItem value="blocked">Заблокировано</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setEditingReq(null)}>Отмена</Button>
                <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                  Сохранить
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
