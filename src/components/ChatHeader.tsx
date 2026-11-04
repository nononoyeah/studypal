import { Link, useNavigate } from 'react-router-dom'

import { clearTokens, hasToken } from '../api/auth.ts'

export function ChatHeader() {
  const navigate = useNavigate()
  const loggedIn = hasToken()

  const handleLogout = () => {
    clearTokens()
    navigate('/', { replace: true })
  }

  return (
    <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center gap-3">
        <Link
          to="/"
          className="rounded-lg px-2 py-1 text-sm text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        >
          ← 返回
        </Link>
        <h1 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">AI 学习助手</h1>
      </div>
      <div className="flex items-center gap-2">
        {loggedIn ? (
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg px-2 py-1 text-sm text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            退出登录
          </button>
        ) : null}
        <span className="inline-flex items-center rounded-full border border-zinc-300 px-3 py-0.5 text-xs font-medium tracking-wide text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          DeepSeek
        </span>
      </div>
    </header>
  )
}
