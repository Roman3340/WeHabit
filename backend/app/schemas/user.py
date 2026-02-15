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


class UserCreate(UserBase):
    telegram_id: int


class UserUpdate(BaseModel):
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    avatar_emoji: Optional[str] = None
    bio: Optional[str] = None


class User(UserBase):
    id: UUID
    telegram_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

