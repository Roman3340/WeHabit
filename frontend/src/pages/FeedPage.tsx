import { useState } from 'react'
import './FeedPage.css'

// Мокап событий ленты (позже с бэкенда)
const MOCK_FEED = [
  { id: '1', text: 'Андрей выполнил привычку «Утренняя пробежка»', time: '16:30' },
  { id: '2', text: 'Мария выполнила привычку «Читать книгу»', time: '14:00' },
]

function FeedPage() {
  const [popupOpen, setPopupOpen] = useState(false)

  const inviteLink = typeof window !== 'undefined' ? window.location.origin + (import.meta.env.BASE_URL || '') : 'https://t.me/your_bot/app'

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
              <input readOnly value={inviteLink} className="input feed-popup-input" />
              <button
                type="button"
                className="btn feed-popup-copy"
                onClick={() => {
                  navigator.clipboard?.writeText(inviteLink)
                  alert('Ссылка скопирована')
                }}
              >
                Копировать
              </button>
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
