from sqlalchemy import Column, String, BigInteger, Text, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from app.db.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    telegram_id = Column(BigInteger, unique=True, nullable=False, index=True)
    username = Column(String(255))
    first_name = Column(String(255))
    last_name = Column(String(255))
    avatar_emoji = Column(String(10), default="👤")
    bio = Column(Text)
    first_day_of_week = Column(String(10), default="monday")  # monday | sunday
    habit_reminders_enabled = Column(Boolean, default=True, nullable=False)
    feed_notifications_enabled = Column(Boolean, default=True, nullable=False)
    referral_code = Column(String(32), unique=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

