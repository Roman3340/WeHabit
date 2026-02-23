from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import auth, habits, friends, stats, profile, feed, achievements
from app.db.database import engine, Base
# Импортируем модели, чтобы они зарегистрировались в Base.metadata
from app.models import User, Habit, HabitParticipant, HabitLog, HabitNotification, Friendship, UserAchievement

# Создание таблиц
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Habit Tracker API",
    description="API для трекера привычек в Telegram",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключение роутеров
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(habits.router, prefix="/api/habits", tags=["habits"])
app.include_router(friends.router, prefix="/api/friends", tags=["friends"])
app.include_router(stats.router, prefix="/api/stats", tags=["stats"])
app.include_router(profile.router, prefix="/api/profile", tags=["profile"])
app.include_router(feed.router, prefix="/api/feed", tags=["feed"])
app.include_router(achievements.router, prefix="/api/achievements", tags=["achievements"])


@app.get("/")
async def root():
    return {"message": "Habit Tracker API", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "ok"}
