// Friendly Russian descriptions for public-schema tables shown in the migrations UI.
export const TABLE_DICTIONARY: Record<string, { title: string; description: string; group: string }> = {
  organizations:           { title: "Организации",            description: "Заказчики и их реквизиты",                                group: "Справочники" },
  contracts:               { title: "Договоры",               description: "Договоры обслуживания с заказчиками",                     group: "Справочники" },
  sites:                   { title: "ЦОД",                    description: "Площадки/центры обработки данных заказчика",              group: "Справочники" },
  equipment:               { title: "Оборудование",           description: "Учётные единицы оборудования по ЦОД",                     group: "Справочники" },
  equipment_categories:    { title: "Категории оборудования", description: "Группировка оборудования",                                group: "Справочники" },
  holidays:                { title: "Календарь праздников",   description: "Государственные выходные и переносы",                     group: "Календарь и ТО" },
  maintenance_tasks:       { title: "Регламент работ",        description: "Шаблоны работ для ТО",                                    group: "Календарь и ТО" },
  maintenance_schedules:   { title: "График ТО",              description: "Назначения работ на даты",                                group: "Календарь и ТО" },
  maintenance_protocols:   { title: "Протоколы ТО",           description: "Документы по факту выполненных работ",                    group: "Календарь и ТО" },
  protocol_items:          { title: "Строки протоколов",      description: "Каждая работа внутри протокола",                          group: "Календарь и ТО" },
  protocol_templates:      { title: "Шаблоны протоколов",     description: "DOCX-шаблоны для генерации",                              group: "Календарь и ТО" },
  monitored_hosts:         { title: "Хосты мониторинга",      description: "Хосты Zabbix, привязанные к ЦОД",                         group: "Мониторинг" },
  monitoring_host_links:   { title: "Связки хост↔оборудование", description: "Соответствие Zabbix-хоста и записи оборудования",       group: "Мониторинг" },
  item_aliases:            { title: "Псевдонимы метрик",      description: "Понятные русские названия метрик",                        group: "Мониторинг" },
  item_overrides:          { title: "Настройки метрик",       description: "Скрытие/переименование метрик по хосту",                  group: "Мониторинг" },
  metric_translations:     { title: "Переводы метрик",        description: "Глобальные переводы ключей Zabbix",                       group: "Мониторинг" },
  alert_thresholds:        { title: "Пороги тревог",          description: "Условия предупреждения и критики по метрикам",            group: "Мониторинг" },
  dismissed_alerts:        { title: "Скрытые тревоги",        description: "Тревоги, скрытые пользователем",                          group: "Мониторинг" },
  mib_oid_cache:           { title: "Кэш OID (MIB)",          description: "Описания OID из внешних источников",                      group: "Мониторинг" },
  saved_graphs:            { title: "Сохранённые графики",    description: "Личные и общие конфигурации графиков",                    group: "Мониторинг" },
  automation_logs:         { title: "Лог автоматизации",      description: "Запуски скриптов Zabbix/Ansible",                         group: "Мониторинг" },
  documents:               { title: "Документы",              description: "Файлы (договоры, паспорта, регламенты)",                  group: "Документы" },
  profiles:                { title: "Профили",                description: "Дополнительные сведения о пользователях",                 group: "Пользователи" },
  user_roles:              { title: "Роли пользователей",     description: "Привязка ролей admin/engineer/customer",                  group: "Пользователи" },
  audit_logs:              { title: "Журнал аудита",          description: "История изменений пользователей",                         group: "Пользователи" },
  notification_channels:   { title: "Каналы уведомлений",     description: "Email/Telegram/Webhook для уведомлений",                  group: "Уведомления" },
  notification_subscriptions: { title: "Подписки на события", description: "Фильтры событий по типам и приоритету",                   group: "Уведомления" },
  notification_preferences:{ title: "Настройки уведомлений",  description: "Тихие часы, дайджесты, DnD",                              group: "Уведомления" },
  notification_queue:      { title: "Очередь уведомлений",    description: "Запланированная отправка",                                group: "Уведомления" },
  notification_log:        { title: "Лог уведомлений",        description: "История отправок и ошибки",                               group: "Уведомления" },
  support_schemes:         { title: "Схемы поддержки",        description: "Схема горячих линий и SLA",                               group: "Поддержка" },
  support_scheme_lines:    { title: "Линии поддержки",        description: "Линии в схеме (1-я, 2-я и т.д.)",                         group: "Поддержка" },
  gitlab_ticket_links:     { title: "Связи с GitLab",         description: "Привязка заявок к issue GitLab",                          group: "Поддержка" },
  integration_settings:    { title: "Настройки интеграций",   description: "Параметры Zabbix/Ansible/GitLab и т.д.",                  group: "Интеграции" },
  infrastructure_maps:     { title: "Карты инфраструктуры",   description: "Визуальные схемы инфраструктуры",                         group: "Документы" },
  infrastructure_map_versions: { title: "Версии карт",        description: "История версий карт инфраструктуры",                      group: "Документы" },
  factory_reset_requests:  { title: "Запросы сброса",         description: "Заявки на полный сброс портала",                          group: "Система" },
  applied_migrations:      { title: "Применённые миграции",   description: "Журнал применённых SQL-миграций",                         group: "Система" },
};

export function describeTable(name: string) {
  return TABLE_DICTIONARY[name] ?? { title: name, description: "—", group: "Прочее" };
}

// Extract table names that a SQL migration references (best-effort, regex-based).
export function extractAffectedTables(sql: string): string[] {
  const re = /(?:CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?|ALTER\s+TABLE(?:\s+IF\s+EXISTS)?|DROP\s+TABLE(?:\s+IF\s+EXISTS)?|INSERT\s+INTO|UPDATE|DELETE\s+FROM|TRUNCATE(?:\s+TABLE)?|GRANT\s+[^;]+ON|CREATE\s+POLICY[^;]+ON)\s+(?:public\.)?["']?([a-z_][a-z0-9_]*)["']?/gi;
  const set = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(sql)) !== null) set.add(m[1].toLowerCase());
  return Array.from(set);
}