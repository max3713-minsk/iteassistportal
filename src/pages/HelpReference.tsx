import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Info, Clock, AlertTriangle } from "lucide-react";

const priorities = [
  {
    name: "Критический отказ инфраструктуры",
    code: "П1",
    description: "Полный отказ кластера или ключевого оборудования, приводящий к остановке работы сервисов ПТК и (или) интеграционных сервисов",
    examples: [
      "Отключение/отказ обоих узлов метрокластера",
      "Отказ основного и резервного стеков сетевого ядра",
      "Одновременный выход из строя СХД или сбой контроллеров хранения, при котором недоступны виртуальные машины",
    ],
    impact: "Полная недоступность сервисов верхнего уровня; невозможность обработки телеметрии и управления",
    sla: "0,5 ч",
    badgeClass: "bg-destructive text-destructive-foreground",
  },
  {
    name: "Частичный отказ или деградация",
    code: "П2",
    description: "Отказ отдельного элемента отказоустойчивой системы, при котором сервисы продолжают работать, но с рисками",
    examples: [
      "Отказ одного из сайтов метрокластера (с миграцией сервисов на второй сайт)",
      "Отказ одного из контроллеров СХД",
      "Отказ одного маршрутизатора или межсетевого экрана из пары",
      "Отказ кворум-сервера",
    ],
    impact: "Сервисы верхнего уровня продолжают работать, но нарушена резервируемость; рост рисков",
    sla: "1 ч",
    badgeClass: "bg-orange-500 text-white",
  },
  {
    name: "Сбой отдельных сервисов или каналов",
    code: "П3",
    description: "Проблемы, влияющие на часть функционала, но не вызывающие полной остановки",
    examples: [
      "Отказ канала связи между узлами кластера",
      "Ошибки репликации или резервного копирования",
      "Деградация производительности SAN или виртуализации",
    ],
    impact: "Частично снижена доступность или скорость работы сервисов ПТК АСДУ",
    sla: "2 ч",
    badgeClass: "bg-yellow-500 text-white",
  },
  {
    name: "Некритичные ошибки и сервисные запросы",
    code: "П4",
    description: "Ошибки мониторинга, настройки, обновления, консультации по вопросам",
    examples: [
      "Настройка VLAN, правил FW, маршрутов",
      "Вопросы по логам",
      "Плановое обновление прошивок",
    ],
    impact: "Не влияет на работу сервисов ПТК АСДУ",
    sla: "3 ч",
    badgeClass: "bg-muted text-muted-foreground",
  },
];

export default function HelpReference() {
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Справка</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Категории приоритетов и время реакции (SLA)
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[140px]">Категория</TableHead>
                <TableHead className="w-20">Приоритет</TableHead>
                <TableHead>Описание инцидента</TableHead>
                <TableHead>Примеры</TableHead>
                <TableHead>Влияние на работу АСДУ</TableHead>
                <TableHead className="w-24 text-center">Время реакции</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {priorities.map((p) => (
                <TableRow key={p.code}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>
                    <Badge className={p.badgeClass}>{p.code}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{p.description}</TableCell>
                  <TableCell className="text-sm">
                    <ul className="list-disc list-inside space-y-1">
                      {p.examples.map((ex, i) => (
                        <li key={i}>{ex}</li>
                      ))}
                    </ul>
                  </TableCell>
                  <TableCell className="text-sm">{p.impact}</TableCell>
                  <TableCell className="text-center font-bold text-lg">{p.sla}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            Примечания
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            <strong>Режим оказания сервисной поддержки</strong> — рабочие дни, определённые законодательством РБ, с 09:00 до 18:00.
          </p>
          <p>
            Для инцидентов категории <strong>П1</strong> время реакции для <strong>круглосуточного режима — 0,5 ч</strong>.
          </p>
          <p>
            Для категорий <strong>П2–П4</strong> при регистрации заявки в период 09:00–18:00 — в рамках текущего рабочего дня, в других случаях — на следующий рабочий день.
          </p>
          <p>
            <strong>Время реакции</strong> — интервал между моментом начала инцидента (фиксируемым системой мониторинга или в журнале заявок / Service Desk) и моментом, когда подрядчик начал диагностику или подключился для устранения.
          </p>
          <div className="flex items-start gap-2 mt-4 p-3 rounded-lg bg-muted">
            <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
            <p>
              Таблица не учитывает время сбора и выезда сервисной группы в случае необходимости. Предполагается, что данный временной интервал будет условием-константой — не более 5 часов (1 час на сбор + 4 часа в пути) для инцидентов категории П1.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Автоматический контроль SLA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Система автоматически отслеживает время реакции по каждой заявке. При создании заявки устанавливается крайний срок реагирования на основе приоритета:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>П1:</strong> 30 минут с момента создания</li>
            <li><strong>П2:</strong> 1 час с момента создания</li>
            <li><strong>П3:</strong> 2 часа с момента создания</li>
            <li><strong>П4:</strong> 3 часа с момента создания</li>
          </ul>
          <p>
            Если статус заявки не изменился на «В работе» до истечения крайнего срока, заявка автоматически переходит в статус <strong className="text-destructive">«Просрочена»</strong>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
