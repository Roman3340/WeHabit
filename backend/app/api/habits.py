from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from uuid import UUID
from datetime import date, timedelta, datetime, time, timezone
from app.db.database import get_db
from app.core.security import get_current_user
from app.models import User, Habit, HabitParticipant, HabitLog, FeedEvent
from app.schemas.habit import (
    Habit as HabitSchema,
    HabitCreate,
    HabitUpdate,
    HabitLog as HabitLogSchema,
    HabitLogCreate,
)

router = APIRouter()

ALL_COLORS = ["gray", "silver", "gold", "emerald", "sapphire", "ruby"]


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
    
    # Текущая неделя (пн–вс) для отображения выполнений
    today = date.today()
    week_start = today - timedelta(days=today.weekday())  # понедельник
    week_end = week_start + timedelta(days=6)

    result = []
    for habit in habits:
        participants = db.query(HabitParticipant).filter(
            HabitParticipant.habit_id == habit.id
        ).all()
        # users cache by id
        users_by_id = {}
        for p in participants:
            if p.user_id not in users_by_id:
                users_by_id[p.user_id] = db.query(User).filter(User.id == p.user_id).first()
        week_logs = db.query(func.date(HabitLog.completed_at)).filter(
            HabitLog.habit_id == habit.id,
            HabitLog.user_id == current_user.id,
            func.date(HabitLog.completed_at) >= week_start,
            func.date(HabitLog.completed_at) <= week_end,
        ).distinct().all()
        current_week_completions = [str(d[0]) for d in week_logs]

        participants_by_user = {p.user_id: p for p in participants}
        accepted_participant_ids = [
            p.user_id for p in participants if getattr(p, "status", "accepted") == "accepted"
        ]

        weekly_participant_completions = {}
        if accepted_participant_ids:
            week_logs_all = db.query(
                func.date(HabitLog.completed_at).label("date"),
                HabitLog.user_id,
            ).filter(
                HabitLog.habit_id == habit.id,
                HabitLog.user_id.in_(accepted_participant_ids),
                func.date(HabitLog.completed_at) >= week_start,
                func.date(HabitLog.completed_at) <= week_end,
            ).all()

            for row in week_logs_all:
                day = str(row[0])
                uid = row[1]
                participant = participants_by_user.get(uid)
                color = getattr(participant, "color", None) if participant else None
                if day not in weekly_participant_completions:
                    weekly_participant_completions[day] = []
                weekly_participant_completions[day].append(
                    {"user_id": uid, "color": color}
                )

        max_streak = 0
        if accepted_participant_ids:
            common_dates = None
            for uid in accepted_participant_ids:
                rows = db.query(func.date(HabitLog.completed_at)).filter(
                    HabitLog.habit_id == habit.id,
                    HabitLog.user_id == uid,
                ).group_by(func.date(HabitLog.completed_at)).order_by(func.date(HabitLog.completed_at)).all()
                dates = [row[0] for row in rows]
                date_set = set(dates)
                if common_dates is None:
                    common_dates = date_set
                else:
                    common_dates &= date_set
            if common_dates:
                ordered = sorted(common_dates)
                cur = 1
                max_streak = 1
                for i in range(1, len(ordered)):
                    if (ordered[i] - ordered[i - 1]).days == 1:
                        cur += 1
                        if cur > max_streak:
                            max_streak = cur
                    else:
                        cur = 1

        has_pending_invites = False
        is_invited = False
        for p in participants:
            if p.user_id == current_user.id and getattr(p, "status", "accepted") == "pending":
                is_invited = True
            if habit.created_by == current_user.id and p.user_id != current_user.id and getattr(p, "status", "accepted") == "pending":
                has_pending_invites = True

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
                {
                    "id": p.user_id,
                    "joined_at": p.joined_at,
                    "status": getattr(p, "status", "accepted"),
                    "color": getattr(p, "color", None),
                    "user": (lambda u: {
                        "id": u.id,
                        "username": u.username,
                        "first_name": u.first_name,
                        "last_name": u.last_name,
                        "avatar_emoji": u.avatar_emoji,
                        "bio": u.bio,
                    } if u else None)(users_by_id.get(p.user_id)),
                }
                for p in participants
            ],
            "current_week_completions": current_week_completions,
            "current_streak": max_streak,
            "has_pending_invites": has_pending_invites,
            "is_invited": is_invited,
            "can_edit": habit.created_by == current_user.id,
            "weekly_participant_completions": weekly_participant_completions,
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

    participant = HabitParticipant(
        habit_id=habit.id,
        user_id=current_user.id,
        status="accepted",
        color=habit.color,
    )
    db.add(participant)

    if habit_data.is_shared and habit_data.participant_ids:
        unique_ids = {pid for pid in habit_data.participant_ids if pid != current_user.id}
        if len(unique_ids) + 1 > 6:
            raise HTTPException(status_code=400, detail="Maximum 6 participants per habit (owner + friends)")
        for friend_id in unique_ids:
            participant = HabitParticipant(
                habit_id=habit.id,
                user_id=friend_id,
                status="pending",
            )
            db.add(participant)

    db.commit()
    db.refresh(habit)

    return await get_habit(habit.id, current_user, db)


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

    participants = db.query(HabitParticipant).filter(
        HabitParticipant.habit_id == habit.id
    ).all()
    users_by_id = {}
    for p in participants:
        if p.user_id not in users_by_id:
            users_by_id[p.user_id] = db.query(User).filter(User.id == p.user_id).first()

    has_pending_invites = False
    is_invited = False
    for p in participants:
        if p.user_id == current_user.id and getattr(p, "status", "accepted") == "pending":
            is_invited = True
        if habit.created_by == current_user.id and p.user_id != current_user.id and getattr(p, "status", "accepted") == "pending":
            has_pending_invites = True

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
            {
                "id": p.user_id,
                "joined_at": p.joined_at,
                "status": getattr(p, "status", "accepted"),
                "color": getattr(p, "color", None),
                "user": (lambda u: {
                    "id": u.id,
                    "username": u.username,
                    "first_name": u.first_name,
                    "last_name": u.last_name,
                    "avatar_emoji": u.avatar_emoji,
                    "bio": u.bio,
                } if u else None)(users_by_id.get(p.user_id)),
            }
            for p in participants
        ],
        "has_pending_invites": has_pending_invites,
        "is_invited": is_invited,
        "can_edit": habit.created_by == current_user.id,
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

    old_color = getattr(habit, "color", None)
    update_data = habit_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(habit, field, value)

    db.commit()
    db.refresh(habit)

    new_color = getattr(habit, "color", None)
    if "color" in update_data and new_color and new_color != old_color:
        db.query(HabitParticipant).filter(
            HabitParticipant.habit_id == habit_id,
            HabitParticipant.user_id == current_user.id,
        ).update({"color": new_color})
        db.commit()

    return await get_habit(habit_id, current_user, db)


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
        raise HTTPException(status_code=403, detail="Удалять привычку может только её создатель")
    
    db.delete(habit)
    db.commit()
    return {"message": "Habit deleted"}


@router.post("/{habit_id}/invitation/accept", response_model=HabitSchema)
async def accept_invitation(
    habit_id: UUID,
    payload: dict = Body(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    habit = db.query(Habit).filter(Habit.id == habit_id).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")

    participant = db.query(HabitParticipant).filter(
        HabitParticipant.habit_id == habit_id,
        HabitParticipant.user_id == current_user.id,
    ).first()
    if not participant or getattr(participant, "status", "accepted") != "pending":
        raise HTTPException(status_code=400, detail="No pending invitation for this habit")

    accepted_count = db.query(func.count(HabitParticipant.id)).filter(
        HabitParticipant.habit_id == habit_id,
        HabitParticipant.status == "accepted",
    ).scalar()
    if accepted_count >= 6:
        raise HTTPException(status_code=400, detail="Maximum participants reached for this habit")

    requested_color = None
    if payload and isinstance(payload, dict):
        value = payload.get("color")
        if isinstance(value, str):
            requested_color = value

    accepted_participants = db.query(HabitParticipant).filter(
        HabitParticipant.habit_id == habit_id,
        HabitParticipant.status == "accepted",
    ).all()
    used_colors = {p.color for p in accepted_participants if p.color}

    color = requested_color
    if color is None or color not in ALL_COLORS or color in used_colors:
        available_colors = [c for c in ALL_COLORS if c not in used_colors]
        if not available_colors:
            raise HTTPException(status_code=400, detail="No available colors for this habit")
        color = available_colors[0]

    participant.status = "accepted"
    participant.color = color
    db.commit()
    # feed: joined -> for creator
    db.add(FeedEvent(
        user_id=habit.created_by,
        actor_id=current_user.id,
        habit_id=habit_id,
        event_type="joined",
    ))
    db.commit()

    return await get_habit(habit_id, current_user, db)


@router.post("/{habit_id}/invitation/decline")
async def decline_invitation(
    habit_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    habit = db.query(Habit).filter(Habit.id == habit_id).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")

    participant = db.query(HabitParticipant).filter(
        HabitParticipant.habit_id == habit_id,
        HabitParticipant.user_id == current_user.id,
    ).first()
    if not participant or getattr(participant, "status", "accepted") != "pending":
        raise HTTPException(status_code=400, detail="No pending invitation for this habit")

    db.delete(participant)
    db.commit()
    # feed: declined -> for creator
    db.add(FeedEvent(
        user_id=habit.created_by,
        actor_id=current_user.id,
        habit_id=habit_id,
        event_type="declined",
    ))
    db.commit()
    return {"message": "Invitation declined"}


@router.post("/{habit_id}/complete", response_model=HabitLogSchema)
async def complete_habit(
    habit_id: UUID,
    log_data: HabitLogCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Отметить выполнение привычки (за сегодня или за указанную дату)."""
    habit = db.query(Habit).filter(Habit.id == habit_id).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")

    if habit.created_by != current_user.id:
        participant = db.query(HabitParticipant).filter(
            HabitParticipant.habit_id == habit_id,
            HabitParticipant.user_id == current_user.id,
            HabitParticipant.status == "accepted",
        ).first()
        if not participant:
            raise HTTPException(status_code=403, detail="Access denied")

    target_date = date.today()
    if getattr(log_data, "date", None):
        try:
            target_date = datetime.strptime(log_data.date, "%Y-%m-%d").date()
        except (ValueError, TypeError):
            raise HTTPException(status_code=400, detail="Invalid date format (use YYYY-MM-DD)")

    existing_log = db.query(HabitLog).filter(
        HabitLog.habit_id == habit_id,
        HabitLog.user_id == current_user.id,
        func.date(HabitLog.completed_at) == target_date
    ).first()

    if existing_log:
        raise HTTPException(status_code=400, detail="Habit already completed for this date")

    completed_at = datetime.combine(target_date, time(12, 0), tzinfo=timezone.utc)
    log = HabitLog(
        habit_id=habit_id,
        user_id=current_user.id,
        notes=log_data.notes,
        completed_at=completed_at,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    # feed: completed -> for other accepted participants and creator (except actor)
    if habit.is_shared:
        accepted = db.query(HabitParticipant).filter(
            HabitParticipant.habit_id == habit_id,
            HabitParticipant.status == "accepted",
        ).all()
        for p in accepted:
            if p.user_id == current_user.id:
                continue
            db.add(FeedEvent(
                user_id=p.user_id,
                actor_id=current_user.id,
                habit_id=habit_id,
                event_type="completed",
            ))
        if habit.created_by != current_user.id:
            db.add(FeedEvent(
                user_id=habit.created_by,
                actor_id=current_user.id,
                habit_id=habit_id,
                event_type="completed",
            ))
        db.commit()
    return log


@router.post("/{habit_id}/invite")
async def invite_participants(
    habit_id: UUID,
    payload: dict = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Пригласить дополнительных друзей в привычку (создатель)."""
    habit = db.query(Habit).filter(Habit.id == habit_id).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    if habit.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Only creator can invite participants")
    user_ids = payload.get("user_ids") if isinstance(payload, dict) else None
    if not isinstance(user_ids, list):
        raise HTTPException(status_code=400, detail="user_ids must be a list")
    user_ids = [uid for uid in user_ids if uid and uid != str(current_user.id)]

    existing = db.query(HabitParticipant).filter(HabitParticipant.habit_id == habit_id).all()
    existing_ids = {str(p.user_id) for p in existing}
    to_add = [uid for uid in user_ids if uid not in existing_ids]

    if len(existing_ids) + len(to_add) > 6:
        raise HTTPException(status_code=400, detail="Maximum 6 participants per habit (owner + friends)")

    for uid in to_add:
        db.add(HabitParticipant(
            habit_id=habit_id,
            user_id=uid,
            status="pending",
        ))
        db.add(FeedEvent(
            user_id=uid,
            actor_id=current_user.id,
            habit_id=habit_id,
            event_type="invited",
        ))
    db.commit()
    return await get_habit(habit_id, current_user, db)


@router.delete("/{habit_id}/participants/{user_id}")
async def remove_participant(
    habit_id: UUID,
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Удалить участника из привычки (создатель). Удаляет также его отметки для этой привычки."""
    habit = db.query(Habit).filter(Habit.id == habit_id).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    if habit.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Only creator can remove participants")

    participant = db.query(HabitParticipant).filter(
        HabitParticipant.habit_id == habit_id,
        HabitParticipant.user_id == user_id,
    ).first()
    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")

    db.query(HabitLog).filter(
        HabitLog.habit_id == habit_id,
        HabitLog.user_id == user_id,
    ).delete()
    db.delete(participant)
    db.commit()
    return await get_habit(habit_id, current_user, db)


@router.post("/{habit_id}/leave")
async def leave_habit(
    habit_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Участник выходит из привычки. Все его отметки по этой привычке удаляются."""
    habit = db.query(Habit).filter(Habit.id == habit_id).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    # создатель не может выйти таким образом
    if habit.created_by == current_user.id:
        raise HTTPException(status_code=400, detail="Creator cannot leave own habit")

    participant = db.query(HabitParticipant).filter(
        HabitParticipant.habit_id == habit_id,
        HabitParticipant.user_id == current_user.id,
        HabitParticipant.status == "accepted",
    ).first()
    if not participant:
        raise HTTPException(status_code=404, detail="You are not a participant of this habit")

    db.query(HabitLog).filter(
        HabitLog.habit_id == habit_id,
        HabitLog.user_id == current_user.id,
    ).delete()
    db.delete(participant)
    db.commit()
    # feed: left -> for creator
    db.add(FeedEvent(
        user_id=habit.created_by,
        actor_id=current_user.id,
        habit_id=habit_id,
        event_type="left",
    ))
    db.commit()
    return {"message": "Left the habit"}


@router.delete("/{habit_id}/logs/{log_date}")
async def remove_habit_log(
    habit_id: UUID,
    log_date: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Убрать отметку о выполнении за указанную дату (YYYY-MM-DD)."""
    habit = db.query(Habit).filter(Habit.id == habit_id).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")

    if habit.created_by != current_user.id:
        participant = db.query(HabitParticipant).filter(
            HabitParticipant.habit_id == habit_id,
            HabitParticipant.user_id == current_user.id,
            HabitParticipant.status == "accepted",
        ).first()
        if not participant:
            raise HTTPException(status_code=403, detail="Access denied")

    try:
        target_date = datetime.strptime(log_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format (use YYYY-MM-DD)")

    log = db.query(HabitLog).filter(
        HabitLog.habit_id == habit_id,
        HabitLog.user_id == current_user.id,
        func.date(HabitLog.completed_at) == target_date
    ).first()

    if not log:
        raise HTTPException(status_code=404, detail="No completion for this date")

    db.delete(log)
    db.commit()
    return {"message": "Completion removed"}

