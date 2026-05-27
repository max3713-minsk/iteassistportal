## Волна 2 — Мониторинг

Цель: дать админу/инженеру управлять метриками шаблонов без правки самого Zabbix, останавливать «зависшие» скрипты, полностью удалять алерты, и автоматически подтягивать описания OID из открытых источников.

### 1. БД — новые таблицы (миграция)

**`item_overrides`** — переопределения метрик (без правки самого Zabbix-шаблона):
- `zabbix_host_id text`, `item_key text` (уникальная пара)
- `disabled boolean` — скрыть из портала
- `custom_display_name text` — переопределить имя
- `custom_oid text` — для SNMP: альтернативный OID (информативно)
- `notes text`, `created_by`, timestamps
- RLS: SELECT всем authenticated, ALL admin/engineer

**`mib_oid_cache`** — кэш ответов OIDs.online / Circitor:
- `oid text PK`, `name text`, `description text`, `source text` (oid.online/circitor/manual), `fetched_at`
- RLS: SELECT всем authenticated, INSERT/UPDATE admin/engineer

**`automation_logs`** — добавить колонки:
- `cancel_requested boolean default false`
- `cancelled_at timestamptz`
- `cancelled_by uuid`

### 2. Edge функции

**`mib-oid-lookup`** (новая) — принимает `{ oid }` или `{ oids: [] }`. Сначала смотрит `mib_oid_cache`, затем по очереди пробует:
1. `https://oid-rep.orange-labs.fr/get/{oid}` (open MIB browser, JSON-ish HTML — парсим)
2. `https://www.circitor.fr/Mibs/Html/...` — fallback search
3. При неудаче — кэшируем `not_found`

Возвращает `{ oid, name, description, source }`. Кэш TTL 30 дней.

**`zabbix-proxy`** — добавить действия:
- `disableItem` / `enableItem`: вызов `item.update` с `status=1/0`
- `updateItemKey`: `item.update` `{key_, name?}` — для смены OID/ключа

Все действия требуют admin/engineer (валидируем по `user_roles`).

### 3. Frontend

**`HostItemsView.tsx`** — для admin/engineer на каждой метрике:
- Меню «⋮»: «Скрыть на портале», «Переименовать», «Изменить ключ/OID», «Подсказка OID» (вызывает `mib-oid-lookup` и показывает описание)
- Скрытые метрики (по `item_overrides.disabled=true`) не отображаются обычным пользователям; для admin/engineer показываются с серым бейджем «скрыто» и кнопкой «вернуть».
- Кнопка «Показать скрытые» в шапке категории.

**`MonitoringAutomation.tsx`** — журнал выполнения:
- Для записей `status=running` — кнопка «Отменить»: ставит `cancel_requested=true`, `cancelled_at=now()`, статус → `cancelled`. Это «логическая» отмена (Zabbix API не умеет отменять `script.execute`), но убирает «вечно выполняется» из UI и записывает в audit.
- Бейдж «Отменено» (вариант `outline`).

**`MonitoringProblems.tsx`** — массовые действия по алертам:
- Уже есть `massAcknowledge`. Добавить чекбоксы + sticky-панель: «Подтвердить», «Закрыть» (close=true), «Создать заявку из выбранных», «Удалить из списка» (= closeEvent + локальная пометка `dismissed` в новой таблице `dismissed_alerts(eventid, user_id)` чтобы не показывать снова даже если в Zabbix остался).

### 4. Применение локально (bash)

После merge:
```bash
git fetch origin && git diff origin/main -- \
  supabase/migrations/ \
  supabase/functions/mib-oid-lookup/index.ts \
  supabase/functions/zabbix-proxy/index.ts \
  src/components/monitoring/HostItemsView.tsx \
  src/components/monitoring/MonitoringAutomation.tsx \
  src/components/monitoring/MonitoringProblems.tsx | git apply -3

supabase db push   # применит миграцию локально
supabase functions deploy mib-oid-lookup zabbix-proxy
```

### Объём и риски
- ~1 миграция, 1 новая edge-функция, правки в zabbix-proxy, 3 React-компонента.
- OIDs.online парсинг — HTML, иногда меняется разметка; на этот случай возвращаем `source: "not_found"` и даём ручной ввод.
- Script cancel — «логическая» (это техническое ограничение Zabbix API), честно описано в подсказке UI.

### Что НЕ входит в эту волну
- Волна 3: организации «Архив», прямое удаление, дружелюбный UI миграций (по согласованию делаем отдельно).
