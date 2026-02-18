import { useNavigate } from 'react-router-dom'
import type { Habit, HabitColor } from '../types'
import './HabitCard.css'

const COLOR_CLASS: Record<HabitColor, string> = {
  gray: 'habit-card--gray',
  silver: 'habit-card--silver',
  gold: 'habit-card--gold',
  emerald: 'habit-card--emerald',
  sapphire: 'habit-card--sapphire',
  ruby: 'habit-card--ruby',
}

function HabitCard({ habit }: { habit: Habit }) {
  const navigate = useNavigate()
  const colorClass = habit.color && COLOR_CLASS[habit.color] ? COLOR_CLASS[habit.color] : 'habit-card--gold'

  return (
    <div className={`habit-card glass-card ${colorClass}`} onClick={() => navigate(`/habits/${habit.id}`)}>
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

