import { useState } from 'react'
import type { HabitColor } from '../types'
import './ParticipantSettingsForm.css'

const COLORS: { value: HabitColor; label: string }[] = [
  { value: 'gray', label: 'Серый' },
  { value: 'silver', label: 'Серебро' },
  { value: 'gold', label: 'Золото' },
  { value: 'emerald', label: 'Изумруд' },
  { value: 'sapphire', label: 'Сапфир' },
  { value: 'ruby', label: 'Рубин' },
]

export interface ParticipantSettingsFormData {
  color?: HabitColor
  reminder_enabled?: boolean
  reminder_time?: string
}

interface ParticipantSettingsFormProps {
  onSubmit: (data: ParticipantSettingsFormData) => void
  initialData: Partial<ParticipantSettingsFormData>
  allowedColors: HabitColor[]
  onCancel: () => void
}

function ParticipantSettingsForm({ onSubmit, initialData, allowedColors, onCancel }: ParticipantSettingsFormProps) {
  const [color, setColor] = useState<HabitColor>(initialData?.color || 'gold')
  const [reminderEnabled, setReminderEnabled] = useState(initialData?.reminder_enabled ?? false)
  const [reminderTime, setReminderTime] = useState(initialData?.reminder_time || '09:00')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      color,
      reminder_enabled: reminderEnabled,
      reminder_time: reminderEnabled ? reminderTime : undefined,
    })
  }

  return (
    <form className="participant-settings-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <div className="habit-form-section-title">Ваш цвет в привычке</div>
        <div className="habit-form-colors">
          {COLORS.filter(c => allowedColors.includes(c.value)).map((c) => (
            <button
              key={c.value}
              type="button"
              className={`habit-form-color-btn habit-form-color-btn--${c.value} ${color === c.value ? 'active' : ''}`}
              onClick={() => setColor(c.value)}
              title={c.label}
            />
          ))}
        </div>
      </div>

      <div className="form-group habit-form-toggle-row">
        <span className="habit-form-toggle-label">Включить напоминание</span>
        <label className="toggle">
          <input
            type="checkbox"
            checked={reminderEnabled}
            onChange={(e) => setReminderEnabled(e.target.checked)}
          />
          <span className="toggle-slider" />
        </label>
      </div>
      {reminderEnabled && (
        <div className="form-group habit-form-time-wrap">
          <span className="habit-form-time-label">Ежедневно в</span>
          <input
            type="time"
            className="input habit-form-time-input"
            value={reminderTime}
            onChange={(e) => setReminderTime(e.target.value)}
            enterKeyHint="done"
          />
          <span className="habit-form-time-zone">по московскому времени (МСК)</span>
        </div>
      )}

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Отмена
        </button>
        <button type="submit" className="btn">
          Сохранить
        </button>
      </div>
    </form>
  )
}

export default ParticipantSettingsForm
