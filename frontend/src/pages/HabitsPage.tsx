import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { habitsApi } from '../services/api'
import type { Habit } from '../types'
import HabitCard from '../components/HabitCard'
import HabitForm from '../components/HabitForm'
import './HabitsPage.css'

function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    const isNew = searchParams.get('new') === 'true'
    setShowForm(isNew)
    loadHabits()
  }, [searchParams])

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

  const handleCreateHabit = async (data: any) => {
    try {
      await habitsApi.create(data)
      setShowForm(false)
      navigate('/habits')
      loadHabits()
    } catch (error) {
      console.error('Failed to create habit:', error)
      alert('Ошибка при создании привычки')
    }
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading">Загрузка...</div>
      </div>
    )
  }

  if (showForm) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1>Создать привычку</h1>
          <button className="btn btn-secondary" onClick={() => {
            setShowForm(false)
            navigate('/habits')
          }}>
            Отмена
          </button>
        </div>
        <HabitForm onSubmit={handleCreateHabit} />
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Привычки</h1>
        <button className="btn" onClick={() => setShowForm(true)}>
          + Создать
        </button>
      </div>

      {habits.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h2>Нет привычек</h2>
          <p>Создайте свою первую привычку!</p>
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

export default HabitsPage

