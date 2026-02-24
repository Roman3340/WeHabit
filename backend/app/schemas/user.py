from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID


class UserBase(BaseModel):
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    avatar_emoji: str = "👤"
    bio: Optional[str] = None
    first_day_of_week: Optional[str] = "monday"  # monday | sunday
    habit_reminders_enabled: bool = True
    feed_notifications_enabled: bool = True


class UserCreate(UserBase):
    telegram_id: int


class UserUpdate(BaseModel):
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    avatar_emoji: Optional[str] = None
    bio: Optional[str] = None
    first_day_of_week: Optional[str] = None
    habit_reminders_enabled: Optional[bool] = None
    feed_notifications_enabled: Optional[bool] = None


class User(UserBase):
    id: UUID
    telegram_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

