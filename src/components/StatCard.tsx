/**
 * 单张学习统计卡片，value 缺失（null/undefined）时渲染 `--` 占位（specs 降级约定）
 */
export function StatCard({ title, value }: { title: string; value?: number | null }) {
  return (
    <article className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 text-center dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-3xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400">
        {value ?? '--'}
      </p>
      <p className="mt-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">{title}</p>
    </article>
  )
}
