import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Lightbulb, Copy, Check, Activity, Terminal } from "lucide-react";
import { getDeviceHints } from "@/lib/device-hints";
import { useToast } from "@/hooks/use-toast";

interface Props {
  deviceType?: string | null;
  /** Compact: убирает Card-обёртку, занимает меньше места */
  compact?: boolean;
  /** Скрыть таб "Команды" — например, для ролей без SSH-доступа */
  hideCommands?: boolean;
  className?: string;
}

/**
 * Контекстная панель подсказок для оборудования.
 * Показывает, что обычно мониторится и какие команды чаще всего применяют.
 */
export default function DeviceHintsPanel({ deviceType, compact, hideCommands, className }: Props) {
  const hints = useMemo(() => getDeviceHints(deviceType), [deviceType]);
  const { toast } = useToast();
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = async (cmd: string) => {
    try {
      await navigator.clipboard.writeText(cmd);
      setCopied(cmd);
      toast({ title: "Команда скопирована" });
      setTimeout(() => setCopied((c) => (c === cmd ? null : c)), 2000);
    } catch {
      toast({ title: "Не удалось скопировать", variant: "destructive" });
    }
  };

  const body = (
    <Tabs defaultValue="metrics" className="w-full">
      <TabsList className="grid w-full" style={{ gridTemplateColumns: hideCommands ? "1fr" : "1fr 1fr" }}>
        <TabsTrigger value="metrics">
          <Activity className="h-3.5 w-3.5 mr-1.5" />
          Метрики
        </TabsTrigger>
        {!hideCommands && (
          <TabsTrigger value="commands">
            <Terminal className="h-3.5 w-3.5 mr-1.5" />
            Команды
          </TabsTrigger>
        )}
      </TabsList>

      <TabsContent value="metrics" className="mt-3">
        <ScrollArea className={compact ? "h-[180px]" : "h-[260px]"}>
          <ul className="space-y-2 pr-3">
            {hints.metrics.map((m) => (
              <li key={m.key} className="border rounded-md p-2 bg-muted/30">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{m.label}</p>
                    <code className="text-[10px] text-muted-foreground break-all">{m.key}</code>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{m.why}</p>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </TabsContent>

      {!hideCommands && (
        <TabsContent value="commands" className="mt-3">
          <ScrollArea className={compact ? "h-[180px]" : "h-[260px]"}>
            <ul className="space-y-2 pr-3">
              {hints.commands.map((c) => (
                <li key={c.command} className="border rounded-md p-2 bg-muted/30">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-medium">{c.label}</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2"
                      onClick={() => handleCopy(c.command)}
                    >
                      {copied === c.command ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  <code className="block text-[11px] bg-background/60 p-1.5 rounded border break-all whitespace-pre-wrap">
                    {c.command}
                  </code>
                  <p className="text-xs text-muted-foreground mt-1">{c.description}</p>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </TabsContent>
      )}
    </Tabs>
  );

  if (compact) {
    return (
      <div className={className}>
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-medium">Подсказки: {hints.title}</span>
          <Badge variant="outline" className="text-[10px] ml-auto">
            {hints.metrics.length} метрик · {hints.commands.length} команд
          </Badge>
        </div>
        {body}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          Контекстные подсказки
          <Badge variant="outline" className="ml-1">{hints.title}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  );
}