---
name: Self-hosted Supabase Architecture
description: Self-hosted Supabase на 10.11.12.243 — Docker-стек, app_db, bootstrap-router для edge functions, deploy workflow
type: feature
---

# Self-hosted Supabase (10.11.12.243)

Проект развёрнут на self-hosted Supabase, НЕ на supabase.com. Все миграции, функции и переменные окружения учитывают это.

## Docker-стек

| Контейнер | Роль |
|-----------|------|
| app_db | PostgreSQL, база `app_db` |
| app_kong | API Gateway |
| app_nginx | Reverse proxy, SSL |
| app_auth | GoTrue |
| app_rest | PostgREST |
| app_functions | Supabase Edge Runtime v1.67.4 |
| app_realtime | Realtime WebSocket |
| app_storage | Файловое хранилище |
| app_redis | Кэш |

## База данных

- База называется `app_db` (не `postgres`).
- DDL в схеме `realtime` — только через пользователя `supabase_admin`.
- После миграций нужен `NOTIFY pgrst, 'reload schema';` в `app_db`.
- RLS включён на всех таблицах в `public`.
- `pg_cron` недоступен в `app_db` — НЕ использовать в миграциях.

## Edge Functions — критично

Edge Runtime v1.67.4 не поддерживает динамические импорты (`await import()`) в режиме `--main-service`. Все функции маршрутизируются через единый роутер `supabase/functions/bootstrap-router/index.ts`.

### Структура каждой функции

Каждая функция ДОЛЖНА использовать `export default`, НЕ `Deno.serve()`:

```ts
// ✅ ПРАВИЛЬНО
export default async function handler(req: Request): Promise<Response> {
  // ...
}

// ❌ НЕПРАВИЛЬНО — не работает с bootstrap-router
Deno.serve(async (req) => { /* ... */ });
```

### bootstrap-router

```ts
import myNewFunction from "file:///home/deno/functions/my-new-function/index.ts";

const routes: Record<string, (req: Request) => Promise<Response>> = {
  "my-new-function": myNewFunction,
};

Deno.serve(async (req) => {
  const fnName = new URL(req.url).pathname.split("/").filter(Boolean)[0];
  const handler = routes[fnName];
  if (handler) return handler(req);
  return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
});
```

### При добавлении новой функции

1. Создать `supabase/functions/<name>/index.ts` с `export default async function handler(...)`.
2. Добавить статический импорт в `bootstrap-router/index.ts` (абсолютный путь `file:///home/deno/functions/<name>/index.ts`).
3. Добавить маршрут в объект `routes`.

## Конфиги — менять осторожно

- `docker-compose.yml` (секция `functions`): НЕ менять `--main-service`, НЕ добавлять `--worker-entrypoint` (не поддерживается v1.67.4). Volume `./supabase/functions:/home/deno/functions:ro`.
- `nginx/conf.d/app.conf`: SSL 443 → Kong:8000, WebSocket-заголовки уже настроены.
- `supabase/kong.yml`: при смене ключей синхронно обновлять `.env` и `kong.yml`.

## Переменные окружения

Фронт (`.env.production` при сборке):

```
VITE_SUPABASE_URL=https://10.11.12.243
VITE_SUPABASE_ANON_KEY=<ANON_KEY из .env>
VITE_SUPABASE_PUBLISHABLE_KEY=<ANON_KEY из .env>
```

Edge Functions (`Deno.env.get(...)`): `SUPABASE_URL` (внутренний `http://kong:8000`), `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`.

## Деплой после изменений в Lovable

```bash
# 1. Применить новую миграцию
docker exec -i app_db psql -U postgres -d app_db < supabase/migrations/<НОВАЯ>.sql

# 2. Перечитать схему PostgREST
docker exec app_db psql -U postgres -d app_db -c "NOTIFY pgrst, 'reload schema';"

# 3. Пересобрать фронт
npm run build

# 4. Перезапустить nginx
docker compose restart nginx

# 5. Если менялись функции
docker compose stop functions && docker compose rm -f functions && docker compose up -d functions
```

## Известные особенности

- Realtime WebSocket: `signature_error` — известная проблема self-hosted, REST API работает.
- `app_studio` показывает `unhealthy` — норма, доступна через UI.
- Миграции из Lovable применяются к `app_db`, не к `postgres`.