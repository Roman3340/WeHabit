import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { profileApi } from '../services/api'
import './NotificationsPage.css'

function NotificationsPage() {
  const navigate = useNavigate()
  const [habitReminders, setHabitReminders] = useState(true)
  const [friendActivity, setFriendActivity] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const profile = await profileApi.get()
        setHabitReminders(profile.habit_reminders_enabled ?? true)
        setFriendActivity(profile.feed_notifications_enabled ?? true)
      } catch (error) {
        console.error('Failed to load notification settings:', error)
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [])

  const handleHabitRemindersChange = async (enabled: boolean) => {
    setHabitReminders(enabled)
    try {
      await profileApi.update({ habit_reminders_enabled: enabled })
    } catch (error) {
      console.error('Failed to update habit reminders setting:', error)
      // Revert on error
      setHabitReminders(!enabled)
    }
  }

  const handleFriendActivityChange = async (enabled: boolean) => {
    setFriendActivity(enabled)
    try {
      await profileApi.update({ feed_notifications_enabled: enabled })
    } catch (error) {
      console.error('Failed to update friend activity setting:', error)
      // Revert on error
      setFriendActivity(!enabled)
    }
  }

  return (
    <div className="page-container notifications-page">
      <div className="page-header-row">
        <button type="button" className="back-btn" onClick={() => navigate('/profile')}>
          ← Назад
        </button>
        <h1>Уведомления</h1>
      </div>
      <div className="glass-card notifications-content">
        {loading ? (
          <p>Загрузка...</p>
        ) : (
          <>
            <div className="notification-row">
              <span className="notification-label">Напоминания о привычках</span>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={habitReminders}
                  onChange={(e) => handleHabitRemindersChange(e.target.checked)}
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
                  onChange={(e) => handleFriendActivityChange(e.target.checked)}
                />
                <span className="toggle-slider" />
              </label>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default NotificationsPage
