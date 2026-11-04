import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchTrend, UnauthorizedError, type TrendDay } from '../api/analytics'

type LoadState = 'loading' | 'error' | 'ready'

const heightClasses = [
  'h-1',
  'h-2',
  'h-4',
  'h-6',
  'h-8',
  'h-10',
  'h-12',
  'h-14',
  'h-16',
  'h-18',
  'h-20',
  'h-22',
  'h-24',
]

function barClass(count: number, max: number) {
  const level = count === 0 ? 0 : Math.max(1, Math.round((count / max) * 12))
  return heightClasses[level]
}

function BarList({ days }: { days: TrendDay[] }) {
  const max = Math.max(...days.map((day) => day.messageCount))
  return (
    <div className="flex items-end justify-around gap-2 overflow-x-auto" role="img" aria-label="学习活跃趋势条形图">
      {days.map((day) => (
        <div key={day.date} className="flex flex-col items-center gap-1">
          <span className="text-xs text-zinc-400 dark:text-zinc-500">{day.messageCount}</span>
          <div
            className={`w-6 rounded-t-md bg-indigo-500 dark:bg-indigo-400 sm:w-8 ${barClass(day.messageCount, max)}`}
          />
          <span className="text-xs text-zinc-600 dark:text-zinc-400">{day.date.slice(5)}</span>
        </div>
      ))}
    </div>
  )
}

/**
 * 数据驱动的周/月活跃趋势图（每日对话消息数），SVG/CSS 实现，无第三方图表库
 */
export function AnalyticsTrendChart() {
  const [period, setPeriod] = useState<'week' | 'month'>('week')
  const [days, setDays] = useState<TrendDay[] | null>(null)
  const [state, setState] = useState<LoadState>('loading')
  const navigate = useNavigate()

  useEffect(() => {
    fetchTrend(period)
      .then((data) => {
        setDays(data.days)
        setState('ready')
      })
      .catch((error: unknown) => {
        if (error instanceof UnauthorizedError) navigate('/login')
        else setState('error')
      })
  }, [period, navigate])

  const retry = () => {
    setState('loading')
    fetchTrend(period)
      .then((data) => {
        setDays(data.days)
        setState('ready')
      })
      .catch((error: unknown) => {
        if (error instanceof UnauthorizedError) navigate('/login')
        else setState('error')
      })
  }

  const switchPeriod = (target: 'week' | 'month') => {
    setPeriod(target)
    setState('loading')
  }

  const isEmpty = state === 'ready' && days !== null && days.every((day) => day.messageCount === 0)

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">活跃趋势</h2>
        <div
          role="tablist"
          aria-label="趋势周期切换"
          className="flex rounded-full border border-zinc-200 p-1 text-sm dark:border-zinc-800"
        >
          {(['week', 'month'] as const).map((target) => (
            <button
              key={target}
              type="button"
              role="tab"
              aria-selected={period === target}
              onClick={() => switchPeriod(target)}
              className={
                'rounded-full px-4 py-1.5 font-medium transition-colors ' +
                (period === target
                  ? 'bg-indigo-600 text-white dark:bg-indigo-500'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white')
              }
            >
              {target === 'week' ? '周' : '月'}
            </button>
          ))}
        </div>
      </div>
      {state === 'error' ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-zinc-300 py-12 dark:border-zinc-700">
          <p className="text-zinc-500 dark:text-zinc-400">趋势数据加载失败，请稍后重试</p>
          <button
            type="button"
            onClick={retry}
            className="rounded-full bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400"
          >
            重试
          </button>
        </div>
      ) : isEmpty ? (
        <p className="rounded-xl border border-dashed border-zinc-300 py-16 text-center text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          暂无学习数据
        </p>
      ) : (
        <div className={state === 'loading' ? 'opacity-50' : ''}>
          {days && <BarList days={days} />}
        </div>
      )}
    </section>
  )
}
