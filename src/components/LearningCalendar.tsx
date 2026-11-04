import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchCalendar, UnauthorizedError, type CalendarDay } from '../api/analytics'

type LoadState = 'loading' | 'error' | 'ready'

const weekdayLabels = ['一', '二', '三', '四', '五', '六', '日']

function formatMonth(anchor: Date): string {
  return `${anchor.getFullYear()}-${String(anchor.getMonth() + 1).padStart(2, '0')}`
}

function shiftMonth(anchor: Date, delta: number): Date {
  return new Date(anchor.getFullYear(), anchor.getMonth() + delta, 1)
}

/**
 * 学习日历：月历展示活跃日打卡（活跃日 = 当日有对话消息），支持月份切换
 */
export function LearningCalendar() {
  const [anchor, setAnchor] = useState(() => new Date())
  const [days, setDays] = useState<CalendarDay[] | null>(null)
  const [state, setState] = useState<LoadState>('loading')
  const navigate = useNavigate()

  const month = formatMonth(anchor)
  const [todayStr] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  })

  useEffect(() => {
    fetchCalendar(month)
      .then((data) => {
        setDays(data.days)
        setState('ready')
      })
      .catch((error: unknown) => {
        if (error instanceof UnauthorizedError) navigate('/login')
        else setState('error')
      })
  }, [month, navigate])

  const changeMonth = (delta: number) => {
    setAnchor((prev) => shiftMonth(prev, delta))
    setState('loading')
  }

  const retry = () => {
    setState('loading')
    fetchCalendar(month)
      .then((data) => {
        setDays(data.days)
        setState('ready')
      })
      .catch((error: unknown) => {
        if (error instanceof UnauthorizedError) navigate('/login')
        else setState('error')
      })
  }

  const grid = useMemo(() => {
    const year = anchor.getFullYear()
    const monthIndex = anchor.getMonth()
    const firstWeekday = (new Date(year, monthIndex, 1).getDay() + 6) % 7
    const total = new Date(year, monthIndex + 1, 0).getDate()
    const prefix = `${year}-${String(monthIndex + 1).padStart(2, '0')}`
    return {
      firstWeekday,
      dateStrings: Array.from(
        { length: total },
        (_, i) => `${prefix}-${String(i + 1).padStart(2, '0')}`,
      ),
    }
  }, [anchor])

  const activeMap = useMemo(
    () => new Map((days ?? []).map((day) => [day.date, day])),
    [days],
  )

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">学习日历</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="上一月"
            onClick={() => changeMonth(-1)}
            className="rounded-full border border-zinc-200 px-3 py-1 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            ←
          </button>
          <span className="min-w-20 text-center text-sm font-medium text-zinc-900 dark:text-zinc-100">{month}</span>
          <button
            type="button"
            aria-label="下一月"
            onClick={() => changeMonth(1)}
            className="rounded-full border border-zinc-200 px-3 py-1 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            →
          </button>
        </div>
      </div>
      {state === 'error' ? (
        <div className="flex flex-col items-center gap-3 py-10">
          <p className="text-zinc-500 dark:text-zinc-400">日历数据加载失败，请稍后重试</p>
          <button
            type="button"
            onClick={retry}
            className="rounded-full bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400"
          >
            重试
          </button>
        </div>
      ) : (
        <div className={state === 'loading' ? 'opacity-50' : ''}>
          <div className="grid grid-cols-7 gap-1 text-center" role="grid" aria-label={`${month} 学习日历`}>
            {weekdayLabels.map((label) => (
              <span key={label} className="py-1 text-xs font-medium text-zinc-400 dark:text-zinc-500">
                {label}
              </span>
            ))}
            {Array.from({ length: grid.firstWeekday }, (_, i) => (
              <span key={`pad-${i}`} aria-hidden="true" />
            ))}
            {grid.dateStrings.map((dateStr) => {
              const dayNumber = Number(dateStr.slice(8))
              const active = activeMap.has(dateStr)
              const isFuture = dateStr > todayStr
              const isToday = dateStr === todayStr
              return (
                <span
                  key={dateStr}
                  className={
                    'flex h-9 w-full items-center justify-center rounded-md text-sm ' +
                    (active
                      ? 'bg-indigo-600 font-semibold text-white dark:bg-indigo-500'
                      : isFuture
                        ? 'text-zinc-300 dark:text-zinc-700'
                        : 'text-zinc-600 dark:text-zinc-400') +
                    (isToday ? ' ring-2 ring-indigo-400 dark:ring-indigo-500' : '')
                  }
                >
                  {dayNumber}
                </span>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}
