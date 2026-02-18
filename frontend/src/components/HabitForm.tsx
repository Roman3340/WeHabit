import { useState } from 'react'
import type { HabitColor } from '../types'
import './HabitForm.css'

const DAY_LABELS = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс']
const COLORS: { value: HabitColor; label: string; class: string }[] = [
  { value: 'gray', label: 'Серый', class: 'habit-card--gray' },
  { value: 'silver', label: 'Серебро', class: 'habit-card--silver' },
  { value: 'gold', label: 'Золото', class: 'habit-card--gold' },
  { value: 'emerald', label: 'Изумруд', class: 'habit-card--emerald' },
  { value: 'sapphire', label: 'Сапфир', class: 'habit-card--sapphire' },
  { value: 'ruby', label: 'Рубин', class: 'habit-card--ruby' },
]

export interface HabitFormData {
  name: string
  description?: string
  frequency?: string
  is_shared?: boolean
  participant_ids?: string[]
  color?: HabitColor
  days_of_week?: number[]
  weekly_goal_days?: number
  reminder_enabled?: boolean
  reminder_time?: string
}

interface HabitFormProps {
  onSubmit: (data: HabitFormData) => void
  initialData?: Partial<HabitFormData>
}

function HabitForm({ onSubmit, initialData }: HabitFormProps) {
  const [name, setName] = useState(initialData?.name || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [frequency] = useState(initialData?.frequency || 'daily')
  const [is_shared, setShared] = useState(initialData?.is_shared ?? false)
  const [color, setColor] = useState<HabitColor>(initialData?.color || 'gold')
  const [useWeeklyGoal, setUseWeeklyGoal] = useState(!!initialData?.weekly_goal_days)
  const [weeklyGoalDays, setWeeklyGoalDays] = useState(initialData?.weekly_goal_days ?? 4)
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(initialData?.days_of_week?.length ? initialData.days_of_week : [1, 2, 3, 4, 5])
  const [reminderEnabled, setReminderEnabled] = useState(initialData?.reminder_enabled ?? false)
  const [reminderTime, setReminderTime] = useState(initialData?.reminder_time || '09:00')

  const toggleDay = (day: number) => {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b)
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      alert('Введите название привычки')
      return
    }
    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      frequency,
      is_shared,
      color,
      days_of_week: useWeeklyGoal ? undefined : daysOfWeek,
      weekly_goal_days: useWeeklyGoal ? weeklyGoalDays : undefined,
      reminder_enabled: reminderEnabled,
      reminder_time: reminderEnabled ? reminderTime : undefined,
    })
  }

  return (
    <form className="habit-form glass-card" onSubmit={handleSubmit}>
      <div className="form-group">
        <div className="habit-form-section-title">Название</div>
        <input
          type="text"
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Например: Утренняя прогулка"
          required
        />
      </div>

      <div className="form-group">
        <div className="habit-form-section-title">Цвет блока</div>
        <div className="habit-form-colors">
          {COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              className={`habit-form-color-btn ${color === c.value ? 'active' : ''} ${c.class}`}
              onClick={() => setColor(c.value)}
              title={c.label}
            />
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={useWeeklyGoal}
            onChange={(e) => setUseWeeklyGoal(e.target.checked)}
          />
          <span>Недельная цель (N дней в неделю, любые)</span>
        </label>
      </div>

      {useWeeklyGoal ? (
        <div className="form-group">
          <div className="habit-form-section-title">Дней в неделю</div>
          <div className="habit-form-days-select">
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <button
                key={n}
                type="button"
                className={`btn btn-secondary ${weeklyGoalDays === n ? 'active' : ''}`}
                onClick={() => setWeeklyGoalDays(n)}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="habit-form-hint">Цель: выполнять привычку {weeklyGoalDays} раз в неделю</p>
        </div>
      ) : (
        <div className="form-group">
          <div className="habit-form-section-title">Дни недели</div>
          <div className="habit-form-days">
            {DAY_LABELS.map((label, i) => {
              const dayNum = i + 1
              return (
                <button
                  key={dayNum}
                  type="button"
                  className={`habit-form-day ${daysOfWeek.includes(dayNum) ? 'active' : ''}`}
                  onClick={() => toggleDay(dayNum)}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="form-group">
        <div className="habit-form-section-title">Напоминание</div>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={reminderEnabled}
            onChange={(e) => setReminderEnabled(e.target.checked)}
          />
          <span>Включить напоминание</span>
        </label>
        {reminderEnabled && (
          <div className="habit-form-time">
            <input
              type="time"
              className="input"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="form-group">
        <div className="habit-form-section-title">Описание</div>
        <textarea
          className="input textarea"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Добавьте детали (необязательно)."
          rows={2}
        />
      </div>

      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={is_shared}
            onChange={(e) => setShared(e.target.checked)}
          />
          <span>Совместная привычка (с друзьями)</span>
        </label>
      </div>

      <button type="submit" className="btn">
        Создать привычку
      </button>
    </form>
  )
}

export default HabitForm
