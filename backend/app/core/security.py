from fastapi import HTTPException, Header, Depends
from typing import Optional
import hmac
import hashlib
from app.core.config import settings
from app.db.database import get_db, SessionLocal
from app.models import User
from sqlalchemy.orm import Session


def verify_telegram_auth(init_data: str) -> dict:
    """
    Верификация данных от Telegram Web App
    В продакшене нужно использовать правильную валидацию через Telegram
    """
    # Упрощенная версия для разработки
    # В продакшене нужно использовать правильную валидацию
    # Для разработки можно парсить init_data вручную
    try:
        # Парсинг init_data (упрощенная версия)
        # В реальности нужно проверять подпись через секретный ключ бота
        import urllib.parse
        params = urllib.parse.parse_qs(init_data)
        user_str = params.get('user', ['{}'])[0]
        import json
        user_data = json.loads(user_str)
        return {
            "id": user_data.get("id", 123456789),
            "first_name": user_data.get("first_name", "Test"),
            "username": user_data.get("username", "testuser"),
            "last_name": user_data.get("last_name")
        }
    except:
        # Fallback для разработки
        return {"id": 123456789, "first_name": "Test", "username": "testuser"}


def get_current_user(
    x_telegram_init_data: Optional[str] = Header(None, alias="X-Telegram-Init-Data"),
    db: Session = Depends(get_db)
) -> User:
    """
    Получение текущего пользователя из Telegram данных
    """
    if not x_telegram_init_data:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Верификация данных Telegram
    telegram_data = verify_telegram_auth(x_telegram_init_data)
    telegram_id = telegram_data.get("id")
    
    if not telegram_id:
        raise HTTPException(status_code=401, detail="Invalid telegram data")
    
    # Поиск или создание пользователя
    user = db.query(User).filter(User.telegram_id == telegram_id).first()
    
    if not user:
        user = User(
            telegram_id=telegram_id,
            username=telegram_data.get("username"),
            first_name=telegram_data.get("first_name"),
            last_name=telegram_data.get("last_name")
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    return user
