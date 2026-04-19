import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

const STATUS_VARIANT: Record<string, string> = {
  sent: "border-emerald-500/40 text-emerald-600",
  failed: "border-destructive/40 text-destructive",
  pending: "border-amber-500/40 text-amber-600",
  skipped: "border-muted-foreground/40 text-muted-foreground",
};

export function NotificationHistory() {
  const { user } = useAuth();
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["notif-log", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("notification_log").select("*")
        .order("created_at", { ascending: false }).limit(100);
      return data ?? [];
    },
    enabled: !!user,
    refetchInterval: 10_000,
  });

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-heading text-lg">История отправок</h3>
        <p className="text-sm text-muted-foreground">Последние 100 уведомлений (обновляется каждые 10 сек)</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Загрузка...</p>
      ) : logs.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">История пуста</CardContent></Card>
      ) : (
        <Card><CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Время</TableHead>
                <TableHead>Событие</TableHead>
                <TableHead>Канал</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Сообщение</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((l: any) => (
                <TableRow key={l.id}>
                  <TableCell className="text-xs whitespace-nowrap">{format(new Date(l.created_at), "dd.MM HH:mm:ss", { locale: ru })}</TableCell>
                  <TableCell className="text-xs">
                    <div className="font-medium">{l.title}</div>
                    <div className="text-muted-foreground">{l.event_type}{l.priority ? ` · ${l.priority}` : ""}</div>
                  </TableCell>
                  <TableCell className="text-xs capitalize">{l.channel_type}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={STATUS_VARIANT[l.status] ?? ""}>{l.status}</Badge>
                  </TableCell>
                  <TableCell className="text-xs max-w-xs">
                    {l.error ? <span className="text-destructive line-clamp-2">{l.error}</span> : <span className="text-muted-foreground line-clamp-2">{l.body}</span>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent></Card>
      )}
    </div>
  );
}
