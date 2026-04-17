import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Star, Plus, Trash2, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface Widget {
  id: string;
  widget_type: string;
  title: string;
  config: { hostid?: string; itemid?: string; graphid?: string; period?: string };
  position: number;
}

interface Props {
  hosts: { hostid: string; name: string }[];
  graphs: { graphid: string; name: string; hosts?: { hostid: string }[] }[];
}

export default function FavoriteGraphs({ hosts, graphs }: Props) {
  const { toast } = useToast();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newHost, setNewHost] = useState("");
  const [newGraph, setNewGraph] = useState("");

  const { data: widgets = [] } = useQuery({
    queryKey: ["dashboard-widgets", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("user_dashboard_widgets")
        .select("*")
        .eq("user_id", user.id)
        .order("position");
      return (data as Widget[]) || [];
    },
    enabled: !!user,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Не авторизован");
      const { error } = await supabase.from("user_dashboard_widgets").insert({
        user_id: user.id,
        widget_type: "graph",
        title: newTitle || "Без названия",
        config: { hostid: newHost, graphid: newGraph, period: "3600" },
        position: widgets.length,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dashboard-widgets"] });
      toast({ title: "График добавлен в избранное" });
      setAdding(false);
      setNewTitle(""); setNewHost(""); setNewGraph("");
    },
    onError: (e: Error) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("user_dashboard_widgets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dashboard-widgets"] });
      toast({ title: "Удалено" });
    },
  });

  const filteredGraphs = newHost
    ? graphs.filter((g) => g.hosts?.some((h) => h.hostid === newHost))
    : graphs;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Star className="h-4 w-4 text-primary" />
          Мои графики
        </CardTitle>
        <Dialog open={adding} onOpenChange={setAdding}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="h-3.5 w-3.5 mr-1" />Добавить
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Закрепить график</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Название</Label>
                <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="CPU srv-01" />
              </div>
              <div>
                <Label>Хост</Label>
                <Select value={newHost} onValueChange={setNewHost}>
                  <SelectTrigger><SelectValue placeholder="Выберите хост" /></SelectTrigger>
                  <SelectContent>
                    {hosts.map((h) => (
                      <SelectItem key={h.hostid} value={h.hostid}>{h.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>График Zabbix</Label>
                <Select value={newGraph} onValueChange={setNewGraph}>
                  <SelectTrigger><SelectValue placeholder="Выберите график" /></SelectTrigger>
                  <SelectContent>
                    {filteredGraphs.slice(0, 50).map((g) => (
                      <SelectItem key={g.graphid} value={g.graphid}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setAdding(false)}>Отмена</Button>
                <Button onClick={() => addMutation.mutate()} disabled={addMutation.isPending || !newGraph}>
                  Добавить
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {widgets.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground">
            <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-40" />
            Закрепите любимые графики для быстрого доступа
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {widgets.map((w) => (
              <Card key={w.id} className="group">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm">{w.title}</CardTitle>
                  <Button
                    size="icon" variant="ghost"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => deleteMutation.mutate(w.id)}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/30 rounded h-32 flex items-center justify-center border border-dashed border-muted-foreground/20">
                    <BarChart3 className="h-6 w-6 opacity-40" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
