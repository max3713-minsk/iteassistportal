## Объём работ

### 1. Протоколы — кнопка «Выполнить все работы» во вкладке «Завершённые»
`src/components/protocols/ProtocolList.tsx` + `src/pages/Protocols.tsx`: показывать зелёную кнопку `ListChecks` для всех статусов, включая `completed`. Дополнительная проверка перед отправкой в облако.

### 2. Заявки — фикс выпадающего меню «Назначить инженера»
`src/components/tickets/TicketDetailDialog.tsx` (и/или Kanban): у `<Select>` добавить `SelectContent` с `position="popper"`, `className="z-[60] max-h-[300px] overflow-y-auto"`. Список выпадает за рамки диалога — нужен portal + ограничение высоты со скроллом.

### 3. Индикатор прогресса выгрузки в облако
`src/components/SeafileSendButton.tsx` + `src/lib/seafile.ts`:
- Глобальный toast с прогрессом `N из M протоколов` при пакетной отправке.
- Спиннер + блокировка повторного клика.
- Для одиночной отправки — `toast.loading` с этапами: «Формирование DOCX → Сбор графиков → Загрузка в Seafile».
- Прогресс через callback `onProgress(step, total, label)`.

### 4. Флаги/ярлыки на активные проблемы и алерты + комментарии
**Миграция** `problem_flags`:
- `id`, `event_id` (zabbix eventid, text), `trigger_id`, `host_id`, `flag` (enum: `important`/`attention`/`minor`), `comment` (text), `created_by`, `created_at`, `updated_at`.
- RLS: чтение всем authenticated, запись — admin/engineer.
- GRANT на authenticated/service_role.

UI в `MonitoringProblems.tsx`:
- Колонка «Флаг» с цветным бейджем (красный/жёлтый/серый).
- Popover для выбора флага и ввода комментария.
- Иконка-индикатор если есть комментарий, тултип показывает автора и текст.
- Флаг попадает в DOCX в колонку «Рекомендации/Заметки».

### 5. Отключённые триггеры — отдельная вкладка с возможностью включить
`MonitoringProblems.tsx`: новая вкладка «Отключённые триггеры».
- Загружает триггеры со `status=1` через zabbix-proxy (`trigger.get` фильтр `status=1`).
- Кнопка «Включить» вызывает `setTriggerStatus` с `status=0` (уже реализовано).
- Audit log записи.

### 6. Даты в DOCX — только отчётная
`src/lib/export-protocol-docx.ts` + `src/lib/protocol-docx-data.ts`:
- Убрать строки «Дата отчёта» из шапки → переименовать в «Отчётная дата» (единственная дата).
- Убрать «Сформировано: {exportedAt}» из футера — оставить только `exportedByName`.
- В таблице работ колонка «Дата»: вместо `it.completedAt` подставлять отчётную дату (`reportDate` / `period_end`).

### 7. Seafile путь по отчётной дате
`supabase/functions/protocol-export-seafile/index.ts`:
- Новая структура: `/Протоколы/{year}/{month_ru}/{frequency_ru}/{отчётная_дата}/`
- `year` и `month` берутся из `period_end` (отчётная дата), не из `created_at`.
- `month_ru` — массив русских месяцев `["Январь", ...]`.
- Удалить уровень с организацией? — **оставить опционально**: путь `/Протоколы/{org}/{year}/{month_ru}/{frequency_ru}/{отчётная_дата}/` для разделения по заказчикам. Уточнить если нужно убрать.

## Технические замечания
- Все изменения — обратно-совместимые, миграции только добавляют таблицу `problem_flags`.
- Edge функция `protocol-export-seafile` будет передеплоена автоматически.
- Тип `ProtocolDocxData` получит поле `reportDate` (отчётная дата) — уже есть `header.reportDate`, используем его как единственную дату.

Подтверди план или скажи что поправить (особенно п.7 — оставлять ли организацию в пути).