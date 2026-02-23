import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Habit, HabitColor } from '../types'
import { habitsApi } from '../services/api'
import { formatDateKey } from '../utils/week'
import './HabitCard.css'

const DAY_LABELS = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс']
const COLOR_CLASS: Record<HabitColor, string> = {
  gray: 'habit-card--gray',
  silver: 'habit-card--silver',
  gold: 'habit-card--gold',
  emerald: 'habit-card--emerald',
  sapphire: 'habit-card--sapphire',
  ruby: 'habit-card--ruby',
}

function getCurrentWeekDates(): string[] {
  const now = new Date()
  const day = now.getDay() // 0 Sun, 1 Mon, ... 6 Sat
  const mondayOffset = (day + 6) % 7
  const monday = new Date(now)
  monday.setDate(monday.getDate() - mondayOffset)
  const dates: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    dates.push(d.toISOString().slice(0, 10))
  }
  return dates
}

interface HabitCardProps {
  habit: Habit
  onQuickToggle?: (updated: Habit | null) => void
  onRefreshHabits?: () => void
}

function HabitCard({ habit, onQuickToggle, onRefreshHabits }: HabitCardProps) {
  const navigate = useNavigate()
  const isInvitation = habit.is_invited === true
  const colorClass = isInvitation
    ? 'habit-card--gold'
    : habit.color && COLOR_CLASS[habit.color]
      ? COLOR_CLASS[habit.color]
      : 'habit-card--gold'

  const ALL_COLORS: HabitColor[] = ['gray', 'silver', 'gold', 'emerald', 'sapphire', 'ruby']
  const [inviteLoading, setInviteLoading] = useState(false)
  const [showColorModal, setShowColorModal] = useState(false)
  const [selectedColor, setSelectedColor] = useState<HabitColor | null>(null)

  const weekDates = useMemo(() => getCurrentWeekDates(), [])
  const completionsSet = useMemo(
    () => new Set(habit.current_week_completions ?? []),
    [habit.current_week_completions]
  )

  const streak = habit.current_streak ?? 0

  const todayKey = formatDateKey(new Date())
  const completedToday = completionsSet.has(todayKey)

  const getDayBackgroundStyle = (dateStr: string): React.CSSProperties | undefined => {
    const entries = habit.weekly_participant_completions?.[dateStr] || []
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

  const handleQuickToggle = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isInvitation) {
      return
    }
    try {
      if (completedToday) {
        await habitsApi.removeLog(habit.id, todayKey)
        onRefreshHabits && onRefreshHabits()
        onQuickToggle && onQuickToggle(habit)
      } else {
        await habitsApi.complete(habit.id, { date: todayKey })
        onRefreshHabits && onRefreshHabits()
        onQuickToggle && onQuickToggle(habit)
      }
    } catch (error) {
      console.error('Failed to toggle quick completion', error)
    }
  }

  const availableColors: HabitColor[] = useMemo(() => {
    const used = new Set<HabitColor>()
    ;(habit.participants || []).forEach((p) => {
      if (p.status === 'accepted' && p.color) {
        used.add(p.color as HabitColor)
      }
    })
    return ALL_COLORS.filter((c) => !used.has(c))
  }, [habit.participants])

  const openAcceptModal = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedColor(null)
    setShowColorModal(true)
  }

  const handleAcceptSave = async () => {
    if (!selectedColor) return
    if (inviteLoading) return
    setInviteLoading(true)
    try {
      const updated = await habitsApi.acceptInvitation(habit.id, { color: selectedColor })
      setShowColorModal(false)
      onRefreshHabits && onRefreshHabits()
      onQuickToggle && onQuickToggle(updated)
    } catch (error) {
      console.error('Failed to accept invitation', error)
      alert('Не удалось принять приглашение')
    } finally {
      setInviteLoading(false)
    }
  }

  const handleDeclineInvitation = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (inviteLoading) return
    setInviteLoading(true)
    try {
      await habitsApi.declineInvitation(habit.id)
      onRefreshHabits && onRefreshHabits()
      onQuickToggle && onQuickToggle(null)
    } catch (error) {
      console.error('Failed to decline invitation', error)
      alert('Не удалось отклонить приглашение')
    } finally {
      setInviteLoading(false)
    }
  }

  return (
    <div className={`habit-card glass-card ${colorClass}`} onClick={() => navigate(`/habits/${habit.id}`)}>
      <div className="habit-card-inner">
        {!isInvitation && (
          <button
            type="button"
            className={`habit-quick-toggle ${completedToday ? 'completed' : ''}`}
            onClick={handleQuickToggle}
            aria-label={completedToday ? 'Снять отметку за сегодня' : 'Отметить сегодня выполненным'}
          >
            ✓
          </button>
        )}
        <div className="habit-header">
          <h3 className="habit-name">{habit.name}</h3>
        </div>
        {habit.description && (
          <p className="habit-description">{habit.description}</p>
        )}
        <div className="habit-footer">
          <div className="habit-footer-left">
            {!isInvitation && (
              <div className="habit-days-block">
                <div className="habit-days-squares">
                  {DAY_LABELS.map((label, i) => {
                    const dateStr = weekDates[i]
                    const hasAny = !!(habit.weekly_participant_completions?.[dateStr]?.length)
                    const completed = hasAny
                    const style = getDayBackgroundStyle(dateStr)
                    return (
                      <div
                        key={i}
                        className={`habit-day-square ${completed ? 'completed' : ''}`}
                        title={label}
                        style={style}
                      />
                    )
                  })}
                </div>
              </div>
            )}
            {habit.has_pending_invites && (
              <span className="participants-count">Друг приглашен</span>
            )}
            {habit.participants && habit.participants.length > 1 && !habit.has_pending_invites && (
              <span className="participants-count">{habit.participants.length} участников</span>
            )}
          </div>
          {!isInvitation && (
            <div className="habit-streak" title="Серия дней подряд">
              <span className="habit-streak-icon" aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2c1.2 2.1 3.5 4 3.5 7 0 2.1-1.6 3.5-3.5 3.5S8.5 11.1 8.5 9c0-1.9 1-3.4 1.9-4.6" />
                  <path d="M12 22c4.1 0 7-3.1 7-7 0-2.5-1.2-4.6-3.1-6.1.1 2.6-1.6 4.1-3.9 4.1S8.1 11.5 8 8.9C6.2 10.4 5 12.5 5 15c0 3.9 2.9 7 7 7z" />
                </svg>
              </span>
              <span className="habit-streak-number">{streak}</span>
            </div>
          )}
        </div>
        {isInvitation && (
          <div className="habit-invitation-actions habit-invitation-actions--full">
            <div className="habit-invitation-buttons">
              <button
                type="button"
                className="btn btn-success habit-invite-accept"
                onClick={openAcceptModal}
                disabled={inviteLoading}
              >
                Принять
              </button>
              <button
                type="button"
                className="btn btn-secondary habit-invite-decline"
                onClick={handleDeclineInvitation}
                disabled={inviteLoading}
              >
                Отклонить
              </button>
            </div>
          </div>
        )}
      </div>
      {showColorModal && (
        <div className="habit-cell-popup-overlay" onClick={() => setShowColorModal(false)}>
          <div className="habit-cell-popup glass-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="habit-cell-popup-title">Выберите свой цвет</h3>
            <div className="habit-form-colors" style={{ marginBottom: '12px' }}>
              {availableColors.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`habit-form-color-btn habit-form-color-btn--${c} ${selectedColor === c ? 'active' : ''}`}
                  onClick={() => setSelectedColor(c)}
                />
              ))}
              {availableColors.length === 0 && (
                <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Нет доступных цветов</div>
              )}
            </div>
            <button
              type="button"
              className="btn btn-success"
              disabled={!selectedColor || inviteLoading}
              onClick={handleAcceptSave}
            >
              Сохранить
            </button>
            <button
              type="button"
              className="btn btn-secondary habit-cell-popup-close"
              onClick={() => setShowColorModal(false)}
            >
              Отмена
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default HabitCard
