#!/bin/bash
# =============================================================================
# Скрипт резервного копирования PostgreSQL
# Запуск: bash backup.sh
# Автозапуск: добавлен в cron при установке (ежедневно в 02:00)
# =============================================================================
set -euo pipefail

BACKUP_DIR="/opt/app/backups"
KEEP_DAYS=30
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/db_${DATE}.sql.gz"

source /opt/app/.env

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting backup..."

docker compose -f /opt/app/docker-compose.yml exec -T db \
  pg_dump -U postgres "$POSTGRES_DB" | gzip > "$BACKUP_FILE"

SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
echo "[$(date)] Backup complete: $BACKUP_FILE ($SIZE)"

# Удаляем старые бэкапы
find "$BACKUP_DIR" -name "db_*.sql.gz" -mtime +${KEEP_DAYS} -delete
COUNT=$(ls "$BACKUP_DIR"/db_*.sql.gz 2>/dev/null | wc -l)
echo "[$(date)] Backups kept: $COUNT (retention: ${KEEP_DAYS} days)"

# Восстановление (не запускается автоматически — только вручную):
# gunzip -c /opt/app/backups/db_YYYYMMDD_HHMMSS.sql.gz | \
#   docker compose exec -T db psql -U postgres app_db
