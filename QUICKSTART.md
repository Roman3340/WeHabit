# Быстрый старт

## Шаг 1: Настройка базы данных

```bash
# Установите PostgreSQL, если еще не установлен
# Затем создайте базу данных:

psql -U postgres
CREATE DATABASE habit_tracker;
\c habit_tracker
\i database/init.sql
\q
```

## Шаг 2: Настройка Backend

```bash
cd backend

# Создайте виртуальное окружение
python -m venv venv

# Активируйте его
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Установите зависимости
pip install -r requirements.txt

# Создайте .env файл
cp .env.example .env

# Отредактируйте .env и укажите правильный DATABASE_URL:
# DATABASE_URL=postgresql://postgres:ваш_пароль@localhost:5432/habit_tracker

# Запустите сервер
python run.py
```

Backend будет доступен на http://localhost:8000
API документация: http://localhost:8000/docs

## Шаг 3: Настройка Frontend

```bash
cd frontend

# Установите зависимости
npm install

# Запустите dev сервер
npm run dev
```

Frontend будет доступен на http://localhost:3000

## Шаг 4: Интеграция с Telegram

1. Создайте бота через [@BotFather](https://t.me/botfather)
2. Получите токен бота
3. Добавьте токен в `backend/.env`:
   ```
   TELEGRAM_BOT_TOKEN=ваш_токен_бота
   ```
4. Настройте Web App:
   - Отправьте `/newapp` в BotFather
   - Укажите название приложения
   - Укажите URL вашего фронтенда (для разработки можно использовать ngrok)
   - Получите ссылку на ваше приложение

## Тестирование

### Локальное тестирование без Telegram

Для тестирования без Telegram можно использовать заголовок:
```
X-Telegram-Init-Data: user=%7B%22id%22%3A123456789%2C%22first_name%22%3A%22Test%22%7D
```

Или использовать Postman/curl с этим заголовком.

### Тестирование в Telegram

1. Разверните приложение (можно использовать ngrok для локальной разработки)
2. Откройте бота в Telegram
3. Нажмите на кнопку Web App или отправьте команду для запуска приложения

## Структура проекта

```
tracker/
├── backend/          # FastAPI приложение
│   ├── app/
│   │   ├── api/      # API роуты
│   │   ├── models/   # SQLAlchemy модели
│   │   ├── schemas/  # Pydantic схемы
│   │   └── core/     # Конфигурация
│   └── run.py        # Точка входа
├── frontend/         # React приложение
│   ├── src/
│   │   ├── components/  # Компоненты
│   │   ├── pages/       # Страницы
│   │   └── services/    # API клиент
│   └── package.json
└── database/         # SQL схемы
    └── init.sql
```

## Полезные команды

### Backend
```bash
# Запуск с автоперезагрузкой
python run.py

# Или через uvicorn напрямую
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend
```bash
# Разработка
npm run dev

# Сборка для продакшена
npm run build

# Просмотр сборки
npm run preview
```

## Решение проблем

### Ошибка подключения к БД
- Проверьте, что PostgreSQL запущен
- Проверьте правильность DATABASE_URL в .env
- Убедитесь, что база данных создана

### Ошибка авторизации
- Проверьте, что заголовок X-Telegram-Init-Data передается
- В режиме разработки можно использовать упрощенную авторизацию

### CORS ошибки
- Проверьте настройки CORS_ORIGINS в backend/.env
- Убедитесь, что фронтенд и бэкенд на правильных портах

