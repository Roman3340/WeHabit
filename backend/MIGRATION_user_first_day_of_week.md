# Миграция БД: первый день недели в профиле пользователя

Настройка «Понедельник / Воскресенье» хранится в таблице `users`.

## Шаг 1: подключиться к БД

```bash
psql -U postgres -d habit_tracker
```

(или ваша строка подключения).

## Шаг 2: выполнить миграцию

```sql
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS first_day_of_week VARCHAR(10) DEFAULT 'monday';
```

Если ваша версия PostgreSQL не поддерживает `IF NOT EXISTS`:

```sql
ALTER TABLE users ADD COLUMN first_day_of_week VARCHAR(10) DEFAULT 'monday';
```

(Если колонка уже есть — будет ошибка, её можно игнорировать.)

## Шаг 3: перезапустить бэкенд

После выполнения SQL перезапустите приложение бэкенда.
