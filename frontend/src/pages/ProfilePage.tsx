import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { profileApi } from '../services/api'
import type { User } from '../types'
import './ProfilePage.css'

const MENU_ITEMS = [
  { path: '/profile/achievements', label: 'Достижения' },
  { path: '/profile/friends', label: 'Друзья' },
  { path: '/profile/notifications', label: 'Уведомления' },
  { path: '/profile/settings', label: 'Настройки' },
]

function ProfilePage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await profileApi.get()
        setUser(data)
      } catch (error) {
        console.error('Failed to load profile:', error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="page-container">
        <div className="profile-loading">Загрузка...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="page-container">
        <div className="profile-error">Ошибка загрузки профиля</div>
      </div>
    )
  }

  const displayName = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Профиль'

  return (
    <div className="page-container profile-page">
      <div className="profile-top glass-card">
        <button
          type="button"
          className="profile-edit-row"
          onClick={() => navigate('/profile/edit')}
          aria-label="Настройки профиля"
        >
          <div className="profile-avatar">{user.avatar_emoji}</div>
          <div className="profile-name-block">
            <span className="profile-name">{displayName}</span>
          </div>
          <span className="profile-arrow">→</span>
        </button>
      </div>

      <nav className="profile-menu">
        {MENU_ITEMS.map((item) => (
          <button
            key={item.path}
            type="button"
            className="glass-card profile-menu-item"
            onClick={() => navigate(item.path)}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  )
}

export default ProfilePage
