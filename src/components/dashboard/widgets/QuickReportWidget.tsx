import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import { useQuickReportPreview } from "@/hooks/useQuickReportPreview";
import QuickReportDialog from "@/components/protocols/QuickReportDialog";

export default function QuickReportWidget() {
  const [open, setOpen] = useState(false);
  const { scheduledCount, sites } = useQuickReportPreview();

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          Быстрый отчёт
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between">
        <div className="space-y-1 mb-4">
          {scheduledCount === 0 ? (
            <p className="text-sm text-muted-foreground">
              Нет запланированных работ на сегодня
            </p>
          ) : (
            <>
              <p className="text-2xl font-bold">{scheduledCount}</p>
              <p className="text-xs text-muted-foreground">
                протоколов к созданию сегодня
              </p>
              <div className="mt-2 space-y-0.5">
                {sites.slice(0, 4).map((s) => (
                  <p key={s.id} className="text-xs text-muted-foreground truncate">
                    • {s.name}
                  </p>
                ))}
              </div>
            </>
          )}
        </div>
        <Button
          className="w-full"
          disabled={scheduledCount === 0}
          onClick={() => setOpen(true)}
        >
          <Zap className="h-3.5 w-3.5 mr-2" />
          Создать все · OK
        </Button>
      </CardContent>
      <QuickReportDialog open={open} onOpenChange={setOpen} />
    </Card>
  );
}