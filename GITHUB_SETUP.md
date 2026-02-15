# Настройка GitHub репозитория и деплой

## Шаг 1: Инициализация и первый push

```bash
# В корне проекта (tracker/)
git init
git add .
git commit -m "Initial commit: Habit Tracker Telegram Mini App"

# Добавьте remote (замените YOUR_USERNAME и YOUR_REPO)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

## Шаг 2: Настройка GitHub Pages

1. Перейдите в **Settings** вашего репозитория на GitHub
2. В левом меню выберите **Pages**
3. В разделе **Source** выберите **GitHub Actions**
4. Сохраните изменения

## Шаг 3: Настройка переменных окружения (опционально)

Если ваш API будет на другом домене:

1. Перейдите в **Settings** → **Secrets and variables** → **Actions**
2. Нажмите **New repository secret**
3. Добавьте:
   - **Name**: `VITE_API_URL`
   - **Value**: URL вашего API (например: `https://your-api.railway.app/api`)

## Шаг 4: Обновление vite.config.ts

Откройте `frontend/vite.config.ts` и замените `YOUR_REPO_NAME` на имя вашего репозитория:

```typescript
const repoName = 'your-repo-name' // Замените на имя вашего репозитория
```

Или установите переменную окружения в GitHub Actions:
- Settings → Secrets and variables → Actions → New repository secret
- Name: `VITE_REPO_NAME`
- Value: имя вашего репозитория

## Шаг 5: Настройка Telegram Mini App

### Создание бота

1. Откройте [@BotFather](https://t.me/botfather) в Telegram
2. Отправьте `/newbot`
3. Следуйте инструкциям
4. Сохраните токен бота

### Создание Web App

1. Отправьте `/newapp` в BotFather
2. Выберите вашего бота
3. Укажите название приложения
4. Укажите описание
5. Загрузите фото (опционально)
6. **Важно**: Укажите URL вашего приложения:
   ```
   https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/
   ```
   Например: `https://username.github.io/habit-tracker/`
7. Сохраните короткое имя

### Получение ссылки

BotFather даст вам ссылку вида:
```
https://t.me/your_bot/your_app
```

## Шаг 6: Настройка Backend API

### Вариант A: Railway (рекомендуется)

1. Зарегистрируйтесь на [railway.app](https://railway.app)
2. Создайте новый проект
3. Нажмите **New** → **GitHub Repo**
4. Выберите ваш репозиторий
5. Выберите папку `backend`
6. Railway автоматически определит Python проект
7. Добавьте переменные окружения:
   - `DATABASE_URL` - ваша строка подключения к PostgreSQL
   - `TELEGRAM_BOT_TOKEN` - токен бота
   - `CORS_ORIGINS` - `["*"]` или конкретные домены
   - `SECRET_KEY` - случайная строка
8. Railway предоставит URL (например: `https://your-app.railway.app`)
9. Обновите `VITE_API_URL` в GitHub Secrets на `https://your-app.railway.app/api`

### Вариант B: Render

1. Зарегистрируйтесь на [render.com](https://render.com)
2. Создайте новый **Web Service**
3. Подключите GitHub репозиторий
4. Настройки:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Добавьте переменные окружения
6. Render предоставит URL

### Вариант C: Локальный сервер + ngrok (для разработки)

```bash
# Установите ngrok
# Запустите backend
cd backend
python run.py

# В другом терминале
ngrok http 8000
```

Используйте URL от ngrok в настройках фронтенда.

## Шаг 7: Проверка работы

1. После push в `main`, GitHub Actions автоматически задеплоит фронтенд
2. Проверьте статус в **Actions** вкладке на GitHub
3. Откройте URL: `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`
4. Откройте бота в Telegram и нажмите на кнопку Web App
5. Приложение должно открыться

## Обновление приложения

После каждого изменения просто делайте:

```bash
git add .
git commit -m "Your commit message"
git push
```

GitHub Actions автоматически задеплоит изменения.

## Troubleshooting

### GitHub Pages показывает 404

1. Убедитесь, что в Settings → Pages выбран **GitHub Actions**
2. Проверьте, что workflow выполнился успешно в **Actions**
3. Подождите 1-2 минуты после деплоя

### Приложение не открывается в Telegram

1. Проверьте URL в настройках бота (должен быть HTTPS)
2. Убедитесь, что сайт доступен в браузере
3. Проверьте консоль браузера на ошибки

### API не работает

1. Проверьте CORS настройки на бэкенде
2. Убедитесь, что `VITE_API_URL` правильно настроен
3. Проверьте логи бэкенда на хостинге

### Ошибки сборки

1. Проверьте логи в **Actions** на GitHub
2. Убедитесь, что все зависимости указаны в `package.json`
3. Проверьте, что Node.js версия совместима

## Полезные ссылки

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Telegram Web Apps](https://core.telegram.org/bots/webapps)
- [Railway Documentation](https://docs.railway.app)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)

