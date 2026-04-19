import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen, Ticket, ClipboardCheck, Calendar, Server, Building2, FileText,
  Activity, Shield, Users, Wrench, Sparkles, Bell,
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
  {
    id: "notifications",
    icon: Bell,
    title: "Уведомления",
    summary: "Webhooks-каналы (Telegram, Mattermost, Email, SMS), подписки на события, режим «Не беспокоить» и дайджесты.",
    steps: [
      { title: "Где находится", body: "Раздел «Уведомления» в боковом меню. Доступен всем ролям. Каждый пользователь настраивает свои каналы и подписки независимо." },
      { title: "Шаг 1 — Каналы доставки", body: "Вкладка «Каналы» → «Добавить канал». Выберите тип (Telegram / Mattermost / Email / SMS), задайте название и параметры подключения. Каждый тип имеет встроенную подсказку с пошаговой инструкцией." },
      { title: "Telegram", body: "Создайте бота у @BotFather командой /newbot — получите токен. Напишите боту любое сообщение и узнайте ваш chat_id у @userinfobot (для группы — добавьте бота в чат и используйте id с минусом, например -1001234567890). Введите оба значения в форму. Опционально выберите parse_mode (HTML/MarkdownV2)." },
      { title: "Mattermost", body: "В Mattermost: Integrations → Incoming Webhooks → Add. Скопируйте сгенерированный URL и вставьте в поле «Webhook URL». Опционально переопределите канал (#alerts) и имя отправителя. Включите «rich attachment» чтобы получать сообщения с заголовком и цветной полосой." },
      { title: "Email (webhook)", body: "Укажите URL вашего SMTP-relay (Make.com, n8n, Zapier, собственный сервис). На него POST'нется JSON {title, message, recipient, event_type, priority, payload}. Введите email получателя в соответствующее поле." },
      { title: "SMS (webhook)", body: "Укажите endpoint провайдера (SMS.by, SMSC.ru, Twilio relay) и номер телефона. Доступны: HTTP-метод, кастомные заголовки (JSON), шаблон тела запроса с переменными." },
      { title: "Шаг 2 — Тест канала", body: "После сохранения нажмите «Тест» в карточке канала. Должно прийти сообщение «Тестовое уведомление». При успехе появится зелёная метка «Проверен», при ошибке — текст ошибки от webhook'а. Также запись попадёт во вкладку «История»." },
      { title: "Шаг 3 — Подписки на события", body: "Вкладка «Подписки» — список из 24+ типов событий, сгруппированных по модулям (Заявки, Протоколы, Мониторинг, Автоматизация, и т.д.). Включите тумблер у нужного события, выберите минимальный приоритет и отметьте каналы доставки чекбоксами. Можно подписать одно событие на несколько каналов одновременно." },
      { title: "Минимальный приоритет", body: "Уведомление будет отправлено только если приоритет события ≥ выбранного. Например, выбрав «P2 — высокий и выше», вы не получите уведомления о P3/P4 событиях. Значение «Любой» отключает фильтрацию по приоритету." },
      { title: "Шаг 4 — Режим доставки", body: "Вкладка «Режим». Три способа: Мгновенно (всё сразу), Критика мгновенно + остальное дайджестом, Только дайджест. Дайджест умеет ежечасно, каждые 4 часа, ежедневно (09:00 / 18:00) или еженедельно. Часовой пояс используется для тихих часов и расписания." },
      { title: "Не беспокоить и тихие часы", body: "Полный DND блокирует все уведомления. Тихие часы — мягкий режим: в указанное окно (например 22:00–08:00) и выбранные дни недели события уходят в дайджест. Чекбокс «Пропускать P1» позволяет критическим событиям прорываться даже в DND/тихие часы." },
      { title: "Шаг 5 — История", body: "Вкладка «История» показывает последние 100 отправок (обновление каждые 10 сек): время, событие, канал, статус (sent/failed/skipped/pending), текст ошибки от провайдера. Используйте для диагностики." },
      { title: "Шаблоны сообщений", body: "В каждом канале есть поле «Шаблон сообщения». Поддерживаются переменные {{title}}, {{body}}, {{event_type}}, {{priority}} и любые поля из payload события. Если оставить пусто — используется формат «{{title}}\\n{{body}}»." },
      { title: "Безопасность", body: "Каналы и подписки доступны через RLS только владельцу. Bot-токены и webhook-URL хранятся в таблице notification_channels с приватным доступом. Не передавайте свои токены третьим лицам — они дают полный контроль над ботом/webhook'ом." },
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
