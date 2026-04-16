// Product/System classification tree for Service Desk tickets

export interface Product {
  code: string;
  name: string;
  subcategories: string[];
}

export const PRODUCTS: Product[] = [
  {
    code: "SK11",
    name: 'Программный комплекс «СК-11»',
    subcategories: ["SCADA", "OMS", "DMS", "Электронный журнал", "База данных (PostgreSQL)"],
  },
  {
    code: "RS20",
    name: 'Интеграционная платформа «РС-20»',
    subcategories: ["ModelEditor", "OTopology", "MMPGAdapter", "DataPrep", "RapidBus"],
  },
  {
    code: "HARD",
    name: "Оборудование ПТК АСДУ",
    subcategories: ["Сервер (Huawei)", "СХД (OceanStor)", "Коммутатор", "Маршрутизатор", "МСЭ"],
  },
  {
    code: "VIRT",
    name: "Платформа виртуализации",
    subcategories: ["ESXi", "vCenter", "Kubernetes Pod"],
  },
  {
    code: "INTEG",
    name: "Интеграционные подсистемы",
    subcategories: ["СУПА", "ZuluGIS", "АСКУЭ", "АГАТ-М"],
  },
  {
    code: "OTHER",
    name: "Общесистемное ПО / АРМ",
    subcategories: ["Толстые клиенты", "ОС", "Браузеры"],
  },
];

export type RequestType = "incident" | "service_request" | "development_request" | "consultation";

export const REQUEST_TYPES: { value: RequestType; label: string; description: string }[] = [
  { value: "incident", label: "Инцидент", description: "Сбой в работе сервиса или оборудования" },
  { value: "service_request", label: "Запрос на обслуживание", description: "Плановые работы (п. 35, 38, 62-64 ТЗ)" },
  { value: "development_request", label: "Запрос на доработку", description: "Моделирование, описание сети (п. 73-91 ТЗ)" },
  { value: "consultation", label: "Консультация", description: "Вопрос по эксплуатации (п. 150, 168 ТЗ)" },
];

export const REQUEST_TYPE_LABELS: Record<string, string> = {
  incident: "Инцидент",
  service_request: "Запрос на обслуживание",
  development_request: "Запрос на доработку",
  consultation: "Консультация",
};

export const INCIDENT_CATEGORIES = [
  { value: "P1", label: "П1 — Критический отказ", description: "Полный отказ кластера, недоступность сервисов" },
  { value: "P2", label: "П2 — Частичный отказ", description: "Деградация, потеря резервирования" },
  { value: "P3", label: "П3 — Сбой сервиса", description: "Ошибка отдельной функции" },
  { value: "P4", label: "П4 — Некритичная ошибка", description: "Вопросы мониторинга, настройки" },
];

// SLA in minutes by priority
export const SLA_MINUTES: Record<string, number> = {
  P1: 30,
  P2: 60,
  P3: 120,
  P4: 180,
};

// Auto-determine priority from request type + incident category
export function getAutoSLA(requestType: RequestType, incidentCategory?: string) {
  if (requestType === "incident" && incidentCategory) {
    return {
      priority: incidentCategory as "P1" | "P2" | "P3" | "P4",
      slaMinutes: SLA_MINUTES[incidentCategory],
    };
  }
  // Non-incident types always get P4
  return { priority: "P4" as const, slaMinutes: SLA_MINUTES.P4 };
}

// Status workflow
export const STATUS_LABELS: Record<string, string> = {
  open: "Новая",
  assigned: "Назначена",
  in_progress: "В работе",
  waiting: "Ожидание",
  overdue: "Просрочена",
  resolved: "Решена",
  closed: "Закрыта",
  cancelled: "Отменена",
};

export const STATUS_COLORS: Record<string, string> = {
  open: "bg-red-500 text-white",
  assigned: "bg-violet-500 text-white",
  in_progress: "bg-blue-400 text-white",
  waiting: "bg-yellow-500 text-white",
  overdue: "bg-destructive text-destructive-foreground",
  resolved: "bg-emerald-500 text-white",
  closed: "bg-gray-400 text-white",
  cancelled: "bg-gray-300 text-gray-700",
};

export const ROW_STATUS_CLASSES: Record<string, string> = {
  open: "border-l-4 border-l-red-500",
  assigned: "border-l-4 border-l-violet-500",
  in_progress: "border-l-4 border-l-blue-400",
  waiting: "border-l-4 border-l-yellow-500",
  overdue: "border-l-4 border-l-destructive bg-destructive/5",
  resolved: "border-l-4 border-l-emerald-500",
  closed: "bg-muted/40 border-l-4 border-l-gray-400 opacity-70",
  cancelled: "bg-muted/40 border-l-4 border-l-gray-300 opacity-60",
};

export const PRIORITY_COLORS: Record<string, string> = {
  P1: "bg-destructive text-destructive-foreground",
  P2: "bg-orange-500 text-white",
  P3: "bg-yellow-500 text-white",
  P4: "bg-muted text-muted-foreground",
};

// Role-based status transitions matrix
export type AppRole = "admin" | "engineer" | "customer";

interface Transition {
  to: string;
  label: string;
  roles: AppRole[];
  requireComment?: boolean;
}

export const STATUS_TRANSITIONS: Record<string, Transition[]> = {
  open: [
    { to: "assigned", label: "Назначить инженера", roles: ["admin"] },
    { to: "cancelled", label: "Отменить", roles: ["admin"] },
    { to: "cancelled", label: "Отозвать", roles: ["customer"] },
  ],
  assigned: [
    { to: "in_progress", label: "Принять в работу", roles: ["engineer"] },
    { to: "cancelled", label: "Отменить", roles: ["admin"] },
    { to: "cancelled", label: "Отозвать", roles: ["customer"] },
  ],
  in_progress: [
    { to: "waiting", label: "Приостановить", roles: ["engineer"], requireComment: true },
    { to: "resolved", label: "Решить", roles: ["engineer"], requireComment: true },
    { to: "cancelled", label: "Отменить", roles: ["admin"] },
  ],
  waiting: [
    { to: "in_progress", label: "Возобновить", roles: ["engineer"] },
    { to: "cancelled", label: "Отменить", roles: ["admin"] },
  ],
  resolved: [
    { to: "closed", label: "Подтвердить закрытие", roles: ["customer"] },
    { to: "in_progress", label: "Вернуть в работу", roles: ["customer"] },
    { to: "cancelled", label: "Отменить", roles: ["admin"] },
  ],
  overdue: [
    { to: "in_progress", label: "Взять в работу", roles: ["engineer", "admin"] },
    { to: "cancelled", label: "Отменить", roles: ["admin"] },
  ],
  closed: [],
  cancelled: [],
};

export function getAvailableTransitions(currentStatus: string, userRoles: AppRole[], isTicketOwner: boolean) {
  const transitions = STATUS_TRANSITIONS[currentStatus] ?? [];
  return transitions.filter((t) => {
    if (t.roles.includes("customer") && !isTicketOwner) return false;
    return t.roles.some((r) => userRoles.includes(r));
  });
}
