from sqlalchemy import Column, String, Text, Boolean, ForeignKey, DateTime, Time, ARRAY, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.db.database import Base


class Habit(Base):
    __tablename__ = "habits"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    emoji = Column(String(32))
    frequency = Column(String(50), nullable=False, default="daily")  # daily, weekly, custom
    is_shared = Column(Boolean, default=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    # Новые поля: цвет, дни недели или недельная цель, напоминание
    color = Column(String(20), default="gold")
    days_of_week = Column(ARRAY(Integer))  # 1=Пн .. 7=Вс, NULL если используется weekly_goal_days
    weekly_goal_days = Column(Integer)  # N из 7, NULL если используются days_of_week
    reminder_enabled = Column(Boolean, default=False)
    reminder_time = Column(String(5))  # HH:MM

    # Relationships
    participants = relationship("HabitParticipant", back_populates="habit", cascade="all, delete-orphan")
    logs = relationship("HabitLog", back_populates="habit", cascade="all, delete-orphan")
    notifications = relationship("HabitNotification", back_populates="habit", cascade="all, delete-orphan")
    creator = relationship("User", foreign_keys=[created_by])


class HabitParticipant(Base):
    __tablename__ = "habit_participants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    habit_id = Column(UUID(as_uuid=True), ForeignKey("habits.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    habit = relationship("Habit", back_populates="participants")
    user = relationship("User")


class HabitLog(Base):
    __tablename__ = "habit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    habit_id = Column(UUID(as_uuid=True), ForeignKey("habits.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    completed_at = Column(DateTime(timezone=True), server_default=func.now())
    notes = Column(Text)

    # Relationships
    habit = relationship("Habit", back_populates="logs")
    user = relationship("User")


class HabitNotification(Base):
    __tablename__ = "habit_notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    habit_id = Column(UUID(as_uuid=True), ForeignKey("habits.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    time = Column(Time, nullable=False)
    timezone = Column(String(50), default="UTC")
    is_active = Column(Boolean, default=True)
    days_of_week = Column(ARRAY(Integer), default=[1, 2, 3, 4, 5, 6, 7])
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    habit = relationship("Habit", back_populates="notifications")
    user = relationship("User")

