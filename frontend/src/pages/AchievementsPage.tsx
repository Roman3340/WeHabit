import { useNavigate } from 'react-router-dom'
import './AchievementsPage.css'

function AchievementsPage() {
  const navigate = useNavigate()

  return (
    <div className="page-container achievements-page">
      <div className="page-header-row">
        <button type="button" className="back-btn" onClick={() => navigate('/profile')}>
          ← Назад
        </button>
        <h1>Достижения</h1>
      </div>
      <div className="glass-card achievements-content">
        <p className="achievements-placeholder">
          Здесь будут отображаться ваши достижения за выполнение привычек.
        </p>
      </div>
    </div>
  )
}

export default AchievementsPage
