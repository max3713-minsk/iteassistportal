Список большой (21 пункт), поэтому разобью на 5 фаз. После каждой — проверим вместе и идём дальше. Если порядок не подходит — скажите, переставлю.

## Фаза 1 — Визуальный «вау» (быстрая отдача)
1. **Skeleton loaders** на Дашборде, Картах инфраструктуры, Протоколах, Тикетах (вместо спиннеров).
2. **Live-индикатор в шапке**: пульсирующая точка «Zabbix · N хостов · M проблем» → клик уводит в `/monitoring?tab=problems`.
3. **KPI-карточки на Панели управления** с сравнением к прошлой неделе (↑12% / ↓5%) и спарклайнами (recharts mini).
4. **Status pills с иконками** (не только цвет) — единый компонент `<StatusPill/>` для тикетов, протоколов, оборудования, хостов.
5. **Аватарки с инициалами + градиент по хэшу имени** + загрузка фото в профиль (storage bucket `avatars`). Заменить все места, где сейчас email.
6. **Page transitions** (framer-motion) между маршрутами в `AppLayout`.

## Фаза 2 — Тикеты и комментарии
7. **Toast undo** для ключевых мутаций: закрытие/удаление тикета, удаление протокола, схемы, документа, оборудования, пользователя. Sonner с action `Отменить (5с)`.
8. **@упоминания и реакции** в `ticket_comments` (mentions через popover автокомплит, эмодзи-реакции в новой таблице `ticket_comment_reactions`).
9. **Связанные тикеты / merge** — таблица `ticket_links` (related/duplicate/parent), кнопка «Связать с #» в детальном диалоге.
10. **Эмпти-стейты с иллюстрациями и CTA** — общий `<EmptyState/>` с svg-иллюстрацией, заголовком, описанием и CTA-кнопкой. Внедрить в Тикеты, Протоколы, Оборудование, Документы, Карты, Расписание.

## Фаза 3 — Мониторинг и инфраструктура
11. **Heatmap проблем** по часам/дням недели на странице мониторинга (источник — `notification_log`/Zabbix events).
12. **Group-actions на хостах**: чек-боксы, массовая привязка к оборудованию, массовое включение/выключение, массовое удаление.
13. **Экспорт карты инфраструктуры** в PNG / SVG / PDF (html-to-image + jsPDF).
14. **История версий карты** + diff — таблица `infrastructure_map_versions`, sidebar «История» с кнопкой «Что изменилось».

## Фаза 4 — Расписание, пользователи, документы
15. **Drag-and-drop** переноса запланированных работ в `MaintenanceCalendar` (dnd-kit).
16. **Импульсный поиск пользователей** + индикатор «online / был N часов назад» (через `last_seen_at` в `profiles`, обновляется на каждом auth-запросе).
17. **Группы прав / роли-пресеты** («Дежурный», «Руководитель смены», «Аудитор») — таблица `permission_presets`, применение пресета в админке пользователей.
18. **Audit timeline на странице пользователя** — фильтр `audit_logs` по `target_user_id`/`user_id` с группировкой по дням.
19. **Версионирование документов** с откатом — таблица `document_versions`, при загрузке нового файла создаётся версия.

## Фаза 5 — Web Push и PWA
20. **Web Push** через Service Worker (VAPID), новый канал в `notification_channels` тип `web_push`, edge-функция для отправки.
21. **PWA-манифест + offline-кеш** для критичных страниц (карты ЦОД, контакты схемы поддержки, последние 50 тикетов в indexedDB). С предупреждением про preview-iframe.

## Технические детали
- Новые таблицы (миграции по фазам): `ticket_comment_reactions`, `ticket_links`, `infrastructure_map_versions`, `document_versions`, `permission_presets`, `web_push_subscriptions`. Колонка `last_seen_at`, `avatar_url` в `profiles`. Bucket `avatars` (public).
- Общие компоненты: `src/components/ui/status-pill.tsx`, `src/components/ui/avatar-hash.tsx`, `src/components/ui/empty-state.tsx`, `src/components/ui/sparkline.tsx`, `src/components/PageTransition.tsx`, `src/components/LiveStatusIndicator.tsx`.
- Иллюстрации эмпти-стейтов — лёгкие inline-SVG в стиле существующего бренда (Space Grotesk + DM Sans, тёмный фон).
- PWA — строго с гвардом `isPreviewHost || isInIframe → не регистрировать SW`, активен только в production.

## Порядок работ
Начинаю с **Фазы 1** прямо сейчас (skeletons → live indicator → KPI → status pills → avatars → page transitions). После того, как покажу результат — двигаемся к Фазе 2.

OK так? Если хотите изменить очерёдность фаз или что-то выкинуть — скажите.