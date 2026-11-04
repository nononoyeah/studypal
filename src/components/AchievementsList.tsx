import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAchievements, UnauthorizedError, type AchievementItem } from '../api/analytics'

type LoadState = 'loading' | 'error' | 'ready'

function AchievementCard({ item }: { item: AchievementItem }) {
  return (
    <article
      className={
        'flex flex-col rounded-xl border p-5 ' +
        (item.unlocked
          ? 'border-indigo-200 bg-indigo-50 dark:border-indigo-900 dark:bg-indigo-950/40'
          : 'border-zinc-200 bg-zinc-50 grayscale dark:border-zinc-800 dark:bg-zinc-900')
      }
    >
      <div className="flex items-center justify-between">
        <span
          className={
            'flex h-10 w-10 items-center justify-center rounded-full text-xl ' +
            (item.unlocked
              ? 'bg-indigo-600 text-white dark:bg-indigo-500'
              : 'bg-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600')
          }
          aria-hidden="true"
        >
          {item.unlocked ? '🏆' : '🔒'}
        </span>
        <span
          className={
            'rounded-full px-2 py-0.5 text-xs font-medium ' +
            (item.unlocked
              ? 'bg-indigo-600 text-white dark:bg-indigo-500'
              : 'bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400')
          }
        >
          {item.unlocked ? '已解锁' : '未解锁'}
        </span>
      </div>
      <h3
        className={
          'mt-3 font-semibold ' +
          (item.unlocked
            ? 'text-zinc-900 dark:text-zinc-100'
            : 'text-zinc-500 dark:text-zinc-400')
        }
      >
        {item.name}
      </h3>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{item.description}</p>
      <p className="mt-3 text-sm font-medium text-indigo-600 dark:text-indigo-400">
        {item.progress}/{item.target}
      </p>
    </article>
  )
}

/**
 * 成就列表：解锁状态完全来自服务端计算结果，不做本地推断
 */
export function AchievementsList() {
  const [items, setItems] = useState<AchievementItem[] | null>(null)
  const [state, setState] = useState<LoadState>('loading')
  const navigate = useNavigate()

  useEffect(() => {
    fetchAchievements()
      .then((data) => {
        setItems(data.achievements)
        setState('ready')
      })
      .catch((error: unknown) => {
        if (error instanceof UnauthorizedError) navigate('/login')
        else setState('error')
      })
  }, [navigate])

  const retry = () => {
    setState('loading')
    fetchAchievements()
      .then((data) => {
        setItems(data.achievements)
        setState('ready')
      })
      .catch((error: unknown) => {
        if (error instanceof UnauthorizedError) navigate('/login')
        else setState('error')
      })
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-4 text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">成就</h2>
      {state === 'error' ? (
        <div className="flex flex-col items-center gap-3 py-10">
          <p className="text-zinc-500 dark:text-zinc-400">成就数据加载失败，请稍后重试</p>
          <button
            type="button"
            onClick={retry}
            className="rounded-full bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400"
          >
            重试
          </button>
        </div>
      ) : state === 'loading' ? (
        <p className="py-10 text-center text-zinc-400 dark:text-zinc-500">正在加载成就…</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(items ?? []).map((item) => (
            <AchievementCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  )
}
