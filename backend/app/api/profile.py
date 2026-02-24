from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.core.security import get_current_user
from app.models import User
from app.schemas.user import User as UserSchema, UserUpdate

router = APIRouter()


@router.get("", response_model=UserSchema)
async def get_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получить профиль пользователя"""
    return current_user


@router.put("", response_model=UserSchema)
async def update_profile(
    profile_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Обновить профиль пользователя"""
    for field, value in profile_data.dict(exclude_unset=True).items():
        if value is not None:
            setattr(current_user, field, value)
    
    db.commit()
    db.refresh(current_user)
    return current_user


@router.delete("")
async def delete_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Удалить профиль пользователя и все связанные данные."""
    db.delete(current_user)
    db.commit()
    return {"message": "Account deleted successfully"}

