export interface User {
  id: string
  telegram_id: number
  username?: string
  first_name?: string
  last_name?: string
  avatar_emoji: string
  bio?: string
  created_at: string
  updated_at: string
}

export interface Habit {
  id: string
  name: string
  description?: string
  frequency: string
  is_shared: boolean
  created_by: string
  created_at: string
  updated_at: string
  participants?: Array<{
    id: string
    joined_at: string
  }>
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
    avatar_emoji: string
  }
}

export interface HabitStats {
  habit_id: string
  total_completions: number
  current_streak: number
  daily_completions: Array<{
    date: string
    count: number
  }>
  period_days: number
}

