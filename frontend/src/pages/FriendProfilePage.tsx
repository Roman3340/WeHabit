import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { friendsApi, achievementsApi } from '../services/api'
import type { Friendship } from '../types'
import './FriendProfilePage.css'

function FriendProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [friends, setFriends] = useState<Friendship[]>([])
  const [achievements, setAchievements] = useState<Array<{ type: string; tier: number; created_at?: string }>>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<{ type: string; tier: number; created_at?: string } | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await friendsApi.getAll()
        setFriends(data)
        if (id) {
          const ach = await achievementsApi.getUser(id)
          setAchievements(ach.map((a) => ({ type: a.type, tier: a.tier, created_at: a.created_at })))
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
      <div className="glass-card friend-ach-card">
        <div className="friend-ach-header">Достижения</div>
        {achievements.length === 0 ? (
          <div className="friend-ach-empty">Нет достижений</div>
        ) : (
          <div className="friend-ach-grid">
            {achievements.map((a) => {
              const color: 'bronze' | 'gold' | 'diamond' =
                a.tier === 1 ? 'bronze' : a.tier === 2 ? 'gold' : 'diamond'
              const label =
                a.type === 'total_days'
                  ? a.tier === 1
                    ? '7'
                    : a.tier === 2
                      ? '14'
                      : '21'
                  : a.type === 'friends_count'
                    ? a.tier === 1
                      ? '3'
                      : a.tier === 2
                        ? '7'
                        : '10'
                    : a.type === 'streak'
                      ? a.tier === 1
                        ? '5'
                        : a.tier === 2
                          ? '15'
                          : '30'
                      : a.type === 'habit_invites'
                        ? a.tier === 1
                          ? '1'
                          : a.tier === 2
                            ? '3'
                            : '5'
                        : ''
              return (
                <button
                  key={`${a.type}-${a.tier}`}
                  type="button"
                  className={`ach-medal ach-medal--${color} achieved friend-ach-medal`}
                  onClick={() =>
                    setSelected({
                      type: a.type,
                      tier: a.tier,
                      created_at: a.created_at,
                    })
                  }
                >
                  <span className="ach-medal-num">{label}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
      <button
        type="button"
        className="btn btn-secondary friend-remove-btn"
        onClick={async () => {
          if (!id) return
          const confirmed = window.confirm('Удалить этого пользователя из друзей?')
          if (!confirmed) return
          try {
            await friendsApi.remove(id)
            navigate('/profile/friends')
          } catch {
            alert('Не удалось удалить друга')
          }
        }}
      >
        Удалить из друзей
      </button>
      {selected && (
        <div className="ach-modal-overlay" onClick={() => setSelected(null)}>
          <div className="glass-card ach-modal" onClick={(e) => e.stopPropagation()}>
            {(() => {
              const type = selected.type
              const tier = selected.tier
              const color: 'bronze' | 'gold' | 'diamond' =
                tier === 1 ? 'bronze' : tier === 2 ? 'gold' : 'diamond'
              let title = 'Достижение'
              let description = ''
              if (type === 'total_days') {
                title = 'Выполняй привычку регулярно'
                description =
                  tier === 1
                    ? 'Выполнено 7 дней привычек.'
                    : tier === 2
                      ? 'Выполнено 14 дней привычек.'
                      : 'Выполнено 21 день привычек.'
              } else if (type === 'friends_count') {
                title = 'Приглашай друзей'
                description =
                  tier === 1
                    ? 'Есть 3 друга.'
                    : tier === 2
                      ? 'Есть 7 друзей.'
                      : 'Есть 10 друзей.'
              } else if (type === 'streak') {
                title = 'Держи серию в привычке'
                description =
                  tier === 1
                    ? 'Серия 5 дней по одной привычке.'
                    : tier === 2
                      ? 'Серия 15 дней по одной привычке.'
                      : 'Серия 30 дней по одной привычке.'
              } else if (type === 'habit_invites') {
                title = 'Веди привычки с друзьями'
                description =
                  tier === 1
                    ? 'Приглашён друг в привычку.'
                    : tier === 2
                      ? 'Приглашено трое друзей в привычку.'
                      : 'Приглашено пятеро друзей в привычку.'
              }
              const dateText = selected.created_at
                ? `Получено ${new Date(selected.created_at).toLocaleDateString('ru-RU', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}`
                : ''
              return (
                <>
                  <h2 className="ach-modal-title">{title}</h2>
                  <div className="ach-modal-medal-wrap">
                    <div className={`ach-medal ach-medal--${color} ach-medal-large achieved`}>
                      <span className="ach-medal-num">
                        {type === 'total_days'
                          ? tier === 1
                            ? '7'
                            : tier === 2
                              ? '14'
                              : '21'
                          : type === 'friends_count'
                            ? tier === 1
                              ? '3'
                              : tier === 2
                                ? '7'
                                : '10'
                            : type === 'streak'
                              ? tier === 1
                                ? '5'
                                : tier === 2
                                  ? '15'
                                  : '30'
                              : type === 'habit_invites'
                                ? tier === 1
                                  ? '1'
                                  : tier === 2
                                    ? '3'
                                    : '5'
                                : ''}
                      </span>
                    </div>
                  </div>
                  <p className="ach-modal-description">{description}</p>
                  {dateText && <p className="ach-modal-date">{dateText}</p>}
                  <button
                    type="button"
                    className="btn btn-secondary ach-modal-close"
                    onClick={() => setSelected(null)}
                  >
                    Закрыть
                  </button>
                </>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}

export default FriendProfilePage

