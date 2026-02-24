import os
import sys
import time
import asyncio
from datetime import datetime, timedelta
import logging
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from aiogram import Bot
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton

# Add the project root to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.models.user import User
from app.models.habit import Habit, HabitParticipant, FeedEvent
from app.core.config import settings

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

DATABASE_URL = settings.DATABASE_URL
TELEGRAM_BOT_TOKEN = settings.TELEGRAM_BOT_TOKEN
MINI_APP_URL = settings.TELEGRAM_MINIAPP_DEEPLINK

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

async def send_notification(bot: Bot, user_id: int, message: str):
    """Sends a notification to a user."""
    try:
        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="Открыть приложение", web_app={"url": settings.TELEGRAM_MINIAPP_DEEPLINK})]
        ])
        await bot.send_message(
            chat_id=user_id,
            text=message,
            parse_mode="HTML",
            reply_markup=keyboard
        )
        logging.info(f"Sent notification to user {user_id}")
    except Exception as e:
        logging.error(f"Failed to send notification to user {user_id}: {e}")

async def check_habit_reminders(bot: Bot):
    """Checks for habit reminders and sends notifications."""
    db = SessionLocal()
    try:
        now_utc = datetime.utcnow()
        now_msk = now_utc + timedelta(hours=3)
        
        # Find habits that need reminders
        stmt = (
            select(Habit, User)
            .join(User, Habit.created_by == User.id)
            .where(
                Habit.reminder_enabled == True,
                Habit.reminder_time != None,
                User.habit_reminders_enabled == True
            )
        )
        
        habits_to_remind = db.execute(stmt).all()
        
        for habit, user in habits_to_remind:
            reminder_time_parts = list(map(int, habit.reminder_time.split(':')))
            
            if now_msk.hour == reminder_time_parts[0] and now_msk.minute == reminder_time_parts[1]:
                message = f"🔔 Пора выполнить привычку: <b>{habit.name}</b>"
                await send_notification(bot, user.telegram_id, message)

        # Check for participants
        stmt_participants = (
            select(Habit, HabitParticipant, User)
            .join(HabitParticipant, Habit.id == HabitParticipant.habit_id)
            .join(User, HabitParticipant.user_id == User.id)
            .where(
                HabitParticipant.reminder_enabled == True,
                HabitParticipant.reminder_time != None,
                User.habit_reminders_enabled == True,
                HabitParticipant.status == 'accepted'
            )
        )

        participants_to_remind = db.execute(stmt_participants).all()

        for habit, participant, user in participants_to_remind:
            reminder_time_parts = list(map(int, participant.reminder_time.split(':')))
            if now_msk.hour == reminder_time_parts[0] and now_msk.minute == reminder_time_parts[1]:
                message = f"🔔 Пора выполнить привычку: <b>{habit.name}</b>"
                await send_notification(bot, user.telegram_id, message)

    finally:
        db.close()

async def check_feed_notifications(bot: Bot):
    """Checks for new feed events and sends notifications."""
    db = SessionLocal()
    try:
        # Get events from the last minute
        one_minute_ago = datetime.utcnow() - timedelta(minutes=1)
        
        stmt = (
            select(FeedEvent, User, User.telegram_id.label("recipient_telegram_id"))
            .join(User, FeedEvent.user_id == User.id)
            .where(
                FeedEvent.created_at >= one_minute_ago,
                User.feed_notifications_enabled == True
            )
        )
        
        events_to_notify = db.execute(stmt).all()
        
        for event, recipient, recipient_telegram_id in events_to_notify:
            if event.actor_id == recipient.id:
                continue

            actor = db.query(User).filter(User.id == event.actor_id).first()
            habit = db.query(Habit).filter(Habit.id == event.habit_id).first()
            
            if not actor:
                continue

            actor_name = actor.first_name or actor.username
            habit_name = f" «{habit.name}»" if habit else ""
            
            message = ""
            if event.event_type == "completed":
                message = f"🎉 {actor_name} выполнил(а) привычку{habit_name}!"
            elif event.event_type == "joined":
                message = f"👋 {actor_name} присоединился(лась) к вашей привычке{habit_name}."
            elif event.event_type == "achievement":
                message = f"🏆 {actor_name} получил(а) новое достижение!"
            
            if message:
                await send_notification(bot, recipient_telegram_id, message)

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
