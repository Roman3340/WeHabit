import os
import sys
import time
import asyncio
from datetime import datetime, timedelta, date
import logging
from sqlalchemy import create_engine, select, and_, func, or_
from sqlalchemy.orm import sessionmaker, joinedload, Session
from aiogram import Bot
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton

# Add the project root to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.models.user import User
from app.models.habit import Habit, HabitParticipant, HabitLog, FeedEvent
from app.models.achievement import UserAchievement
from app.core.config import settings

# New function to get achievement details
def get_achievement_details(achievement_type: str, tier: int) -> dict:
    """Returns the name and emoji for an achievement."""
    # This is a placeholder. In a real application, this would come from a config file or database.
    achievements = {
        "streak": {
            1: {"name": "Начало положено", "emoji": "🔥"},
            2: {"name": "Уже привычка", "emoji": "🔥🔥"},
            3: {"name": "Мастер постоянства", "emoji": "🔥🔥🔥"},
        },
        "habit_invites": {
            1: {"name": "Душа компании", "emoji": "🎉"},
            2: {"name": "Массовик-затейник", "emoji": "🥳"},
            3: {"name": "Лидер мнений", "emoji": "👑"},
        }
    }
    return achievements.get(achievement_type, {}).get(tier, {"name": "Новое достижение", "emoji": "🏆"})

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

DATABASE_URL = settings.DATABASE_URL
TELEGRAM_BOT_TOKEN = settings.TELEGRAM_BOT_TOKEN
MINI_APP_URL = settings.TELEGRAM_MINIAPP_LINK

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_schedule_description(habit: Habit) -> str:
    """Returns a human-readable schedule for a habit."""
    if habit.days_of_week:
        days = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]
        valid_indexes = [i for i in habit.days_of_week if 1 <= i <= 7]
        if set(valid_indexes) == {1, 2, 3, 4, 5, 6, 7}:
            return "Каждый день"
        selected_days = [days[i-1] for i in valid_indexes]
        if selected_days:
            return ", ".join(selected_days)

    if habit.weekly_goal_days:
        if habit.weekly_goal_days >= 7:
            return "Каждый день"
        return f"{habit.weekly_goal_days} из 7 дней"

    if habit.frequency == "daily":
        return "Каждый день"

    return "Нет расписания"

async def send_notification(bot: Bot, user_id: int, message: str):
    """Sends a notification to a user."""
    try:
        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="Открыть приложение", web_app={"url": settings.TELEGRAM_MINIAPP_LINK})]
        ])
        await bot.send_message(
            chat_id=user_id,
            text=message,
            parse_mode="HTML",
            reply_markup=keyboard
        )
        logging.info(f"Sent notification to user {user_id}")
        return True
    except Exception as e:
        logging.error(f"Failed to send notification to user {user_id}: {e}")
        return False

def calculate_streak(db: Session, habit_id: str, user_id: str) -> int:
    """Calculates the current streak for a habit."""
    logs = db.query(HabitLog.completed_at).filter(
        HabitLog.habit_id == habit_id,
        HabitLog.user_id == user_id
    ).order_by(HabitLog.completed_at.desc()).all()

    if not logs:
        return 0

    streak = 0
    today = datetime.utcnow().date()
    last_log_date = logs[0].completed_at.date()

    # If the last log was today or yesterday, the streak is at least 1
    if last_log_date == today or last_log_date == today - timedelta(days=1):
        streak = 1
        for i in range(len(logs) - 1):
            if (logs[i].completed_at.date() - logs[i+1].completed_at.date()).days == 1:
                streak += 1
            else:
                break
    return streak

async def check_habit_reminders(bot: Bot):
    """Checks for habit reminders and sends notifications."""
    db = SessionLocal()
    try:
        now_utc = datetime.utcnow()
        today = now_utc.date()
        current_weekday = today.isoweekday()

        reminders_query = (
            select(Habit, User, HabitParticipant)
            .join(HabitParticipant, Habit.id == HabitParticipant.habit_id)
            .join(User, HabitParticipant.user_id == User.id)
            .where(
                User.habit_reminders_enabled == True,
                HabitParticipant.reminder_enabled == True,
                HabitParticipant.reminder_time != None,
                HabitParticipant.status == 'accepted'
            )
        )
        
        potential_reminders = db.execute(reminders_query).all()

        for habit, user, participant in potential_reminders:
            reminder_time_str = participant.reminder_time
            user_time = now_utc + timedelta(hours=3) # Assuming MSK
            reminder_hour, reminder_minute = map(int, reminder_time_str.split(':'))

            if not (user_time.hour == reminder_hour and user_time.minute == reminder_minute):
                continue

            # Schedule check
            if habit.days_of_week and current_weekday not in habit.days_of_week:
                continue
            
            # Weekly goal check
            if habit.frequency == 'weekly' and habit.weekly_goal_days:
                start_of_week = today - timedelta(days=today.weekday())
                logs_this_week = db.query(HabitLog).filter(
                    HabitLog.habit_id == habit.id,
                    HabitLog.user_id == user.id,
                    HabitLog.completed_at >= start_of_week
                ).count()
                if logs_this_week >= habit.weekly_goal_days:
                    continue

            log_exists_today = db.query(HabitLog).filter(
                HabitLog.habit_id == habit.id,
                HabitLog.user_id == user.id,
                func.date(HabitLog.completed_at) == today
            ).first()
            if log_exists_today:
                continue
            
            streak = calculate_streak(db, habit.id, user.id)
            message = (
                f"🔔 Пора выполнить привычку: <b>{habit.name}</b>\n\n"
                f"💬 {habit.description or 'Нет описания'}\n"
                f"📆 {get_schedule_description(habit)}\n"
                f"🔥 Серия: {streak} дней"
            )
            await send_notification(bot, user.telegram_id, message)
    finally:
        db.close()


async def check_feed_notifications(bot: Bot):
    """Checks for new feed events and sends notifications."""
    db = SessionLocal()
    try:
        stmt = (
            select(FeedEvent)
            .options(
                joinedload(FeedEvent.user),
                joinedload(FeedEvent.actor),
                joinedload(FeedEvent.habit)
            )
            .where(FeedEvent.notification_sent == False)
        )
        
        events_to_notify = db.execute(stmt).scalars().all()
        
        for event in events_to_notify:
            event.notification_sent = True

            if not event.actor or not event.user or event.actor_id == event.user_id:
                continue
            
            if not event.user.feed_notifications_enabled:
                continue

            actor_name = event.actor.first_name or event.actor.username
            habit_name = f" «{event.habit.name}»" if event.habit else ""
            habit_desc = f"💬 {event.habit.description}" if event.habit and event.habit.description else ""
            habit_schedule = f"📆 {get_schedule_description(event.habit)}" if event.habit else ""
            
            message = ""
            if event.event_type == "completed":
                message = (
                    f"🎉 {actor_name} выполнил(а) привычку<b>{habit_name}</b>!\n\n"
                    f"{habit_desc}\n"
                    f"{habit_schedule}"
                ).strip()
            elif event.event_type == "joined":
                message = (
                    f"👋 {actor_name} присоединился(лась) к вашей привычке<b>{habit_name}</b>\n\n"
                    f"{habit_desc}\n"
                    f"{habit_schedule}"
                ).strip()
            elif event.event_type == "left":
                 message = (
                    f"🚫 {actor_name} вышел(ла) из вашей привычки<b>{habit_name}</b>\n\n"
                    f"{habit_desc}\n"
                    f"{habit_schedule}"
                ).strip()
            elif event.event_type == "declined":
                 message = (
                    f"❌ {actor_name} отказался(лась) участвовать в вашей привычке<b>{habit_name}</b>\n\n"
                    f"{habit_desc}\n"
                    f"{habit_schedule}"
                ).strip()
            elif event.event_type == "invited":
                message = (
                    f"👋 {actor_name} пригласил вас выполнять привычку<b>{habit_name}</b> вместе с ним!\n\n"
                    f"{habit_desc}\n"
                    f"{habit_schedule}"
                ).strip()
            elif event.event_type == "removed":
                message = (
                    f"🚫 {actor_name} удалил вас из привычки<b>{habit_name}</b>.\n\n"
                    f"{habit_desc}\n"
                    f"{habit_schedule}"
                ).strip()
            elif event.event_type == "achievement":
                user_achievement = db.query(UserAchievement).filter(
                    UserAchievement.user_id == event.actor_id,
                    UserAchievement.created_at >= event.created_at - timedelta(seconds=10)
                ).order_by(UserAchievement.created_at.desc()).first()

                if user_achievement:
                    details = get_achievement_details(user_achievement.type, user_achievement.tier)
                    tier_emoji = {1: "🥉", 2: "🏅", 3: "💎"}.get(user_achievement.tier, "")
                    message = f"🏆 {actor_name} получил(а) новое достижение: <b>{details['name']}</b> {tier_emoji}"

            if message:
                await send_notification(bot, event.user.telegram_id, message)
        
        db.commit()
    finally:
        db.close()


async def main():
    """Main worker function."""
    if not TELEGRAM_BOT_TOKEN:
        logging.error("TELEGRAM_BOT_TOKEN is not set. Exiting.")
        return

    bot = Bot(token=TELEGRAM_BOT_TOKEN)
    
    logging.info("Notification worker started.")
    
    while True:
        try:
            await check_habit_reminders(bot)
            await check_feed_notifications(bot)
        except Exception as e:
            logging.error(f"An error occurred in the main loop: {e}")
        
        await asyncio.sleep(60) # Check every minute

if __name__ == "__main__":
    asyncio.run(main())
