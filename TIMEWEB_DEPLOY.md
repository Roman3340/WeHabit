# Деплой бэкенда на Timeweb

## Подготовка

### 1. Требования на сервере

- Python 3.11+
- PostgreSQL (или используйте внешнюю БД)
- pip/virtualenv

### 2. Подготовка файлов для загрузки

Создайте архив с файлами бэкенда:

```bash
# В корне проекта
cd backend
# Создайте архив (исключая venv и __pycache__)
tar -czf ../backend-deploy.tar.gz \
  --exclude='venv' \
  --exclude='__pycache__' \
  --exclude='*.pyc' \
  --exclude='.env' \
  app/ requirements.txt run.py

# Или на Windows используйте 7-Zip/WinRAR для создания архива
# Включите только: app/, requirements.txt, run.py
# Исключите: venv/, __pycache__/, *.pyc, .env
```

## Загрузка через FileZilla

### 1. Подключение

1. Откройте FileZilla
2. Создайте новое подключение:
   - **Хост**: ваш сервер Timeweb (например: `your-domain.com` или IP)
   - **Пользователь**: ваш FTP пользователь
   - **Пароль**: ваш FTP пароль
   - **Порт**: 21 (или 22 для SFTP)

### 2. Загрузка файлов

1. Подключитесь к серверу
2. Перейдите в директорию для вашего проекта (например: `/home/username/habit-tracker-backend` или `/var/www/backend`)
3. Загрузите файлы:
   - `app/` (вся папка)
   - `requirements.txt`
   - `run.py`

## Настройка на сервере

### 1. Подключение по SSH

```bash
ssh username@your-server.com
```

### 2. Установка зависимостей

```bash
cd /path/to/your/backend

# Создайте виртуальное окружение
python3 -m venv venv

# Активируйте его
source venv/bin/activate

# Установите зависимости
pip install -r requirements.txt
```

### 3. Настройка переменных окружения

Создайте файл `.env`:

```bash
nano .env
```

Добавьте:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/habit_tracker

# Telegram
TELEGRAM_BOT_TOKEN=your-telegram-bot-token

# CORS
CORS_ORIGINS=["https://your-username.github.io","https://your-domain.com"]

# Security
SECRET_KEY=your-very-secret-key-change-this
```

### 4. Настройка базы данных

Если PostgreSQL на том же сервере:

```bash
# Подключитесь к PostgreSQL
sudo -u postgres psql

# Создайте базу данных
CREATE DATABASE habit_tracker;
CREATE USER habit WITH PASSWORD '123';
GRANT ALL PRIVILEGES ON DATABASE habit_tracker TO habit_user;
\q

# Примените схему
psql -U habit -d habit_tracker -f database/init.sql
```

Или используйте внешнюю БД (например, от Timeweb) и укажите ее URL в `DATABASE_URL`.

## Запуск приложения

### Вариант 1: Через systemd (рекомендуется)

Создайте файл сервиса:

```bash
sudo nano /etc/systemd/system/habit-tracker.service
```

Добавьте:

```ini
[Unit]
Description=Habit Tracker API
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/your/backend
Environment="PATH=/path/to/your/backend/venv/bin"
ExecStart=/path/to/your/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

Активируйте и запустите:

```bash
sudo systemctl daemon-reload
sudo systemctl enable habit-tracker
sudo systemctl start habit-tracker

# Проверьте статус
sudo systemctl status habit-tracker
```

### Вариант 2: Через screen/tmux

```bash
# Установите screen
sudo apt install screen

# Создайте новую сессию
screen -S habit-tracker

# Активируйте venv и запустите
cd /path/to/your/backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Нажмите Ctrl+A, затем D для отсоединения
```

### Вариант 3: Через nohup

```bash
cd /path/to/your/backend
source venv/bin/activate
nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 > app.log 2>&1 &
```

## Настройка Nginx (если нужен reverse proxy)

Если хотите использовать домен для API:

```bash
sudo nano /etc/nginx/sites-available/habit-tracker-api
```

Добавьте:

```nginx
server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Активируйте:

```bash
sudo ln -s /etc/nginx/sites-available/habit-tracker-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Настройка SSL (HTTPS)

Используйте Let's Encrypt:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.your-domain.com
```

## Проверка работы

1. Проверьте, что сервис запущен:
   ```bash
   sudo systemctl status habit-tracker
   ```

2. Проверьте логи:
   ```bash
   sudo journalctl -u habit-tracker -f
   ```

3. Проверьте API:
   ```bash
   curl http://your-server:8000/health
   # Или
   curl https://api.your-domain.com/health
   ```

## Обновление приложения

1. Загрузите новые файлы через FileZilla
2. Перезапустите сервис:
   ```bash
   sudo systemctl restart habit-tracker
   ```

Или если используете screen:
```bash
screen -r habit-tracker
# Остановите приложение (Ctrl+C)
# Запустите снова
```

## Настройка фронтенда для работы с вашим API

После деплоя бэкенда, обновите настройки фронтенда:

1. В GitHub репозитории:
   - Settings → Secrets and variables → Actions
   - Добавьте секрет `VITE_API_URL` со значением: `https://api.your-domain.com/api` или `http://your-server-ip:8000/api`

2. Или обновите `.env` локально и пересоберите:
   ```bash
   cd frontend
   echo "VITE_API_URL=https://api.your-domain.com/api" > .env.production
   npm run build
   ```

## Troubleshooting

### Приложение не запускается

1. Проверьте логи:
   ```bash
   sudo journalctl -u habit-tracker -n 50
   ```

2. Проверьте права доступа:
   ```bash
   ls -la /path/to/your/backend
   ```

3. Проверьте, что порт свободен:
   ```bash
   sudo netstat -tulpn | grep 8000
   ```

### Ошибки подключения к БД

1. Проверьте, что PostgreSQL запущен:
   ```bash
   sudo systemctl status postgresql
   ```

2. Проверьте строку подключения в `.env`
3. Проверьте права пользователя БД

### CORS ошибки

Убедитесь, что в `.env` указаны правильные домены в `CORS_ORIGINS`:
```env
CORS_ORIGINS=["https://your-username.github.io","https://your-domain.com"]
```

## Полезные команды

```bash
# Просмотр логов
sudo journalctl -u habit-tracker -f

# Перезапуск сервиса
sudo systemctl restart habit-tracker

# Остановка сервиса
sudo systemctl stop habit-tracker

# Проверка статуса
sudo systemctl status habit-tracker

# Просмотр процессов
ps aux | grep uvicorn
```

