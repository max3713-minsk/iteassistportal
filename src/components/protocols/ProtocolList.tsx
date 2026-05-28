import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, ClipboardList, Plus, UserCheck, ListChecks } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { frequencyLabels } from "@/lib/schedule-utils";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";

const statusLabels: Record<string, string> = {
  pending: "Ожидает",
  in_progress: "В работе",
  completed: "Завершён",
  overdue: "Просрочен",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500 text-white",
  in_progress: "bg-blue-400 text-white",
  completed: "bg-emerald-500 text-white",
  overdue: "bg-red-500 text-white",
};

const rowStatusClasses: Record<string, string> = {
  pending: "border-l-4 border-l-yellow-500",
  in_progress: "border-l-4 border-l-blue-400",
  completed: "border-l-4 border-l-emerald-500 bg-muted/30",
  overdue: "border-l-4 border-l-red-500",
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
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onToggleSelectAll?: (ids: string[]) => void;
  loading?: boolean;
  onCreate?: () => void;
  onAssignSigners?: (id: string) => void;
  onCompleteAllWorks?: (id: string) => void;
}

export default function ProtocolList({ protocols, onSelect, selectedIds, onToggleSelect, onToggleSelectAll, loading, onCreate, onAssignSigners, onCompleteAllWorks }: Props) {
  if (loading) {
    return (
      <Card className="p-4 space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 flex-[2]" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </Card>
    );
  }
  if (protocols.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="Протоколы не найдены"
        description="По выбранным фильтрам пока ничего нет. Создайте новый протокол ТО или сбросьте фильтры."
        action={onCreate ? { label: "Создать протокол", onClick: onCreate, icon: Plus } : undefined}
      />
    );
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            {onToggleSelect && (
              <TableHead className="w-10">
                <Checkbox
                  checked={protocols.length > 0 && protocols.every((p) => selectedIds?.has(p.id))}
                  onCheckedChange={() => onToggleSelectAll?.(protocols.map((p) => p.id))}
                />
              </TableHead>
            )}
            <TableHead>Площадка</TableHead>
            <TableHead>Тип работ</TableHead>
            <TableHead>Период</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead className="hidden md:table-cell">Создан</TableHead>
            <TableHead className="w-28">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {protocols.map((p) => (
            <TableRow key={p.id} className={cn(rowStatusClasses[p.status])}>
              {onToggleSelect && (
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedIds?.has(p.id) ?? false}
                    onCheckedChange={() => onToggleSelect(p.id)}
                  />
                </TableCell>
              )}
              <TableCell className="font-medium">{p.sites?.name ?? "—"}</TableCell>
              <TableCell>
                <Badge variant="outline">{frequencyLabels[p.frequency] ?? p.frequency}</Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {format(new Date(p.period_start), "dd.MM.yyyy")} — {format(new Date(p.period_end), "dd.MM.yyyy")}
              </TableCell>
              <TableCell>
                <Badge className={statusColors[p.status] ?? "bg-gray-400 text-white"}>
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
                {onAssignSigners && (
                  <Button variant="ghost" size="icon" onClick={() => onAssignSigners(p.id)} title="Подписанты">
                    <UserCheck className="h-4 w-4" />
                  </Button>
                )}
                {onCompleteAllWorks && p.status !== "completed" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onCompleteAllWorks(p.id)}
                    title="Выполнить все работы"
                  >
                    <ListChecks className="h-4 w-4 text-emerald-500" />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
