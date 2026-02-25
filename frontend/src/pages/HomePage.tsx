import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { habitsApi, profileApi } from '../services/api'
import type { Habit, User } from '../types'
import HabitCard from '../components/HabitCard'
import './HomePage.css'

function formatDateLabel(date: Date) {
  const formatter = new Intl.DateTimeFormat('ru-RU', {
    weekday: 'short',
    day: '2-digit',
    month: 'long',
  })
  const raw = formatter.format(date) // пт, 16 февраля
  const [weekdayPart, rest] = raw.split(',')
  return {
    weekday: weekdayPart?.trim().toUpperCase() ?? '',
    full: rest?.trim() ?? '',
  }
}

function HomePage() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState(true)
  const [me, setMe] = useState<User | null>(null)
  const navigate = useNavigate()

  const refreshHabits = async () => {
    try {
      const [profile, data] = await Promise.all([profileApi.get(), habitsApi.getAll()])
      setMe(profile)
      setHabits(data)
    } catch (error) {
      console.error('Failed to refresh habits:', error)
    }
  }

  useEffect(() => {
    const loadHabits = async () => {
      try {
        const [profile, data] = await Promise.all([profileApi.get(), habitsApi.getAll()])
        setMe(profile)
        setHabits(data)
      } catch (error) {
        console.error('Failed to load habits:', error)
      } finally {
        setLoading(false)
      }
    }
    loadHabits()
  }, [])

  const dateLabel = useMemo(() => formatDateLabel(new Date()), [])

  if (loading) {
    return (
      <div className="home-screen">
        <div className="home-loading">Загрузка...</div>
      </div>
    )
  }

  const hasHabits = habits.length > 0

  return (
    <div className="home-screen">
      <div className="home-header">
        <span className="home-date-weekday">{dateLabel.weekday}</span>
        <span className="home-date-full">{dateLabel.full}</span>
      </div>

      {!hasHabits && (
        <section className="home-hero">
          <h1 className="home-title">Создайте свою первую привычку</h1>
          <p className="home-subtitle">
            Добавьте то, что хотите делать регулярно, и начинайте отмечать прогресс.
          </p>

          <button
            className="home-add-button"
            onClick={() => navigate('/habits?new=true')}
          >
            Добавить привычку
          </button>
        </section>
      )}

      {hasHabits && (
        <section className="home-section">
          <div className="home-section-header">
            <h2 className="home-section-title">Мои привычки</h2>
            <button
              type="button"
              className="home-section-add"
              onClick={() => navigate('/habits?new=true')}
              aria-label="Добавить привычку"
            >
              +
            </button>
          </div>
          <div className="home-habits-list">
            {habits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                myUserId={me?.id}
                onQuickToggle={(updated) =>
                  setHabits((prev) => {
                    if (!updated) {
                      return prev.filter((h) => h.id !== habit.id)
                    }
                    return prev.map((h) => (h.id === updated.id ? updated : h))
                  })
                }
                onRefreshHabits={refreshHabits}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default HomePage

