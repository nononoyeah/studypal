import type { DailyGoal } from '../content/dailyGoals'

/**
 * 单条学习目标行，完成态样式：删除线 + 对勾标识；纯展示，状态由 Section 管理
 */
export function GoalItem({ goal, onToggle }: { goal: DailyGoal; onToggle: (id: string) => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onToggle(goal.id)}
        aria-pressed={goal.status === 'done'}
        className={
          'flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-base transition-colors ' +
          (goal.status === 'done'
            ? 'border-indigo-200 bg-indigo-50 text-zinc-400 line-through dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-zinc-500'
            : 'border-zinc-200 bg-white text-zinc-700 hover:border-indigo-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-indigo-700')
        }
      >
        <span
          aria-hidden="true"
          className={
            'flex h-5 w-5 flex-none items-center justify-center rounded-full border text-xs font-bold ' +
            (goal.status === 'done'
              ? 'border-indigo-500 bg-indigo-500 text-white dark:border-indigo-400 dark:bg-indigo-400'
              : 'border-zinc-300 text-transparent dark:border-zinc-600')
          }
        >
          ✓
        </span>
        {goal.title}
      </button>
    </li>
  )
}
