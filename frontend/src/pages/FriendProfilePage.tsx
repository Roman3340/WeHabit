import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { friendsApi, achievementsApi } from '../services/api'
import type { Friendship } from '../types'
import './FriendProfilePage.css'

function FriendProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [friends, setFriends] = useState<Friendship[]>([])
  const [achievements, setAchievements] = useState<Array<{ type: string; tier: number }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await friendsApi.getAll()
        setFriends(data)
        if (id) {
          const ach = await achievementsApi.getUser(id)
          setAchievements(ach.map(a => ({ type: a.type, tier: a.tier })))
        }
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
      <div className="glass-card" style={{ marginTop: 12, padding: 12 }}>
        <div style={{ color: 'var(--text-secondary)', marginBottom: 6 }}>Достижения</div>
        {achievements.length === 0 ? (
          <div style={{ color: 'var(--text-muted)' }}>Нет достижений</div>
        ) : (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {achievements.map((a, i) => {
              const color =
                a.type === 'total_days' ? (a.tier === 1 ? 'bronze' : a.tier === 2 ? 'gold' : 'diamond')
                : a.type === 'friends_count' ? (a.tier === 1 ? 'bronze' : a.tier === 2 ? 'gold' : 'diamond')
                : a.type === 'streak' ? (a.tier === 1 ? 'bronze' : a.tier === 2 ? 'gold' : 'diamond')
                : a.type === 'habit_invites' ? (a.tier === 1 ? 'bronze' : a.tier === 2 ? 'gold' : 'diamond')
                : 'bronze'
              return (
                <span key={i} className={`ach-badge ach-badge--${color}`} title={`${a.type} ${a.tier}`}>
                  ★
                </span>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default FriendProfilePage

