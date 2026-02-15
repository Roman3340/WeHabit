// Утилиты для работы с Telegram Web App

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string
        initDataUnsafe: {
          user?: {
            id: number
            first_name?: string
            last_name?: string
            username?: string
          }
        }
        ready: () => void
        expand: () => void
        close: () => void
        setHeaderColor?: (color: string) => void
        setBackgroundColor?: (color: string) => void
      }
    }
  }
}

export const initTelegramWebApp = () => {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    const tg = window.Telegram.WebApp
    tg.ready()
    tg.expand()
    
    // Настройка цветовой схемы (если методы доступны)
    if (tg.setHeaderColor) {
      tg.setHeaderColor('#f5f7fa')
    }
    if (tg.setBackgroundColor) {
      tg.setBackgroundColor('#f5f7fa')
    }
    
    return tg
  }
  return null
}

export const getTelegramUser = () => {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    return window.Telegram.WebApp.initDataUnsafe.user
  }
  return null
}

