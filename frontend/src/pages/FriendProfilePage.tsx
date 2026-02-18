import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { friendsApi } from '../services/api'
import type { Friendship } from '../types'
import './FriendProfilePage.css'

function FriendProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [friends, setFriends] = useState<Friendship[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await friendsApi.getAll()
        setFriends(data)
      } catch (e) {
        console.error('Failed to load friends', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const friend = useMemo(() => {
    const f = friends
      .map((fr) => fr.friend)
      .find((u) => (u?.id || '') === (id || ''))
    return f || null
  }, [friends, id])

  if (loading) {
    return (
      <div className="page-container friend-profile-page">
        <div className="loading">Загрузка...</div>
      </div>
    )
  }

  if (!friend) {
    return (
      <div className="page-container friend-profile-page">
        <button type="button" className="back-btn" onClick={() => navigate('/profile/friends')}>
          ← Назад
        </button>
        <div className="error">Профиль друга не найден</div>
      </div>
    )
  }

  const displayName =
    [friend.first_name, friend.last_name].filter(Boolean).join(' ') ||
    (friend.username ? '@' + friend.username : 'Профиль')

  return (
    <div className="page-container friend-profile-page">
      <button type="button" className="back-btn" onClick={() => navigate('/profile/friends')}>
        ← Назад
      </button>

      <div className="friend-profile-top">
        <div className="friend-profile-avatar">{friend.avatar_emoji || '👤'}</div>
        <div className="friend-profile-name">{displayName}</div>
      </div>

      {friend.bio && <div className="friend-profile-bio">{friend.bio}</div>}
    </div>
  )
}

export default FriendProfilePage

