import os
import sys
import time
import asyncio
from datetime import datetime, timedelta, date
import logging
from sqlalchemy import create_engine, select, and_
from sqlalchemy.orm import sessionmaker, joinedload
from aiogram import Bot
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton

# Add the project root to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.models.user import User
from app.models.habit import Habit, HabitParticipant, HabitLog, FeedEvent
from app.models.achievement import UserAchievement
from app.core.config import settings
from app.api.achievements import get_achievement_details

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

DATABASE_URL = settings.DATABASE_URL
TELEGRAM_BOT_TOKEN = settings.TELEGRAM_BOT_TOKEN
MINI_APP_URL = settings.TELEGRAM_MINIAPP_LINK

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_schedule_description(habit: Habit) -> str:
    """Returns a human-readable schedule for a habit."""
    if habit.frequency == 'daily':
        return "Каждый день"
    elif habit.frequency == 'weekly':
        return f"{habit.weekly_goal_days} раз(а) в неделю"
    elif habit.frequency == 'custom' and habit.days_of_week:
        days = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]
        selected_days = [days[i-1] for i in habit.days_of_week]
        return ", ".join(selected_days)
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

async def check_habit_reminders(bot: Bot):
    """Checks for habit reminders and sends notifications."""
    db = SessionLocal()
    try:
        now_utc = datetime.utcnow()
        today = now_utc.date()

        # Base query for reminders
        base_stmt = (
            select(Habit, User)
            .where(
                User.habit_reminders_enabled == True
            )
        )

        # Reminders for habit creators
        creator_stmt = base_stmt.join(User, Habit.created_by == User.id).where(
            Habit.reminder_enabled == True,
            Habit.reminder_time != None
        )
        habits_to_remind = db.execute(creator_stmt).all()

        # Reminders for habit participants
        participant_stmt = base_stmt.join(HabitParticipant, Habit.id == HabitParticipant.habit_id).join(User, HabitParticipant.user_id == User.id).where(
            HabitParticipant.reminder_enabled == True,
            HabitParticipant.reminder_time != None,
            HabitParticipant.status == 'accepted'
        )
        participants_to_remind = db.execute(participant_stmt.add_columns(HabitParticipant)).all()

        all_reminders = []
        for habit, user in habits_to_remind:
            all_reminders.append((habit, user, habit.reminder_time))
        for habit, user, participant in participants_to_remind:
            all_reminders.append((habit, user, participant.reminder_time))

        for habit, user, reminder_time_str in all_reminders:
            # Naive timezone handling: assuming reminder_time is in user's local time,
            # and we are checking against server's UTC time + 3 hours (MSK).
            # A more robust solution would store user's timezone.
            user_time = now_utc + timedelta(hours=3) # Assuming MSK
            reminder_hour, reminder_minute = map(int, reminder_time_str.split(':'))

            if user_time.hour == reminder_hour and user_time.minute == reminder_minute:
                # Check if the habit was already completed today
                log_exists = db.query(HabitLog).filter(
                    HabitLog.habit_id == habit.id,
                    HabitLog.user_id == user.id,
                    func.date(HabitLog.completed_at) == today
                ).first()

                if not log_exists:
                    # Calculate current streak
                    # This is a simplified streak calculation. A real one would be more complex.
                    logs = db.query(HabitLog).filter(
                        HabitLog.habit_id == habit.id,
                        HabitLog.user_id == user.id
                    ).order_by(HabitLog.completed_at.desc()).all()
                    
                    streak = 0
                    if logs:
                        # Simple streak: count consecutive days from today backwards
                        last_log_date = logs[0].completed_at.date()
                        if last_log_date == today or last_log_date == today - timedelta(days=1):
                           streak = 1
                           for i in range(len(logs) - 1):
                               if (logs[i].completed_at.date() - logs[i+1].completed_at.date()).days == 1:
                                   streak += 1
                               else:
                                   break

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
            .join(User, FeedEvent.user_id == User.id)
            .where(
                FeedEvent.notification_sent == False,
                User.feed_notifications_enabled == True
            )
        )
        
        events_to_notify = db.execute(stmt).scalars().all()
        
        for event in events_to_notify:
            if not event.actor or not event.user or event.actor_id == event.user_id:
                event.notification_sent = True
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
                    f"{actor_name} пригласил вас выполнять привычку<b>{habit_name}</b> вместе с ним!\n\n"
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
                if await send_notification(bot, event.user.telegram_id, message):
                    event.notification_sent = True
            else:
                # Mark as sent even if no message was generated to avoid reprocessing
                event.notification_sent = True
        
        db.commit()

    except Exception as e:
        logging.error(f"Error in check_feed_notifications: {e}")
        db.rollback()
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
