import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { habitsApi, statsApi, profileApi } from '../services/api'
import type { Habit, HabitStats, HabitColor } from '../types'
import { getDayLabels, formatDateKey } from '../utils/week'
import type { FirstDayOfWeek } from '../utils/week'
import HabitForm, { type HabitFormData } from '../components/HabitForm'
import './HabitDetailPage.css'

function SettingsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

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
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

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

  const handleEdit = async (formData: HabitFormData) => {
    if (!id) return
    setSaving(true)
    try {
      await habitsApi.update(id, formData)
      await loadHabit()
      await loadStats()
      setEditing(false)
      alert('Привычка обновлена!')
    } catch (error) {
      console.error('Failed to update habit:', error)
      alert('Ошибка при обновлении привычки')
    } finally {
      setSaving(false)
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

  const today = useMemo(() => new Date(), [])
  const monthLabel = useMemo(() => {
    const monthNames = [
      'Январь',
      'Февраль',
      'Март',
      'Апрель',
      'Май',
      'Июнь',
      'Июль',
      'Август',
      'Сентябрь',
      'Октябрь',
      'Ноябрь',
      'Декабрь',
    ]
    return `${monthNames[today.getMonth()]} ${today.getFullYear()}`
  }, [today])

  const monthWeeks = useMemo(() => {
    const year = today.getFullYear()
    const month = today.getMonth()
    const firstOfMonth = new Date(year, month, 1)
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    // 1=Пн .. 7=Вс
    const firstWeekdayIso = ((firstOfMonth.getDay() + 6) % 7) + 1
    const startOfWeek = firstDay === 'sunday' ? 7 : 1
    const firstCellIndex = (firstWeekdayIso - startOfWeek + 7) % 7

    const totalCells = firstCellIndex + daysInMonth
    const rows = Math.ceil(totalCells / 7)

    const weeks: (Date | null)[][] = []
    let day = 1
    for (let w = 0; w < rows; w++) {
      const row: (Date | null)[] = []
      for (let d = 0; d < 7; d++) {
        const cellIndex = w * 7 + d
        if (cellIndex < firstCellIndex || day > daysInMonth) {
          row.push(null)
        } else {
          row.push(new Date(year, month, day))
          day += 1
        }
      }
      weeks.push(row)
    }
    return weeks
  }, [firstDay, today])

  const participantCompletionMap = useMemo(() => {
    const map: Record<
      string,
      {
        user_id: string
        color?: HabitColor
      }[]
    > = {}
    if (stats?.participant_completions) {
      stats.participant_completions.forEach((entry) => {
        const key = entry.date
        if (!map[key]) {
          map[key] = []
        }
        map[key].push({
          user_id: entry.user_id,
          color: entry.color as HabitColor | undefined,
        })
      })
    }
    return map
  }, [stats?.participant_completions])

  const ALL_COLORS: HabitColor[] = ['gray', 'silver', 'gold', 'emerald', 'sapphire', 'ruby']

  const getCellBackgroundStyle = (dateStr: string): React.CSSProperties | undefined => {
    const entries = participantCompletionMap[dateStr] || []
    if (!entries.length) {
      return undefined
    }
    const colors = entries
      .map((e) => e.color)
      .filter((c): c is HabitColor => !!c && (ALL_COLORS as string[]).includes(c))
    if (!colors.length) {
      return undefined
    }
    const uniqueColors: HabitColor[] = []
    colors.forEach((c) => {
      if (!uniqueColors.includes(c)) {
        uniqueColors.push(c)
      }
    })
    const cssColor = (c: HabitColor) => {
      if (c === 'gray') return '#a19d98'
      if (c === 'silver') return '#c0c0c0'
      if (c === 'gold') return '#d4af37'
      if (c === 'emerald') return '#40916c'
      if (c === 'sapphire') return '#4780ff'
      if (c === 'ruby') return '#c83c3c'
      return '#d4af37'
    }
    const count = uniqueColors.length
    const step = 100 / count
    const stops = uniqueColors.map((c, index) => {
      const start = index * step
      const end = (index + 1) * step
      return `${cssColor(c)} ${start}% ${end}%`
    })
    return {
      backgroundImage: `linear-gradient(135deg, ${stops.join(', ')})`,
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
    <div className="page-container habit-detail-page">
      <div className="habit-detail-header">
        <button type="button" className="back-btn" onClick={() => navigate('/')}>
          ← Назад
        </button>
      </div>

      {editing ? (
        <div className="habit-detail-card">
          <div className="habit-detail-edit-header">
            <h2>Редактировать привычку</h2>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setEditing(false)}
              disabled={saving}
            >
              Отмена
            </button>
          </div>
          <HabitForm
            onSubmit={handleEdit}
            submitLabel="Сохранить изменения"
            initialData={{
              name: habit.name,
              description: habit.description,
              frequency: habit.frequency,
              is_shared: habit.is_shared,
              color: habit.color || 'gold',
              days_of_week: habit.days_of_week,
              weekly_goal_days: habit.weekly_goal_days,
              reminder_enabled: habit.reminder_enabled,
              reminder_time: habit.reminder_time,
            }}
          />
        </div>
      ) : (
        <div className={`habit-detail-card habit-detail-card--${habit.color || 'gold'}`}>
          <div className="habit-detail-title">
            <div className="habit-detail-title-text">
              <h1>{habit.name}</h1>
              {habit.is_shared && <span className="shared-badge">👥 Совместная</span>}
            </div>
            {habit.can_edit && (
              <button
                type="button"
                className="habit-detail-edit-icon"
                onClick={() => setEditing(true)}
                title="Редактировать привычку"
              >
                <SettingsIcon />
              </button>
            )}
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

          {!habit.is_invited && (
            <div className="habit-detail-calendar">
              <div className="habit-calendar-month-label">{monthLabel}</div>
              <div className="habit-calendar-header">
                {dayLabels.map((l, i) => (
                  <span key={i} className="habit-calendar-day-label">{l}</span>
                ))}
              </div>
              {monthWeeks.map((week, wi) => {
                const weekDates = week
                  .filter((d): d is Date => d != null)
                  .map((d) => formatDateKey(d))
                const weekCompletions = weekDates.filter((d) => completedSet.has(d)).length

                return (
                  <div key={wi} className="habit-calendar-week">
                    {week.map((cellDate, di) => {
                      if (!cellDate) {
                        return <div key={di} className="habit-calendar-cell habit-calendar-cell--empty" />
                      }

                      const dateStr = formatDateKey(cellDate)
                      const completed = completedSet.has(dateStr)
                      const weekdayNum = (cellDate.getDay() + 6) % 7 + 1
                      const inSchedule = !habit.days_of_week?.length || habit.days_of_week.includes(weekdayNum)
                      const notInSchedule = habit.days_of_week?.length && !inSchedule
                      const weeklyGoalReached =
                        habit.weekly_goal_days != null && weekCompletions >= habit.weekly_goal_days
                      const disabledStyle =
                        (notInSchedule && !completed) || (weeklyGoalReached && !completed)

                      const isToday = dateStr === formatDateKey(new Date())
                      const dayNumber = cellDate.getDate()
                      const style = getCellBackgroundStyle(dateStr)

                      return (
                        <button
                          key={di}
                          type="button"
                          className={`habit-calendar-cell ${completed ? 'completed' : ''} ${disabledStyle ? 'disabled' : ''}`}
                          title={formatDateLabel(dateStr)}
                          onClick={() => setPopupDate(dateStr)}
                          style={style}
                        >
                          <span className="habit-calendar-day-number">{dayNumber}</span>
                          {isToday && <span className="habit-calendar-today-dot" />}
                        </button>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          )}

          {!habit.is_invited && stats && (
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

          <div className="habit-detail-actions">
            {!habit.is_invited && (
              <button
                className="btn btn-success"
                onClick={handleComplete}
                disabled={completing}
              >
                {completing ? 'Отмечаю...' : '✓ Отметить выполнение'}
              </button>
            )}
            {habit.can_edit && (
              <button
                type="button"
                className="habit-detail-delete-link"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? '…' : '× Удалить привычку'}
              </button>
            )}
          </div>
        </div>
      )}

      {popupDate && !habit.is_invited && (
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
