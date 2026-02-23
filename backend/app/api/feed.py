from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.db.database import get_db
from app.core.security import get_current_user
from app.models import User, Habit, FeedEvent

router = APIRouter()


@router.get("")
@router.get("/")
async def get_feed(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Лента событий для текущего пользователя"""
    events = db.query(FeedEvent).filter(
        FeedEvent.user_id == current_user.id
    ).order_by(desc(FeedEvent.created_at)).limit(500).all()

    result = []
    for ev in events:
        actor = db.query(User).filter(User.id == ev.actor_id).first() if ev.actor_id else None
        habit = db.query(Habit).filter(Habit.id == ev.habit_id).first() if ev.habit_id else None
        result.append({
            "id": ev.id,
            "event_type": ev.event_type,
            "created_at": ev.created_at,
            "habit": {
                "id": habit.id,
                "name": habit.name,
            } if habit else None,
            "actor": {
                "id": actor.id,
                "username": actor.username,
                "first_name": actor.first_name,
                "last_name": actor.last_name,
                "avatar_emoji": actor.avatar_emoji,
            } if actor else None,
        })
    return result
