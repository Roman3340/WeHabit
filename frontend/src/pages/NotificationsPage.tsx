import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './NotificationsPage.css'

function NotificationsPage() {
  const navigate = useNavigate()
  const [habitReminders, setHabitReminders] = useState(true)
  const [friendActivity, setFriendActivity] = useState(true)

  return (
    <div className="page-container notifications-page">
      <div className="page-header-row">
        <button type="button" className="back-btn" onClick={() => navigate('/profile')}>
          ← Назад
        </button>
        <h1>Уведомления</h1>
      </div>
      <div className="glass-card notifications-content">
        <div className="notification-row">
          <span className="notification-label">Напоминания о привычках</span>
          <label className="toggle">
            <input
              type="checkbox"
              checked={habitReminders}
              onChange={(e) => setHabitReminders(e.target.checked)}
            />
            <span className="toggle-slider" />
          </label>
        </div>
        <div className="notification-row">
          <span className="notification-label">События друзей (лента)</span>
          <label className="toggle">
            <input
              type="checkbox"
              checked={friendActivity}
              onChange={(e) => setFriendActivity(e.target.checked)}
            />
            <span className="toggle-slider" />
          </label>
        </div>
      </div>
    </div>
  )
}

export default NotificationsPage
