import axios from 'axios'
import type { User, Habit, HabitLog, Friendship, HabitStats } from '../types'

const API_URL = import.meta.env.VITE_API_URL || '/api'

// Получение initData из Telegram Web App
const getTelegramInitData = (): string | null => {
  if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
    return (window as any).Telegram.WebApp.initData
  }
  return null
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Добавляем initData в заголовки для каждого запроса
api.interceptors.request.use((config) => {
  const initData = getTelegramInitData()
  if (initData) {
    config.headers['X-Telegram-Init-Data'] = initData
  }
  return config
})

// Auth
export const authApi = {
  getMe: async (): Promise<User> => {
    const response = await api.get('/auth/me')
    return response.data
  },
}

// Habits
export const habitsApi = {
  getAll: async (): Promise<Habit[]> => {
    const response = await api.get('/habits')
    return response.data
  },
  
  getById: async (id: string): Promise<Habit> => {
    const response = await api.get(`/habits/${id}`)
    return response.data
  },
  
  create: async (data: {
    name: string
    description?: string
    frequency?: string
    is_shared?: boolean
    participant_ids?: string[]
    color?: string
    days_of_week?: number[]
    weekly_goal_days?: number
    reminder_enabled?: boolean
    reminder_time?: string
  }): Promise<Habit> => {
    const response = await api.post('/habits', data)
    return response.data
  },
  
  update: async (id: string, data: {
    name?: string
    description?: string
    frequency?: string
    is_shared?: boolean
    color?: string
    days_of_week?: number[]
    weekly_goal_days?: number
    reminder_enabled?: boolean
    reminder_time?: string
  }): Promise<Habit> => {
    const response = await api.put(`/habits/${id}`, data)
    return response.data
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/habits/${id}`)
  },
  
  complete: async (id: string, options?: { notes?: string; date?: string }): Promise<HabitLog> => {
    const response = await api.post(`/habits/${id}/complete`, { notes: options?.notes, date: options?.date })
    return response.data
  },

  removeLog: async (id: string, dateStr: string): Promise<void> => {
    await api.delete(`/habits/${id}/logs/${dateStr}`)
  },

  acceptInvitation: async (id: string, data?: { color?: string }): Promise<Habit> => {
    const response = await api.post(`/habits/${id}/invitation/accept`, data || {})
    return response.data
  },

  declineInvitation: async (id: string): Promise<void> => {
    await api.post(`/habits/${id}/invitation/decline`)
  },
}

// Friends
export const friendsApi = {
  getAll: async (): Promise<Friendship[]> => {
    const response = await api.get('/friends')
    return response.data
  },

  getInvite: async (): Promise<{ referral_code: string; referral_url: string }> => {
    const response = await api.get('/friends/invite')
    return response.data
  },
  
  add: async (userId: string): Promise<void> => {
    await api.post(`/friends/${userId}`)
  },
  
  remove: async (userId: string): Promise<void> => {
    await api.delete(`/friends/${userId}`)
  },
}

// Stats
export const statsApi = {
  getHabitStats: async (habitId: string, days: number = 30): Promise<HabitStats> => {
    const response = await api.get(`/stats/habits/${habitId}?days=${days}`)
    return response.data
  },
}

// Profile
export const profileApi = {
  get: async (): Promise<User> => {
    const response = await api.get('/profile')
    return response.data
  },
  
  update: async (data: {
    username?: string
    first_name?: string
    last_name?: string
    avatar_emoji?: string
    bio?: string
    first_day_of_week?: string
  }): Promise<User> => {
    const response = await api.put('/profile', data)
    return response.data
  },
}

