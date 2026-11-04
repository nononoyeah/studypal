const API_BASE: string = import.meta.env?.VITE_API_BASE ?? 'http://localhost:8000'
const ACCESS_KEY = 'access_token'
const REFRESH_KEY = 'refresh_token'

export class UnauthorizedError extends Error {
  constructor() {
    super('未登录或登录已过期')
  }
}

export class AuthRequestError extends Error {
  constructor(message: string) {
    super(message)
  }
}

export interface AuthUser {
  id: number
  username: string
}

export interface LoginResult {
  accessToken: string
  refreshToken: string
  user: AuthUser
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY)
}

export function hasToken(): boolean {
  return localStorage.getItem(ACCESS_KEY) !== null
}

export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(ACCESS_KEY, accessToken)
  localStorage.setItem(REFRESH_KEY, refreshToken)
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

async function extractDetail(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { detail?: unknown }
    if (typeof data.detail === 'string') return data.detail
  } catch {
    // 非 JSON 响应体，走通用文案
  }
  return `请求失败（${res.status}）`
}

export async function register(username: string, password: string): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) throw new AuthRequestError(await extractDetail(res))
  return (await res.json()) as AuthUser
}

export async function login(username: string, password: string): Promise<LoginResult> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) throw new AuthRequestError(await extractDetail(res))
  const data = (await res.json()) as {
    access_token: string
    refresh_token: string
    user: AuthUser
  }
  setTokens(data.access_token, data.refresh_token)
  return { accessToken: data.access_token, refreshToken: data.refresh_token, user: data.user }
}

// 单例 refresh promise：并发 401 只发起一次刷新（specs 场景约定）
let refreshingPromise: Promise<string> | null = null

async function refreshAccessToken(): Promise<string> {
  const refreshToken = localStorage.getItem(REFRESH_KEY)
  if (!refreshToken) {
    clearTokens()
    throw new UnauthorizedError()
  }
  // 裸 fetch：refresh 请求本身不走 authFetch，避免死循环
  const res = await fetch(`${API_BASE}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
  if (!res.ok) {
    clearTokens()
    throw new UnauthorizedError()
  }
  const data = (await res.json()) as { access_token: string }
  setTokens(data.access_token, refreshToken)
  return data.access_token
}

export async function authFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const token = getAccessToken()
  const headers = new Headers(init?.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const res = await fetch(input, { ...init, headers })
  if (res.status !== 401 || !localStorage.getItem(REFRESH_KEY)) return res

  if (!refreshingPromise) {
    refreshingPromise = refreshAccessToken().finally(() => {
      refreshingPromise = null
    })
  }
  let newToken: string
  try {
    newToken = await refreshingPromise
  } catch {
    throw new UnauthorizedError()
  }
  const retryHeaders = new Headers(init?.headers)
  retryHeaders.set('Authorization', `Bearer ${newToken}`)
  return fetch(input, { ...init, headers: retryHeaders })
}
