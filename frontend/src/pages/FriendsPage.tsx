import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { friendsApi } from '../services/api'
import type { Friendship } from '../types'
import * as QRCode from 'qrcode'
import './FriendsPage.css'
import './FeedPage.css'

function FriendsPage() {
  const navigate = useNavigate()
  const [friends, setFriends] = useState<Friendship[]>([])
  const [loading, setLoading] = useState(true)
  const [popupOpen, setPopupOpen] = useState(false)
  const [inviteUrl, setInviteUrl] = useState<string>('')
  const [qrUrl, setQrUrl] = useState<string>('')
  const [inviteLoading, setInviteLoading] = useState(false)

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
        <button className="btn feed-invite-button" onClick={() => setPopupOpen(true)}>
          Пригласить друга
        </button>
      </section>
      {friends.length > 0 && (
        <section className="feed-friends-section">
          <h2 className="feed-section-title">Мои друзья</h2>
          <div className="feed-friends-list">
            {friends.map((friendship) => (
              <button
                key={friendship.id}
                type="button"
                className="glass-card friend-card"
                onClick={() => navigate(`/profile/friends/${friendship.friend?.id || ''}`)}
              >
                <div className="friend-avatar">
                  {friendship.friend?.avatar_emoji || '👤'}
                </div>
                <div className="friend-info">
                  <h3 className="friend-name">
                    {[friendship.friend?.first_name, friendship.friend?.last_name].filter(Boolean).join(' ') ||
                      friendship.friend?.username ||
                      'Без имени'}
                  </h3>
                  {friendship.friend?.username && (
                    <p className="friend-username">@{friendship.friend.username}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {popupOpen && (
        <div className="feed-popup-overlay" onClick={() => setPopupOpen(false)}>
          <div className="glass-card feed-popup" onClick={(e) => e.stopPropagation()}>
            <h3 className="feed-popup-title">Пригласить друга</h3>
            <p className="feed-popup-desc">Отправьте ссылку или QR — друг сможет принять приглашение.</p>
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

export default FriendsPage

