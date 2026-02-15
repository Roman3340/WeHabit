# Трекер Привычек - Telegram Mini App

## Описание

Мини-приложение для трекинга привычек в Telegram с возможностью совместного ведения привычек с друзьями.

## Быстрый старт

### Для разработки локально

См. [QUICKSTART.md](QUICKSTART.md)

### Для деплоя на GitHub

См. [GITHUB_SETUP.md](GITHUB_SETUP.md)

## Архитектура

### Технологический стек
- **Frontend**: React + TypeScript + Vite
- **Backend**: FastAPI + Python 3.11+
- **База данных**: PostgreSQL
- **Авторизация**: Telegram Web App (автоматическая)

### Структура проекта

```
tracker/
├── frontend/          # React приложение
│   ├── src/
│   │   ├── components/    # Переиспользуемые компоненты
│   │   ├── pages/         # Страницы приложения
│   │   ├── hooks/         # React хуки
│   │   ├── services/      # API клиент
│   │   ├── styles/        # Глобальные стили
│   │   └── types/         # TypeScript типы
│   └── package.json
├── backend/           # FastAPI приложение
│   ├── app/
│   │   ├── models/        # SQLAlchemy модели
│   │   ├── schemas/       # Pydantic схемы
│   │   ├── api/           # API роуты
│   │   ├── core/          # Конфигурация, безопасность
│   │   ├── services/      # Бизнес-логика
│   │   └── db/            # Работа с БД
│   └── requirements.txt
├── database/          # SQL миграции и схемы
│   └── init.sql
└── .gitignore
```

## Основные функции

### MVP (Минимально жизнеспособный продукт)
1. **Авторизация**: Автоматическая через Telegram Web App
2. **Привычки**:
   - Создание личных привычек
   - Создание совместных привычек с друзьями
   - Настройки привычек (название, описание, частота, уведомления)
   - Отметка выполнения
3. **Друзья**: Добавление друзей, список друзей
4. **Статистика**: Отслеживание прогресса по привычкам
5. **Профиль**: Редактирование данных, выбор эмодзи-аватарки

### Будущие функции
- Достижения (achievements)
- Темная тема
- Расширенная аналитика

## База данных

### Основные таблицы
- `users` - пользователи
- `habits` - привычки
- `habit_participants` - участники привычек (связь многие-ко-многим)
- `habit_logs` - записи о выполнении привычек
- `friendships` - дружеские связи
- `notifications` - настройки уведомлений

## API Endpoints

### Авторизация
- `GET /api/auth/me` - Получить текущего пользователя

### Привычки
- `GET /api/habits` - Список привычек пользователя
- `POST /api/habits` - Создать привычку
- `GET /api/habits/{id}` - Детали привычки
- `PUT /api/habits/{id}` - Обновить привычку
- `DELETE /api/habits/{id}` - Удалить привычку
- `POST /api/habits/{id}/complete` - Отметить выполнение

### Друзья
- `GET /api/friends` - Список друзей
- `POST /api/friends/{user_id}` - Добавить друга
- `DELETE /api/friends/{user_id}` - Удалить друга

### Статистика
- `GET /api/stats/habits/{id}` - Статистика по привычке

### Профиль
- `GET /api/profile` - Получить профиль
- `PUT /api/profile` - Обновить профиль

## Установка и запуск

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### База данных
```bash
# Создать БД и применить миграции
psql -U postgres -f database/init.sql
```

## Дизайн

- Стиль: Закругленные полупрозрачные блоки (glassmorphism)
- Цветовая схема: Светлая тема (темная в разработке)
- Адаптивность: Мобильная версия с поддержкой расширения экрана

## Документация

- [QUICKSTART.md](QUICKSTART.md) - Быстрый старт для локальной разработки
- [GITHUB_SETUP.md](GITHUB_SETUP.md) - Настройка GitHub и деплой
- [DEPLOY.md](DEPLOY.md) - Детальная инструкция по деплою
- [ARCHITECTURE.md](ARCHITECTURE.md) - Архитектура приложения

## Лицензия

MIT
