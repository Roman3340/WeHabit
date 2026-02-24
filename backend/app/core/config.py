from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/habit_tracker"
    
    # Telegram
    TELEGRAM_BOT_TOKEN: str = "7758408519:AAFIxgU5jgyjaORfsUne9rpIdYaPyT6E69s"
    TELEGRAM_BOT_USERNAME: str = "wehabit_bot"
    TELEGRAM_MINIAPP_DEEPLINK: str = "https://t.me/wehabit_bot/friends"  # например: https://t.me/<bot_username>/<app_shortname>
    TELEGRAM_MINIAPP_LINK: str = "https://roman3340.github.io/WeHabit/"
    
    # CORS
    CORS_ORIGINS: List[str] = ["*"]
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

