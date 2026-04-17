import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, AlertTriangle, XCircle, Edit2, Search, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

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
}

const statusConfig: Record<string, { label: string; icon: typeof CheckCircle2; color: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  covered: { label: "Покрыто", icon: CheckCircle2, color: "text-green-500", variant: "default" },
  partial: { label: "Частично", icon: AlertTriangle, color: "text-amber-500", variant: "secondary" },
  none: { label: "Не покрыто", icon: XCircle, color: "text-muted-foreground", variant: "outline" },
};

export default function TZCoverage() {
  const { toast } = useToast();
  const { isStaff } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [editingReq, setEditingReq] = useState<TzReq | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editStatus, setEditStatus] = useState("none");
  const [editHostId, setEditHostId] = useState<string>("none");
  const [editNotes, setEditNotes] = useState("");

  const { data: reqs } = useQuery({
    queryKey: ["tz-requirements"],
    queryFn: async () => {
      const { data } = await supabase
        .from("tz_requirements")
        .select("*")
        .order("code", { ascending: true });
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
      const { data } = await supabase.from("monitored_hosts").select("id, name").order("name");
      return data || [];
    },
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
      return true;
    });
  }, [reqs, search, statusFilter, categoryFilter, coverageMap]);

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
    setEditTitle(req.title);
    const list = coverageMap.get(req.id) || [];
    const first = list[0];
    setEditStatus(first?.status || "none");
    setEditHostId(first?.host_id || "none");
    setEditNotes(first?.notes || "");
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!editingReq) return;

      // Update requirement title if changed
      if (editTitle !== editingReq.title) {
        await supabase.from("tz_requirements").update({ title: editTitle }).eq("id", editingReq.id);
      }

      // Update or create coverage
      const list = coverageMap.get(editingReq.id) || [];
      const existing = list[0];
      const payload = {
        requirement_id: editingReq.id,
        host_id: editHostId === "none" ? null : editHostId,
        status: editStatus,
        notes: editNotes || null,
      };
      if (existing) {
        await supabase.from("tz_coverage").update(payload).eq("id", existing.id);
      } else if (editStatus !== "none" || editHostId !== "none" || editNotes) {
        await supabase.from("tz_coverage").insert(payload);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tz-requirements"] });
      qc.invalidateQueries({ queryKey: ["tz-coverage"] });
      toast({ title: "Сохранено" });
      setEditingReq(null);
    },
    onError: (e: Error) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      {/* Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Покрытие пунктов ТЗ: {stats.percent}%
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Progress value={stats.percent} className="h-3" />
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <p className="text-2xl font-heading font-bold text-green-500">{stats.covered}</p>
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

      {/* Filters */}
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
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value="covered">Покрыто</SelectItem>
            <SelectItem value="partial">Частично</SelectItem>
            <SelectItem value="none">Не покрыто</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все категории</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Пункт</TableHead>
                <TableHead>Требование</TableHead>
                <TableHead>Категория</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead>Статус</TableHead>
                {isStaff && <TableHead className="text-right">Действия</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReqs.slice(0, 100).map((req) => {
                const s = reqStatus(req.id);
                const cfg = statusConfig[s];
                const Icon = cfg.icon;
                return (
                  <TableRow key={req.id}>
                    <TableCell className="font-mono text-xs">{req.code}</TableCell>
                    <TableCell className="text-sm max-w-xl truncate">{req.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{req.category || "—"}</Badge>
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
          {filteredReqs.length > 100 && (
            <p className="text-xs text-muted-foreground text-center pt-3">
              Показано 100 из {filteredReqs.length}. Уточните фильтры.
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editingReq} onOpenChange={(o) => !o && setEditingReq(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Пункт {editingReq?.code}</DialogTitle>
          </DialogHeader>
          {editingReq && (
            <div className="space-y-3">
              <div>
                <Label>Название требования</Label>
                <Textarea value={editTitle} onChange={(e) => setEditTitle(e.target.value)} rows={3} />
              </div>
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
