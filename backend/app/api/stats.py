from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from uuid import UUID
from datetime import date, timedelta
from app.db.database import get_db
from app.core.security import get_current_user
from app.models import User, Habit, HabitLog, HabitParticipant
from typing import Dict, Any, Optional

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
            HabitParticipant.user_id == current_user.id,
            HabitParticipant.status == "accepted",
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
    
    # Максимальная серия дней подряд
    # Для одиночных привычек считаем по пользователю, для совместных — по общим дням всех участников
    completion_dates = sorted([dc.date for dc in daily_completions])
    user_max_streak = 0
    if completion_dates:
        current_streak = 1
        user_max_streak = 1
        for i in range(1, len(completion_dates)):
            days_diff = (completion_dates[i] - completion_dates[i - 1]).days
            if days_diff == 1:
                current_streak += 1
                user_max_streak = max(user_max_streak, current_streak)
            else:
                current_streak = 1

    accepted_participants = db.query(HabitParticipant).filter(
        HabitParticipant.habit_id == habit_id,
        HabitParticipant.status == "accepted",
    ).all()

    joint_max_streak = user_max_streak
    participant_completions = []

    if accepted_participants:
        participant_ids = [p.user_id for p in accepted_participants]
        participants_by_user = {p.user_id: p for p in accepted_participants}

        rows = db.query(
            func.date(HabitLog.completed_at).label("date"),
            HabitLog.user_id,
        ).filter(
            HabitLog.habit_id == habit_id,
            HabitLog.user_id.in_(participant_ids),
            func.date(HabitLog.completed_at) >= start_date,
        ).all()

        for row in rows:
            d = row.date
            uid = row.user_id
            participant = participants_by_user.get(uid)
            participant_completions.append(
                {
                    "date": str(d),
                    "user_id": uid,
                    "color": getattr(participant, "color", None) if participant else None,
                }
            )

        if len(participant_ids) > 1:
            common_dates = None
            for uid in participant_ids:
                user_rows = [
                    r.date
                    for r in rows
                    if r.user_id == uid
                ]
                date_set = set(user_rows)
                if common_dates is None:
                    common_dates = date_set
                else:
                    common_dates &= date_set
            if common_dates:
                ordered = sorted(common_dates)
                cur = 1
                joint_max_streak = 1
                for i in range(1, len(ordered)):
                    if (ordered[i] - ordered[i - 1]).days == 1:
                        cur += 1
                        if cur > joint_max_streak:
                            joint_max_streak = cur
                    else:
                        cur = 1

    current_streak = joint_max_streak

    # Сверх нормы: выполнение в день, не входящий в расписание (или сверх цели по неделе)
    # Единая нумерация: 1=Пн, 2=Вт, ..., 7=Вс (как во фронте)
    above_norm_count = 0
    raw_days = getattr(habit, "days_of_week", None) or []
    days_of_week = set(int(x) for x in raw_days if x is not None)
    days_of_week = {d for d in days_of_week if 1 <= d <= 7}
    weekly_goal_days = getattr(habit, "weekly_goal_days", None)

    if len(days_of_week) > 0:
        # Режим "конкретные дни": сверх нормы = выполнение в день не из списка (1=Пн .. 7=Вс)
        for dc in daily_completions:
            d = dc.date
            weekday_iso = d.weekday() + 1  # Python date.weekday(): 0=Mon, 6=Sun -> 1..7
            if weekday_iso not in days_of_week:
                above_norm_count += dc.count
    elif weekly_goal_days is not None and weekly_goal_days > 0:
        # Режим "N из 7": на каждой неделе считаем лишние выполнения сверх N
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
        "participant_completions": participant_completions,
        "period_days": days
    }


@router.get("/yearly")
async def get_yearly_report(
    year: int,
    habit_id: Optional[UUID] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Годовой отчёт по привычкам пользователя.

    Возвращает список доступных лет и даты выполнений выбранной привычки за указанный год.
    """
    year_int = int(year)

    # Все года, в которых у пользователя есть выполнения любых привычек
    year_rows = (
        db.query(func.extract("year", HabitLog.completed_at).label("y"))
        .filter(HabitLog.user_id == current_user.id)
        .group_by("y")
        .order_by("y")
        .all()
    )
    years = [int(row.y) for row in year_rows]

    completed_dates: list[str] = []

    if habit_id is not None:
        habit = db.query(Habit).filter(Habit.id == habit_id).first()
        if not habit:
            raise HTTPException(status_code=404, detail="Habit not found")

        # Проверка доступа
        if habit.created_by != current_user.id:
            participant = db.query(HabitParticipant).filter(
                HabitParticipant.habit_id == habit_id,
                HabitParticipant.user_id == current_user.id,
                HabitParticipant.status == "accepted",
            ).first()
            if not participant:
                raise HTTPException(status_code=403, detail="Access denied")

        rows = (
            db.query(func.date(HabitLog.completed_at).label("d"))
            .filter(
                HabitLog.habit_id == habit_id,
                HabitLog.user_id == current_user.id,
                func.extract("year", HabitLog.completed_at) == year_int,
            )
            .order_by("d")
            .all()
        )
        completed_dates = [str(r.d) for r in rows]

    return {
        "years": years,
        "completed_dates": completed_dates,
    }
