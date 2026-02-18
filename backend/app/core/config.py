from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/habit_tracker"
    
    # Telegram
    TELEGRAM_BOT_TOKEN: str = ""
    TELEGRAM_BOT_USERNAME: str = ""
    TELEGRAM_MINIAPP_DEEPLINK: str = ""  # например: https://t.me/<bot_username>/<app_shortname>
    
    # CORS
    CORS_ORIGINS: List[str] = ["*"]
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

