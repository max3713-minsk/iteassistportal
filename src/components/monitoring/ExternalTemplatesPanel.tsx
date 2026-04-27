import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, Loader2, ExternalLink, Plus, FileCode, Github, Server, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

type Source = "all" | "local" | "official" | "community";

interface Item {
  id: string;
  name: string;
  source: string;
  category?: string;
  description?: string;
  source_url?: string;
}

const SOURCE_ICON: Record<string, typeof Github> = {
  local: Server,
  official: Github,
  community: Github,
};

export default function ExternalTemplatesPanel() {
  const { toast } = useToast();
  const { isStaff } = useAuth();
  const qc = useQueryClient();
  const [source, setSource] = useState<Source>("all");
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["external-templates", source, search],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("zabbix-templates-fetch", {
        body: null,
        // Pass via query params via URL (invoke doesn't support, fall back to fetch)
      });
      // invoke doesn't expose query params; do a direct fetch instead.
      const url = new URL(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/zabbix-templates-fetch`);
      url.searchParams.set("source", source);
      if (search) url.searchParams.set("search", search);
      const { data: { session } } = await supabase.auth.getSession();
      const r = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${session?.access_token || ""}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
      });
      const j = await r.json();
      if (!r.ok || j.error) throw new Error(j.error || `HTTP ${r.status}`);
      return j.items as Item[];
    },
    staleTime: 60_000,
  });

  const deleteLocal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("zabbix_template_library").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["external-templates"] }); toast({ title: "Шаблон удалён" }); },
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <Tabs value={source} onValueChange={(v) => setSource(v as Source)}>
          <TabsList>
            <TabsTrigger value="all">Все</TabsTrigger>
            <TabsTrigger value="local"><Server className="h-3 w-3 mr-1" /> Локальные</TabsTrigger>
            <TabsTrigger value="official"><Github className="h-3 w-3 mr-1" /> Официальные</TabsTrigger>
            <TabsTrigger value="community"><Github className="h-3 w-3 mr-1" /> Community</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Поиск..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-9" />
        </div>
        {isStaff && <AddLocalButton open={addOpen} setOpen={setAddOpen} />}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : !data?.length ? (
        <p className="text-center py-8 text-sm text-muted-foreground">Шаблоны не найдены</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[480px] overflow-auto">
          {data.slice(0, 200).map((it) => {
            const Icon = SOURCE_ICON[it.source] || FileCode;
            return (
              <Card key={it.id} className="hover:border-primary/40 transition-colors">
                <CardContent className="py-3 px-4 flex items-start gap-3">
                  <Icon className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium truncate">{it.name}</p>
                      <Badge variant="outline" className="text-[10px]">{it.source}</Badge>
                      {it.category && <Badge variant="secondary" className="text-[10px]">{it.category}</Badge>}
                    </div>
                    {it.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{it.description}</p>}
                    <div className="flex items-center gap-2 mt-1">
                      {it.source_url && (
                        <a href={it.source_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                          Открыть <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {it.source === "local" && isStaff && (
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => deleteLocal.mutate(it.id)}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {data.length > 200 && (
            <p className="col-span-full text-center text-xs text-muted-foreground">Показано 200 из {data.length}</p>
          )}
        </div>
      )}
    </div>
  );
}

function AddLocalButton({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [yamlContent, setYaml] = useState("");
  const [description, setDesc] = useState("");
  const [saving, setSaving] = useState(false);

  const reset = () => { setName(""); setCategory(""); setYaml(""); setDesc(""); };
  const submit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("zabbix_template_library").insert({
        name, source: "local", category: category || null, description: description || null, yaml_content: yamlContent || null, tags: [],
      });
      if (error) throw error;
      toast({ title: "Шаблон добавлен в локальную библиотеку" });
      reset();
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["external-templates"] });
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="h-3.5 w-3.5 mr-1" /> В локальную</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Новый шаблон в локальную библиотеку</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Название *</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><Label>Категория</Label><Input value={category} onChange={(e) => setCategory(e.target.value)} /></div>
          <div><Label>Описание</Label><Textarea rows={2} value={description} onChange={(e) => setDesc(e.target.value)} /></div>
          <div><Label>YAML / XML содержимое</Label><Textarea rows={6} className="font-mono text-xs" value={yamlContent} onChange={(e) => setYaml(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Отмена</Button>
          <Button onClick={submit} disabled={saving || !name.trim()}>
            {saving && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />} Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}