import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { achievementsApi } from '../services/api'
import './AchievementsPage.css'

function AchievementsPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState<Array<{ id: string; type: string; tier: number; created_at: string }>>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<{ type: string; tier: number; created_at?: string } | null>(null)

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

  const getMeta = (type: string, tier: number) => {
    if (type === 'total_days') {
      return {
        title: 'Выполняй привычку регулярно',
        description:
          tier === 1
            ? 'Выполните любую привычку 7 дней.'
            : tier === 2
              ? 'Выполните привычки 14 дней.'
              : 'Выполните привычки 21 день.',
      }
    }
    if (type === 'friends_count') {
      return {
        title: 'Приглашай друзей',
        description:
          tier === 1
            ? 'Пригласите и подружитесь с 3 людьми.'
            : tier === 2
              ? 'Соберите 7 друзей.'
              : 'Расширьте круг до 10 друзей.',
      }
    }
    if (type === 'streak') {
      return {
        title: 'Держи серию в привычке',
        description:
          tier === 1
            ? 'Выполняйте одну привычку 5 дней подряд.'
            : tier === 2
              ? 'Выполняйте одну привычку 15 дней подряд.'
              : 'Выполняйте одну привычку 30 дней подряд.',
      }
    }
    if (type === 'habit_invites') {
      return {
        title: 'Веди привычки с друзьями',
        description:
          tier === 1
            ? 'Пригласите друга в одну из своих привычек.'
            : tier === 2
              ? 'Соберите компанию из трёх друзей в привычке.'
              : 'Сделайте привычку общим делом для пятерых друзей.',
      }
    }
    return {
      title: 'Достижение',
      description: '',
    }
  }

  const block = (
    title: string,
    type: string,
    tiers: Array<{ tier: number; label: string; color: 'bronze' | 'gold' | 'diamond' }>
  ) => {
    return (
      <div className="ach-block" key={type}>
        <div className="ach-block-title">{title}</div>
        <div className="ach-block-grid">
          {tiers.map((t) => {
            const isEarned = (earned[type] || []).includes(t.tier)
            return (
              <button
                key={t.tier}
                type="button"
                className={`ach-medal ach-medal--${t.color} ${isEarned ? 'achieved' : 'locked'}`}
                title={isEarned ? 'Получено' : 'Не получено'}
                onClick={() => {
                  const found = items.find((it) => it.type === type && it.tier === t.tier)
                  setSelected({
                    type,
                    tier: t.tier,
                    created_at: found?.created_at,
                  })
                }}
              >
                <span className="ach-medal-num">{t.label}</span>
              </button>
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
          <div className="achievements-loader">
            <div className="achievements-spinner" />
            <span>Загрузка достижений…</span>
          </div>
        </div>
      ) : (
        <div className="achievements-sections">
          {block('Выполняй привычку регулярно', 'total_days', [
            { tier: 1, label: '7', color: 'bronze' },
            { tier: 2, label: '14', color: 'gold' },
            { tier: 3, label: '21', color: 'diamond' },
          ])}
          {block('Приглашай друзей', 'friends_count', [
            { tier: 1, label: '3', color: 'bronze' },
            { tier: 2, label: '7', color: 'gold' },
            { tier: 3, label: '10', color: 'diamond' },
          ])}
          {block('Держи серию в привычке', 'streak', [
            { tier: 1, label: '5', color: 'bronze' },
            { tier: 2, label: '15', color: 'gold' },
            { tier: 3, label: '30', color: 'diamond' },
          ])}
          {block('Веди привычки с друзьями', 'habit_invites', [
            { tier: 1, label: '1', color: 'bronze' },
            { tier: 2, label: '3', color: 'gold' },
            { tier: 3, label: '5', color: 'diamond' },
          ])}
        </div>
      )}
      {selected && (
        <div className="ach-modal-overlay" onClick={() => setSelected(null)}>
          <div className="glass-card ach-modal" onClick={(e) => e.stopPropagation()}>
            {(() => {
              const meta = getMeta(selected.type, selected.tier)
              const color: 'bronze' | 'gold' | 'diamond' =
                selected.tier === 1 ? 'bronze' : selected.tier === 2 ? 'gold' : 'diamond'
              const achieved = !!items.find(
                (it) => it.type === selected.type && it.tier === selected.tier
              )
              return (
                <>
                  <h2 className="ach-modal-title">{meta.title}</h2>
                  <div className="ach-modal-medal-wrap">
                    <div
                      className={`ach-medal ach-medal--${color} ${
                        achieved ? 'achieved' : 'locked'
                      } ach-medal-large`}
                    >
                      <span className="ach-medal-num">
                        {selected.type === 'total_days'
                          ? selected.tier === 1
                            ? '7'
                            : selected.tier === 2
                              ? '14'
                              : '21'
                          : selected.type === 'friends_count'
                            ? selected.tier === 1
                              ? '3'
                              : selected.tier === 2
                                ? '7'
                                : '10'
                            : selected.type === 'streak'
                              ? selected.tier === 1
                                ? '5'
                                : selected.tier === 2
                                  ? '15'
                                  : '30'
                              : selected.type === 'habit_invites'
                                ? selected.tier === 1
                                  ? '1'
                                  : selected.tier === 2
                                    ? '3'
                                    : '5'
                                : ''}
                      </span>
                    </div>
                  </div>
                  <p className="ach-modal-description">{meta.description}</p>
                  <p className="ach-modal-date">
                    {selected.created_at
                      ? `Получено ${new Date(selected.created_at).toLocaleDateString('ru-RU', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        })}`
                      : 'Ещё не получено'}
                  </p>
                  <button
                    type="button"
                    className="btn btn-secondary ach-modal-close"
                    onClick={() => setSelected(null)}
                  >
                    Закрыть
                  </button>
                </>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}

export default AchievementsPage
