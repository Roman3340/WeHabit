import { useNavigate } from 'react-router-dom'
import type { Habit } from '../types'
import './HabitCard.css'

interface HabitCardProps {
  habit: Habit
}

function HabitCard({ habit }: HabitCardProps) {
  const navigate = useNavigate()

  return (
    <div className="habit-card glass-card" onClick={() => navigate(`/habits/${habit.id}`)}>
      <div className="habit-header">
        <h3 className="habit-name">{habit.name}</h3>
        {habit.is_shared && (
          <span className="shared-badge">👥</span>
        )}
      </div>
      {habit.description && (
        <p className="habit-description">{habit.description}</p>
      )}
      <div className="habit-footer">
        <span className="habit-frequency">{habit.frequency === 'daily' ? 'Ежедневно' : 'Еженедельно'}</span>
        {habit.participants && habit.participants.length > 1 && (
          <span className="participants-count">
            {habit.participants.length} участников
          </span>
        )}
      </div>
    </div>
  )
}

export default HabitCard

