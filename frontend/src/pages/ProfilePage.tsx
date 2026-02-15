import { useEffect, useState } from 'react'
import { profileApi } from '../services/api'
import type { User } from '../types'
import './ProfilePage.css'

const EMOJI_OPTIONS = [
  '👤', '😊', '😎', '🤖', '🎯', '🚀', '⭐', '🔥',
  '💪', '🎨', '📚', '🎵', '🏃', '🧘', '🍕', '☕'
]

function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    avatar_emoji: '👤',
    bio: '',
  })

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const data = await profileApi.get()
      setUser(data)
      setFormData({
        username: data.username || '',
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

  const handleSave = async () => {
    try {
      const updated = await profileApi.update(formData)
      setUser(updated)
      setEditing(false)
      alert('Профиль обновлен!')
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
    <div className="page-container">
      <div className="page-header">
        <h1>Профиль</h1>
        {!editing && (
          <button className="btn" onClick={() => setEditing(true)}>
            Редактировать
          </button>
        )}
      </div>

      <div className="glass-card profile-card">
        <div className="profile-avatar-section">
          <div className="profile-avatar">
            {editing ? (
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
            ) : (
              <div className="avatar-display">{user.avatar_emoji}</div>
            )}
          </div>
        </div>

        <div className="profile-form">
          <div className="form-group">
            <label>Имя</label>
            {editing ? (
              <input
                type="text"
                className="input"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                placeholder="Ваше имя"
              />
            ) : (
              <div className="profile-value">{user.first_name || 'Не указано'}</div>
            )}
          </div>

          <div className="form-group">
            <label>Фамилия</label>
            {editing ? (
              <input
                type="text"
                className="input"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                placeholder="Ваша фамилия"
              />
            ) : (
              <div className="profile-value">{user.last_name || 'Не указано'}</div>
            )}
          </div>

          <div className="form-group">
            <label>Username</label>
            {editing ? (
              <input
                type="text"
                className="input"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="@username"
              />
            ) : (
              <div className="profile-value">{user.username ? `@${user.username}` : 'Не указано'}</div>
            )}
          </div>

          <div className="form-group">
            <label>О себе</label>
            {editing ? (
              <textarea
                className="input textarea"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Расскажите о себе..."
                rows={4}
              />
            ) : (
              <div className="profile-value">{user.bio || 'Не указано'}</div>
            )}
          </div>

          {editing && (
            <div className="form-actions">
              <button className="btn btn-secondary" onClick={() => {
                setEditing(false)
                loadProfile()
              }}>
                Отмена
              </button>
              <button className="btn" onClick={handleSave}>
                Сохранить
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfilePage

