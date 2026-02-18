export interface User {
  id: string
  telegram_id: number
  username?: string
  first_name?: string
  last_name?: string
  avatar_emoji: string
  bio?: string
  /** monday | sunday — первый день недели в календаре */
  first_day_of_week?: string
  created_at: string
  updated_at: string
}

export type HabitColor = 'gray' | 'silver' | 'gold' | 'emerald' | 'sapphire' | 'ruby'

export interface Habit {
  id: string
  name: string
  description?: string
  frequency: string
  is_shared: boolean
  created_by: string
  created_at: string
  updated_at: string
  color?: HabitColor
  days_of_week?: number[] /** 0=Sun, 1=Mon, ... 6=Sat */
  weekly_goal_days?: number /** N из 7 для недельной цели */
  reminder_enabled?: boolean
  reminder_time?: string /** HH:MM */
  participants?: Array<{
    id: string
    joined_at: string
  }>
  /** Даты выполнений за текущую неделю (YYYY-MM-DD) */
  current_week_completions?: string[]
  /** Максимальная серия дней подряд (как в статистике; для карточки) */
  current_streak?: number
}

export interface HabitLog {
  id: string
  habit_id: string
  user_id: string
  completed_at: string
  notes?: string
}

export interface Friendship {
  id: string
  user_id: string
  friend_id: string
  status: string
  created_at: string
  updated_at: string
  friend?: {
    id: string
    username?: string
    first_name?: string
    last_name?: string
    avatar_emoji: string
    bio?: string
  }
}

export interface HabitStats {
  habit_id: string
  total_completions: number
  current_streak: number
  /** Дней выполнено сверх расписания (не в запланированный день или сверх цели по неделе) */
  above_norm_count?: number
  daily_completions: Array<{
    date: string
    count: number
  }>
  period_days: number
}

