import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen, Ticket, ClipboardCheck, Calendar, Server, Building2, FileText,
  Activity, Shield, Users, Wrench, Sparkles,
} from "lucide-react";

interface Section {
  id: string;
  icon: any;
  title: string;
  summary: string;
  steps: { title: string; body: string }[];
}

const sections: Section[] = [
  {
    id: "tickets",
    icon: Ticket,
    title: "Заявки (Service Desk)",
    summary: "Регистрация инцидентов и сервисных запросов с автоматическим контролем SLA.",
    steps: [
      { title: "Создание заявки", body: "Нажмите «Создать заявку», выберите тип (инцидент / сервисный запрос), категорию, ЦОД, оборудование. Система автоматически выставит приоритет П1–П4 и крайний срок реагирования." },
      { title: "Жизненный цикл", body: "open → assigned → in_progress → waiting → resolved → closed. Только Заказчик может окончательно закрыть заявку. При просрочке статус становится «overdue» (выделение красным)." },
      { title: "Привязка к мониторингу", body: "Заявки, созданные из проблем Zabbix, содержат ссылку на eventid. Алерт остаётся в списке актуальных, пока связанная заявка не будет закрыта." },
      { title: "Комментарии", body: "Внутренние комментарии видны только инженерам и администраторам, обычные — заказчику." },
    ],
  },
  {
    id: "protocols",
    icon: ClipboardCheck,
    title: "Протоколы технического обслуживания",
    summary: "Учёт регулярных работ ТО по периодичности (день / неделя / месяц / квартал / полугодие).",
    steps: [
      { title: "Вкладки", body: "Активные — текущий период. Просрочены — период истёк, статус не «completed». Завершённые — выполненные протоколы." },
      { title: "Создание", body: "Создаётся вручную или автоматически по графику обслуживания. Включает чек-лист задач по оборудованию ЦОД." },
      { title: "Автозаполнение метрик", body: "Для пунктов с типом auto подтягиваются значения из Zabbix и сохраняются в auto_result." },
      { title: "Экспорт", body: "Готовые протоколы экспортируются в DOCX с подписями и графиками." },
    ],
  },
  {
    id: "calendar",
    icon: Calendar,
    title: "Календарь обслуживания",
    summary: "Визуальный план плановых работ с цветовой индикацией нагрузки.",
    steps: [
      { title: "Просмотр", body: "Клик по дню открывает список запланированных задач с разбивкой по оборудованию." },
      { title: "Цветовая шкала", body: "Зелёный — выполнено, синий — в работе, жёлтый — ожидает, красный — просрочено." },
    ],
  },
  {
    id: "equipment",
    icon: Server,
    title: "Оборудование",
    summary: "Реестр единиц оборудования с привязкой к ЦОД и категориям.",
    steps: [
      { title: "Карточка", body: "Содержит модель, серийный номер, ОС, статус (active / maintenance / decommissioned)." },
      { title: "Привязка к Zabbix", body: "Через monitoring_host_links оборудование связывается с zabbix_host_id для отображения метрик." },
      { title: "Метрики в карточке", body: "CPU/RAM/Disk показываются в нормализованном виде (проценты, байты/КБ/МБ/ГБ, биты/Мбит/с)." },
    ],
  },
  {
    id: "sites",
    icon: Building2,
    title: "ЦОД",
    summary: "Список центров обработки данных заказчика.",
    steps: [
      { title: "Управление", body: "Только администраторы и инженеры могут добавлять и редактировать ЦОД. Заказчик видит свои." },
    ],
  },
  {
    id: "documents",
    icon: FileText,
    title: "Документы",
    summary: "Файловое хранилище с предпросмотром PDF, DOC и изображений.",
    steps: [
      { title: "Загрузка", body: "Поддерживаются PDF, DOCX, XLSX, изображения. Файлы привязываются к ЦОД и организации." },
    ],
  },
  {
    id: "monitoring",
    icon: Activity,
    title: "Мониторинг и автоматизация",
    summary: "Интеграция с Zabbix: хосты, проблемы, графики, шаблоны, автоматизация Ansible.",
    steps: [
      { title: "Дашборд", body: "Сводка по хостам, проблемам и алертам. Виджеты кластера и быстрых графиков." },
      { title: "Хосты", body: "Список хостов из Zabbix с метриками. Карточка хоста — детальные параметры. Метрики автоматически конвертируются (% / B / KB / MB / GB / bps / Mbps)." },
      { title: "Проблемы и алерты", body: "Активные триггеры. Признание (acknowledge), создание заявки. Если триггер запрещает ручное закрытие — система автоматически делает только подтверждение и сообщает об этом." },
      { title: "Графики", body: "Конструктор графиков по item_keys нескольких хостов. Ось Y и tooltip используют единицы измерения. Сохранение в библиотеке (личные, общие, шаблоны)." },
      { title: "Покрытие ТЗ", body: "Сопоставление пунктов технического задания с метриками Zabbix. Авто-сопоставление по ключам и шаблонам метрик." },
      { title: "Инструменты для непокрытых пунктов", body: "Для пунктов со статусом «Частично» или «Не покрыто» в диалоге редактирования доступен раздел «Инструменты для закрытия пункта». Можно перечислить шаблоны Zabbix, скрипты Ansible, ручные процедуры или внешние системы с указанием ответственного и текущего статуса (запланировано / в работе / настроено / заблокировано)." },
      { title: "Настройка", body: "Параметры подключения к Zabbix, управление хостами, библиотека шаблонов." },
    ],
  },
  {
    id: "audit",
    icon: Shield,
    title: "Журнал аудита",
    summary: "История значимых действий пользователей. Доступен только администраторам.",
    steps: [
      { title: "Фильтры", body: "По модулю, действию, пользователю, дате." },
      { title: "Экспорт", body: "CSV с поддержкой кириллицы (UTF-8 BOM)." },
    ],
  },
  {
    id: "users",
    icon: Users,
    title: "Управление пользователями",
    summary: "Создание учётных записей и назначение ролей. Доступно только администраторам.",
    steps: [
      { title: "Роли", body: "admin — полный доступ; engineer — операционные действия; customer — заявки и просмотр." },
      { title: "Модули", body: "Гранулярная настройка доступа к модулям через user_module_permissions." },
    ],
  },
];

export default function UserManual() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Руководство пользователя портала ITEA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Этот портал объединяет управление инцидентами (Service Desk), плановое
            обслуживание (Протоколы и Календарь), реестр оборудования и ЦОД, документацию,
            а также мониторинг инфраструктуры через интеграцию с Zabbix и Ansible.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <Badge variant="outline" className="gap-1"><Sparkles className="h-3 w-3" />Авто-сопоставление ТЗ</Badge>
            <Badge variant="outline" className="gap-1"><Wrench className="h-3 w-3" />Конфигурация инструментов покрытия</Badge>
            <Badge variant="outline" className="gap-1"><Activity className="h-3 w-3" />Единицы измерения метрик</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <Accordion type="multiple" defaultValue={["monitoring"]} className="w-full">
            {sections.map((s) => {
              const Icon = s.icon;
              return (
                <AccordionItem key={s.id} value={s.id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2 text-left">
                      <Icon className="h-4 w-4 text-primary shrink-0" />
                      <div>
                        <p className="font-medium">{s.title}</p>
                        <p className="text-xs text-muted-foreground font-normal">{s.summary}</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ol className="space-y-2 pl-6 list-decimal text-sm">
                      {s.steps.map((step, i) => (
                        <li key={i}>
                          <span className="font-medium">{step.title}.</span>{" "}
                          <span className="text-muted-foreground">{step.body}</span>
                        </li>
                      ))}
                    </ol>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Wrench className="h-4 w-4 text-primary" />
            Как закрыть пункт ТЗ через настраиваемые инструменты
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <ol className="list-decimal pl-5 space-y-1">
            <li>Откройте Мониторинг → Покрытие ТЗ.</li>
            <li>Найдите пункт со статусом «Частично» или «Не покрыто» и нажмите карандаш.</li>
            <li>В блоке «Инструменты для закрытия пункта» нажмите «Добавить».</li>
            <li>Укажите название, тип (Zabbix шаблон, Ansible playbook, скрипт, ручная процедура, внешняя система), параметры конфигурации, ответственного и статус выполнения.</li>
            <li>Сохраните. Конфигурация хранится в <code>tz_coverage.related_items.tools</code> и доступна для последующего автоматического разворачивания.</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
