import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { useAuthForm, type AuthMode } from '../hooks/useAuthForm.ts'

const modeOptions: Array<{ value: AuthMode; label: string }> = [
  { value: 'login', label: '登录' },
  { value: 'register', label: '注册' },
]

const inputClass =
  'w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from
  const form = useAuthForm(() => navigate(from ?? '/chat', { replace: true }))

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void form.submit()
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-sm">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          {/* 登录/注册模式切换 */}
          <div className="mb-6 grid grid-cols-2 gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
            {modeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => form.switchMode(option.value)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  form.mode === option.value
                    ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100'
                    : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              用户名
            </label>
            <input
              type="text"
              value={form.username}
              onChange={(event) => form.setUsername(event.target.value)}
              maxLength={50}
              autoComplete="username"
              className={inputClass}
            />
            {form.errors.username ? (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{form.errors.username}</p>
            ) : null}

            <label className="mb-1 mt-4 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              密码
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(event) => form.setPassword(event.target.value)}
              maxLength={128}
              autoComplete={form.mode === 'login' ? 'current-password' : 'new-password'}
              className={inputClass}
            />
            {form.errors.password ? (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{form.errors.password}</p>
            ) : null}

            {form.submitError ? (
              <p
                role="alert"
                className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
              >
                {form.submitError}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={form.submitting}
              className="mt-6 w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              {form.submitting ? '提交中…' : form.mode === 'login' ? '登录' : '注册并登录'}
            </button>
          </form>

          {form.mode === 'register' ? (
            <p className="mt-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
              注册成功后将自动登录
            </p>
          ) : null}
        </div>

        <div className="mt-4 text-center">
          <Link
            to="/"
            className="text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            ← 返回首页
          </Link>
        </div>
      </div>
    </div>
  )
}
