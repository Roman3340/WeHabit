import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { habitsApi, statsApi } from '../services/api'
import type { Habit, HabitStats } from '../types'
import './HabitDetailPage.css'

function HabitDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [habit, setHabit] = useState<Habit | null>(null)
  const [stats, setStats] = useState<HabitStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)

  useEffect(() => {
    if (id) {
      loadHabit()
      loadStats()
    }
  }, [id])

  const loadHabit = async () => {
    if (!id) return
    try {
      const data = await habitsApi.getById(id)
      setHabit(data)
    } catch (error) {
      console.error('Failed to load habit:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    if (!id) return
    try {
      const data = await statsApi.getHabitStats(id)
      setStats(data)
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const handleComplete = async () => {
    if (!id) return
    setCompleting(true)
    try {
      await habitsApi.complete(id)
      await loadStats()
      alert('Привычка отмечена как выполненная! 🎉')
    } catch (error: any) {
      if (error.response?.status === 400) {
        alert('Вы уже выполнили эту привычку сегодня!')
      } else {
        alert('Ошибка при отметке выполнения')
      }
    } finally {
      setCompleting(false)
    }
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading">Загрузка...</div>
      </div>
    )
  }

  if (!habit) {
    return (
      <div className="page-container">
        <div className="error">Привычка не найдена</div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="habit-detail-header">
        <button className="back-btn" onClick={() => navigate('/habits')}>
          ← Назад
        </button>
      </div>

      <div className="glass-card habit-detail-card">
        <div className="habit-detail-title">
          <h1>{habit.name}</h1>
          {habit.is_shared && <span className="shared-badge">👥 Совместная</span>}
        </div>

        {habit.description && (
          <p className="habit-detail-description">{habit.description}</p>
        )}

        <div className="habit-detail-info">
          <div className="info-item">
            <span className="info-label">Частота:</span>
            <span className="info-value">
              {habit.frequency === 'daily' ? 'Ежедневно' : 'Еженедельно'}
            </span>
          </div>
        </div>

        {stats && (
          <div className="habit-stats">
            <h3>Статистика</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-value">{stats.current_streak}</div>
                <div className="stat-label">Дней подряд</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{stats.total_completions}</div>
                <div className="stat-label">Всего выполнено</div>
              </div>
            </div>
          </div>
        )}

        <button
          className="btn btn-success"
          onClick={handleComplete}
          disabled={completing}
        >
          {completing ? 'Отмечаю...' : '✓ Отметить выполнение'}
        </button>
      </div>
    </div>
  )
}

export default HabitDetailPage

