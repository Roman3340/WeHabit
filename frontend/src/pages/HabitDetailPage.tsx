import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { habitsApi, statsApi, profileApi } from '../services/api'
import type { Habit, HabitStats } from '../types'
import { getWeekStart, addDays, getDayLabels, formatDateKey } from '../utils/week'
import type { FirstDayOfWeek } from '../utils/week'
import './HabitDetailPage.css'

const WEEKDAY_NAMES = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']

function formatDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const day = date.getDay()
  const weekdayName = WEEKDAY_NAMES[day === 0 ? 6 : day - 1]
  return `${weekdayName}, ${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}.${y}`
}

function HabitDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [habit, setHabit] = useState<Habit | null>(null)
  const [stats, setStats] = useState<HabitStats | null>(null)
  const [firstDay, setFirstDay] = useState<FirstDayOfWeek>('monday')
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [popupDate, setPopupDate] = useState<string | null>(null)
  const [popupLoading, setPopupLoading] = useState(false)

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
      const todayStr = formatDateKey(new Date())
      await habitsApi.complete(id, { date: todayStr })
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

  const handleCompleteForDate = async (dateStr: string) => {
    if (!id) return
    setPopupLoading(true)
    try {
      await habitsApi.complete(id, { date: dateStr })
      await loadStats()
      setPopupDate(null)
    } catch (error: any) {
      if (error.response?.status === 400) {
        alert('В этот день уже есть отметка.')
      } else {
        alert('Ошибка при отметке')
      }
    } finally {
      setPopupLoading(false)
    }
  }

  const handleRemoveLog = async (dateStr: string) => {
    if (!id) return
    setPopupLoading(true)
    try {
      await habitsApi.removeLog(id, dateStr)
      await loadStats()
      setPopupDate(null)
    } catch (error: any) {
      alert('Ошибка при снятии отметки')
    } finally {
      setPopupLoading(false)
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
                const notInSchedule = habit.days_of_week?.length && !inSchedule
                const weekCompletions = week.filter((d) => completedSet.has(formatDateKey(d))).length
                const weeklyGoalReached =
                  habit.weekly_goal_days != null && weekCompletions >= habit.weekly_goal_days
                const disabledStyle =
                  (notInSchedule && !completed) || (weeklyGoalReached && !completed)
                return (
                  <button
                    key={di}
                    type="button"
                    className={`habit-calendar-cell ${completed ? 'completed' : ''} ${disabledStyle ? 'disabled' : ''}`}
                    title={formatDateLabel(dateStr)}
                    onClick={() => setPopupDate(dateStr)}
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
              {(stats.above_norm_count ?? 0) > 0 && (
                <div className="stat-item stat-item--extra">
                  <div className="stat-value">{stats.above_norm_count}</div>
                  <div className="stat-label">Сверх нормы</div>
                </div>
              )}
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
        <button
          type="button"
          className="habit-detail-delete-link"
          onClick={handleDelete}
          disabled={deleting}
        >
          {deleting ? '…' : '× Удалить привычку'}
        </button>
      </div>

      {popupDate && (
        <div className="habit-cell-popup-overlay" onClick={() => setPopupDate(null)}>
          <div className="glass-card habit-cell-popup" onClick={(e) => e.stopPropagation()}>
            <h3 className="habit-cell-popup-title">{formatDateLabel(popupDate)}</h3>
            <p className="habit-cell-popup-date">{popupDate}</p>
            {completedSet.has(popupDate) ? (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => handleRemoveLog(popupDate)}
                disabled={popupLoading}
              >
                {popupLoading ? '…' : 'Убрать отметку'}
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-success"
                onClick={() => handleCompleteForDate(popupDate)}
                disabled={popupLoading}
              >
                {popupLoading ? '…' : 'Отметить выполнение'}
              </button>
            )}
            <button type="button" className="btn btn-secondary habit-cell-popup-close" onClick={() => setPopupDate(null)}>
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default HabitDetailPage
