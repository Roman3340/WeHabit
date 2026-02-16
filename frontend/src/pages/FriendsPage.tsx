import { useEffect, useState } from 'react'
import { friendsApi } from '../services/api'
import type { Friendship } from '../types'
import './FriendsPage.css'

function FriendsPage() {
  const [friends, setFriends] = useState<Friendship[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadFriends = async () => {
      try {
        const data = await friendsApi.getAll()
        setFriends(data)
      } catch (error) {
        console.error('Failed to load friends:', error)
      } finally {
        setLoading(false)
      }
    }
    loadFriends()
  }, [])

  const handleInviteClick = () => {
    if ((window as any).Telegram?.WebApp?.openTelegramLink) {
      // Здесь пользователь сможет заменить ссылку на реальную ссылку мини‑приложения
      ;(window as any).Telegram.WebApp.openTelegramLink(
        'https://t.me/your_bot_username'
      )
    } else if (navigator.share) {
      navigator
        .share({
          title: 'Habit Tracker',
          text: 'Строим привычки вместе 💪',
          url: window.location.href,
        })
        .catch(() => {})
    } else {
      alert('Отправьте другу ссылку на это мини‑приложение в Telegram.')
    }
  }

  if (loading) {
    return (
      <div className="feed-container">
        <div className="feed-loading">Загрузка...</div>
      </div>
    )
  }

  const hasFriends = friends.length > 0

  return (
    <div className="feed-container">
      <header className="feed-header">
        <div className="feed-date-label">Лента</div>
        <h1 className="feed-title">Пригласите своих друзей</h1>
        <p className="feed-subtitle">
          Следите за их прогрессом и поддерживайте друг друга каждый день.
        </p>
      </header>

      <section className="glass-card feed-invite-card">
        <div className="feed-avatars">
          <div className="feed-avatar-circle feed-avatar-main" />
          <div className="feed-avatar-circle feed-avatar-secondary" />
        </div>
        <button className="btn feed-invite-button" onClick={handleInviteClick}>
          Пригласить друга
        </button>
      </section>

      {hasFriends && (
        <section className="feed-friends-section">
          <h2 className="feed-section-title">Мои друзья</h2>
          <div className="feed-friends-list">
            {friends.map((friendship) => (
              <div key={friendship.id} className="glass-card friend-card">
                <div className="friend-avatar">
                  {friendship.friend?.avatar_emoji || '👤'}
                </div>
                <div className="friend-info">
                  <h3 className="friend-name">
                    {friendship.friend?.first_name ||
                      friendship.friend?.username ||
                      'Без имени'}
                  </h3>
                  {friendship.friend?.username && (
                    <p className="friend-username">
                      @{friendship.friend.username}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default FriendsPage

