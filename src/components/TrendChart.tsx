import { useState } from 'react'
import { trendMonthly, trendWeekly, type TrendPoint } from '../content/learning'

/**
 * 条形高度档位类名表（h-1 起步，8px/档），纯 Tailwind 类实现比例映射，无内联 style
 */
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

function barClass(minutes: number, max: number) {
  const level = minutes === 0 ? 0 : Math.max(1, Math.round((minutes / max) * 12))
  return heightClasses[level]
}

function BarList({ points }: { points: TrendPoint[] }) {
  const max = Math.max(...points.map((point) => point.minutes))
  return (
    <div className="flex items-end justify-around gap-2" role="img" aria-label="学习时长条形图">
      {points.map((point) => (
        <div key={point.period} className="flex flex-col items-center gap-1">
          <span className="text-xs text-zinc-400 dark:text-zinc-500">{point.minutes}</span>
          <div
            className={`w-8 rounded-t-md bg-indigo-500 dark:bg-indigo-400 sm:w-12 ${barClass(point.minutes, max)}`}
          />
          <span className="text-sm text-zinc-600 dark:text-zinc-400">{point.period}</span>
        </div>
      ))}
    </div>
  )
}

/**
 * 周/月学习时长趋势图，标签切换，不引入第三方图表库
 */
export function TrendChart() {
  const [tab, setTab] = useState<'week' | 'month'>('week')
  const points = tab === 'week' ? trendWeekly : trendMonthly

  return (
    <section id="trends" className="bg-white dark:bg-zinc-950">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 md:text-3xl dark:text-zinc-100">
            学习趋势
          </h2>
          <div
            role="tablist"
            className="flex rounded-full border border-zinc-200 p-1 text-sm dark:border-zinc-800"
          >
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'week'}
              onClick={() => setTab('week')}
              className={
                'rounded-full px-4 py-1.5 font-medium transition-colors ' +
                (tab === 'week'
                  ? 'bg-indigo-600 text-white dark:bg-indigo-500'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white')
              }
            >
              周
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'month'}
              onClick={() => setTab('month')}
              className={
                'rounded-full px-4 py-1.5 font-medium transition-colors ' +
                (tab === 'month'
                  ? 'bg-indigo-600 text-white dark:bg-indigo-500'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white')
              }
            >
              月
            </button>
          </div>
        </div>
        {points.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-300 py-16 text-center text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            暂无学习数据
          </p>
        ) : (
          <BarList points={points} />
        )}
      </div>
    </section>
  )
}
