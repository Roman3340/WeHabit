from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.core.security import get_current_user
from app.models import User, UserAchievement

router = APIRouter()


@router.get("/my")
async def get_my_achievements(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rows = db.query(UserAchievement).filter(UserAchievement.user_id == current_user.id).order_by(UserAchievement.created_at.desc()).all()
    return [
        {
            "id": ua.id,
            "type": ua.type,
            "tier": ua.tier,
            "created_at": ua.created_at,
            "metadata_": ua.metadata_,
        } for ua in rows
    ]


@router.get("/user/{user_id}")
async def get_user_achievements(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rows = db.query(UserAchievement).filter(UserAchievement.user_id == user_id).order_by(UserAchievement.created_at.desc()).all()
    return [
        {
            "id": ua.id,
            "type": ua.type,
            "tier": ua.tier,
            "created_at": ua.created_at,
            "metadata_": ua.metadata_,
        } for ua in rows
    ]
