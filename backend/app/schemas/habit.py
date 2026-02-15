from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, time, date
from uuid import UUID


class HabitBase(BaseModel):
    name: str
    description: Optional[str] = None
    frequency: str = "daily"  # daily, weekly, custom
    is_shared: bool = False


class HabitCreate(HabitBase):
    participant_ids: Optional[List[UUID]] = None  # Для совместных привычек


class HabitUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    frequency: Optional[str] = None
    is_shared: Optional[bool] = None


class Habit(HabitBase):
    id: UUID
    created_by: UUID
    created_at: datetime
    updated_at: datetime
    participants: Optional[List[dict]] = None

    class Config:
        from_attributes = True


class HabitLogCreate(BaseModel):
    notes: Optional[str] = None


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

