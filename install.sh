#!/bin/bash
set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✓]${NC} $*"; }
warn() { echo -e "${YELLOW}[!]${NC} $*"; }
step() { echo -e "\n${CYAN}══════════════════════════════════════${NC}\n${CYAN}  $*${NC}\n${CYAN}══════════════════════════════════════${NC}"; }

[[ $EUID -ne 0 ]] && { echo -e "${RED}Запусти так: sudo bash install.sh${NC}"; exit 1; }

echo -e "${CYAN}"
cat << 'EOF'
  ╔══════════════════════════════════════════╗
  ║    Assist Portal — Установщик       ║
  ║    Assist Portal                 ║
  ╚══════════════════════════════════════════╝
EOF
echo -e "${NC}"

read -p "Введи URL твоего GitHub репозитория
(пример: https://github.com/max3713-minsk/assistportal): " GITHUB_URL
echo ""

read -p "Введи IP-адрес этого сервера
(пример: 192.168.1.100): " SERVER_IP
echo ""

read -p "Введи email администратора портала
(пример: admin@company.by): " ADMIN_EMAIL
echo ""

read -s -p "Придумай пароль для базы данных (минимум 16 символов, запиши его!): " DB_PASS
echo ""
[[ ${#DB_PASS} -lt 16 ]] && { echo -e "${RED}Пароль слишком короткий!${NC}"; exit 1; }

JWT=$(openssl rand -hex 32)
ANON=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 40)
SVC=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 40)
DASH=$(openssl rand -base64 12 | tr -dc 'a-zA-Z0-9' | head -c 16)

step "ШАГ 1/7 — Обновление системы"
apt-get update -qq && apt-get upgrade -y -qq
apt-get install -y -qq curl wget git unzip ca-certificates gnupg lsb-release openssl ufw
log "Готово"

step "ШАГ 2/7 — Установка Docker"
if ! command -v docker &>/dev/null; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" > /etc/apt/sources.list.d/docker.list
  apt-get update -qq
  apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin
  systemctl enable docker && systemctl start docker
  log "Docker установлен"
else
  log "Docker уже установлен"
fi

if ! command -v node &>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - >/dev/null 2>&1
  apt-get install -y -qq nodejs
  log "Node.js установлен"
fi

step "ШАГ 3/7 — Скачивание кода из GitHub"
if [[ -d "/opt/app/.git" ]]; then
  cd /opt/app && git pull && log "Код обновлён"
else
  git clone "$GITHUB_URL" /opt/app && log "Код скачан"
fi

step "ШАГ 4/7 — Сборка портала"
cd /opt/app
npm install --silent

cat > /opt/app/.env.production << EOF
VITE_SUPABASE_URL=https://${SERVER_IP}
VITE_SUPABASE_ANON_KEY=${ANON}
EOF

npm run build
log "Портал собран"

step "ШАГ 5/7 — Создание конфигурации"
mkdir -p /opt/app/supabase/volumes/{db/data,storage}

cat > /opt/app/.env << EOF
GITHUB_URL=${GITHUB_URL}
APP_DOMAIN=${SERVER_IP}
POSTGRES_PASSWORD=${DB_PASS}
POSTGRES_DB=app_db
JWT_SECRET=${JWT}
ANON_KEY=${ANON}
SERVICE_ROLE_KEY=${SVC}
SUPABASE_ADMIN_EMAIL=${ADMIN_EMAIL}
SUPABASE_ADMIN_PASSWORD=${DB_PASS}
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=${DASH}
SITE_URL=https://${SERVER_IP}
API_EXTERNAL_URL=https://${SERVER_IP}
EOF
log "Конфигурация создана"

mkdir -p /opt/app/nginx/ssl /opt/app/nginx/conf.d
openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
  -keyout /opt/app/nginx/ssl/server.key \
  -out    /opt/app/nginx/ssl/server.crt \
  -subj   "/CN=${SERVER_IP}" 2>/dev/null
log "SSL сертификат создан"

step "ШАГ 6/7 — Настройка файрвола"
ufw --force reset >/dev/null
ufw default deny incoming >/dev/null
ufw default allow outgoing >/dev/null
ufw allow 22/tcp >/dev/null
ufw allow 80/tcp >/dev/null
ufw allow 443/tcp >/dev/null
ufw allow 8000/tcp >/dev/null
ufw --force enable >/dev/null
log "Файрвол настроен"

step "ШАГ 7/7 — Запуск контейнеров"
cd /opt/app
docker compose pull
docker compose up -d
log "Все сервисы запущены"

# Автообновление — простая команда
cat > /usr/local/bin/app-update << 'UPDATE'
#!/bin/bash
echo "Обновляю портал из GitHub..."
cd /opt/app
git pull
npm install --silent
npm run build
docker compose up -d --build
echo "Готово! Портал обновлён."
UPDATE
chmod +x /usr/local/bin/app-update

# Бэкап каждую ночь в 02:00
echo "0 2 * * * root bash /opt/app/scripts/backup.sh >> /var/log/app-backup.log 2>&1" > /etc/cron.d/app-backup

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           УСТАНОВКА ЗАВЕРШЕНА!                         ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  🌐 Открой в браузере:  ${CYAN}https://${SERVER_IP}${NC}"
echo -e "  📊 Supabase Studio:    ${CYAN}http://${SERVER_IP}:3001${NC}"
echo -e "  👤 Логин Studio:       ${CYAN}admin / ${DASH}${NC}"
echo ""
echo -e "${YELLOW}  СОХРАНИ ЭТИ ДАННЫЕ В НАДЁЖНОМ МЕСТЕ:${NC}"
echo -e "  Пароль БД:    ${DASH}"
echo -e "  Пароль Studio: ${DASH}"
echo ""
echo -e "  Чтобы обновить портал после изменений в GitHub:"
echo -e "  ${CYAN}app-update${NC}"
