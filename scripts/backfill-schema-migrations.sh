#!/usr/bin/env bash
# backfill-schema-migrations.sh — заполняет supabase_migrations.schema_migrations
# существующими файлами из supabase/migrations/*.sql, чтобы дальнейший `supabase db push`
# не пытался применить их повторно.
#
# Использование (на ВМ, где есть psql и доступ к БД):
#   PGURI=postgres://postgres:PASS@HOST:5432/postgres ./scripts/backfill-schema-migrations.sh
#
# Безопасно: вставляет с ON CONFLICT DO NOTHING.

set -euo pipefail

: "${PGURI:?Установите PGURI=postgres://user:pass@host:port/db}"

psql "$PGURI" -v ON_ERROR_STOP=1 <<'SQL'
CREATE SCHEMA IF NOT EXISTS supabase_migrations;
CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
  version text PRIMARY KEY,
  statements text[],
  name text
);
SQL

for f in supabase/migrations/*.sql; do
  base=$(basename "$f")
  # ожидаемый формат: <14-digit-timestamp>_<slug>.sql
  version=$(echo "$base" | grep -oE '^[0-9]{14}') || true
  if [[ -z "$version" ]]; then
    echo "skip: $base (нет timestamp в имени)"; continue
  fi
  name=$(echo "$base" | sed -E 's/^[0-9]{14}_//; s/\.sql$//')
  psql "$PGURI" -v ON_ERROR_STOP=1 -c \
    "INSERT INTO supabase_migrations.schema_migrations(version,name) VALUES ('$version', '$name') ON CONFLICT (version) DO NOTHING;"
done

echo "Готово. Проверьте: SELECT count(*) FROM supabase_migrations.schema_migrations;"