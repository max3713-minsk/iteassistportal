---
name: Environment variables — облачный vs self-hosted
description: Cloud .env содержит только VITE_SUPABASE_*, self-hosted Docker требует расширенный набор
type: feature
---

## Cloud (Lovable) .env — только публичные значения
- `VITE_SUPABASE_PROJECT_ID`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_URL`

## Self-hosted Docker (install.sh / docker-compose) — дополнительно
- `POSTGRES_PASSWORD`, `POSTGRES_DB`
- `JWT_SECRET`
- `ANON_KEY`, `SERVICE_ROLE_KEY`
- `APP_DOMAIN`, `SITE_URL`, `API_EXTERNAL_URL`
- `SUPABASE_ADMIN_EMAIL`, `SUPABASE_ADMIN_PASSWORD`
- `DASHBOARD_USERNAME`, `DASHBOARD_PASSWORD`

Эти переменные генерирует `install.sh` и пишет в `/opt/app/.env`. **Никогда не добавляй их в облачный `.env`** — он перезаписывается Lovable. Любые правки docker-стенда делай в `install.sh` / `docker-compose.yml` / `.env.example`.