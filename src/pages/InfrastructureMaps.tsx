import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Network, Trash2, Pencil, ArrowLeft } from "lucide-react";
import MapEditor, { MapDoc } from "@/components/infrastructure/MapEditor";
import { logAudit } from "@/lib/audit";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

export default function InfrastructureMaps() {
  const { isStaff, user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [openId, setOpenId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const { data: maps = [], isLoading: mapsLoading } = useQuery({
    queryKey: ["infra-maps"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("infrastructure_maps" as any)
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: current } = useQuery({
    queryKey: ["infra-map", openId],
    enabled: !!openId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("infrastructure_maps" as any)
        .select("*")
        .eq("id", openId)
        .single();
      if (error) throw error;
      return data as any;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("infrastructure_maps" as any)
        .insert({ name, description, created_by: user?.id, data: { nodes: [], edges: [] } })
        .select("id")
        .single();
      if (error) throw error;
      await logAudit({ action: `Создана схема: ${name}`, module: "infrastructure_maps", entityId: (data as any).id });
      return data as any;
    },
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ["infra-maps"] });
      setCreateOpen(false); setName(""); setDescription("");
      setOpenId(d.id);
    },
    onError: (e: any) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  });

  const saveMutation = useMutation({
    mutationFn: async (doc: MapDoc) => {
      if (!openId) return;
      const { error } = await supabase
        .from("infrastructure_maps" as any)
        .update({ data: doc as any })
        .eq("id", openId);
      if (error) throw error;
      await logAudit({ action: `Обновлена схема инфраструктуры`, module: "infrastructure_maps", entityId: openId });
      // Snapshot version (best-effort, не блокирует основной save)
      try {
        const { data: last } = await supabase
          .from("infrastructure_map_versions" as any)
          .select("version_number")
          .eq("map_id", openId)
          .order("version_number", { ascending: false })
          .limit(1)
          .maybeSingle();
        const next = ((last as any)?.version_number ?? 0) + 1;
        const { data: prof } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", user?.id ?? "")
          .maybeSingle();
        await supabase.from("infrastructure_map_versions" as any).insert({
          map_id: openId,
          version_number: next,
          data: doc as any,
          created_by: user?.id,
          created_by_name: prof?.full_name ?? user?.email ?? null,
          node_count: doc.nodes?.length ?? 0,
          edge_count: doc.edges?.length ?? 0,
        });
      } catch {
        /* версии не критичны */
      }
    },
    onSuccess: () => {
      toast({ title: "Сохранено" });
      qc.invalidateQueries({ queryKey: ["infra-maps"] });
      qc.invalidateQueries({ queryKey: ["infra-map", openId] });
      qc.invalidateQueries({ queryKey: ["map-versions", openId] });
    },
    onError: (e: any) => toast({ title: "Ошибка сохранения", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("infrastructure_maps" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["infra-maps"] });
      toast({ title: "Схема удалена" });
    },
  });

  // Editor view
  if (openId && current) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setOpenId(null)} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> К списку
            </Button>
            <div>
              <h1 className="font-heading text-xl font-bold">{current.name}</h1>
              {current.description && <p className="text-xs text-muted-foreground">{current.description}</p>}
            </div>
          </div>
        </div>
        <MapEditor
          initial={(current.data as MapDoc) ?? { nodes: [], edges: [] }}
          readOnly={!isStaff}
          onSave={saveMutation.mutateAsync}
          saving={saveMutation.isPending}
          mapId={openId}
          mapName={current.name}
        />
      </div>
    );
  }

  // List view
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Карты инфраструктуры</h1>
          <p className="text-sm text-muted-foreground mt-1">Конструктор схем ЦОД, сетей и связей между устройствами</p>
        </div>
        {isStaff && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" />Новая схема</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Новая схема инфраструктуры</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Название</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Сеть ЦОД Брест" />
                </div>
                <div className="space-y-2">
                  <Label>Описание</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => createMutation.mutate()} disabled={!name || createMutation.isPending}>
                  Создать и открыть
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {maps.length === 0 ? (
        mapsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-32 w-full rounded-none" />
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Network}
            title="Схемы инфраструктуры ещё не созданы"
            description="Создайте интерактивную карту ЦОД, сети или связи между устройствами. Узлы можно привязать к Zabbix-хостам, чтобы видеть статус в реальном времени."
            action={isStaff ? { label: "Создать первую схему", onClick: () => setCreateOpen(true), icon: Plus } : undefined}
          />
        )
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {maps.map((m) => {
            const nodeCount = (m.data?.nodes?.length ?? 0);
            const edgeCount = (m.data?.edges?.length ?? 0);
            return (
              <Card
                key={m.id}
                className={cn(
                  "group cursor-pointer overflow-hidden transition-all hover:shadow-lg hover:border-primary/50",
                  "relative",
                )}
                onClick={() => setOpenId(m.id)}
              >
                <div className="h-32 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent border-b relative overflow-hidden">
                  <div className="absolute inset-0 opacity-30" style={{
                    backgroundImage: `radial-gradient(circle at 20% 30%, hsl(var(--primary)) 1.5px, transparent 1.5px),
                                      radial-gradient(circle at 70% 60%, hsl(var(--accent)) 1.5px, transparent 1.5px),
                                      radial-gradient(circle at 50% 80%, hsl(var(--success)) 1.5px, transparent 1.5px)`,
                    backgroundSize: "100% 100%",
                  }} />
                  <Network className="absolute right-3 top-3 h-6 w-6 text-primary/40" />
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold truncate">{m.name}</h3>
                      {m.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{m.description}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-3 text-[11px] text-muted-foreground">
                    <span>{nodeCount} узлов</span>
                    <span>·</span>
                    <span>{edgeCount} связей</span>
                    <span className="ml-auto">{new Date(m.updated_at).toLocaleDateString("ru-RU")}</span>
                  </div>
                  {isStaff && (
                    <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="sm" variant="outline" className="flex-1 gap-1.5" onClick={(e) => { e.stopPropagation(); setOpenId(m.id); }}>
                        <Pencil className="h-3.5 w-3.5" />Открыть
                      </Button>
                      <Button
                        size="sm" variant="ghost"
                        onClick={(e) => { e.stopPropagation(); if (confirm(`Удалить схему "${m.name}"?`)) deleteMutation.mutate(m.id); }}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
