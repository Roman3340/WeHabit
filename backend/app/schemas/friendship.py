from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID


class FriendshipBase(BaseModel):
    status: str = "pending"  # pending, accepted, blocked


class FriendshipCreate(BaseModel):
    friend_id: UUID


class Friendship(FriendshipBase):
    id: UUID
    user_id: UUID
    friend_id: UUID
    created_at: datetime
    updated_at: datetime
    friend: Optional[dict] = None

    class Config:
        from_attributes = True

