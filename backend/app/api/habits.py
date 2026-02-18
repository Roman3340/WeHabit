from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from uuid import UUID
from datetime import date
from app.db.database import get_db
from app.core.security import get_current_user
from app.models import User, Habit, HabitParticipant, HabitLog
from app.schemas.habit import (
    Habit as HabitSchema,
    HabitCreate,
    HabitUpdate,
    HabitLog as HabitLogSchema,
    HabitLogCreate
)

router = APIRouter()


@router.get("", response_model=List[HabitSchema])
async def get_habits(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получить все привычки пользователя"""
    # Привычки, созданные пользователем или где он участник
    habits = db.query(Habit).filter(
        (Habit.created_by == current_user.id) |
        (Habit.id.in_(
            db.query(HabitParticipant.habit_id).filter(
                HabitParticipant.user_id == current_user.id
            )
        ))
    ).all()
    
    # Добавляем информацию об участниках
    result = []
    for habit in habits:
        participants = db.query(HabitParticipant).filter(
            HabitParticipant.habit_id == habit.id
        ).all()
        habit_dict = {
            "id": habit.id,
            "name": habit.name,
            "description": habit.description,
            "frequency": habit.frequency,
            "is_shared": habit.is_shared,
            "created_by": habit.created_by,
            "created_at": habit.created_at,
            "updated_at": habit.updated_at,
            "color": getattr(habit, "color", None),
            "days_of_week": getattr(habit, "days_of_week", None),
            "weekly_goal_days": getattr(habit, "weekly_goal_days", None),
            "reminder_enabled": getattr(habit, "reminder_enabled", None),
            "reminder_time": getattr(habit, "reminder_time", None),
            "participants": [
                {"id": p.user_id, "joined_at": p.joined_at} for p in participants
            ],
        }
        result.append(habit_dict)

    return result


@router.post("", response_model=HabitSchema)
async def create_habit(
    habit_data: HabitCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Создать новую привычку"""
    habit = Habit(
        name=habit_data.name,
        description=habit_data.description,
        frequency=habit_data.frequency,
        is_shared=habit_data.is_shared,
        created_by=current_user.id,
        color=getattr(habit_data, "color", None) or "gold",
        days_of_week=getattr(habit_data, "days_of_week", None),
        weekly_goal_days=getattr(habit_data, "weekly_goal_days", None),
        reminder_enabled=getattr(habit_data, "reminder_enabled", False) or False,
        reminder_time=getattr(habit_data, "reminder_time", None),
    )
    db.add(habit)
    db.commit()
    db.refresh(habit)
    
    # Добавляем создателя как участника
    participant = HabitParticipant(habit_id=habit.id, user_id=current_user.id)
    db.add(participant)
    
    # Добавляем других участников, если это совместная привычка
    if habit_data.is_shared and habit_data.participant_ids:
        for friend_id in habit_data.participant_ids:
            if friend_id != current_user.id:
                participant = HabitParticipant(habit_id=habit.id, user_id=friend_id)
                db.add(participant)
    
    db.commit()
    db.refresh(habit)
    
    return habit


@router.get("/{habit_id}", response_model=HabitSchema)
async def get_habit(
    habit_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получить детали привычки"""
    habit = db.query(Habit).filter(Habit.id == habit_id).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")

    # Проверка доступа
    if habit.created_by != current_user.id:
        participant = db.query(HabitParticipant).filter(
            HabitParticipant.habit_id == habit_id,
            HabitParticipant.user_id == current_user.id
        ).first()
        if not participant:
            raise HTTPException(status_code=403, detail="Access denied")

    # Формируем ответ с участниками в том же формате, что и в списке привычек
    participants = db.query(HabitParticipant).filter(
        HabitParticipant.habit_id == habit.id
    ).all()

    habit_dict = {
        "id": habit.id,
        "name": habit.name,
        "description": habit.description,
        "frequency": habit.frequency,
        "is_shared": habit.is_shared,
        "created_by": habit.created_by,
        "created_at": habit.created_at,
        "updated_at": habit.updated_at,
        "color": getattr(habit, "color", None),
        "days_of_week": getattr(habit, "days_of_week", None),
        "weekly_goal_days": getattr(habit, "weekly_goal_days", None),
        "reminder_enabled": getattr(habit, "reminder_enabled", None),
        "reminder_time": getattr(habit, "reminder_time", None),
        "participants": [
            {"id": p.user_id, "joined_at": p.joined_at} for p in participants
        ],
    }
    return habit_dict


@router.put("/{habit_id}", response_model=HabitSchema)
async def update_habit(
    habit_id: UUID,
    habit_data: HabitUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Обновить привычку"""
    habit = db.query(Habit).filter(Habit.id == habit_id).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    
    if habit.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Only creator can update habit")
    
    update_data = habit_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(habit, field, value)

    db.commit()
    db.refresh(habit)
    # Возвращаем в том же формате, что и get_habit
    participants = db.query(HabitParticipant).filter(HabitParticipant.habit_id == habit.id).all()
    return {
        "id": habit.id,
        "name": habit.name,
        "description": habit.description,
        "frequency": habit.frequency,
        "is_shared": habit.is_shared,
        "created_by": habit.created_by,
        "created_at": habit.created_at,
        "updated_at": habit.updated_at,
        "color": getattr(habit, "color", None),
        "days_of_week": getattr(habit, "days_of_week", None),
        "weekly_goal_days": getattr(habit, "weekly_goal_days", None),
        "reminder_enabled": getattr(habit, "reminder_enabled", None),
        "reminder_time": getattr(habit, "reminder_time", None),
        "participants": [{"id": p.user_id, "joined_at": p.joined_at} for p in participants],
    }


@router.delete("/{habit_id}")
async def delete_habit(
    habit_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Удалить привычку"""
    habit = db.query(Habit).filter(Habit.id == habit_id).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    
    if habit.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Only creator can delete habit")
    
    db.delete(habit)
    db.commit()
    return {"message": "Habit deleted"}


@router.post("/{habit_id}/complete", response_model=HabitLogSchema)
async def complete_habit(
    habit_id: UUID,
    log_data: HabitLogCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Отметить выполнение привычки"""
    habit = db.query(Habit).filter(Habit.id == habit_id).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    
    # Проверка доступа
    if habit.created_by != current_user.id:
        participant = db.query(HabitParticipant).filter(
            HabitParticipant.habit_id == habit_id,
            HabitParticipant.user_id == current_user.id
        ).first()
        if not participant:
            raise HTTPException(status_code=403, detail="Access denied")
    
    # Проверка, не выполнена ли уже сегодня
    today = date.today()
    existing_log = db.query(HabitLog).filter(
        HabitLog.habit_id == habit_id,
        HabitLog.user_id == current_user.id,
        func.date(HabitLog.completed_at) == today
    ).first()
    
    if existing_log:
        raise HTTPException(status_code=400, detail="Habit already completed today")
    
    log = HabitLog(
        habit_id=habit_id,
        user_id=current_user.id,
        notes=log_data.notes
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log

