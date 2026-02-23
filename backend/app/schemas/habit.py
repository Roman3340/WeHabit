from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, time
from uuid import UUID


class HabitBase(BaseModel):
    name: str
    description: Optional[str] = None
    frequency: str = "daily"  # daily, weekly, custom
    is_shared: bool = False
    color: Optional[str] = "gold"
    days_of_week: Optional[List[int]] = None  # 1=Пн .. 7=Вс
    weekly_goal_days: Optional[int] = None  # N из 7
    reminder_enabled: Optional[bool] = False
    reminder_time: Optional[str] = None  # HH:MM


class HabitCreate(HabitBase):
    participant_ids: Optional[List[UUID]] = None  # Для совместных привычек


class HabitUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    frequency: Optional[str] = None
    is_shared: Optional[bool] = None
    color: Optional[str] = None
    days_of_week: Optional[List[int]] = None
    weekly_goal_days: Optional[int] = None
    reminder_enabled: Optional[bool] = None
    reminder_time: Optional[str] = None


class Habit(HabitBase):
    id: UUID
    created_by: UUID
    created_at: datetime
    updated_at: datetime
    participants: Optional[List[dict]] = None
    current_week_completions: Optional[List[str]] = None  # даты YYYY-MM-DD за текущую неделю
    current_streak: Optional[int] = None  # максимальная серия дней подряд (для карточки)
    has_pending_invites: Optional[bool] = None
    is_invited: Optional[bool] = None
    can_edit: Optional[bool] = None
    weekly_participant_completions: Optional[Dict[str, List[Dict[str, Any]]]] = None

    class Config:
        from_attributes = True


class HabitLogCreate(BaseModel):
    notes: Optional[str] = None
    date: Optional[str] = None  # YYYY-MM-DD, если не указано — сегодня


class HabitLog(BaseModel):
    id: UUID
    habit_id: UUID
    user_id: UUID
    completed_at: datetime
    notes: Optional[str] = None

    class Config:
        from_attributes = True


class HabitNotificationCreate(BaseModel):
    time: time
    timezone: str = "UTC"
    is_active: bool = True
    days_of_week: List[int] = [1, 2, 3, 4, 5, 6, 7]


class HabitNotification(BaseModel):
    id: UUID
    habit_id: UUID
    user_id: UUID
    time: time
    timezone: str
    is_active: bool
    days_of_week: List[int]
    created_at: datetime

    class Config:
        from_attributes = True

