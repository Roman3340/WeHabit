import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { friendsApi } from '../services/api'
import './FeedPage.css'

// Мокап событий ленты (позже с бэкенда)
const MOCK_FEED = [
  { id: '1', text: 'Андрей выполнил привычку «Утренняя пробежка»', time: '16:30' },
  { id: '2', text: 'Мария выполнила привычку «Читать книгу»', time: '14:00' },
]

function FeedPage() {
  const [popupOpen, setPopupOpen] = useState(false)
  const [inviteUrl, setInviteUrl] = useState<string>('')
  const [qrUrl, setQrUrl] = useState<string>('')
  const [inviteLoading, setInviteLoading] = useState(false)

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

  return (
    <div className="feed-page">
      <header className="feed-page-header">
        <h1 className="feed-page-title">Лента</h1>
        <p className="feed-page-subtitle">Прогресс и активность друзей</p>
      </header>

      <section className="glass-card feed-invite-block">
        <button
          type="button"
          className="btn feed-invite-btn"
          onClick={() => setPopupOpen(true)}
        >
          Пригласить друга
        </button>
      </section>

      <section className="feed-activity">
        <h2 className="feed-activity-title">Активность</h2>
        {MOCK_FEED.length === 0 ? (
          <p className="feed-empty">Пока нет событий. Добавьте друзей и ведите привычки вместе.</p>
        ) : (
          <ul className="feed-list">
            {MOCK_FEED.map((item) => (
              <li key={item.id} className="glass-card feed-item">
                <span className="feed-item-text">{item.text}</span>
                <span className="feed-item-time">{item.time}</span>
              </li>
            ))}
          </ul>
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
