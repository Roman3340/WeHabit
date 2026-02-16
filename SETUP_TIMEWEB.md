# Быстрая инструкция: Деплой бэкенда на Timeweb

## Шаг 1: Подготовка файлов

1. Откройте FileZilla
2. Подключитесь к вашему серверу Timeweb:
   - Хост: ваш домен или IP
   - Пользователь: ваш FTP пользователь
   - Пароль: ваш FTP пароль

## Шаг 2: Загрузка файлов

Загрузите на сервер следующие файлы и папки из `backend/`:
- `app/` (вся папка со всем содержимым)
- `requirements.txt`
- `run.py`

**НЕ загружайте**:
- `venv/` (виртуальное окружение)
- `__pycache__/`
- `.env` (создадите на сервере)

## Шаг 3: Настройка на сервере (через SSH)

Подключитесь по SSH к серверу:

```bash
ssh username@your-server.com
```

### Установка зависимостей

```bash
# Перейдите в директорию с проектом
cd /path/to/your/backend

# Создайте виртуальное окружение
python3 -m venv venv

# Активируйте его
source venv/bin/activate

# Установите зависимости
pip install -r requirements.txt
```

### Создание .env файла

```bash
nano .env
```

Добавьте:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/habit_tracker
TELEGRAM_BOT_TOKEN=your-bot-token
CORS_ORIGINS=["https://your-username.github.io"]
SECRET_KEY=your-secret-key
```

### Настройка базы данных

Если у вас есть доступ к PostgreSQL:

```bash
# Создайте БД (если еще не создана)
createdb habit_tracker

# Примените схему
psql -d habit_tracker -f database/init.sql
```

Или используйте внешнюю БД от Timeweb и укажите ее URL в `DATABASE_URL`.

## Шаг 4: Запуск

### Простой способ (для теста)

```bash
cd /path/to/your/backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Постоянный запуск (через screen)

```bash
# Установите screen (если нет)
sudo apt install screen

# Создайте сессию
screen -S habit-tracker

# Запустите приложение
cd /path/to/your/backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Нажмите Ctrl+A, затем D для отсоединения
```

## Шаг 5: Проверка

Откройте в браузере:
```
http://your-server-ip:8000/health
```

Должен вернуться: `{"status":"ok"}`

## Шаг 6: Настройка фронтенда

1. В GitHub репозитории:
   - Settings → Secrets and variables → Actions
   - Добавьте/обновите секрет `VITE_API_URL`:
     - Если используете IP: `http://your-server-ip:8000/api`
     - Если настроили домен: `https://api.your-domain.com/api`

2. Перезапустите GitHub Actions workflow для фронтенда

## Важные замечания

- Убедитесь, что порт 8000 открыт в firewall Timeweb
- Если используете домен, настройте Nginx reverse proxy (см. TIMEWEB_DEPLOY.md)
- Для продакшена рекомендуется использовать systemd для автозапуска (см. TIMEWEB_DEPLOY.md)

## Troubleshooting

**Приложение не запускается:**
- Проверьте, что все зависимости установлены: `pip list`
- Проверьте логи ошибок
- Убедитесь, что порт свободен: `netstat -tulpn | grep 8000`

**Ошибки подключения к БД:**
- Проверьте строку подключения в `.env`
- Убедитесь, что PostgreSQL запущен
- Проверьте права доступа пользователя БД

**CORS ошибки:**
- Убедитесь, что в `CORS_ORIGINS` указан правильный домен GitHub Pages

