import { useState } from 'react'
import './HabitForm.css'

interface HabitFormProps {
  onSubmit: (data: {
    name: string
    description?: string
    frequency?: string
    is_shared?: boolean
    participant_ids?: string[]
  }) => void
  initialData?: {
    name?: string
    description?: string
    frequency?: string
    is_shared?: boolean
  }
}

function HabitForm({ onSubmit, initialData }: HabitFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    frequency: initialData?.frequency || 'daily',
    is_shared: initialData?.is_shared || false,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      alert('Введите название привычки')
      return
    }
    onSubmit(formData)
  }

  return (
    <form className="habit-form glass-card" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="name">Название привычки *</label>
        <input
          id="name"
          type="text"
          className="input"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Например: Пить воду"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="description">Описание</label>
        <textarea
          id="description"
          className="input textarea"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Добавьте описание привычки..."
          rows={3}
        />
      </div>

      <div className="form-group">
        <label htmlFor="frequency">Частота</label>
        <select
          id="frequency"
          className="input"
          value={formData.frequency}
          onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
        >
          <option value="daily">Ежедневно</option>
          <option value="weekly">Еженедельно</option>
        </select>
      </div>

      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={formData.is_shared}
            onChange={(e) => setFormData({ ...formData, is_shared: e.target.checked })}
          />
          <span>Совместная привычка (с друзьями)</span>
        </label>
      </div>

      <button type="submit" className="btn">
        Создать привычку
      </button>
    </form>
  )
}

export default HabitForm

