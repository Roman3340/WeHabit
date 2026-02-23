import uuid
from sqlalchemy import Column, DateTime, String, Integer, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.db.database import Base


class UserAchievement(Base):
    __tablename__ = "user_achievements"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    type = Column(String(50), nullable=False)  # total_days | friends_count | streak | habit_invites
    tier = Column(Integer, nullable=False)  # e.g., 1,2,3 (progressive thresholds)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    metadata_ = Column(JSON, nullable=True)  # extra info, e.g., habit_id, threshold
