import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { habitsApi } from '../services/api'
import type { Habit } from '../types'
import HabitCard from '../components/HabitCard'
import './HomePage.css'

function HomePage() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadHabits()
  }, [])

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

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading">Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Мои Привычки</h1>
        <button className="btn" onClick={() => navigate('/habits?new=true')}>
          + Создать
        </button>
      </div>

      {habits.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h2>Нет привычек</h2>
          <p>Создайте свою первую привычку и начните отслеживать прогресс!</p>
          <button className="btn" onClick={() => navigate('/habits?new=true')}>
            Создать привычку
          </button>
        </div>
      ) : (
        <div className="habits-list">
          {habits.map((habit) => (
            <HabitCard key={habit.id} habit={habit} />
          ))}
        </div>
      )}
    </div>
  )
}

export default HomePage

