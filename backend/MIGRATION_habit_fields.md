# Миграция БД: новые поля таблицы `habits`

На сервере уже развёрнута база PostgreSQL. Чтобы добавить поля для привычек (цвет, дни недели, недельная цель, напоминания), выполните **один раз** следующий SQL от имени пользователя БД с правами на изменение схемы.

## Шаг 1: подключиться к БД

На сервере:

```bash
psql -U postgres -d habit_tracker
```

(или ваша строка подключения: другой пользователь/хост/порт).

## Шаг 2: выполнить миграцию

Скопируйте и выполните в `psql`:

```sql
-- Новые колонки для привычек (значения по умолчанию для существующих строк)
ALTER TABLE habits
  ADD COLUMN IF NOT EXISTS color VARCHAR(20) DEFAULT 'gold',
  ADD COLUMN IF NOT EXISTS days_of_week INTEGER[],
  ADD COLUMN IF NOT EXISTS weekly_goal_days INTEGER,
  ADD COLUMN IF NOT EXISTS reminder_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS reminder_time VARCHAR(5);
```

Если ваша версия PostgreSQL не поддерживает `ADD COLUMN IF NOT EXISTS` (старые версии), выполните по одной колонке и пропустите уже существующие вручную:

```sql
ALTER TABLE habits ADD COLUMN color VARCHAR(20) DEFAULT 'gold';
ALTER TABLE habits ADD COLUMN days_of_week INTEGER[];
ALTER TABLE habits ADD COLUMN weekly_goal_days INTEGER;
ALTER TABLE habits ADD COLUMN reminder_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE habits ADD COLUMN reminder_time VARCHAR(5);
```

(Если какая-то колонка уже есть, вы получите ошибку — просто не выполняйте эту строку повторно.)

## Шаг 3: перезапустить бэкенд

После успешного выполнения SQL перезапустите приложение бэкенда (systemd, docker, pm2 и т.п.), чтобы подхватить обновлённые модели.

## Откат (если понадобится)

Удалять колонки имеет смысл только если вы точно откатываете функционал:

```sql
ALTER TABLE habits
  DROP COLUMN IF EXISTS color,
  DROP COLUMN IF EXISTS days_of_week,
  DROP COLUMN IF EXISTS weekly_goal_days,
  DROP COLUMN IF EXISTS reminder_enabled,
  DROP COLUMN IF EXISTS reminder_time,
  DROP COLUMN IF EXISTS emoji;
```

После отката тоже перезапустите бэкенд.
