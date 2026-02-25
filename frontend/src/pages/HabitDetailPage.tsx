import { useMemo, useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { habitsApi, statsApi, friendsApi, profileApi } from '../services/api'
import type { Habit, HabitStats, HabitColor, User } from '../types'
import { formatDateKey, getDayLabels } from '../utils/week'
import type { FirstDayOfWeek } from '../utils/week'
import HabitForm, { type HabitFormData } from '../components/HabitForm'
import ParticipantSettingsForm, { type ParticipantSettingsFormData } from '../components/ParticipantSettingsForm'
import QRCode from 'qrcode'
import './HabitDetailPage.css'
import './FeedPage.css'

function SettingsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

const WEEKDAY_NAMES = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']

function formatDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const day = date.getDay()
  const weekdayName = WEEKDAY_NAMES[day === 0 ? 6 : day - 1]
  return `${weekdayName}, ${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}.${y}`
}

function HabitDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [habit, setHabit] = useState<Habit | null>(null)
  const [stats, setStats] = useState<HabitStats | null>(null)
  const [firstDay, setFirstDay] = useState<FirstDayOfWeek>('monday')
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [popupDate, setPopupDate] = useState<string | null>(null)
  const [popupLoading, setPopupLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [acceptModalOpen, setAcceptModalOpen] = useState(false)
  const [selectedColor, setSelectedColor] = useState<HabitColor | null>(null)
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteFriends, setInviteFriends] = useState<Array<{ id: string; name: string; avatar: string }>>([])
  const [inviteSelected, setInviteSelected] = useState<string[]>([])
  const [inviteLinkModalOpen, setInviteLinkModalOpen] = useState(false)
  const [inviteLinkUrl, setInviteLinkUrl] = useState<string | null>(null)
  const [inviteLinkQr, setInviteLinkQr] = useState<string | null>(null)
  const [inviteLinkLoading, setInviteLinkLoading] = useState(false)
  const [profilePopup, setProfilePopup] = useState<{ userId: string; name: string; avatar: string; bio?: string } | null>(null)
  const [me, setMe] = useState<User | null>(null)

  useEffect(() => {
    if (id) {
      loadHabit()
      loadStats()
    }
  }, [id])

  useEffect(() => {
    const load = async () => {
      try {
        const profile = await profileApi.get()
        setMe(profile)
        const fd = profile.first_day_of_week
        setFirstDay(fd === 'sunday' || fd === 'monday' ? fd : 'monday')
      } catch (e) {
        console.error('Failed to load profile', e)
      }
    }
    load()
  }, [])

  const loadHabit = async () => {
    if (!id) return
    try {
      const data = await habitsApi.getById(id)
      // Если есть принятые участники, но режим совместной привычки выключен — включаем его
      const acceptedCount = (data.participants || []).filter((p) => p.status === 'accepted').length
      if (!data.is_shared && acceptedCount > 1) {
        try {
          const updated = await habitsApi.update(id, { is_shared: true })
          setHabit(updated)
        } catch {
          setHabit(data)
        }
      } else {
        setHabit(data)
      }
    } catch (error) {
      console.error('Failed to load habit:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    if (!id) return
    try {
      const data = await statsApi.getHabitStats(id, 35)
      setStats(data)
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const handleComplete = async () => {
    if (!id) return
    setCompleting(true)
    try {
      const todayStr = formatDateKey(new Date())
      await habitsApi.complete(id, { date: todayStr })
      await loadStats()
      alert('Привычка отмечена как выполненная! 🎉')
    } catch (error: any) {
      if (error.response?.status === 400) {
        alert('Вы уже выполнили эту привычку сегодня!')
      } else {
        alert('Ошибка при отметке выполнения')
      }
    } finally {
      setCompleting(false)
    }
  }

  const handleCompleteForDate = async (dateStr: string) => {
    if (!id) return
    setPopupLoading(true)
    try {
      await habitsApi.complete(id, { date: dateStr })
      await loadStats()
      setPopupDate(null)
    } catch (error: any) {
      if (error.response?.status === 400) {
        alert('В этот день уже есть отметка.')
      } else {
        alert('Ошибка при отметке')
      }
    } finally {
      setPopupLoading(false)
    }
  }

  const handleRemoveLog = async (dateStr: string) => {
    if (!id) return
    setPopupLoading(true)
    try {
      await habitsApi.removeLog(id, dateStr)
      await loadStats()
      setPopupDate(null)
    } catch (error: any) {
      alert('Ошибка при снятии отметки')
    } finally {
      setPopupLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!id || !habit) return
    if (!confirm('Удалить привычку «' + habit.name + '»? Это действие нельзя отменить.')) return
    setDeleting(true)
    try {
      await habitsApi.delete(id)
      navigate('/')
    } catch (error) {
      console.error('Failed to delete habit:', error)
      alert('Ошибка при удалении')
    } finally {
      setDeleting(false)
    }
  }

  const handleEdit = async (formData: HabitFormData) => {
    if (!id) return
    setSaving(true)
    try {
      await habitsApi.update(id, formData)
      const toInvite = (formData.participant_ids || []).filter((uid) => {
        return !(habit?.participants || []).some((p) => p.id === uid)
      })
      if (formData.is_shared && toInvite.length > 0) {
        await habitsApi.invite(id, toInvite)
      }
      await loadHabit()
      await loadStats()
      setEditing(false)
      alert('Привычка обновлена!')
    } catch (error) {
      console.error('Failed to update habit:', error)
      alert('Ошибка при обновлении привычки')
    } finally {
      setSaving(false)
    }
  }

  const handleParticipantSettingsSave = async (formData: ParticipantSettingsFormData) => {
    if (!id) return
    setSaving(true)
    try {
      await habitsApi.updateMyParticipation(id, formData)
      await loadHabit()
      await loadStats()
      setEditing(false)
      alert('Настройки обновлены!')
    } catch (error) {
      console.error('Failed to update participant settings:', error)
      alert('Ошибка при обновлении настроек')
    } finally {
      setSaving(false)
    }
  }

  const scheduleLabel = useMemo(() => {
    if (!habit) return ''
    if (habit.weekly_goal_days != null) return `${habit.weekly_goal_days} из 7 дней`
    if (habit.days_of_week?.length) {
      const labels = getDayLabels(firstDay)
      const names = habit.days_of_week.map((d) => labels[(d - 1) % 7]).filter(Boolean)
      return names.length ? names.join(', ') : 'Еженедельно'
    }
    return habit.frequency === 'daily' ? 'Ежедневно' : 'Еженедельно'
  }, [habit, firstDay])

  const completedSet = useMemo(
    () => new Set((stats?.daily_completions ?? []).map((d) => d.date)),
    [stats?.daily_completions]
  )

  const dayLabels = useMemo(() => getDayLabels(firstDay), [firstDay])

  const today = useMemo(() => new Date(), [])
  const monthLabel = useMemo(() => {
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
    return `${monthNames[today.getMonth()]} ${today.getFullYear()}`
  }, [today])

  const monthWeeks = useMemo(() => {
    const year = today.getFullYear()
    const month = today.getMonth()
    const firstOfMonth = new Date(year, month, 1)
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    // 1=Пн .. 7=Вс
    const firstWeekdayIso = ((firstOfMonth.getDay() + 6) % 7) + 1
    const startOfWeek = firstDay === 'sunday' ? 7 : 1
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
          row.push(new Date(year, month, day))
          day += 1
        }
      }
      weeks.push(row)
    }
    return weeks
  }, [firstDay, today])

  const participantCompletionMap = useMemo(() => {
    const map: Record<
      string,
      {
        user_id: string
        color?: HabitColor
      }[]
    > = {}
    if (stats?.participant_completions) {
      stats.participant_completions.forEach((entry) => {
        const key = entry.date
        if (!map[key]) {
          map[key] = []
        }
        map[key].push({
          user_id: entry.user_id,
          color: entry.color as HabitColor | undefined,
        })
      })
    }
    return map
  }, [stats?.participant_completions])

  const ALL_COLORS: HabitColor[] = ['gray', 'silver', 'gold', 'emerald', 'sapphire', 'ruby']

  const getCellBackgroundStyle = (dateStr: string): React.CSSProperties | undefined => {
    const entries = participantCompletionMap[dateStr] || []
    if (!entries.length) {
      return undefined
    }
    const colors = entries
      .map((e) => e.color)
      .filter((c): c is HabitColor => !!c && (ALL_COLORS as string[]).includes(c))
    if (!colors.length) {
      return undefined
    }
    const uniqueColors: HabitColor[] = []
    colors.forEach((c) => {
      if (!uniqueColors.includes(c)) {
        uniqueColors.push(c)
      }
    })
    const cssColor = (c: HabitColor) => {
      if (c === 'gray') return '#a19d98'
      if (c === 'silver') return '#c0c0c0'
      if (c === 'gold') return '#d4af37'
      if (c === 'emerald') return '#40916c'
      if (c === 'sapphire') return '#4780ff'
      if (c === 'ruby') return '#c83c3c'
      return '#d4af37'
    }
    const count = uniqueColors.length
    const step = 100 / count
    const stops = uniqueColors.map((c, index) => {
      const start = index * step
      const end = (index + 1) * step
      return `${cssColor(c)} ${start}% ${end}%`
    })
    return {
      backgroundImage: `linear-gradient(135deg, ${stops.join(', ')})`,
    }
  }

  const openAcceptModal = () => {
    setSelectedColor(null)
    setAcceptModalOpen(true)
  }

  const availableColors: HabitColor[] = useMemo(() => {
    if (!habit) return []
    const used = new Set<HabitColor>()
    ;(habit.participants || []).forEach((p) => {
      if (p.status === 'accepted' && p.color) {
        used.add(p.color as HabitColor)
      }
    })
    return ALL_COLORS.filter((c) => !used.has(c))
  }, [habit?.participants])

  const handleAcceptInvitation = async () => {
    if (!habit || !id) return
    if (!selectedColor) return
    setInviteLoading(true)
    try {
      await habitsApi.acceptInvitation(id, { color: selectedColor })
      setAcceptModalOpen(false)
      await loadHabit()
      await loadStats()
    } catch (error) {
      alert('Не удалось принять приглашение')
    } finally {
      setInviteLoading(false)
    }
  }

  const handleDeclineInvitation = async () => {
    if (!habit || !id) return
    setInviteLoading(true)
    try {
      await habitsApi.declineInvitation(id)
      navigate('/')
    } catch {
      alert('Не удалось отклонить приглашение')
    } finally {
      setInviteLoading(false)
    }
  }

  const handleOpenInviteModal = async () => {
    if (!habit) return
    setInviteModalOpen(true)
    setInviteSelected([])
    try {
      const friends = await friendsApi.getAll()
      const participantIds = new Set((habit.participants || []).map((p) => p.id))
      const candidates = friends
        .map((fr) => fr.friend)
        .filter(Boolean)
        .filter((u) => !participantIds.has(u!.id))
        .map((u) => ({
          id: u!.id,
          name: ([u!.first_name, u!.last_name].filter(Boolean).join(' ') || u!.username || 'Друг'),
          avatar: u!.avatar_emoji,
        }))
      setInviteFriends(candidates)
    } catch (e) {
      console.error('Failed to load friends', e)
    }
  }

  const toggleInviteSelect = (uid: string) => {
    setInviteSelected((prev) => {
      const inHabit = (habit?.participants || []).length
      const maxSelectable = Math.max(0, 6 - inHabit)
      if (prev.includes(uid)) {
        return prev.filter((id) => id !== uid)
      }
      if (prev.length >= maxSelectable) return prev
      return [...prev, uid]
    })
  }

  const handleInviteSubmit = async () => {
    if (!habit || !id) return
    if (inviteSelected.length === 0) {
      setInviteModalOpen(false)
      return
    }
    setInviteLoading(true)
    try {
      if (!habit.is_shared) {
        await habitsApi.update(id, { is_shared: true })
      }
      await habitsApi.invite(id, inviteSelected)
      setInviteModalOpen(false)
      await loadHabit()
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Не удалось отправить приглашения')
    } finally {
      setInviteLoading(false)
    }
  }

  const openInviteLinkModal = async () => {
    setInviteModalOpen(false)
    setInviteLinkModalOpen(true)
    setInviteLinkUrl(null)
    setInviteLinkQr(null)
    setInviteLinkLoading(true)
    try {
      const inv = await friendsApi.getInvite()
      setInviteLinkUrl(inv.referral_url)
      const dataUrl = await QRCode.toDataURL(inv.referral_url, {
        width: 220,
        margin: 1,
        color: { dark: '#111827', light: '#F9FAFB' },
      })
      setInviteLinkQr(dataUrl)
    } catch {
      alert('Не удалось получить ссылку для приглашения')
      setInviteLinkModalOpen(false)
    } finally {
      setInviteLinkLoading(false)
    }
  }

  const handleRemoveParticipant = async (uid: string) => {
    if (!habit || !id) return
    if (!confirm('Удалить участника из привычки? Все его отметки будут удалены.')) return
    try {
      await habitsApi.removeParticipant(id, uid)
      setProfilePopup(null)
      await loadHabit()
      await loadStats()
    } catch {
      alert('Не удалось удалить участника')
    }
  }

  const handleLeaveHabit = async () => {
    if (!habit || !id) return
    if (!confirm('Выйти из привычки? Все ваши отметки будут удалены.')) return
    try {
      await habitsApi.leave(id)
      navigate('/')
    } catch {
      alert('Не удалось выйти из привычки')
    }
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading">Загрузка...</div>
      </div>
    )
  }

  if (!habit) {
    return (
      <div className="page-container">
        <div className="error">Привычка не найдена</div>
      </div>
    )
  }

  return (
    <div className="page-container habit-detail-page">
      <div className="habit-detail-header">
        <button type="button" className="back-btn" onClick={() => navigate('/')}>
          ← Назад
        </button>
      </div>

      {editing ? (
        <div className="habit-detail-card">
          {habit.can_edit ? (
            <>
              <div className="habit-detail-edit-header">
                <h2>Редактировать привычку</h2>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditing(false)}
                  disabled={saving}
                >
                  Отмена
                </button>
              </div>
              <HabitForm
                onSubmit={handleEdit}
                submitLabel="Сохранить изменения"
                initialData={{
                  name: habit.name,
                  description: habit.description,
                  frequency: habit.frequency,
                  is_shared:
                    habit.is_shared ||
                    ((habit.participants || []).filter((p) => p.status === 'accepted').length > 1),
                  color: habit.color || 'gold',
                  days_of_week: habit.days_of_week,
                  weekly_goal_days: habit.weekly_goal_days,
                  reminder_enabled: habit.reminder_enabled,
                  reminder_time: habit.reminder_time,
                }}
                excludeUserIds={(habit.participants || []).map((p) => p.id)}
                allowedColors={(() => {
                  if (!habit.is_shared) return undefined
                  const usedByOthers = new Set<HabitColor>()
                  ;(habit.participants || []).forEach((p) => {
                    if (p.id !== habit.created_by && p.status === 'accepted' && p.color) {
                      usedByOthers.add(p.color as HabitColor)
                    }
                  })
                  const ALL: HabitColor[] = ['gray', 'silver', 'gold', 'emerald', 'sapphire', 'ruby']
                  const allowed = ALL.filter((c) => !usedByOthers.has(c))
                  return allowed.length ? allowed : []
                })()}
              />
            </>
          ) : (
            <>
              <div className="habit-detail-edit-header">
                <h2>Настройки привычки</h2>
              </div>
              <ParticipantSettingsForm
                onSubmit={handleParticipantSettingsSave}
                onCancel={() => setEditing(false)}
                initialData={{
                  color: habit.participants?.find(p => p.id === me?.id)?.color || 'gold',
                  reminder_enabled: habit.participants?.find(p => p.id === me?.id)?.reminder_enabled,
                  reminder_time: habit.participants?.find(p => p.id === me?.id)?.reminder_time,
                }}
                allowedColors={(() => {
                  const usedByOthers = new Set<HabitColor>()
                  ;(habit.participants || []).forEach((p) => {
                    if (p.id !== me?.id && p.status === 'accepted' && p.color) {
                      usedByOthers.add(p.color as HabitColor)
                    }
                  })
                  const ALL: HabitColor[] = ['gray', 'silver', 'gold', 'emerald', 'sapphire', 'ruby']
                  return ALL.filter((c) => !usedByOthers.has(c))
                })()}
              />
            </>
          )}
        </div>
      ) : (
        <div
          className={`habit-detail-card habit-detail-card--${
            habit.participants?.find((p) => p.id === me?.id)?.color || habit.color || 'gold'
          }`}
        >
          <div className="habit-detail-title">
            <div className="habit-detail-title-text">
              <h1>{habit.name}</h1>
            </div>
            {habit.can_edit && (
              <button
                type="button"
                className="habit-detail-edit-icon"
                onClick={() => setEditing(true)}
                title="Редактировать привычку"
              >
                <SettingsIcon />
              </button>
            )}
            {!habit.can_edit && habit.is_shared && (
              <button
                type="button"
                className="habit-detail-edit-icon"
                onClick={() => setEditing(true)}
                title="Настроить привычку"
              >
                <SettingsIcon />
              </button>
            )}
          </div>

          {habit.description && (
            <p className="habit-detail-description">{habit.description}</p>
          )}

          {(habit.is_shared || ((habit.participants || []).filter((p) => p.status !== 'pending').length > 1)) && (
            <div className="habit-detail-info" style={{ marginTop: '-8px' }}>
              <div className="info-item" style={{ alignItems: 'center' }}>
                <span className="info-label">Участвуют:</span>
                <span className="info-value" style={{ display: 'flex', gap: 8 }}>
                  {(habit.participants || []).filter((p) => p.status !== 'pending').map((p) => {
                    const u = p.user
                    const name = u ? ([u.first_name, u.last_name].filter(Boolean).join(' ') || u.username || 'Друг') : 'Участник'
                    return (
                      <button
                        key={p.id}
                        type="button"
                        className="avatar-btn"
                        title={name}
                        onClick={() => u && setProfilePopup({ userId: u.id, name, avatar: u.avatar_emoji, bio: u.bio })}
                        style={{
                          width: 28, height: 28, borderRadius: 999, display: 'inline-flex',
                          alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)'
                        }}
                      >
                        <span style={{ fontSize: 18, lineHeight: 1 }}>{u?.avatar_emoji || '👤'}</span>
                      </button>
                    )
                  })}
                </span>
              </div>
            </div>
          )}

          <div className="habit-detail-info">
            <div className="info-item">
              <span className="info-label">Расписание:</span>
              <span className="info-value">{scheduleLabel}</span>
            </div>
          </div>

          {!habit.is_invited && (
            <div className="habit-detail-calendar">
              <div className="habit-calendar-month-label">{monthLabel}</div>
              <div className="habit-calendar-header">
                {dayLabels.map((l: string, i: number) => (
                  <span key={i} className="habit-calendar-day-label">{l}</span>
                ))}
              </div>
              {monthWeeks.map((week, wi) => {
                const weekDates = week
                  .filter((d): d is Date => d != null)
                  .map((d) => formatDateKey(d))
                const weekCompletions = weekDates.filter((d) => completedSet.has(d)).length

                return (
                  <div key={wi} className="habit-calendar-week">
                    {week.map((cellDate, di) => {
                      if (!cellDate) {
                        return <div key={di} className="habit-calendar-cell habit-calendar-cell--empty" />
                      }

                      const dateStr = formatDateKey(cellDate)
                      const completed = completedSet.has(dateStr)
                      const weekdayNum = (cellDate.getDay() + 6) % 7 + 1
                      const inSchedule = !habit.days_of_week?.length || habit.days_of_week.includes(weekdayNum)
                      const notInSchedule = habit.days_of_week?.length && !inSchedule
                      const weeklyGoalReached =
                        habit.weekly_goal_days != null && weekCompletions >= habit.weekly_goal_days
                      const disabledStyle =
                        (notInSchedule && !completed) || (weeklyGoalReached && !completed)

                      const isToday = dateStr === formatDateKey(new Date())
                      const dayNumber = cellDate.getDate()
                      const style = getCellBackgroundStyle(dateStr)

                      return (
                        <button
                          key={di}
                          type="button"
                          className={`habit-calendar-cell ${completed ? 'completed' : ''} ${disabledStyle ? 'disabled' : ''}`}
                          title={formatDateLabel(dateStr)}
                          onClick={() => setPopupDate(dateStr)}
                          style={style}
                        >
                          <span className="habit-calendar-day-number">{dayNumber}</span>
                          {isToday && <span className="habit-calendar-today-dot" />}
                        </button>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          )}

          {!habit.is_invited && stats && (
            <div className="habit-stats">
              <h3>Статистика</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-value">{stats.current_streak}</div>
                  <div className="stat-label">Дней подряд</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{stats.total_completions}</div>
                  <div className="stat-label">Всего выполнено</div>
                </div>
                {(stats.above_norm_count ?? 0) > 0 && (
                  <div className="stat-item stat-item--extra">
                    <div className="stat-value">{stats.above_norm_count}</div>
                    <div className="stat-label">Сверх нормы</div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="habit-detail-actions">
            {!habit.is_invited && (
              <button
                className="btn btn-success"
                onClick={handleComplete}
                disabled={completing}
              >
                {completing ? 'Отмечаю...' : '✓ Отметить выполнение'}
              </button>
            )}
            {habit.is_invited && (
              <>
                <button className="btn btn-success" onClick={openAcceptModal} disabled={inviteLoading}>
                  Принять
                </button>
                <button className="btn btn-secondary" onClick={handleDeclineInvitation} disabled={inviteLoading}>
                  Отклонить
                </button>
              </>
            )}
            {habit.can_edit && !habit.is_invited && (
              <button className="btn" onClick={handleOpenInviteModal} disabled={inviteLoading}>
                Пригласить друга
              </button>
            )}
            {!habit.can_edit && !habit.is_invited && (
              <button className="btn btn-secondary" onClick={handleLeaveHabit}>
                Выйти из привычки
              </button>
            )}
            {habit.can_edit && (
              <button
                type="button"
                className="habit-detail-delete-link"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? '…' : '× Удалить привычку'}
              </button>
            )}
          </div>
        </div>
      )}

      {popupDate && !habit.is_invited && (
        <div className="habit-cell-popup-overlay" onClick={() => setPopupDate(null)}>
          <div className="glass-card habit-cell-popup" onClick={(e) => e.stopPropagation()}>
            <h3 className="habit-cell-popup-title">{formatDateLabel(popupDate)}</h3>
            <p className="habit-cell-popup-date">{popupDate}</p>
            {completedSet.has(popupDate) ? (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => handleRemoveLog(popupDate)}
                disabled={popupLoading}
              >
                {popupLoading ? '…' : 'Убрать отметку'}
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-success"
                onClick={() => handleCompleteForDate(popupDate)}
                disabled={popupLoading}
              >
                {popupLoading ? '…' : 'Отметить выполнение'}
              </button>
            )}
            <button type="button" className="btn btn-secondary habit-cell-popup-close" onClick={() => setPopupDate(null)}>
              Закрыть
            </button>
          </div>
        </div>
      )}

      {acceptModalOpen && (
        <div className="habit-cell-popup-overlay" onClick={() => setAcceptModalOpen(false)}>
          <div className="glass-card habit-cell-popup" onClick={(e) => e.stopPropagation()}>
            <h3 className="habit-cell-popup-title">Выберите свой цвет</h3>
            <div className="habit-form-colors" style={{ marginBottom: '12px' }}>
              {availableColors.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`habit-form-color-btn habit-form-color-btn--${c} ${selectedColor === c ? 'active' : ''}`}
                  onClick={() => setSelectedColor(c)}
                />
              ))}
            </div>
            <button className="btn btn-success" disabled={!selectedColor || inviteLoading} onClick={handleAcceptInvitation}>
              Сохранить
            </button>
            <button className="btn btn-secondary habit-cell-popup-close" onClick={() => setAcceptModalOpen(false)}>
              Отмена
            </button>
          </div>
        </div>
      )}

      {inviteModalOpen && (
        <div className="habit-cell-popup-overlay" onClick={() => setInviteModalOpen(false)}>
          <div className="glass-card habit-cell-popup" onClick={(e) => e.stopPropagation()}>
            <h3 className="habit-cell-popup-title">Пригласить друзей</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12, maxHeight: 260, overflow: 'auto' }}>
              {inviteFriends.length === 0 && <div style={{ color: 'var(--text-muted)' }}>Нет доступных друзей</div>}
              {inviteFriends.map((f) => {
                const selected = inviteSelected.includes(f.id)
                return (
                  <button
                    key={f.id}
                    type="button"
                    className={`habit-form-friend-btn ${selected ? 'selected' : ''}`}
                    onClick={() => toggleInviteSelect(f.id)}
                  >
                    <span className="habit-form-friend-avatar">{f.avatar}</span>
                    <span className="habit-form-friend-name">{f.name}</span>
                  </button>
                )
              })}
            </div>
            {inviteFriends.length > 0 && (
              <button className="btn btn-success" onClick={handleInviteSubmit} disabled={inviteLoading || inviteSelected.length === 0}>
                Пригласить
              </button>
            )}
            <button className="btn btn-secondary" onClick={openInviteLinkModal} disabled={inviteLoading}>
              Пригласить нового друга
            </button>
            <button className="btn btn-secondary habit-cell-popup-close" onClick={() => setInviteModalOpen(false)}>
              Закрыть
            </button>
          </div>
        </div>
      )}

      {inviteLinkModalOpen && (
        <div className="feed-popup-overlay" onClick={() => setInviteLinkModalOpen(false)}>
          <div className="glass-card feed-popup" onClick={(e) => e.stopPropagation()}>
            <h3 className="feed-popup-title">Пригласить друга</h3>
            <p className="feed-popup-desc">Отправьте ссылку или QR — друг сможет принять приглашение.</p>
            <div className="feed-popup-link-wrap">
              <input readOnly value={inviteLinkUrl || '…'} className="input feed-popup-input" />
              <button
                type="button"
                className="btn feed-popup-copy"
                disabled={!inviteLinkUrl}
                onClick={async () => {
                  try {
                    await navigator.clipboard?.writeText(inviteLinkUrl || '')
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
              {inviteLinkLoading ? (
                <div className="feed-popup-qr-loading">Генерирую QR…</div>
              ) : inviteLinkQr ? (
                <img className="feed-popup-qr-img" src={inviteLinkQr} alt="QR-код приглашения" />
              ) : (
                <div className="feed-popup-qr-loading">QR недоступен</div>
              )}
            </div>
            <button type="button" className="btn btn-secondary" onClick={() => setInviteLinkModalOpen(false)}>
              Закрыть
            </button>
          </div>
        </div>
      )}

      {profilePopup && (
        <div className="habit-cell-popup-overlay" onClick={() => setProfilePopup(null)}>
          <div className="glass-card habit-cell-popup" onClick={(e) => e.stopPropagation()}>
            <h3 className="habit-cell-popup-title">{profilePopup.name}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ fontSize: 28 }}>{profilePopup.avatar}</div>
              {profilePopup.bio && <div style={{ color: 'var(--text-muted)' }}>{profilePopup.bio}</div>}
            </div>
            {habit.can_edit && profilePopup.userId !== habit.created_by && (
              <button className="btn btn-secondary" onClick={() => handleRemoveParticipant(profilePopup.userId)}>
                Удалить из привычки
              </button>
            )}
            <button className="btn btn-secondary habit-cell-popup-close" onClick={() => setProfilePopup(null)}>
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default HabitDetailPage
