from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
import secrets
from app.db.database import get_db
from app.core.security import get_current_user
from app.core.config import settings
from app.models import User, Friendship, FeedEvent, UserAchievement
from sqlalchemy import func
from app.schemas.friendship import Friendship as FriendshipSchema, FriendshipCreate

router = APIRouter()

def ensure_referral_code(db: Session, user: User) -> str:
    if getattr(user, "referral_code", None):
        return user.referral_code

    for _ in range(10):
        code = secrets.token_hex(8)  # 16 символов 0-9a-f, безопасно для /start payload
        exists = db.query(User).filter(User.referral_code == code).first()
        if not exists:
            user.referral_code = code
            db.commit()
            db.refresh(user)
            return code

    raise HTTPException(status_code=500, detail="Failed to generate referral code")


@router.get("/invite")
async def get_invite_link(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получить реферальную ссылку для приглашения друга."""
    code = ensure_referral_code(db, current_user)
    if not settings.TELEGRAM_BOT_USERNAME:
        raise HTTPException(status_code=500, detail="TELEGRAM_BOT_USERNAME is not configured")
    url = f"https://t.me/{settings.TELEGRAM_BOT_USERNAME}?start={code}"
    return {"referral_code": code, "referral_url": url}


@router.get("", response_model=List[FriendshipSchema])
async def get_friends(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получить список друзей"""
    friendships = db.query(Friendship).filter(
        (Friendship.user_id == current_user.id) |
        (Friendship.friend_id == current_user.id),
        Friendship.status == "accepted"
    ).all()
    
    result = []
    for friendship in friendships:
        friend_id = friendship.friend_id if friendship.user_id == current_user.id else friendship.user_id
        friend = db.query(User).filter(User.id == friend_id).first()
        friendship_dict = {
            "id": friendship.id,
            "user_id": friendship.user_id,
            "friend_id": friendship.friend_id,
            "status": friendship.status,
            "created_at": friendship.created_at,
            "updated_at": friendship.updated_at,
            "friend": {
                "id": friend.id,
                "username": friend.username,
                "first_name": friend.first_name,
                "last_name": friend.last_name,
                "bio": friend.bio,
                "avatar_emoji": friend.avatar_emoji
            } if friend else None
        }
        result.append(friendship_dict)
    
    return result


@router.post("/{user_id}")
async def add_friend(
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Добавить друга"""
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot add yourself as friend")
    
    friend = db.query(User).filter(User.id == user_id).first()
    if not friend:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Проверка существующей дружбы
    existing = db.query(Friendship).filter(
        ((Friendship.user_id == current_user.id) & (Friendship.friend_id == user_id)) |
        ((Friendship.user_id == user_id) & (Friendship.friend_id == current_user.id))
    ).first()
    
    if existing:
        if existing.status == "accepted":
            raise HTTPException(status_code=400, detail="Already friends")
        elif existing.status == "pending":
            if existing.user_id == user_id:
                existing.status = "accepted"
                db.commit()
                # Achievements: friends_count (3,7,10) for both parties
                thresholds = [(1, 3), (2, 7), (3, 10)]
                for uid in [current_user.id, user_id]:
                    total_friends = db.query(func.count(Friendship.id)).filter(
                        ((Friendship.user_id == uid) | (Friendship.friend_id == uid)),
                        Friendship.status == "accepted"
                    ).scalar() or 0
                    for tier, th in thresholds:
                        exists_ach = db.query(UserAchievement).filter(
                            UserAchievement.user_id == uid,
                            UserAchievement.type == "friends_count",
                            UserAchievement.tier == tier
                        ).first()
                        if not exists_ach and total_friends >= th:
                            db.add(UserAchievement(user_id=uid, type="friends_count", tier=tier, metadata_={"threshold": th}))
                            # Create feed events for all of uid's accepted friends
                            friend_rows = db.query(Friendship).filter(
                                ((Friendship.user_id == uid) | (Friendship.friend_id == uid)),
                                Friendship.status == "accepted"
                            ).all()
                            friend_ids = {fr.user_id if fr.user_id != uid else fr.friend_id for fr in friend_rows}
                            for fid in friend_ids:
                                db.add(FeedEvent(user_id=fid, actor_id=uid, habit_id=None, event_type="achievement"))
                            # also add self event
                            db.add(FeedEvent(user_id=uid, actor_id=uid, habit_id=None, event_type="achievement"))
                            db.commit()
                return {"message": "Friendship accepted"}
            else:
                raise HTTPException(status_code=400, detail="Friendship request already sent")
    
    # Создание новой дружбы
    friendship = Friendship(
        user_id=current_user.id,
        friend_id=user_id,
        status="pending"
    )
    db.add(friendship)
    db.commit()
    db.refresh(friendship)
    
    return {"message": "Friendship request sent", "friendship": friendship}


@router.delete("/{user_id}")
async def remove_friend(
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Удалить друга"""
    friendship = db.query(Friendship).filter(
        ((Friendship.user_id == current_user.id) & (Friendship.friend_id == user_id)) |
        ((Friendship.user_id == user_id) & (Friendship.friend_id == current_user.id))
    ).first()
    
    if not friendship:
        raise HTTPException(status_code=404, detail="Friendship not found")
    
    db.delete(friendship)
    db.commit()
    return {"message": "Friend removed"}

