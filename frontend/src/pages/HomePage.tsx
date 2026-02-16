import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { habitsApi } from '../services/api'
import type { Habit } from '../types'
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
  const navigate = useNavigate()

  useEffect(() => {
    const loadHabits = async () => {
      try {
        const data = await habitsApi.getAll()
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

      <section className="home-hero">
        <h1 className="home-title">Начните свой путь.</h1>
        <p className="home-subtitle">
          Создайте привычку и отмечайте прогресс каждый день.
        </p>

        <button
          className="home-add-button"
          onClick={() => navigate('/habits?new=true')}
          aria-label="Создать привычку"
        >
          <span className="home-add-button-inner">+</span>
        </button>
      </section>

      {hasHabits && (
        <section className="home-section">
          <div className="home-section-header">
            <h2 className="home-section-title">Мои привычки</h2>
            <button
              className="home-section-link"
              type="button"
              onClick={() => navigate('/habits')}
            >
              Открыть все
            </button>
          </div>

          <div className="home-habits-list">
            {habits.map((habit) => (
              <HabitCard key={habit.id} habit={habit} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default HomePage

