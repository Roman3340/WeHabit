from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from uuid import UUID
from datetime import date, timedelta
from app.db.database import get_db
from app.core.security import get_current_user
from app.models import User, Habit, HabitLog, HabitParticipant
from typing import Dict, Any

router = APIRouter()


@router.get("/habits/{habit_id}")
async def get_habit_stats(
    habit_id: UUID,
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получить статистику по привычке"""
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
    
    # Статистика за период
    start_date = date.today() - timedelta(days=days)
    
    # Общее количество выполнений
    total_completions = db.query(func.count(HabitLog.id)).filter(
        HabitLog.habit_id == habit_id,
        HabitLog.user_id == current_user.id,
        func.date(HabitLog.completed_at) >= start_date
    ).scalar()
    
    # Выполнения по дням
    daily_completions = db.query(
        func.date(HabitLog.completed_at).label("date"),
        func.count(HabitLog.id).label("count")
    ).filter(
        HabitLog.habit_id == habit_id,
        HabitLog.user_id == current_user.id,
        func.date(HabitLog.completed_at) >= start_date
    ).group_by(func.date(HabitLog.completed_at)).all()
    
    # Текущая серия (дней подряд)
    current_streak = 0
    check_date = date.today()
    while True:
        log = db.query(HabitLog).filter(
            HabitLog.habit_id == habit_id,
            HabitLog.user_id == current_user.id,
            func.date(HabitLog.completed_at) == check_date
        ).first()
        
        if log:
            current_streak += 1
            check_date -= timedelta(days=1)
        else:
            break

    # Сверх нормы: выполнение в день, не входящий в расписание (или сверх цели по неделе)
    above_norm_count = 0
    days_of_week = getattr(habit, "days_of_week", None)
    weekly_goal_days = getattr(habit, "weekly_goal_days", None)

    if days_of_week and len(days_of_week) > 0:
        for dc in daily_completions:
            d = dc.date
            weekday_iso = d.weekday() + 1  # Python: 0=Mon -> 1, 6=Sun -> 7
            if weekday_iso not in days_of_week:
                above_norm_count += dc.count
    elif weekly_goal_days is not None and weekly_goal_days > 0:
        week_start = start_date - timedelta(days=start_date.weekday())
        week_completions = {}
        for dc in daily_completions:
            d = dc.date
            wstart = d - timedelta(days=d.weekday())
            key = str(wstart)
            week_completions[key] = week_completions.get(key, 0) + dc.count
        for count in week_completions.values():
            above_norm_count += max(0, count - weekly_goal_days)

    return {
        "habit_id": habit_id,
        "total_completions": total_completions or 0,
        "current_streak": current_streak,
        "above_norm_count": above_norm_count,
        "daily_completions": [
            {"date": str(dc.date), "count": dc.count} for dc in daily_completions
        ],
        "period_days": days
    }

