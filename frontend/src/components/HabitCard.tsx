import { useMemo } from 'react'
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
  onQuickToggle?: (updated: Habit) => void
}

function HabitCard({ habit, onQuickToggle }: HabitCardProps) {
  const navigate = useNavigate()
  const colorClass = habit.color && COLOR_CLASS[habit.color] ? COLOR_CLASS[habit.color] : 'habit-card--gold'

  const weekDates = useMemo(() => getCurrentWeekDates(), [])
  const completionsSet = useMemo(
    () => new Set(habit.current_week_completions ?? []),
    [habit.current_week_completions]
  )

  const todayKey = formatDateKey(new Date())
  const completedToday = completionsSet.has(todayKey)

  const handleQuickToggle = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      if (completedToday) {
        await habitsApi.removeLog(habit.id, todayKey)
        if (onQuickToggle) {
          const next = (habit.current_week_completions || []).filter((d) => d !== todayKey)
          onQuickToggle({ ...habit, current_week_completions: next })
        }
      } else {
        await habitsApi.complete(habit.id, { date: todayKey })
        if (onQuickToggle) {
          const set = new Set(habit.current_week_completions || [])
          set.add(todayKey)
          onQuickToggle({ ...habit, current_week_completions: Array.from(set) })
        }
      }
    } catch (error) {
      console.error('Failed to toggle quick completion', error)
    }
  }

  return (
    <div className={`habit-card glass-card ${colorClass}`} onClick={() => navigate(`/habits/${habit.id}`)}>
      <div className="habit-card-inner">
        <button
          type="button"
          className={`habit-quick-toggle ${completedToday ? 'completed' : ''}`}
          onClick={handleQuickToggle}
          aria-label={completedToday ? 'Снять отметку за сегодня' : 'Отметить сегодня выполненным'}
        >
          ✓
        </button>
        <div className="habit-header">
          <h3 className="habit-name">{habit.name}</h3>
          {habit.is_shared && <span className="shared-badge">👥</span>}
        </div>
        {habit.description && (
          <p className="habit-description">{habit.description}</p>
        )}
        <div className="habit-footer">
          {habit.participants && habit.participants.length > 1 && (
            <span className="participants-count">{habit.participants.length} участников</span>
          )}
          <div className="habit-days-block">
            <div className="habit-days-squares">
              {DAY_LABELS.map((label, i) => {
                const dateStr = weekDates[i]
                const completed = completionsSet.has(dateStr)
                return (
                  <div
                    key={i}
                    className={`habit-day-square ${completed ? 'completed' : ''}`}
                    title={label}
                  />
                )
              })}
            </div>
            <span className="habit-days-label">дни недели</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HabitCard
