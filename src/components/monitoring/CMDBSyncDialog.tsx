import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logAudit } from "@/lib/audit";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, RefreshCw, Link2, CheckCircle2, AlertCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

type ZabbixHost = {
  hostid: string;
  host: string;
  name: string;
  interfaces?: { ip: string; dns?: string }[];
};
type Equipment = {
  id: string;
  name: string;
  model: string | null;
  site_id: string;
};
type HostLink = {
  id: string;
  zabbix_host_id: string;
  equipment_id: string;
  host_name: string;
  auto_matched: boolean;
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

function normalize(s: string) {
  return s.toLowerCase().replace(/[\s_\-.:]/g, "");
}

export default function CMDBSyncDialog({ open, onOpenChange }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [overrides, setOverrides] = useState<Record<string, string>>({}); // hostid -> equipment_id ('' = skip)
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  // Fetch Zabbix hosts
  const { data: zabbixHosts = [], isLoading: zbxLoading, refetch: refetchZbx } = useQuery({
    queryKey: ["cmdb-sync", "zabbix-hosts"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("zabbix-proxy", {
        body: { action: "getHosts" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return (data?.result ?? []) as ZabbixHost[];
    },
    enabled: open,
  });

  const { data: equipment = [] } = useQuery({
    queryKey: ["cmdb-sync", "equipment"],
    queryFn: async () => {
      const { data, error } = await supabase.from("equipment").select("id, name, model, site_id");
      if (error) throw error;
      return data as Equipment[];
    },
    enabled: open,
  });

  const { data: existingLinks = [] } = useQuery({
    queryKey: ["cmdb-sync", "links"],
    queryFn: async () => {
      const { data, error } = await supabase.from("monitoring_host_links").select("*");
      if (error) throw error;
      return data as HostLink[];
    },
    enabled: open,
  });

  // Auto-match: name normalized OR IP in equipment.name/model/description
  const matches = useMemo(() => {
    return zabbixHosts.map((zh) => {
      const linkedEqId = existingLinks.find((l) => l.zabbix_host_id === zh.hostid)?.equipment_id;
      if (linkedEqId) {
        return { zh, equipmentId: linkedEqId, status: "linked" as const, score: 100 };
      }
      const ips = (zh.interfaces ?? []).map((i) => i.ip).filter(Boolean);
      const zNameNorm = normalize(zh.name || zh.host);
      let best: { eq: Equipment; score: number } | null = null;
      for (const eq of equipment) {
        const eNameNorm = normalize(eq.name);
        let score = 0;
        if (eNameNorm === zNameNorm) score = 100;
        else if (eNameNorm.includes(zNameNorm) || zNameNorm.includes(eNameNorm)) score = 80;
        const hay = `${eq.name} ${eq.model ?? ""}`;
        for (const ip of ips) {
          if (hay.includes(ip)) score = Math.max(score, 90);
        }
        if (score > 0 && (!best || score > best.score)) best = { eq, score };
      }
      if (best) {
        return { zh, equipmentId: best.eq.id, status: "auto" as const, score: best.score };
      }
      return { zh, equipmentId: null, status: "unmatched" as const, score: 0 };
    });
  }, [zabbixHosts, equipment, existingLinks]);

  const stats = useMemo(() => {
    const linked = matches.filter((m) => m.status === "linked").length;
    const auto = matches.filter((m) => m.status === "auto").length;
    const unmatched = matches.filter((m) => m.status === "unmatched").length;
    return { linked, auto, unmatched, total: matches.length };
  }, [matches]);

  const syncMutation = useMutation({
    mutationFn: async () => {
      const rows: { zabbix_host_id: string; equipment_id: string; host_name: string; auto_matched: boolean }[] = [];
      for (const m of matches) {
        if (m.status === "linked") continue;
        const eqId = overrides[m.zh.hostid] !== undefined ? overrides[m.zh.hostid] : m.equipmentId;
        if (!eqId) continue;
        // Only sync items that user selected (default: all auto-matched are pre-selected)
        const isSelected = selected[m.zh.hostid] ?? m.status === "auto";
        if (!isSelected) continue;
        rows.push({
          zabbix_host_id: m.zh.hostid,
          equipment_id: eqId,
          host_name: m.zh.name || m.zh.host,
          auto_matched: m.status === "auto",
        });
      }
      if (rows.length === 0) throw new Error("Нет выбранных связей для сохранения");
      const { error } = await supabase.from("monitoring_host_links").upsert(rows, {
        onConflict: "equipment_id",
      });
      if (error) throw error;
      return rows.length;
    },
    onSuccess: async (count) => {
      await logAudit({
        action: "Синхронизация CMDB с Zabbix",
        module: "monitoring",
        details: `Создано/обновлено связей: ${count}`,
      });
      qc.invalidateQueries({ queryKey: ["cmdb-sync"] });
      qc.invalidateQueries({ queryKey: ["monitoring-host-links"] });
      qc.invalidateQueries({ queryKey: ["equipment"] });
      toast({ title: "Синхронизация завершена", description: `Связей создано/обновлено: ${count}` });
      onOpenChange(false);
    },
    onError: (e: Error) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Синхронизация хостов Zabbix с оборудованием (CMDB)
          </DialogTitle>
          <DialogDescription>
            Автоматическое сопоставление по имени и IP-адресу. Проверьте и подтвердите связи.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="default" className="gap-1">
            <CheckCircle2 className="h-3 w-3" /> Уже связано: {stats.linked}
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <CheckCircle2 className="h-3 w-3" /> Авто-совпадение: {stats.auto}
          </Badge>
          <Badge variant="outline" className="gap-1">
            <AlertCircle className="h-3 w-3" /> Без совпадений: {stats.unmatched}
          </Badge>
          <Button size="sm" variant="ghost" onClick={() => refetchZbx()} disabled={zbxLoading}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${zbxLoading ? "animate-spin" : ""}`} />
            Обновить
          </Button>
        </div>

        <ScrollArea className="flex-1 border rounded-md">
          {zbxLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Zabbix-хост</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="w-[280px]">Связать с оборудованием</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matches.map((m) => {
                  const ips = (m.zh.interfaces ?? []).map((i) => i.ip).join(", ");
                  const isLinked = m.status === "linked";
                  const currentOverride = overrides[m.zh.hostid];
                  const currentValue = currentOverride !== undefined ? currentOverride : (m.equipmentId ?? "");
                  const isSelected = selected[m.zh.hostid] ?? m.status === "auto";
                  return (
                    <TableRow key={m.zh.hostid} className={isLinked ? "opacity-60" : ""}>
                      <TableCell>
                        {!isLinked && (
                          <Checkbox
                            checked={isSelected}
                            disabled={!currentValue}
                            onCheckedChange={(v) =>
                              setSelected((s) => ({ ...s, [m.zh.hostid]: !!v }))
                            }
                          />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {m.zh.name || m.zh.host}
                        <div className="text-xs text-muted-foreground font-mono">{m.zh.host}</div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{ips || "—"}</TableCell>
                      <TableCell>
                        {isLinked && <Badge variant="default">Связано</Badge>}
                        {m.status === "auto" && (
                          <Badge variant="secondary">Авто ({m.score}%)</Badge>
                        )}
                        {m.status === "unmatched" && (
                          <Badge variant="outline">Нет совпадения</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={currentValue || "__none__"}
                          disabled={isLinked}
                          onValueChange={(v) => {
                            const val = v === "__none__" ? "" : v;
                            setOverrides((o) => ({ ...o, [m.zh.hostid]: val }));
                            if (val) setSelected((s) => ({ ...s, [m.zh.hostid]: true }));
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Не связывать" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">— Не связывать —</SelectItem>
                            {equipment.map((eq) => (
                              <SelectItem key={eq.id} value={eq.id}>
                                {eq.name}
                                {eq.model ? ` · ${eq.model}` : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {matches.length === 0 && !zbxLoading && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Нет хостов в Zabbix
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Отмена</Button>
          <Button
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending || stats.auto + Object.values(overrides).filter(Boolean).length === 0}
          >
            {syncMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Сохранить связи
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
