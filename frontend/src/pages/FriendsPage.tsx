import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { friendsApi } from '../services/api'
import type { Friendship } from '../types'
import './FriendsPage.css'

function FriendsPage() {
  const navigate = useNavigate()
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

  const inviteLink = typeof window !== 'undefined' ? window.location.origin + (import.meta.env.BASE_URL || '') : ''
  const handleInviteClick = () => {
    if (navigator.clipboard?.writeText(inviteLink)) {
      navigator.clipboard.writeText(inviteLink)
      alert('Ссылка скопирована — отправьте её другу.')
    } else {
      alert('Отправьте другу ссылку: ' + inviteLink)
    }
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="feed-loading">Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="page-container friends-page">
      <div className="page-header-row">
        <button type="button" className="back-btn" onClick={() => navigate('/profile')}>
          ← Назад
        </button>
        <h1>Друзья</h1>
      </div>
      <section className="glass-card feed-invite-card">
        <button className="btn feed-invite-button" onClick={handleInviteClick}>
          Пригласить друга
        </button>
      </section>
      {friends.length > 0 && (
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
                    <p className="friend-username">@{friendship.friend.username}</p>
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

