import { useCallback, useState } from 'react'

import { AuthRequestError, login, register } from '../api/auth.ts'

export type AuthMode = 'login' | 'register'

export interface AuthFormErrors {
  username?: string
  password?: string
}

// 校验规则与后端契约一致：RegisterRequest username 1-50 / password 8-128
export function validateUsername(value: string): string | null {
  if (!value.trim()) return '请输入用户名'
  if (value.length > 50) return '用户名不能超过 50 个字符'
  return null
}

export function validatePassword(value: string): string | null {
  if (!value) return '请输入密码'
  if (value.length < 8) return '密码至少 8 位'
  if (value.length > 128) return '密码不能超过 128 位'
  return null
}

export function useAuthForm(onSuccess: () => void) {
  const [mode, setMode] = useState<AuthMode>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<AuthFormErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const switchMode = useCallback((next: AuthMode) => {
    setMode(next)
    setErrors({})
    setSubmitError(null)
  }, [])

  const submit = useCallback(async () => {
    const usernameError = validateUsername(username)
    const passwordError = validatePassword(password)
    if (usernameError || passwordError) {
      setErrors({ username: usernameError ?? undefined, password: passwordError ?? undefined })
      return
    }
    setErrors({})
    setSubmitError(null)
    setSubmitting(true)
    try {
      if (mode === 'register') {
        await register(username, password)
      }
      // 注册成功后用同一凭据登录（后端 register 不返回 token，见 design D2）
      await login(username, password)
      onSuccess()
    } catch (err: unknown) {
      setSubmitError(
        err instanceof AuthRequestError || err instanceof Error
          ? err.message
          : '操作失败，请重试',
      )
    } finally {
      setSubmitting(false)
    }
  }, [mode, username, password, onSuccess])

  return {
    mode,
    switchMode,
    username,
    setUsername,
    password,
    setPassword,
    errors,
    submitError,
    submitting,
    submit,
  }
}
