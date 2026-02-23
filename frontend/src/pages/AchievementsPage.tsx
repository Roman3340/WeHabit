import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { achievementsApi } from '../services/api'
import './AchievementsPage.css'

function AchievementsPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState<Array<{ id: string; type: string; tier: number; created_at: string }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await achievementsApi.getMy()
        setItems(data)
      } catch (e) {
        console.error('Failed to load achievements', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const earned = useMemo(() => {
    const byType: Record<string, number[]> = {}
    items.forEach((it) => {
      if (!byType[it.type]) byType[it.type] = []
      if (!byType[it.type].includes(it.tier)) byType[it.type].push(it.tier)
    })
    return byType
  }, [items])

  const block = (title: string, type: string, tiers: Array<{ tier: number; label: string; color: 'bronze' | 'gold' | 'diamond' }>) => {
    return (
      <div className="ach-block glass-card" key={type}>
        <div className="ach-block-title">{title}</div>
        <div className="ach-block-grid">
          {tiers.map((t) => {
            const isEarned = (earned[type] || []).includes(t.tier)
            return (
              <div className={`ach-medal ach-medal--${t.color} ${isEarned ? 'achieved' : 'locked'}`} key={t.tier} title={isEarned ? 'Получено' : 'Не получено'}>
                <span className="ach-medal-num">{t.label}</span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="page-container achievements-page">
      <div className="page-header-row">
        <button type="button" className="back-btn" onClick={() => navigate('/profile')}>
          ← Назад
        </button>
        <h1>Достижения</h1>
      </div>
      {loading ? (
        <div className="glass-card achievements-content">
          <p className="achievements-placeholder">Загрузка…</p>
        </div>
      ) : (
        <div className="achievements-sections">
          {block('По привычке (7/14/21 дней)', 'total_days', [
            { tier: 1, label: '7', color: 'bronze' },
            { tier: 2, label: '14', color: 'gold' },
            { tier: 3, label: '21', color: 'diamond' },
          ])}
          {block('Друзья (3/7/10)', 'friends_count', [
            { tier: 1, label: '3', color: 'bronze' },
            { tier: 2, label: '7', color: 'gold' },
            { tier: 3, label: '10', color: 'diamond' },
          ])}
          {block('Серия (5/15/30 дней)', 'streak', [
            { tier: 1, label: '5', color: 'bronze' },
            { tier: 2, label: '15', color: 'gold' },
            { tier: 3, label: '30', color: 'diamond' },
          ])}
          {block('Приглашения в привычку (1/3/5)', 'habit_invites', [
            { tier: 1, label: '1', color: 'bronze' },
            { tier: 2, label: '3', color: 'gold' },
            { tier: 3, label: '5', color: 'diamond' },
          ])}
        </div>
      )}
    </div>
  )
}

export default AchievementsPage
