import { useEffect, useState } from 'react'
import { friendsApi } from '../services/api'
import type { Friendship } from '../types'
import './FriendsPage.css'

function FriendsPage() {
  const [friends, setFriends] = useState<Friendship[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFriends()
  }, [])

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

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading">Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Друзья</h1>
      </div>

      {friends.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <h2>Нет друзей</h2>
          <p>Добавьте друзей, чтобы вести совместные привычки!</p>
        </div>
      ) : (
        <div className="friends-list">
          {friends.map((friendship) => (
            <div key={friendship.id} className="glass-card friend-card">
              <div className="friend-avatar">
                {friendship.friend?.avatar_emoji || '👤'}
              </div>
              <div className="friend-info">
                <h3 className="friend-name">
                  {friendship.friend?.first_name || friendship.friend?.username || 'Без имени'}
                </h3>
                {friendship.friend?.username && (
                  <p className="friend-username">@{friendship.friend.username}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default FriendsPage

