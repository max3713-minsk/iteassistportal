#!/bin/bash
# =============================================================================
# АВТОУСТАНОВЩИК — Lovable App на Ubuntu 22.04 / VMware
# Запуск: curl -fsSL https://raw.githubusercontent.com/YOUR/REPO/main/scripts/install.sh | bash
# Или локально: chmod +x install.sh && sudo bash install.sh
# =============================================================================

set -euo pipefail

# ── Цвета для вывода ──────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'

log()  { echo -e "${GREEN}[✓]${NC} $*"; }
warn() { echo -e "${YELLOW}[!]${NC} $*"; }
err()  { echo -e "${RED}[✗]${NC} $*"; exit 1; }
info() { echo -e "${BLUE}[→]${NC} $*"; }
step() { echo -e "\n${CYAN}══════════════════════════════════════${NC}"; echo -e "${CYAN}  $*${NC}"; echo -e "${CYAN}══════════════════════════════════════${NC}"; }

# ── Проверки ──────────────────────────────────────────────────────────────────
[[ $EUID -ne 0 ]] && err "Запусти скрипт с правами root: sudo bash install.sh"
[[ ! -f /etc/os-release ]] && err "Не удалось определить ОС"
source /etc/os-release
[[ "$ID" != "ubuntu" ]] && warn "Скрипт тестировался на Ubuntu 22.04. Текущая ОС: $PRETTY_NAME"

# ── Конфигурация (заполняется интерактивно) ───────────────────────────────────
echo ""
echo -e "${CYAN}"
cat << 'EOF'
  ██████╗ ███████╗██████╗ ██╗      ██████╗ ██╗   ██╗
  ██╔══██╗██╔════╝██╔══██╗██║     ██╔═══██╗╚██╗ ██╔╝
  ██║  ██║█████╗  ██████╔╝██║     ██║   ██║ ╚████╔╝
  ██║  ██║██╔══╝  ██╔═══╝ ██║     ██║   ██║  ╚██╔╝
  ██████╔╝███████╗██║     ███████╗╚██████╔╝   ██║
  ╚═════╝ ╚══════╝╚═╝     ╚══════╝ ╚═════╝    ╚═╝
     Автоустановщик платформы тех. поддержки
EOF
echo -e "${NC}"

# Проверяем наличие .env файла
if [[ -f "/opt/app/.env" ]]; then
  warn "Найден существующий .env — используем его"
  source /opt/app/.env
else
  echo ""
  read -p "GitHub URL репозитория (https://github.com/user/repo): " GITHUB_URL
  read -p "Домен или IP сервера (например: 192.168.1.100 или support.company.by): " APP_DOMAIN
  read -p "Email администратора Supabase: " SUPABASE_ADMIN_EMAIL
  read -s -p "Пароль БД (минимум 16 символов): " DB_PASSWORD; echo ""
  read -s -p "JWT Secret (минимум 32 символа): " JWT_SECRET; echo ""

  [[ ${#DB_PASSWORD} -lt 16 ]] && err "Пароль БД должен быть минимум 16 символов"
  [[ ${#JWT_SECRET} -lt 32 ]]  && err "JWT Secret должен быть минимум 32 символа"
fi

ANON_KEY=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 40)
SERVICE_KEY=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 40)
DASHBOARD_PASSWORD=$(openssl rand -base64 12 | tr -dc 'a-zA-Z0-9' | head -c 16)

# =============================================================================
step "Шаг 1/8 — Обновление системы и базовые пакеты"
# =============================================================================
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq \
  curl wget git unzip nano htop \
  ca-certificates gnupg lsb-release \
  ufw fail2ban openssl
log "Базовые пакеты установлены"

# =============================================================================
step "Шаг 2/8 — Установка Docker и Docker Compose"
# =============================================================================
if command -v docker &>/dev/null; then
  log "Docker уже установлен: $(docker --version)"
else
  info "Устанавливаем Docker..."
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
    https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -qq
  apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin
  systemctl enable docker
  systemctl start docker
  log "Docker установлен: $(docker --version)"
fi

# Node.js 20 LTS для сборки фронтенда
if ! command -v node &>/dev/null; then
  info "Устанавливаем Node.js 20 LTS..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y -qq nodejs
  log "Node.js установлен: $(node --version)"
fi

# =============================================================================
step "Шаг 3/8 — Клонирование репозитория"
# =============================================================================
mkdir -p /opt/app
if [[ -d "/opt/app/.git" ]]; then
  info "Репозиторий уже склонирован — обновляем..."
  cd /opt/app && git pull
else
  info "Клонируем $GITHUB_URL..."
  git clone "$GITHUB_URL" /opt/app
fi
log "Код получен из GitHub"

# =============================================================================
step "Шаг 4/8 — Сборка фронтенда"
# =============================================================================
cd /opt/app
info "Устанавливаем npm зависимости..."
npm ci --prefer-offline 2>/dev/null || npm install

info "Собираем production build..."
# Подставляем реальные URL в переменные окружения сборки
cat > /opt/app/.env.production << EOF
VITE_SUPABASE_URL=http://${APP_DOMAIN}:8000
VITE_SUPABASE_ANON_KEY=${ANON_KEY}
EOF
npm run build
log "Фронтенд собран → dist/"

# =============================================================================
step "Шаг 5/8 — Генерация .env и docker-compose.yml"
# =============================================================================
mkdir -p /opt/app/supabase/volumes/{db/data,storage,functions}

cat > /opt/app/.env << EOF
# ── Основные настройки ──────────────────────────────────────────────
GITHUB_URL=${GITHUB_URL}
APP_DOMAIN=${APP_DOMAIN}

# ── База данных ─────────────────────────────────────────────────────
POSTGRES_PASSWORD=${DB_PASSWORD}
POSTGRES_DB=app_db
POSTGRES_PORT=5432

# ── Supabase ────────────────────────────────────────────────────────
JWT_SECRET=${JWT_SECRET}
ANON_KEY=${ANON_KEY}
SERVICE_ROLE_KEY=${SERVICE_KEY}
SUPABASE_ADMIN_EMAIL=${SUPABASE_ADMIN_EMAIL}
SUPABASE_ADMIN_PASSWORD=${DB_PASSWORD}
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=${DASHBOARD_PASSWORD}
SITE_URL=http://${APP_DOMAIN}
API_EXTERNAL_URL=http://${APP_DOMAIN}:8000

# ── Email (отключён по умолчанию, SMTP настраивается позже) ─────────
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_SENDER_NAME=Support Portal
EOF

log ".env создан"

# Копируем docker-compose файл (должен быть в репозитории)
# Если нет — создаём минимальный
if [[ ! -f "/opt/app/docker-compose.yml" ]]; then
  warn "docker-compose.yml не найден в репозитории — создаём стандартный"
  cp /opt/app/scripts/docker-compose.yml /opt/app/docker-compose.yml 2>/dev/null || \
    info "Используй docker-compose.yml из этого пакета"
fi

# =============================================================================
step "Шаг 6/8 — Настройка Nginx"
# =============================================================================
mkdir -p /opt/app/nginx/conf.d /opt/app/nginx/ssl

# Генерируем self-signed SSL сертификат
openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
  -keyout /opt/app/nginx/ssl/server.key \
  -out    /opt/app/nginx/ssl/server.crt \
  -subj   "/C=BY/ST=Minsk/L=Minsk/O=Support/CN=${APP_DOMAIN}" \
  2>/dev/null
log "SSL сертификат создан (self-signed, 10 лет)"

# =============================================================================
step "Шаг 7/8 — Настройка Firewall"
# =============================================================================
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp   comment 'SSH'
ufw allow 80/tcp   comment 'HTTP'
ufw allow 443/tcp  comment 'HTTPS'
ufw allow 8000/tcp comment 'Supabase API'
ufw --force enable
log "Firewall настроен"

# =============================================================================
step "Шаг 8/8 — Запуск всех контейнеров"
# =============================================================================
cd /opt/app
info "Скачиваем Docker образы (может занять несколько минут)..."
docker compose pull

info "Запускаем сервисы..."
docker compose up -d

# Ждём старта БД
info "Ожидаем старт PostgreSQL..."
sleep 15
for i in {1..12}; do
  docker compose exec -T db pg_isready -U postgres &>/dev/null && break
  sleep 5
done
log "PostgreSQL готов"

# =============================================================================
# Настройка автообновления из GitHub (CI/CD без GitHub Actions)
# =============================================================================
cat > /usr/local/bin/app-deploy << 'DEPLOY_SCRIPT'
#!/bin/bash
set -e
cd /opt/app
echo "[$(date)] Pulling latest code..."
git pull
echo "[$(date)] Installing dependencies..."
npm ci --prefer-offline 2>/dev/null || npm install
echo "[$(date)] Building frontend..."
npm run build
echo "[$(date)] Restarting containers..."
docker compose up -d --build
echo "[$(date)] Deploy complete"
DEPLOY_SCRIPT
chmod +x /usr/local/bin/app-deploy
log "Команда app-deploy создана"

# Webhook-сервер для автодеплоя при push в GitHub
cat > /opt/app/scripts/webhook.py << 'WEBHOOK'
#!/usr/bin/env python3
"""Простой webhook сервер — слушает GitHub push и запускает app-deploy"""
import hmac, hashlib, subprocess, json
from http.server import HTTPServer, BaseHTTPRequestHandler

SECRET = open("/opt/app/.webhook_secret").read().strip()

class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        body = self.rfile.read(int(self.headers.get("Content-Length", 0)))
        sig = "sha256=" + hmac.new(SECRET.encode(), body, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, self.headers.get("X-Hub-Signature-256", "")):
            self.send_response(403); self.end_headers(); return
        payload = json.loads(body)
        if payload.get("ref") == "refs/heads/main":
            subprocess.Popen(["/usr/local/bin/app-deploy"])
        self.send_response(200); self.end_headers(); self.wfile.write(b"ok")
    def log_message(self, *a): pass

HTTPServer(("0.0.0.0", 9000), Handler).serve_forever()
WEBHOOK

WEBHOOK_SECRET=$(openssl rand -hex 20)
echo "$WEBHOOK_SECRET" > /opt/app/.webhook_secret
chmod 600 /opt/app/.webhook_secret

# Systemd сервис для webhook
cat > /etc/systemd/system/app-webhook.service << EOF
[Unit]
Description=App GitHub Webhook
After=network.target

[Service]
ExecStart=/usr/bin/python3 /opt/app/scripts/webhook.py
Restart=always
WorkingDirectory=/opt/app

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable app-webhook
systemctl start app-webhook
log "Webhook сервер запущен на порту 9000"

# =============================================================================
# Вывод итоговой информации
# =============================================================================
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           УСТАНОВКА ЗАВЕРШЕНА УСПЕШНО                    ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  🌐 Портал:          ${CYAN}https://${APP_DOMAIN}${NC}"
echo -e "  🗄  Supabase API:    ${CYAN}http://${APP_DOMAIN}:8000${NC}"
echo -e "  📊 Supabase Studio: ${CYAN}http://${APP_DOMAIN}:3001${NC}"
echo -e "  👤 Studio логин:    ${CYAN}admin / ${DASHBOARD_PASSWORD}${NC}"
echo ""
echo -e "  🔑 Webhook secret:  ${CYAN}${WEBHOOK_SECRET}${NC}"
echo -e "  📎 Webhook URL:     ${CYAN}http://${APP_DOMAIN}:9000${NC}"
echo ""
echo -e "  💾 Данные хранятся: ${CYAN}/opt/app/supabase/volumes/${NC}"
echo -e "  📋 Логи:            ${CYAN}docker compose logs -f${NC}"
echo -e "  🔄 Обновить вручную:${CYAN}app-deploy${NC}"
echo ""
warn "СОХРАНИ эти данные в надёжном месте!"
warn "Webhook secret нужен для настройки CI/CD в GitHub"
