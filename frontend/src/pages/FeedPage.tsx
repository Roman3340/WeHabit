import { useEffect, useMemo, useState } from 'react'
import * as QRCode from 'qrcode'
import { friendsApi, feedApi } from '../services/api'
import './FeedPage.css'

function FeedPage() {
  const [popupOpen, setPopupOpen] = useState(false)
  const [inviteUrl, setInviteUrl] = useState<string>('')
  const [qrUrl, setQrUrl] = useState<string>('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [feed, setFeed] = useState<Array<{
    id: string
    event_type: string
    created_at: string
    habit?: { id: string; name: string } | null
    actor?: { id: string; username?: string; first_name?: string; last_name?: string; avatar_emoji: string } | null
    achievement?: { type: string; tier: number } | null
  }>>([])
  const [hasFriends, setHasFriends] = useState(false)
  const [page, setPage] = useState(0)
  const pageSize = 20

  useEffect(() => {
    const loadFeed = async () => {
      try {
        const data = await feedApi.getAll()
        setFeed(data)
        setPage(0)
      } catch (e) {
        console.error('Failed to load feed', e)
      }
    }
    loadFeed()
  }, [])

  useEffect(() => {
    const loadInvite = async () => {
      if (!popupOpen) return
      setInviteLoading(true)
      try {
        const { referral_url } = await friendsApi.getInvite()
        setInviteUrl(referral_url)
        const dataUrl = await QRCode.toDataURL(referral_url, {
          width: 220,
          margin: 1,
          color: { dark: '#111827', light: '#F9FAFB' },
        })
        setQrUrl(dataUrl)
      } catch (e) {
        console.error('Failed to load invite link', e)
      } finally {
        setInviteLoading(false)
      }
    }
    loadInvite()
  }, [popupOpen])

  useEffect(() => {
    const loadFriends = async () => {
      try {
        const data = await friendsApi.getAll()
        setHasFriends(data.length > 0)
      } catch (e) {
        console.error('Failed to load friends', e)
      }
    }
    loadFriends()
  }, [])

  const grouped = useMemo(() => {
    const sorted = [...feed].sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    const start = page * pageSize
    const pageItems = sorted.slice(start, start + pageSize)
    const map: Record<string, typeof feed> = {}
    pageItems.forEach((ev) => {
      const d = new Date(ev.created_at)
      const key = d.toISOString().slice(0, 10)
      if (!map[key]) map[key] = []
      map[key].push(ev)
    })
    const entries = Object.entries(map).sort((a, b) => (a[0] < b[0] ? 1 : -1))
    return { entries, total: sorted.length }
  }, [feed, page, pageSize])

  const formatDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number)
    return `${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}.${y}`
  }

  const formatEventText = (ev: any): string => {
    const name = [ev.actor?.first_name, ev.actor?.last_name].filter(Boolean).join(' ') || ev.actor?.username || 'Друг'
    const habitName = ev.habit?.name ? `«${ev.habit.name}»` : ''
    switch (ev.event_type) {
      case 'invited':
        return `${name} пригласил(а) вас в привычку ${habitName}`
      case 'joined':
        return `${name} присоединился(лась) к вашей привычке ${habitName}`
      case 'declined':
        return `${name} отказался(лась) участвовать в вашей привычке ${habitName}`
      case 'left':
        return `${name} вышел(ла) из вашей привычки ${habitName}`
      case 'completed':
        return `${name} выполнил(а) привычку ${habitName}`
      case 'removed':
        return `${name} удалил(а) вас из своей привычки ${habitName}`
      case 'achievement': {
        const a = ev.achievement
        let achName = 'новое достижение'
        if (a) {
          if (a.type === 'total_days') achName = '«Выполняй привычку регулярно»'
          if (a.type === 'friends_count') achName = '«Приглашай друзей»'
          if (a.type === 'streak') achName = '«Держи серию в привычке»'
          if (a.type === 'habit_invites') achName = '«Веди привычки с друзьями»'
        }
        return `${name} получил(а) достижение ${achName}`
      }
      default:
        return `${name}: событие ${ev.event_type} ${habitName}`
    }
  }

  return (
    <div className="feed-page">
      <header className="feed-page-header">
        <h1 className="feed-page-title">Лента</h1>
        <p className="feed-page-subtitle">Прогресс и активность друзей</p>
      </header>

      {!hasFriends && (
        <section className="glass-card feed-invite-block">
          <button
            type="button"
            className="btn feed-invite-btn"
            onClick={() => setPopupOpen(true)}
          >
            Пригласить друга
          </button>
        </section>
      )}

      <section className="feed-activity">
        <h2 className="feed-activity-title">Активность</h2>
        {feed.length === 0 ? (
          <p className="feed-empty">Пока нет событий. Добавьте друзей и ведите привычки вместе.</p>
        ) : (
          <div className="feed-list">
            {grouped.entries.map(([dateKey, events]) => (
              <div key={dateKey} className="feed-group">
                <div className="feed-group-date">{formatDate(dateKey)}</div>
                <ul>
                  {events
                    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
                    .map((ev) => (
                      <li key={ev.id} className="feed-item">
                        <span className="feed-item-avatar">{ev.actor?.avatar_emoji || '👤'}</span>
                        <span className="feed-item-text">{formatEventText(ev)}</span>
                        <span className="feed-item-time">
                          {new Date(ev.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
            {grouped.total > pageSize && (
              <div className="feed-pagination">
                <button
                  type="button"
                  className="feed-page-btn"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  ← Новые
                </button>
                <span className="feed-page-counter">
                  {page + 1} / {Math.ceil(grouped.total / pageSize)}
                </span>
                <button
                  type="button"
                  className="feed-page-btn"
                  disabled={(page + 1) * pageSize >= grouped.total}
                  onClick={() =>
                    setPage((p) => ((p + 1) * pageSize >= grouped.total ? p : p + 1))
                  }
                >
                  Ранее →
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {popupOpen && (
        <div className="feed-popup-overlay" onClick={() => setPopupOpen(false)}>
          <div className="glass-card feed-popup" onClick={(e) => e.stopPropagation()}>
            <h3 className="feed-popup-title">Пригласить друга</h3>
            <p className="feed-popup-desc">Отправьте ссылку другу — он сможет открыть приложение и добавиться в друзья.</p>
            <div className="feed-popup-link-wrap">
              <input readOnly value={inviteUrl || '…'} className="input feed-popup-input" />
              <button
                type="button"
                className="btn feed-popup-copy"
                disabled={!inviteUrl}
                onClick={async () => {
                  try {
                    await navigator.clipboard?.writeText(inviteUrl)
                    alert('Ссылка скопирована')
                  } catch {
                    alert('Не удалось скопировать. Скопируйте ссылку вручную.')
                  }
                }}
              >
                Копировать
              </button>
            </div>

            <div className="feed-popup-qr">
              {inviteLoading ? (
                <div className="feed-popup-qr-loading">Генерирую QR…</div>
              ) : qrUrl ? (
                <img className="feed-popup-qr-img" src={qrUrl} alt="QR-код приглашения" />
              ) : (
                <div className="feed-popup-qr-loading">QR недоступен</div>
              )}
            </div>
            <button type="button" className="btn btn-secondary" onClick={() => setPopupOpen(false)}>
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default FeedPage
