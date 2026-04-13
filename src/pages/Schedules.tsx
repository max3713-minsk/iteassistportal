import { Card, CardContent } from "@/components/ui/card";
import { CalendarCheck } from "lucide-react";

export default function Schedules() {
  return (
    <div>
      <h1 className="font-heading text-2xl font-bold mb-6">Календарь ТО</h1>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CalendarCheck className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">Модуль календаря — следующий этап</p>
        </CardContent>
      </Card>
    </div>
  );
}
