# Миграция БД: реферальный код пользователя

Чтобы поддержать приглашение друзей по ссылке/QR, добавьте пользователю реферальный код.

## SQL (PostgreSQL)

Подключитесь к БД и выполните:

```sql
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS referral_code VARCHAR(32);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_referral_code_unique
  ON users (referral_code)
  WHERE referral_code IS NOT NULL;
```

## Откат

```sql
DROP INDEX IF EXISTS idx_users_referral_code_unique;
ALTER TABLE users DROP COLUMN IF EXISTS referral_code;
```

