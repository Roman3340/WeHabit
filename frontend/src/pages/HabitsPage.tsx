import { useSearchParams, useNavigate, Navigate } from 'react-router-dom'
import { habitsApi } from '../services/api'
import HabitForm from '../components/HabitForm'
import './HabitsPage.css'

function HabitsPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const isNewMode = searchParams.get('new') === 'true'

  const handleCreateHabit = async (data: Parameters<typeof habitsApi.create>[0]) => {
    try {
      await habitsApi.create(data)
      navigate('/')
    } catch (error) {
      console.error('Failed to create habit:', error)
      alert('Ошибка при создании привычки')
    }
  }

  if (!isNewMode) {
    return <Navigate to="/" replace />
  }

  if (isNewMode) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1>Создать привычку</h1>
          <button className="btn btn-secondary" onClick={() => navigate('/')}>
            Отмена
          </button>
        </div>
        <HabitForm onSubmit={handleCreateHabit} />
      </div>
    )
  }

  return <Navigate to="/" replace />
}

export default HabitsPage

