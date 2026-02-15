from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.db.database import get_db
from app.core.security import get_current_user
from app.models import User, Friendship
from app.schemas.friendship import Friendship as FriendshipSchema, FriendshipCreate

router = APIRouter()


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
            # Если запрос от другого пользователя, принимаем его
            if existing.user_id == user_id:
                existing.status = "accepted"
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

