from typing import Optional

from aiogram import Bot, Dispatcher, F, Router
from aiogram.enums import ParseMode
from aiogram.filters import CommandStart
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, Message, WebAppInfo
from aiogram.utils.keyboard import InlineKeyboardBuilder
from aiogram import BaseMiddleware
from aiogram.types import TelegramObject

from app.core.config import settings
from app.db.database import SessionLocal
from app.models import User


def build_webapp_url(ref_code: Optional[str] = None) -> str:
    """
    URL, который открывает Telegram Mini App.
    settings.TELEGRAM_MINIAPP_DEEPLINK: https://t.me/<bot_username>/<app_shortname>
    Для передачи payload добавляем ?startapp=<ref_code>
    """
    base = settings.TELEGRAM_MINIAPP_DEEPLINK.strip()
    if not base:
        return f"https://t.me/{settings.TELEGRAM_BOT_USERNAME or 'your_bot'}/your_app"

    if ref_code:
        sep = "&" if "?" in base else "?"
        return f"{base}{sep}startapp={ref_code}"
    return base


router = Router()


@router.message(CommandStart())
async def cmd_start(message: Message) -> None:
  args = message.text.split(maxsplit=1)
  ref_code = None
  if len(args) == 2:
      ref_code = args[1].strip()

  inviter_username = None
  if ref_code:
      with SessionLocal() as db:
          inviter = db.query(User).filter(User.referral_code == ref_code).first()
          if inviter:
              inviter_username = inviter.username or inviter.first_name

  if ref_code and inviter_username:
      text = (
          f"Привет! Тебя пригласил друг {inviter_username}.\n\n"
          "Нажми кнопку ниже, чтобы открыть приложение и принять приглашение."
      )
      kb = InlineKeyboardBuilder()
      kb.row(
          InlineKeyboardButton(
              text="Принять приглашение 🎯",
              web_app=WebAppInfo(url=build_webapp_url(ref_code)),
          )
      )
      await message.answer(text, reply_markup=kb.as_markup())
      return

  # Базовый /start без реф-кода
  text = (
      "Это Habit Tracker — премиальный трекер привычек в Telegram Mini App.\n\n"
      "Создавай привычки, отмечай выполнение и следи за сериями. "
      "Добавляй друзей и выполняй совместные привычки."
  )
  kb = InlineKeyboardBuilder()
  kb.row(
      InlineKeyboardButton(
          text="Открыть приложение",
          web_app=WebAppInfo(url=build_webapp_url(None)),
      )
  )
  await message.answer(text, reply_markup=kb.as_markup())


async def main() -> None:
    if not settings.TELEGRAM_BOT_TOKEN:
        raise RuntimeError("TELEGRAM_BOT_TOKEN is not configured")

    bot = Bot(token=settings.TELEGRAM_BOT_TOKEN, parse_mode=ParseMode.HTML)
    dp = Dispatcher()
    dp.include_router(router)
    await dp.start_polling(bot)


if __name__ == "__main__":
    import asyncio

    asyncio.run(main())


