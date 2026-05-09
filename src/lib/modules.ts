// Single source of truth for portal modules used in user permissions.
// Keep `key` values in sync with the `moduleKey` props in src/components/layout/AppSidebar.tsx
// so that toggling a module here actually hides/shows the matching sidebar item.

export type ModuleDef = { key: string; label: string; group: string; adminOnly?: boolean };

export const PORTAL_MODULES: ModuleDef[] = [
  { key: "dashboard",     label: "Панель управления",       group: "Рабочее место" },
  { key: "tickets",       label: "Заявки",                  group: "Рабочее место" },
  { key: "notifications", label: "Уведомления",             group: "Рабочее место" },
  { key: "sites",         label: "ЦОД",                     group: "Объекты" },
  { key: "equipment",     label: "Оборудование",            group: "Объекты" },
  { key: "protocols",     label: "Протоколы",               group: "Обслуживание" },
  { key: "schedules",     label: "Календарь ТО",            group: "Обслуживание" },
  { key: "documents",     label: "Документация",            group: "Обслуживание" },
  { key: "monitoring",    label: "Мониторинг и Карта",      group: "Мониторинг" },
  { key: "help",          label: "Справка",                 group: "Справка" },
  { key: "organizations", label: "Организации и Договоры",  group: "Администрирование", adminOnly: true },
  { key: "integrations",  label: "Подключения",             group: "Администрирование", adminOnly: true },
  { key: "users",         label: "Пользователи",            group: "Администрирование", adminOnly: true },
  { key: "audit",         label: "Журнал событий",          group: "Администрирование", adminOnly: true },
];

export const NON_ADMIN_MODULES = PORTAL_MODULES.filter((m) => !m.adminOnly);