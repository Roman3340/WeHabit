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
    frequency = Column(String(50), nullable=False, default="daily")  # daily, weekly, custom
    is_shared = Column(Boolean, default=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

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

