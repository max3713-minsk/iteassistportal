import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface FavoriteMetric {
  id: string;
  user_id: string;
  zabbix_host_id: string;
  host_name: string;
  itemid: string;
  item_key: string;
  item_name: string;
  units: string | null;
  position: number;
  created_at: string;
}

export function useFavoriteMetrics() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["favorite-metrics", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("user_favorite_metrics")
        .select("*")
        .eq("user_id", user.id)
        .order("position", { ascending: true });
      return (data || []) as FavoriteMetric[];
    },
    enabled: !!user,
  });

  const favorites = query.data || [];
  const favoriteItemIds = new Set(favorites.map((f) => f.itemid));

  const add = useMutation({
    mutationFn: async (m: Omit<FavoriteMetric, "id" | "user_id" | "position" | "created_at">) => {
      if (!user) throw new Error("Не авторизован");
      const position = favorites.length;
      const { error } = await supabase.from("user_favorite_metrics").insert({
        user_id: user.id,
        zabbix_host_id: m.zabbix_host_id,
        host_name: m.host_name,
        itemid: m.itemid,
        item_key: m.item_key,
        item_name: m.item_name,
        units: m.units,
        position,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["favorite-metrics", user?.id] });
      toast({ title: "Добавлено в избранное" });
    },
    onError: (e: Error) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (itemid: string) => {
      if (!user) throw new Error("Не авторизован");
      const { error } = await supabase
        .from("user_favorite_metrics")
        .delete()
        .eq("user_id", user.id)
        .eq("itemid", itemid);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["favorite-metrics", user?.id] });
      toast({ title: "Удалено из избранного" });
    },
    onError: (e: Error) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  });

  const toggle = (m: Omit<FavoriteMetric, "id" | "user_id" | "position" | "created_at">) => {
    if (favoriteItemIds.has(m.itemid)) remove.mutate(m.itemid);
    else add.mutate(m);
  };

  return {
    favorites,
    favoriteItemIds,
    isLoading: query.isLoading,
    toggle,
    add: add.mutate,
    remove: remove.mutate,
  };
}