import { NavLink, Outlet } from 'react-router-dom'
import { ThemeToggle } from './ThemeToggle'

const navItems = [
  { to: '/analysis', label: '学习数据', end: true },
  { to: '/analysis/suggestions', label: 'AI 对话建议', end: false },
  { to: '/analysis/goals', label: '学习目标', end: false },
]

/**
 * 学习分析区布局壳：左侧导航（依次：学习数据、AI 对话建议、学习目标）+ 子页出口
 */
export function AnalysisLayout() {
  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <aside className="flex w-56 shrink-0 flex-col border-r border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <NavLink
          to="/"
          className="mb-6 text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
        >
          ← 返回首页
        </NavLink>
        <nav aria-label="学习分析导航" className="flex flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                'rounded-lg px-3 py-2 text-sm font-medium transition-colors ' +
                (isActive
                  ? 'bg-indigo-600 text-white dark:bg-indigo-500'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto">
          <ThemeToggle />
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-4 sm:p-6">
        <Outlet />
      </main>
    </div>
  )
}
