import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Eye, ClipboardList } from "lucide-react";
import { frequencyLabels } from "@/lib/schedule-utils";

const statusLabels: Record<string, string> = {
  pending: "Ожидает",
  in_progress: "В работе",
  completed: "Завершён",
  overdue: "Просрочен",
};

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  in_progress: "secondary",
  completed: "default",
  overdue: "destructive",
};

interface Protocol {
  id: string;
  site_id: string;
  frequency: string;
  period_start: string;
  period_end: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  sites?: { name: string } | null;
}

interface Props {
  protocols: Protocol[];
  onSelect: (id: string) => void;
}

export default function ProtocolList({ protocols, onSelect }: Props) {
  if (protocols.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center py-12">
        <ClipboardList className="h-12 w-12 text-muted-foreground/40 mb-4" />
        <p className="text-muted-foreground">Протоколы не найдены</p>
      </Card>
    );
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Площадка</TableHead>
            <TableHead>Тип работ</TableHead>
            <TableHead>Период</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead className="hidden md:table-cell">Создан</TableHead>
            <TableHead className="w-20">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {protocols.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-medium">{p.sites?.name ?? "—"}</TableCell>
              <TableCell>
                <Badge variant="outline">{frequencyLabels[p.frequency] ?? p.frequency}</Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {format(new Date(p.period_start), "dd.MM.yyyy")} — {format(new Date(p.period_end), "dd.MM.yyyy")}
              </TableCell>
              <TableCell>
                <Badge variant={statusVariants[p.status] ?? "outline"}>
                  {statusLabels[p.status] ?? p.status}
                </Badge>
              </TableCell>
              <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                {format(new Date(p.created_at), "dd.MM.yyyy HH:mm")}
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" onClick={() => onSelect(p.id)} title="Открыть">
                  <Eye className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
