import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { habitsApi, statsApi, profileApi } from '../services/api'
import type { Habit } from '../types'
import type { FirstDayOfWeek } from '../utils/week'
import { getDayLabels } from '../utils/week'
import './YearlyReportPage.css'

function YearlyReportPage() {
  const navigate = useNavigate()
  const [habits, setHabits] = useState<Habit[]>([])
  const [years, setYears] = useState<number[]>([])
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [selectedHabitId, setSelectedHabitId] = useState<string | ''>('')
  const [completedDates, setCompletedDates] = useState<Set<string>>(new Set())
  const [firstDay, setFirstDay] = useState<FirstDayOfWeek>('monday')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [profile, habitsData] = await Promise.all([profileApi.get(), habitsApi.getAll()])
        const fd = profile.first_day_of_week
        setFirstDay(fd === 'sunday' || fd === 'monday' ? fd : 'monday')
        setHabits(habitsData)

        const initialHabitId = habitsData[0]?.id ?? ''
        setSelectedHabitId(initialHabitId || '')

        const year = new Date().getFullYear()
        const report = await statsApi.getYearlyReport(year, initialHabitId || undefined)
        setYears(report.years.length ? report.years : [year])
        setSelectedYear(year)
        setCompletedDates(new Set(report.completed_dates))
      } catch (e) {
        console.error('Failed to load yearly report data', e)
        setYears([new Date().getFullYear()])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    const load = async () => {
      if (!selectedYear || !selectedHabitId) {
        setCompletedDates(new Set())
        return
      }
      try {
        const report = await statsApi.getYearlyReport(selectedYear, selectedHabitId)
        setCompletedDates(new Set(report.completed_dates))
      } catch (e) {
        console.error('Failed to load yearly habit data', e)
        setCompletedDates(new Set())
      }
    }
    load()
  }, [selectedYear, selectedHabitId])

  const dayLabels = useMemo(() => getDayLabels(firstDay), [firstDay])

  const months = useMemo(() => {
    const monthNames = [
      'Январь',
      'Февраль',
      'Март',
      'Апрель',
      'Май',
      'Июнь',
      'Июль',
      'Август',
      'Сентябрь',
      'Октябрь',
      'Ноябрь',
      'Декабрь',
    ]

    const result: Array<{
      monthIndex: number
      label: string
      weeks: (Date | null)[][]
    }> = []

    const startOfWeek = firstDay === 'sunday' ? 7 : 1

    for (let month = 0; month < 12; month++) {
      const firstOfMonth = new Date(selectedYear, month, 1)
      const daysInMonth = new Date(selectedYear, month + 1, 0).getDate()

      const firstWeekdayIso = ((firstOfMonth.getDay() + 6) % 7) + 1
      const firstCellIndex = (firstWeekdayIso - startOfWeek + 7) % 7

      const totalCells = firstCellIndex + daysInMonth
      const rows = Math.ceil(totalCells / 7)

      const weeks: (Date | null)[][] = []
      let day = 1
      for (let w = 0; w < rows; w++) {
        const row: (Date | null)[] = []
        for (let d = 0; d < 7; d++) {
          const cellIndex = w * 7 + d
          if (cellIndex < firstCellIndex || day > daysInMonth) {
            row.push(null)
          } else {
            row.push(new Date(selectedYear, month, day))
            day += 1
          }
        }
        weeks.push(row)
      }

      result.push({
        monthIndex: month,
        label: monthNames[month],
        weeks,
      })
    }

    return result
  }, [selectedYear, firstDay])

  const completedSet = completedDates

  const habitOptions = habits

  const hasHabits = habitOptions.length > 0

  return (
    <div className="page-container yearly-page">
      <div className="page-header-row">
        <button type="button" className="back-btn" onClick={() => navigate('/profile')}>
          ← Назад
        </button>
        <h1>Годовой отчёт</h1>
      </div>

      <div className="glass-card yearly-controls">
        <div className="yearly-row">
          <span className="yearly-label">Год:</span>
          <select
            className="input yearly-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            disabled={loading}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div className="yearly-row">
          <span className="yearly-label">Привычка:</span>
          {hasHabits ? (
            <select
              className="input yearly-select"
              value={selectedHabitId}
              onChange={(e) => setSelectedHabitId(e.target.value)}
              disabled={loading}
            >
              {habitOptions.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="yearly-empty">
              <p>Привычек пока нет. Создайте первую!</p>
              <button type="button" className="btn btn-primary" onClick={() => navigate('/habits')}>
                Перейти к привычкам
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="yearly-calendars">
        {months.map((month, idx) => (
          <div key={month.monthIndex} className="yearly-month">
            <div className="yearly-month-title">{month.label}</div>
            <div className="yearly-month-grid">
              <div className="yearly-weekday-row">
                {dayLabels.map((label) => (
                  <span key={label} className="yearly-weekday">
                    {label[0]}
                  </span>
                ))}
              </div>
              {month.weeks.map((week, wi) => (
                <div key={wi} className="yearly-week-row">
                  {week.map((day, di) => {
                    if (!day) {
                      return <div key={di} className="yearly-day empty" />
                    }
                    const y = day.getFullYear()
                    const m = String(day.getMonth() + 1).padStart(2, '0')
                    const d = String(day.getDate()).padStart(2, '0')
                    const key = `${y}-${m}-${d}`
                    const done = completedSet.has(key)
                    return (
                      <div
                        key={di}
                        className={`yearly-day ${done ? 'done' : 'idle'} month-${(idx % 6) + 1}`}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default YearlyReportPage

