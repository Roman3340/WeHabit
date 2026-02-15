# Инструкция по деплою

## Подготовка репозитория

### 1. Инициализация Git (если еще не сделано)

```bash
# В корне проекта
git init
git add .
git commit -m "Initial commit"
```

### 2. Подключение к GitHub репозиторию

```bash
# Замените YOUR_USERNAME и YOUR_REPO на ваши данные
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

## Настройка GitHub Pages

### 1. Включение GitHub Pages

1. Перейдите в Settings вашего репозитория на GitHub
2. В разделе "Pages" (слева в меню)
3. В "Source" выберите "GitHub Actions"
4. Сохраните изменения

### 2. Настройка секретов (опционально)

Если ваш API находится на другом домене, добавьте секрет:

1. Settings → Secrets and variables → Actions
2. New repository secret
3. Имя: `VITE_API_URL`
4. Значение: URL вашего API (например: `https://api.example.com/api`)

## Настройка Telegram Mini App

### 1. Создание бота

1. Откройте [@BotFather](https://t.me/botfather) в Telegram
2. Отправьте `/newbot`
3. Следуйте инструкциям для создания бота
4. Сохраните токен бота

### 2. Создание Web App

1. Отправьте `/newapp` в BotFather
2. Выберите вашего бота
3. Укажите название приложения
4. Укажите описание
5. Загрузите фото (опционально)
6. Укажите URL вашего приложения:
   ```
   https://YOUR_USERNAME.github.io/YOUR_REPO/
   ```
   Или если используете кастомный домен:
   ```
   https://your-domain.com
   ```
7. Сохраните короткое имя для приложения

### 3. Получение ссылки

После создания Web App, BotFather даст вам ссылку вида:
```
https://t.me/your_bot/your_app
```

## Альтернативные варианты деплоя

### Vercel (рекомендуется для продакшена)

1. Зарегистрируйтесь на [vercel.com](https://vercel.com)
2. Подключите GitHub репозиторий
3. Настройки:
   - Framework Preset: Vite
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Добавьте переменную окружения:
   - `VITE_API_URL` = URL вашего API
5. Деплой произойдет автоматически

### Netlify

1. Зарегистрируйтесь на [netlify.com](https://netlify.com)
2. Подключите GitHub репозиторий
3. Настройки:
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `frontend/dist`
4. Добавьте переменную окружения `VITE_API_URL`
5. Деплой произойдет автоматически

## Настройка Backend API

### Вариант 1: Локальный сервер (для разработки)

Используйте ngrok для создания туннеля:

```bash
# Установите ngrok
# Запустите ваш backend на localhost:8000
ngrok http 8000
```

Используйте полученный URL в настройках фронтенда.

### Вариант 2: Облачный хостинг

Рекомендуемые варианты:
- **Railway** (railway.app) - простой деплой
- **Render** (render.com) - бесплатный tier
- **Heroku** (heroku.com) - классический вариант
- **DigitalOcean App Platform**
- **AWS/GCP/Azure** - для продакшена

### Пример деплоя на Railway

1. Зарегистрируйтесь на railway.app
2. Создайте новый проект
3. Подключите GitHub репозиторий
4. Выберите папку `backend`
5. Railway автоматически определит Python проект
6. Добавьте переменные окружения из `.env`
7. Railway предоставит URL для вашего API

## Проверка работы

1. После деплоя фронтенда, откройте URL в браузере
2. Проверьте, что приложение загружается
3. Откройте бота в Telegram и нажмите на кнопку Web App
4. Приложение должно открыться в Telegram

## Обновление приложения

После каждого push в ветку `main`, GitHub Actions автоматически:
1. Соберет фронтенд
2. Задеплоит на GitHub Pages

Для обновления просто сделайте:
```bash
git add .
git commit -m "Update"
git push
```

## Troubleshooting

### Приложение не открывается в Telegram

1. Проверьте, что URL правильный в настройках бота
2. Убедитесь, что сайт доступен в браузере
3. Проверьте, что используется HTTPS (обязательно для Telegram)

### API не работает

1. Проверьте CORS настройки на бэкенде
2. Убедитесь, что `VITE_API_URL` правильно настроен
3. Проверьте логи бэкенда

### GitHub Pages показывает 404

1. Убедитесь, что GitHub Actions workflow выполнился успешно
2. Проверьте, что в Settings → Pages выбран источник "GitHub Actions"
3. Подождите несколько минут после деплоя

