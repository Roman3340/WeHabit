import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { profileApi } from '../services/api'
import type { User } from '../types'
import './ProfileEditPage.css'

const EMOJI_OPTIONS = [
  '👤', '😊', '😎', '🥰', '🤪', '😇', '🤩', '🤖', '🎯', '🚀', '⭐', '🔥',
  '💪', '🎨', '📚', '🏃', '🧘',
  '❤️', '✨', '👻', '👀', '⚡️', '🍓', '💎'
]

function ProfileEditPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    avatar_emoji: '👤',
    bio: '',
  })

  useEffect(() => {
    const load = async () => {
      try {
        const data = await profileApi.get()
        setUser(data)
        setFormData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          avatar_emoji: data.avatar_emoji || '👤',
          bio: data.bio || '',
        })
      } catch (error) {
        console.error('Failed to load profile:', error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleSave = async () => {
    try {
      const updated = await profileApi.update(formData)
      setUser(updated)
      alert('Профиль обновлен!')
      navigate('/profile')
    } catch (error) {
      console.error('Failed to update profile:', error)
      alert('Ошибка при обновлении профиля')
    }
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading">Загрузка...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="page-container">
        <div className="error">Ошибка загрузки профиля</div>
      </div>
    )
  }

  return (
    <div className="page-container profile-edit-page">
      <div className="profile-edit-header">
        <button type="button" className="back-btn" onClick={() => navigate('/profile')}>
          ← Назад
        </button>
        <h1>Настройки профиля</h1>
      </div>

      <div className="profile-edit-card">
        <div className="profile-avatar-section">
          <div className="emoji-selector">
            <div className="emoji-grid">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  className={`emoji-option ${formData.avatar_emoji === emoji ? 'selected' : ''}`}
                  onClick={() => setFormData({ ...formData, avatar_emoji: emoji })}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="profile-form">
          <div className="form-group">
            <label>Имя</label>
            <input
              type="text"
              className="input"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  ;(e.currentTarget as HTMLElement).blur()
                }
              }}
              placeholder="Ваше имя"
              enterKeyHint="done"
            />
          </div>
          <div className="form-group">
            <label>Фамилия</label>
            <input
              type="text"
              className="input"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  ;(e.currentTarget as HTMLElement).blur()
                }
              }}
              placeholder="Ваша фамилия"
              enterKeyHint="done"
            />
          </div>
          <div className="form-group">
            <label>О себе</label>
            <textarea
              className="input textarea"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  ;(e.currentTarget as HTMLElement).blur()
                }
              }}
              placeholder="Расскажите о себе..."
              rows={4}
              enterKeyHint="done"
            />
          </div>
          <div className="form-actions">
            <button className="btn btn-secondary" onClick={() => navigate('/profile')}>
              Отмена
            </button>
            <button className="btn" onClick={handleSave}>
              Сохранить
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileEditPage
