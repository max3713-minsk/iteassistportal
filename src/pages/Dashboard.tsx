import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Server, Ticket, ClipboardList } from "lucide-react";

export default function Dashboard() {
  const { data: sitesCount } = useQuery({
    queryKey: ["sites-count"],
    queryFn: async () => {
      const { count } = await supabase.from("sites").select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const { data: equipmentCount } = useQuery({
    queryKey: ["equipment-count"],
    queryFn: async () => {
      const { count } = await supabase.from("equipment").select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const { data: ticketsCount } = useQuery({
    queryKey: ["open-tickets-count"],
    queryFn: async () => {
      const { count } = await supabase.from("tickets").select("*", { count: "exact", head: true }).in("status", ["open", "in_progress"]);
      return count ?? 0;
    },
  });

  const { data: protocolsCount } = useQuery({
    queryKey: ["pending-protocols-count"],
    queryFn: async () => {
      const { count } = await supabase.from("maintenance_protocols").select("*", { count: "exact", head: true }).in("status", ["pending", "in_progress"]);
      return count ?? 0;
    },
  });

  const stats = [
    { label: "Площадки", value: sitesCount ?? 0, icon: Building2, color: "text-primary" },
    { label: "Оборудование", value: equipmentCount ?? 0, icon: Server, color: "text-accent" },
    { label: "Открытые заявки", value: ticketsCount ?? 0, icon: Ticket, color: "text-destructive" },
    { label: "Активные протоколы", value: protocolsCount ?? 0, icon: ClipboardList, color: "text-success" },
  ];

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold mb-6">Панель управления</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className={cn("h-5 w-5", s.color)} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-heading font-bold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
