# Перенос изменений Lovable → test (10.11.12.243) → production (10.11.12.244)

Этот документ — единый источник правды по релизам. Обновляйте его одновременно с кодом.
Сценарий: `Lovable (main)` → ветка `test` на ВМ 10.11.12.243 → ветка `production` на ВМ 10.11.12.244.

---

## 1. Что нужно от вас (чек-лист на каждый релиз)

Чтобы я мог делать переезд максимально безопасно, при следующем обращении присылайте/держите актуальным:

1. **diff-сводку production ↔ main** (только список путей, не сами диффы): какие файлы изменены, добавлены, удалены в production относительно main. Удобный формат: `git diff --name-status main..production`.
2. **Снимок `.env`** обеих ВМ (без значений секретов — только список ключей). Это покажет, какие переменные ожидаются.
3. **Версия БД на проде** (`SELECT max(version) FROM supabase_migrations.schema_migrations`) — точка отсчёта для миграций.
4. **Список локальных правок production**, которые НЕ должны быть затёрты: путь + краткое описание зачем. Например: `supabase/functions/zabbix-proxy/index.ts — добавлена проверка self-signed`, `docker-compose.yml — volume для seafile`.
5. **Снапшот таблиц `applied_migrations`, `integration_settings`, `notification_channels`** (CSV) — конфигурация, которую нельзя дропнуть.
6. **nginx/conf.d/app.conf** с прода, если отличается от репозитория.

Когда всё это есть — переезд занимает один раунд и без сюрпризов.

---

## 2. Архитектура веток и обязанности

| Ветка        | ВМ            | Кто меняет                | Что хранит                       |
|--------------|---------------|---------------------------|----------------------------------|
| `main`       | —             | Lovable                   | новые фичи, миграции, edge fns   |
| `test`       | 10.11.12.243  | вы (merge `main`)         | интеграция и проверка `main`     |
| `production` | 10.11.12.244  | вы (merge `test`)         | рабочая среда + локальные хотфиксы |

Production использует **Supabase Cloud** (БД, Auth, Storage, Edge Functions размещены в облаке). На ВМ крутится **только фронт** (nginx + статика) и вспомогательные сервисы. `docker-compose.yml` в репозитории содержит self-hosted-стенд, который НЕ используется в проде — его сервисы (db/auth/rest/realtime/kong/storage) для прода игнорируются, поднимается только профиль `web`.

> Рекомендация: вынести self-hosted-сервисы в отдельный `docker-compose.selfhost.yml` через профили, чтобы `docker compose up` на проде поднимал ровно nginx + дополнительные локальные сервисы. См. §6.

---

## 3. Стандартный регламент релиза (main → test → production)

```
┌──────────────┐  1.fetch+merge   ┌──────────────┐  4.fetch+merge   ┌──────────────────┐
│   main       ├─────────────────▶│   test       ├─────────────────▶│   production     │
│   Lovable    │                  │ 10.11.12.243 │                  │   10.11.12.244   │
└──────────────┘  2.миграции      └──────────────┘  5.миграции      └──────────────────┘
                  3.edge fns                        6.edge fns
```

### 3.1 На тестовой ВМ (10.11.12.243)

```bash
# Войти на ВМ под аккаунтом деплоя
cd /opt/portal                          # путь репозитория
git fetch origin
git checkout test
git pull --ff-only origin test
git merge --no-ff origin/main           # ← забираем правки Lovable
# Решаем конфликты, если есть. Конфликты с локальными правками — см. §5.

# Применяем миграции, отсутствующие в облаке. На Supabase Cloud это делается
# через push CLI или вручную через SQL-editor. Список новых файлов:
ls supabase/migrations | sort > /tmp/all.txt
psql "$SUPABASE_DB_URL" -tAc "SELECT name FROM applied_migrations ORDER BY name" > /tmp/applied.txt
comm -23 /tmp/all.txt /tmp/applied.txt   # ← миграции к применению

# Деплой edge-функций — если используете Supabase CLI:
supabase functions deploy --project-ref <ref> $(ls supabase/functions)

# Фронт:
docker compose build web
docker compose up -d web nginx
```

### 3.2 На production (10.11.12.244)

```bash
cd /opt/portal
git fetch origin
git checkout production
git pull --ff-only origin production
git merge --no-ff origin/test           # ← test уже проверен
# Конфликты с локальными правками — см. §5.

# БД и edge fns — те же команды, что и на тесте, но на production-проект Supabase.
# Если БД одна и та же (что НЕ рекомендуется) — миграции уже применены на этапе test.

docker compose build web
docker compose up -d web nginx
```

---

## 4. Совместимость по версиям ПО

Подтверждённые на production (10.11.12.244): **Node 20.20.2, npm 10.8.2, Docker 29.5.3, docker compose v5.1.4**.
Репозиторий собирается через `bun` в dev-среде Lovable, но в продакшен-сборке достаточно `npm` (или `bun`, если установлен).

Минимальные требования к ВМ 10.11.12.243 (test):
- Docker ≥ 24, docker compose v2+;
- Node ≥ 20 (нужен только при локальной сборке без Docker);
- Опционально: Supabase CLI ≥ 1.180 — для применения миграций и деплоя edge-функций (`curl -fsSL https://supabase.com/install.sh | sh`).

`psql` на хосте необязателен, если использовать `docker run --rm postgres:15 psql ...`.

---

## 5. Локальные правки production, которые нужно сохранить

По вашему предварительному анализу в `production` отличаются от `main`:

- `docker-compose.yml`
- `supabase/config.toml`
- `supabase/kong.yml`
- Edge Functions: `manage-user`, `create-user`, `notification-dispatch`, `zabbix-proxy`, `seafile-upload-typed`, `holidays-sync`, `run-migration`
- Frontend: страницы `Monitoring`, `Tickets`, `Protocols`, `Schedules`, `WorkScope`, `Organizations`, `Auth`
- Слой типов Supabase и интеграции

### Рекомендуемая стратегия — «cherry-pick локальных хотфиксов в main»

Чтобы избежать вечных merge-конфликтов, **локальные правки production сначала переносятся в `main`** через Lovable (или PR в `main`), и только потом релиз идёт обычным путём. Иначе каждый merge `main → test` будет затирать их.

1. На production: `git format-patch main..production -- <путь>` для каждого файла из списка выше.
2. Прислать патчи / выложить в `docs/local-patches/`.
3. Применю их в Lovable и закоммичу в `main` так, чтобы поведение совпало.
4. После этого `production` будет полностью наследоваться из `test`, локальных divergences не останется.

### Если правку нельзя унести в main (например, окружение-специфичная)

Выносим в `.env` либо в `config/production.json`, чтобы файл кода стал одинаковым во всех ветках. Список таких параметров — поддерживать в §8.

---

## 6. docker-compose.yml — что обязательно править

Сейчас файл содержит полный self-hosted-стенд Supabase. На проде нужны только `nginx` (статика) и, опционально, вспомогательные сервисы (Seafile/ftp/…).

Рекомендуемое разделение:

```yaml
services:
  web:
    image: node:20-alpine
    profiles: ["build"]            # ← сборка по запросу
    working_dir: /app
    volumes: [".:/app"]
    command: sh -c "npm ci && npm run build"

  nginx:
    image: nginx:1.25-alpine
    profiles: ["web"]              # ← поднимается всегда
    ports: ["80:80", "443:443"]
    volumes:
      - ./dist:/usr/share/nginx/html:ro
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro

  # self-hosted Supabase сервисы — НЕ запускать на проде:
  db:    { profiles: ["selfhost"], ... }
  auth:  { profiles: ["selfhost"], ... }
  rest:  { profiles: ["selfhost"], ... }
  # … остальные сервисы Supabase
```

Запуск на проде: `docker compose --profile web up -d`. Self-hosted стенд для разработки: `docker compose --profile selfhost up -d`.

---

## 7. nginx — обязательные правки

Текущий `nginx/conf.d/app.conf` проксирует `/api/` на kong и `/realtime/` на realtime — это для self-hosted. На проде, где используется Supabase Cloud, **эти location-блоки не нужны** (фронт ходит напрямую на `https://<ref>.supabase.co`). Оставьте только:

```nginx
location / {
    try_files $uri $uri/ /index.html;
    add_header Cache-Control "no-cache";
}
location /assets/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
# /api/ и /realtime/ — удалить или закомментировать.
```

Если на проде есть свои локальные прокси (ftp-agent, seafile-bridge) — добавьте их явно и опишите здесь.

---

## 8. Переменные окружения

В `.env` фронта на ВМ должны быть:

```
VITE_SUPABASE_URL=https://<ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon/publishable-key>
VITE_SUPABASE_PROJECT_ID=<ref>
```

Все «секретные» ключи (service role, API tokens интеграций) хранятся в **Secrets** проекта Supabase и доступны только edge-функциям — на ВМ их быть не должно.

Если на проде в `.env` есть переменные, которых нет в репозитории — занесите их сюда:

| Переменная | Назначение | Где используется |
|------------|------------|------------------|
| (заполните при первом релизе) | | |

---

## 9. Что меняется в текущем релизе (Lovable → main)

Поддерживайте этот раздел перед каждым merge. Шаблон:

```
### Релиз YYYY-MM-DD

Миграции к применению:
- 20260606165843_… — добавлены поля для анализа логов
- 20260608062311_… — include_in_protocol для maintenance_tasks
- 20260609061320_… — metric_bindings для maintenance_tasks
- 20260610074425_… — parent_id/edited_at/body_format/attachments для ticket_comments

Edge Functions к деплою:
- analyze-log (новая)

Файлы конфигурации, которые НЕ менялись: docker-compose.yml, nginx/conf.d/app.conf, supabase/config.toml.

Frontend — крупные новые модули:
- WorkScope: bulk-выбор задач, EquipmentCategoriesManager, TaskMetricBindings
- Monitoring: WorkScopeCoverage, MonitoringLogs, CMDBSyncDialog (исправлен скролл)
- Tickets: markdown в комментариях, reply, parent_id
- Logs: LogAnalysisDialog, LogResultView (восстановлены)

Ожидаемые конфликты:
- src/pages/{Tickets,Monitoring,WorkScope,Protocols,Schedules,Organizations,Auth}.tsx — пересеклись с локальными правками
- supabase/functions/{manage-user, create-user, notification-dispatch, zabbix-proxy, seafile-upload-typed, holidays-sync, run-migration}/index.ts — локальные изменения, см. §5
- supabase/config.toml, supabase/kong.yml — локальные правки оставить
```

---

## 10. Быстрая команда «что новое в БД»

```bash
# на ВМ, имея $SUPABASE_DB_URL прода:
psql "$SUPABASE_DB_URL" -tAc "SELECT name FROM applied_migrations ORDER BY name" > /tmp/applied.txt
ls supabase/migrations | sort > /tmp/all.txt
diff /tmp/applied.txt /tmp/all.txt
```

Если в репозитории есть файлы, которых нет в `applied_migrations` — это и есть пачка SQL, которую нужно применить через `supabase db push` или вручную через SQL-editor облака.

---

## 11. Откат

- БД: до релиза снимать `pg_dump --schema=public --data-only` критичных таблиц (`applied_migrations`, `integration_settings`, `notification_channels`, `monitoring_host_links`). Для обратимых миграций — писать `down`-скрипт рядом с `up`.
- Фронт: предыдущая собранная `dist/` хранится как Docker-образ с тегом по коммиту (`portal-web:<sha>`); откат — `docker compose up -d --no-deps web=portal-web:<previous-sha>`.
- Edge functions: Supabase CLI хранит историю деплоев; `supabase functions deploy <name> --import-map ...` с предыдущей версией.

---

## 12. Контрольный список «pre-flight» перед merge в test

- [ ] Прогнан `npm run build` / `bun run build` локально без ошибок.
- [ ] Все новые миграции имеют `GRANT` для `authenticated`/`service_role`.
- [ ] В UI протестированы изменённые экраны (Tickets, Monitoring, WorkScope).
- [ ] Edge-функции, которые меняются, проверены через `supabase functions serve` или curl.
- [ ] Перечислены файлы из §5, которые нельзя перезаписать.
- [ ] Обновлён §9 в этом документе.

---

## 13. Скрипты в репозитории

- `scripts/release.sh` — воспроизводимое обновление: `git ff-merge → bun install → supabase db push → supabase functions deploy → bun run build → nginx reload`. Запуск:
  ```bash
  ./scripts/release.sh --branch origin/main --nginx-reload
  # доступны флаги: --skip-db --skip-functions --skip-build
  ```
  Лог каждого релиза + tar.gz собранного `dist/` сохраняются в `scripts/.releases/`.
- `scripts/backfill-schema-migrations.sh` — одноразовая операция для prod, где `supabase_migrations.schema_migrations` пуст (миграции ранее пушились напрямую из Lovable, в обход CLI). Заполняет таблицу версиями из `supabase/migrations/*.sql`, после чего `supabase db push` будет видеть только реально новые миграции. Запуск:
  ```bash
  PGURI=postgres://postgres:PASS@HOST:5432/postgres ./scripts/backfill-schema-migrations.sh
  ```

После backfill можно безопасно выполнять `./scripts/release.sh`: пропущенные на prod колонки (`maintenance_tasks.equipment_ids/include_in_protocol/metric_bindings`, `ticket_comments.parent_id`, чат-таблицы, бакет `chat-attachments` и т.д.) приедут одной командой.