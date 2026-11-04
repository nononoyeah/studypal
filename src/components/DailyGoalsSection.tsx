import { useState } from 'react'
import { goalList } from '../content/dailyGoals'
import { GoalItem } from './GoalItem'

/**
 * 每日目标清单：初始完成态来自 mock status，勾选切换仅本页生效（不持久化）
 */
export function DailyGoalsSection() {
  const [doneIds, setDoneIds] = useState(() =>
    new Set(
      goalList
        .filter((goal) => goal.status === 'done')
        .map((goal) => goal.id),
    ),
  )

  const toggleGoal = (id: string) =>
    setDoneIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })

  return (
    <section id="goals" className="bg-white dark:bg-zinc-950">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 md:text-3xl dark:text-zinc-100">
          今日目标
        </h2>
        {goalList.length === 0 ? (
          <p className="mt-6 rounded-xl border border-dashed border-zinc-300 py-12 text-center text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            今日暂无目标，去添加一个吧
          </p>
        ) : (
          <ul className="mt-6 flex flex-col gap-3">
            {goalList.map((goal) => (
              <GoalItem
                key={goal.id}
                goal={{ ...goal, status: doneIds.has(goal.id) ? 'done' : 'todo' }}
                onToggle={toggleGoal}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
