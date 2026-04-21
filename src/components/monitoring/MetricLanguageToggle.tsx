import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { useMetricTranslations, setUserMetricLanguage } from "@/hooks/useMetricTranslations";
import { useToast } from "@/hooks/use-toast";

/**
 * Кнопка-переключатель языка отображения метрик.
 * Сохраняет выбор в user_metric_preferences.
 */
export default function MetricLanguageToggle({ size = "sm" }: { size?: "sm" | "default" }) {
  const { user } = useAuth();
  const { language } = useMetricTranslations();
  const qc = useQueryClient();
  const { toast } = useToast();

  const toggle = async () => {
    if (!user) return;
    const next = language === "translated" ? "original" : "translated";
    try {
      await setUserMetricLanguage(user.id, next);
      qc.invalidateQueries({ queryKey: ["user-metric-prefs", user.id] });
      toast({
        title: next === "translated" ? "Метрики на русском" : "Оригинальные имена Zabbix",
      });
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size={size} onClick={toggle} className="gap-1.5">
            <Languages className="h-3.5 w-3.5" />
            <span className="text-xs font-mono uppercase">
              {language === "translated" ? "RU" : "EN"}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {language === "translated"
            ? "Сейчас: русские названия. Кликните, чтобы показать оригинальные имена Zabbix."
            : "Сейчас: оригинальные имена Zabbix. Кликните, чтобы показать русские названия."}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}