import { useEffect, useState } from 'react'
import type { HabitColor, Friendship } from '../types'
import { friendsApi } from '../services/api'
import './HabitForm.css'

const DAY_LABELS = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс']
const COLORS: { value: HabitColor; label: string }[] = [
  { value: 'gray', label: 'Серый' },
  { value: 'silver', label: 'Серебро' },
  { value: 'gold', label: 'Золото' },
  { value: 'emerald', label: 'Изумруд' },
  { value: 'sapphire', label: 'Сапфир' },
  { value: 'ruby', label: 'Рубин' },
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
  submitLabel?: string
}

function HabitForm({ onSubmit, initialData, submitLabel = 'Создать привычку' }: HabitFormProps) {
  const [name, setName] = useState(initialData?.name || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [frequency] = useState(initialData?.frequency || 'daily')
  const [is_shared, setShared] = useState(initialData?.is_shared ?? false)
  const [color, setColor] = useState<HabitColor>(initialData?.color || 'gold')
  const [useWeeklyGoal, setUseWeeklyGoal] = useState(!!initialData?.weekly_goal_days)
  const [weeklyGoalDays, setWeeklyGoalDays] = useState(initialData?.weekly_goal_days ?? 4)
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(
    initialData?.days_of_week?.length ? initialData.days_of_week : [1, 2, 3, 4, 5]
  )
  const [reminderEnabled, setReminderEnabled] = useState(initialData?.reminder_enabled ?? false)
  const [reminderTime, setReminderTime] = useState(initialData?.reminder_time || '09:00')
  const [friends, setFriends] = useState<Friendship[]>([])
  const [friendsLoading, setFriendsLoading] = useState(false)
  const [friendsError, setFriendsError] = useState<string | null>(null)
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>(initialData?.participant_ids || [])

  const handleEnterAsDone = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      ;(e.currentTarget as HTMLElement).blur()
    }
  }

  const toggleDay = (day: number) => {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b)
    )
  }

  useEffect(() => {
    if (!is_shared) {
      return
    }
    if (friends.length > 0 || friendsLoading) {
      return
    }
    const loadFriends = async () => {
      setFriendsLoading(true)
      setFriendsError(null)
      try {
        const data = await friendsApi.getAll()
        setFriends(data)
      } catch (error) {
        console.error('Failed to load friends for shared habit', error)
        setFriendsError('Не удалось загрузить список друзей')
      } finally {
        setFriendsLoading(false)
      }
    }
    loadFriends()
  }, [is_shared, friends.length, friendsLoading])

  const toggleFriend = (friendId: string) => {
    setSelectedFriendIds((prev) => {
      if (prev.includes(friendId)) {
        return prev.filter((id) => id !== friendId)
      }
      if (prev.length >= 5) {
        alert('Максимум 6 участников в привычке: вы и до 5 друзей')
        return prev
      }
      return [...prev, friendId]
    })
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
      participant_ids: is_shared ? selectedFriendIds : undefined,
    })
  }

  return (
    <form
      className={`habit-form habit-form--${color}`}
      onSubmit={handleSubmit}
    >
      <div className="form-group">
        <div className="habit-form-section-title">Название</div>
        <input
          type="text"
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleEnterAsDone}
          placeholder="Например: Утренняя прогулка"
          enterKeyHint="done"
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
              className={`habit-form-color-btn habit-form-color-btn--${c.value} ${color === c.value ? 'active' : ''}`}
              onClick={() => setColor(c.value)}
              title={c.label}
            />
          ))}
        </div>
      </div>

      <div className="form-group">
        <div className="habit-form-section-title">Дни недели</div>
        {useWeeklyGoal ? (
          <div className="habit-form-weekly-block">
            <button
              type="button"
              className="habit-form-arrow"
              onClick={() => setWeeklyGoalDays((n) => Math.max(1, n - 1))}
              aria-label="Меньше дней"
            >
              ←
            </button>
            <span className="habit-form-weekly-value">{weeklyGoalDays}/7 дней</span>
            <button
              type="button"
              className="habit-form-arrow"
              onClick={() => setWeeklyGoalDays((n) => Math.min(7, n + 1))}
              aria-label="Больше дней"
            >
              →
            </button>
          </div>
        ) : (
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
        )}
      </div>

      <div className="form-group habit-form-toggle-row">
        <span className="habit-form-toggle-label">Недельная цель</span>
        <label className="toggle">
          <input
            type="checkbox"
            checked={useWeeklyGoal}
            onChange={(e) => setUseWeeklyGoal(e.target.checked)}
          />
          <span className="toggle-slider" />
        </label>
      </div>

      <div className="form-group">
        <div className="habit-form-section-title">Описание</div>
        <textarea
          className="input textarea"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={handleEnterAsDone}
          placeholder="Добавьте детали (необязательно)."
          rows={2}
          enterKeyHint="done"
        />
      </div>

      <div className="form-group habit-form-toggle-row">
        <span className="habit-form-toggle-label">Совместная привычка с друзьями</span>
        <label className="toggle">
          <input
            type="checkbox"
            checked={is_shared}
            onChange={(e) => setShared(e.target.checked)}
          />
          <span className="toggle-slider" />
        </label>
      </div>

      {is_shared && (
        <div className="form-group">
          <div className="habit-form-section-title">Выберите друзей (до 6 человек вместе с вами)</div>
          {friendsLoading && <div className="habit-form-friends-loading">Загрузка списка друзей…</div>}
          {friendsError && !friendsLoading && (
            <div className="habit-form-friends-error">{friendsError}</div>
          )}
          {!friendsLoading && !friendsError && friends.length === 0 && (
            <div className="habit-form-friends-empty">
              У вас пока нет друзей. Пригласите их через профиль, чтобы создать совместную привычку.
            </div>
          )}
          {!friendsLoading && !friendsError && friends.length > 0 && (
            <div className="habit-form-friends-list">
              {friends.map((fr) => {
                const friend = fr.friend
                if (!friend) return null
                const selected = selectedFriendIds.includes(friend.id)
                const displayName =
                  [friend.first_name, friend.last_name].filter(Boolean).join(' ') ||
                  (friend.username ? '@' + friend.username : 'Друг')
                return (
                  <button
                    key={friend.id}
                    type="button"
                    className={`habit-form-friend-btn ${selected ? 'selected' : ''}`}
                    onClick={() => toggleFriend(friend.id)}
                  >
                    <span className="habit-form-friend-avatar">{friend.avatar_emoji}</span>
                    <span className="habit-form-friend-name">{displayName}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

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
          <input
            type="time"
            className="input habit-form-time-input"
            value={reminderTime}
            onChange={(e) => setReminderTime(e.target.value)}
            enterKeyHint="done"
          />
        </div>
      )}

      <button type="submit" className="btn">
        {submitLabel}
      </button>
    </form>
  )
}

export default HabitForm
