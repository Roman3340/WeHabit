import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './SettingsPage.css'

function SettingsPage() {
  const navigate = useNavigate()
  const [firstDayOfWeek, setFirstDayOfWeek] = useState<'monday' | 'sunday'>('monday')
  const [language, setLanguage] = useState('ru')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleDeleteAccountClick = () => {
    setShowDeleteConfirm(true)
  }

  const handleDeleteConfirm = () => {
    // Пока не реализовано — только предупреждение
    alert('Удаление аккаунта пока недоступно. Все ваши данные будут безвозвратно удалены.')
    setShowDeleteConfirm(false)
  }

  return (
    <div className="page-container settings-page">
      <div className="page-header-row">
        <button type="button" className="back-btn" onClick={() => navigate('/profile')}>
          ← Назад
        </button>
        <h1>Настройки</h1>
      </div>
      <div className="glass-card settings-content">
        <div className="settings-group">
          <label className="settings-label">Первый день недели</label>
          <div className="settings-options">
            <button
              type="button"
              className={`settings-option ${firstDayOfWeek === 'monday' ? 'active' : ''}`}
              onClick={() => setFirstDayOfWeek('monday')}
            >
              Понедельник
            </button>
            <button
              type="button"
              className={`settings-option ${firstDayOfWeek === 'sunday' ? 'active' : ''}`}
              onClick={() => setFirstDayOfWeek('sunday')}
            >
              Воскресенье
            </button>
          </div>
        </div>
        <div className="settings-group">
          <label className="settings-label">Язык</label>
          <select
            className="input settings-select"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="ru">Русский</option>
            <option value="en">English</option>
          </select>
        </div>
        <div className="settings-group settings-danger">
          <button
            type="button"
            className="btn btn-danger settings-delete-btn"
            onClick={handleDeleteAccountClick}
          >
            Удалить аккаунт
          </button>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="settings-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="glass-card settings-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Удалить аккаунт?</h3>
            <p>
              Все ваши данные (профиль, привычки, история) будут безвозвратно удалены. Это действие нельзя отменить.
            </p>
            <div className="settings-modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(false)}>
                Отмена
              </button>
              <button className="btn btn-danger" onClick={handleDeleteConfirm}>
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SettingsPage
