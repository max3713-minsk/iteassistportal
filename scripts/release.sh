#!/usr/bin/env bash
# release.sh — воспроизводимое обновление self-hosted/test/prod площадки.
# Запускается из корня проекта на ВМ (10.11.12.243 — test, 10.11.12.244 — prod).
#
# Поведение:
#   1. git fetch + merge выбранной ветки (по умолчанию origin/main → текущая)
#   2. bun install (если изменился bun.lock / package.json)
#   3. supabase db push   — применяет supabase/migrations/*.sql, которых нет в schema_migrations
#   4. supabase functions deploy — все папки из supabase/functions/, кроме _shared
#   5. bun run build      — собирает фронт в dist/
#   6. nginx reload       — если флаг --nginx-reload
#
# Логи: scripts/.releases/<timestamp>.log
# Откат: см. docs/DEPLOYMENT.md §5 (releases/ + pg_dump).

set -euo pipefail

SOURCE_BRANCH="${SOURCE_BRANCH:-origin/main}"
SKIP_DB=0
SKIP_FUNCTIONS=0
SKIP_BUILD=0
NGINX_RELOAD=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --branch) SOURCE_BRANCH="$2"; shift 2 ;;
    --skip-db) SKIP_DB=1; shift ;;
    --skip-functions) SKIP_FUNCTIONS=1; shift ;;
    --skip-build) SKIP_BUILD=1; shift ;;
    --nginx-reload) NGINX_RELOAD=1; shift ;;
    -h|--help)
      sed -n '1,30p' "$0"; exit 0 ;;
    *) echo "Неизвестный флаг: $1" >&2; exit 2 ;;
  esac
done

TS=$(date +%Y%m%d-%H%M%S)
LOG_DIR="scripts/.releases"
mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/$TS.log"
exec > >(tee -a "$LOG") 2>&1

echo "=== Release $TS ==="
echo "Branch source: $SOURCE_BRANCH"

# 1. Git
echo "--- git fetch + merge ---"
git fetch --all --prune
CUR=$(git rev-parse --abbrev-ref HEAD)
echo "Current branch: $CUR"
git merge --ff-only "$SOURCE_BRANCH" || {
  echo "Fast-forward невозможен. Сделайте merge вручную (см. docs/DEPLOYMENT.md §4)." >&2
  exit 1
}

# 2. Зависимости
if git diff --name-only "HEAD@{1}" HEAD 2>/dev/null | grep -qE '^(package\.json|bun\.lock)$'; then
  echo "--- bun install ---"
  bun install --frozen-lockfile
else
  echo "(skip bun install — lockfile не изменился)"
fi

# 3. Миграции
if [[ "$SKIP_DB" -eq 0 ]]; then
  echo "--- supabase db push ---"
  if ! command -v supabase >/dev/null; then
    echo "supabase CLI не найден. Установка: https://supabase.com/docs/guides/cli" >&2
    exit 1
  fi
  supabase db push
fi

# 4. Edge functions
if [[ "$SKIP_FUNCTIONS" -eq 0 ]]; then
  echo "--- supabase functions deploy ---"
  for d in supabase/functions/*/; do
    name=$(basename "$d")
    [[ "$name" == "_shared" ]] && continue
    [[ ! -f "$d/index.ts" ]] && continue
    echo "  → $name"
    supabase functions deploy "$name" --no-verify-jwt 2>/dev/null \
      || supabase functions deploy "$name"
  done
fi

# 5. Сборка фронта
if [[ "$SKIP_BUILD" -eq 0 ]]; then
  echo "--- bun run build ---"
  bun run build
  echo "Сохраняю снапшот dist → $LOG_DIR/dist-$TS.tar.gz"
  tar czf "$LOG_DIR/dist-$TS.tar.gz" dist/
fi

# 6. nginx
if [[ "$NGINX_RELOAD" -eq 1 ]]; then
  echo "--- nginx reload ---"
  if command -v docker >/dev/null && docker ps --format '{{.Names}}' | grep -q '^nginx$'; then
    docker exec nginx nginx -t && docker exec nginx nginx -s reload
  else
    sudo nginx -t && sudo systemctl reload nginx
  fi
fi

echo "=== OK ($TS) ==="
echo "Лог: $LOG"