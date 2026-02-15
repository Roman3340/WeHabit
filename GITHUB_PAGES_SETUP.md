# Настройка GitHub Pages

Если вы получаете ошибку "Get Pages site failed", выполните следующие шаги:

## Шаг 1: Включение GitHub Pages

1. Перейдите в ваш репозиторий на GitHub
2. Нажмите на **Settings** (в верхней панели репозитория)
3. В левом меню найдите и нажмите **Pages**
4. В разделе **Source** выберите **GitHub Actions** (НЕ "Deploy from a branch")
5. Сохраните изменения

## Шаг 2: Проверка permissions

Убедитесь, что в Settings → Actions → General:
- **Workflow permissions** должны быть установлены на "Read and write permissions"
- Или включите "Allow GitHub Actions to create and approve pull requests"

## Шаг 3: Первый запуск

После включения GitHub Pages:

1. Сделайте небольшое изменение в коде (например, добавьте комментарий)
2. Сделайте commit и push:
   ```bash
   git add .
   git commit -m "Trigger GitHub Pages deployment"
   git push
   ```
3. Перейдите в **Actions** вкладку на GitHub
4. Дождитесь завершения workflow "Deploy Frontend to GitHub Pages"
5. Если workflow успешно завершился, ваш сайт будет доступен по адресу:
   ```
   https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/
   ```

## Альтернативный вариант: Деплой через ветку

Если GitHub Actions не работает, можно использовать деплой через ветку:

1. В Settings → Pages → Source выберите **Deploy from a branch**
2. Выберите ветку `main` или `master`
3. Выберите папку `/ (root)`
4. Сохраните

Затем создайте workflow, который будет пушить в ветку `gh-pages`:

```yaml
name: Deploy to gh-pages branch

on:
  push:
    branches: [ main, master ]
    paths:
      - 'frontend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          
      - name: Install and build
        working-directory: ./frontend
        run: |
          npm ci
          npm run build
          
      - name: Deploy to gh-pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./frontend/dist
```

## Troubleshooting

### Ошибка "Not Found"

- Убедитесь, что GitHub Pages включен в Settings
- Проверьте, что выбран источник "GitHub Actions"
- Убедитесь, что workflow имеет правильные permissions

### Сайт не обновляется

- Подождите 1-2 минуты после деплоя
- Очистите кэш браузера (Ctrl+Shift+R)
- Проверьте логи в Actions вкладке

### 404 ошибка на сайте

- Убедитесь, что `vite.config.ts` имеет правильный `base` путь
- Проверьте, что имя репозитория совпадает с настройками

