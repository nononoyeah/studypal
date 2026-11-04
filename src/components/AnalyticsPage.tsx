import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchSummary, UnauthorizedError, type AnalyticsSummary } from '../api/analytics'
import { AchievementsList } from './AchievementsList'
import { AnalyticsTrendChart } from './AnalyticsTrendChart'
import { LearningCalendar } from './LearningCalendar'
import { StatCard } from './StatCard'

type LoadState = 'loading' | 'error' | 'ready'

const summaryCards: { key: keyof AnalyticsSummary; title: string }[] = [
  { key: 'activeDaysTotal', title: '累计活跃天数' },
  { key: 'activeDaysThisWeek', title: '本周活跃天数' },
  { key: 'streak', title: '连续活跃天数' },
  { key: 'messageCount', title: '累计对话消息' },
  { key: 'xp', title: '经验值 XP' },
]

/**
 * 学习数据页：概览统计卡片 + 活跃趋势图，数据来自 /api/analytics/*（JWT 认证）
 */
export function AnalyticsPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [state, setState] = useState<LoadState>('loading')
  const navigate = useNavigate()

  useEffect(() => {
    fetchSummary()
      .then((data) => {
        setSummary(data)
        setState('ready')
      })
      .catch((error: unknown) => {
        if (error instanceof UnauthorizedError) navigate('/login')
        else setState('error')
      })
  }, [navigate])

  const retry = () => {
    setState('loading')
    fetchSummary()
      .then((data) => {
        setSummary(data)
        setState('ready')
      })
      .catch((error: unknown) => {
        if (error instanceof UnauthorizedError) navigate('/login')
        else setState('error')
      })
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">学习数据</h1>
      {state === 'error' ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-zinc-300 bg-white py-16 dark:border-zinc-700 dark:bg-zinc-900">
          <p className="text-zinc-500 dark:text-zinc-400">学习数据加载失败，请稍后重试</p>
          <button
            type="button"
            onClick={retry}
            className="rounded-full bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400"
          >
            重试
          </button>
        </div>
      ) : (
        <>
          <p aria-live="polite" className="text-sm text-zinc-400 dark:text-zinc-500">
            {state === 'loading' ? '正在加载学习数据…' : ''}
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {summaryCards.map(({ key, title }) => (
              <StatCard key={key} title={title} value={summary ? summary[key] : null} />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <LearningCalendar />
            <AnalyticsTrendChart />
          </div>
          <AchievementsList />
        </>
      )}
    </div>
  )
}
