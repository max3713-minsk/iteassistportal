import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import QuickReportDialog from "./QuickReportDialog";

export default function QuickReportButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Zap className="h-4 w-4 mr-2" />
        Быстрый отчёт
      </Button>
      <QuickReportDialog open={open} onOpenChange={setOpen} />
    </>
  );
}