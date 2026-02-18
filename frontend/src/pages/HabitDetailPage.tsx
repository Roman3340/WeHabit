import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { habitsApi, statsApi, profileApi } from '../services/api'
import type { Habit, HabitStats } from '../types'
import { getWeekStart, addDays, getDayLabels, formatDateKey } from '../utils/week'
import type { FirstDayOfWeek } from '../utils/week'
import './HabitDetailPage.css'

function HabitDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [habit, setHabit] = useState<Habit | null>(null)
  const [stats, setStats] = useState<HabitStats | null>(null)
  const [firstDay, setFirstDay] = useState<FirstDayOfWeek>('monday')
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (id) {
      loadHabit()
      loadStats()
    }
  }, [id])

  useEffect(() => {
    const load = async () => {
      try {
        const profile = await profileApi.get()
        const fd = profile.first_day_of_week
        setFirstDay(fd === 'sunday' || fd === 'monday' ? fd : 'monday')
      } catch (e) {
        console.error('Failed to load profile', e)
      }
    }
    load()
  }, [])

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
      const data = await statsApi.getHabitStats(id, 35)
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

  const handleDelete = async () => {
    if (!id || !habit) return
    if (!confirm('Удалить привычку «' + habit.name + '»? Это действие нельзя отменить.')) return
    setDeleting(true)
    try {
      await habitsApi.delete(id)
      navigate('/')
    } catch (error) {
      console.error('Failed to delete habit:', error)
      alert('Ошибка при удалении')
    } finally {
      setDeleting(false)
    }
  }

  const scheduleLabel = useMemo(() => {
    if (!habit) return ''
    if (habit.weekly_goal_days != null) return `${habit.weekly_goal_days} из 7 дней`
    if (habit.days_of_week?.length) {
      const labels = getDayLabels(firstDay)
      const names = habit.days_of_week.map((d) => labels[(d - 1) % 7]).filter(Boolean)
      return names.length ? names.join(', ') : 'Еженедельно'
    }
    return habit.frequency === 'daily' ? 'Ежедневно' : 'Еженедельно'
  }, [habit, firstDay])

  const completedSet = useMemo(
    () => new Set((stats?.daily_completions ?? []).map((d) => d.date)),
    [stats?.daily_completions]
  )

  const dayLabels = useMemo(() => getDayLabels(firstDay), [firstDay])
  const weekStart = useMemo(() => getWeekStart(new Date(), firstDay), [firstDay])
  const gridWeeks = useMemo(() => {
    const weeks: Date[][] = []
    for (let w = 0; w < 4; w++) {
      const row: Date[] = []
      for (let d = 0; d < 7; d++) {
        row.push(addDays(weekStart, w * 7 + d))
      }
      weeks.push(row)
    }
    return weeks
  }, [weekStart])

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
    <div className="page-container habit-detail-page">
      <div className="habit-detail-header">
        <button type="button" className="back-btn" onClick={() => navigate('/')}>
          ← Назад
        </button>
        <button
          type="button"
          className="btn btn-danger habit-detail-delete"
          onClick={handleDelete}
          disabled={deleting}
        >
          {deleting ? '…' : 'Удалить'}
        </button>
      </div>

      <div className={`glass-card habit-detail-card habit-detail-card--${habit.color || 'gold'}`}>
        <div className="habit-detail-title">
          <h1>{habit.name}</h1>
          {habit.is_shared && <span className="shared-badge">👥 Совместная</span>}
        </div>

        {habit.description && (
          <p className="habit-detail-description">{habit.description}</p>
        )}

        <div className="habit-detail-info">
          <div className="info-item">
            <span className="info-label">Расписание:</span>
            <span className="info-value">{scheduleLabel}</span>
          </div>
        </div>

        <div className="habit-detail-calendar">
          <div className="habit-calendar-header">
            {dayLabels.map((l, i) => (
              <span key={i} className="habit-calendar-day-label">{l}</span>
            ))}
          </div>
          {gridWeeks.map((week, wi) => (
            <div key={wi} className="habit-calendar-week">
              {week.map((cellDate, di) => {
                const dateStr = formatDateKey(cellDate)
                const completed = completedSet.has(dateStr)
                const weekdayNum = (cellDate.getDay() + 6) % 7 + 1
                const inSchedule = !habit.days_of_week?.length || habit.days_of_week.includes(weekdayNum)
                const weekCompletions = week.filter((d) => completedSet.has(formatDateKey(d))).length
                const goalReached = habit.weekly_goal_days != null && weekCompletions >= habit.weekly_goal_days
                const locked = habit.weekly_goal_days != null && goalReached && !completed
                const disabled = habit.days_of_week?.length && !inSchedule
                return (
                  <div
                    key={di}
                    className={`habit-calendar-cell ${completed ? 'completed' : ''} ${disabled ? 'disabled' : ''} ${locked ? 'locked' : ''}`}
                    title={dateStr}
                  />
                )
              })}
            </div>
          ))}
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
