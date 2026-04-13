import { Card, CardContent } from "@/components/ui/card";
import { ClipboardList } from "lucide-react";

export default function Protocols() {
  return (
    <div>
      <h1 className="font-heading text-2xl font-bold mb-6">Протоколы обслуживания</h1>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <ClipboardList className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">Модуль протоколов — следующий этап</p>
        </CardContent>
      </Card>
    </div>
  );
}
