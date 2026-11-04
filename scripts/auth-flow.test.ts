import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'

import {
  authFetch,
  clearTokens,
  setTokens,
  UnauthorizedError,
} from '../src/api/auth.ts'

// node 环境内存版 localStorage
const store = new Map<string, string>()
globalThis.localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
} as Storage

const REAL = 'http://x/api/protected'

function jsonResponse(status: number, body: unknown = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/** mock fetch：按脚本依次返回响应，记录每次调用的 Authorization */
function mockFetch(script: Array<{ status: number; body?: unknown }>) {
  const calls: Array<string | null> = []
  let i = 0
  globalThis.fetch = (async (_input: unknown, init?: RequestInit) => {
    const step = script[Math.min(i, script.length - 1)]
    i += 1
    calls.push(new Headers(init?.headers).get('Authorization'))
    return jsonResponse(step.status, step.body)
  }) as typeof fetch
  return calls
}

beforeEach(() => {
  store.clear()
  setTokens('old-access', 'valid-refresh')
})

describe('authFetch 401 刷新恢复', () => {
  it('首请求 401 → 刷新 → 重放成功', async () => {
    const calls = mockFetch([
      { status: 401 },
      { status: 200, body: { access_token: 'new-access' } },
      { status: 200, body: { ok: true } },
    ])

    const res = await authFetch(REAL)
    assert.equal(res.status, 200)
    assert.equal(calls.length, 3)
    assert.equal(calls[0], 'Bearer old-access')
    assert.equal(calls[1], null) // refresh 走裸 fetch 不带 Authorization
    assert.equal(calls[2], 'Bearer new-access')
    assert.equal(store.get('access_token'), 'new-access')
    assert.equal(store.get('refresh_token'), 'valid-refresh')
  })

  it('并发 401 仅刷新一次，全部重放成功', async () => {
    let refreshCalls = 0
    globalThis.fetch = (async (_input: unknown, init?: RequestInit) => {
      const auth = new Headers(init?.headers).get('Authorization')
      const url = String(_input)
      if (url.includes('/api/auth/refresh')) {
        refreshCalls += 1
        await new Promise((r) => setTimeout(r, 5)) // 制造并发窗口
        return jsonResponse(200, { access_token: 'new-access' })
      }
      return jsonResponse(auth === 'Bearer new-access' ? 200 : 401)
    }) as typeof fetch

    const [a, b] = await Promise.all([authFetch(REAL), authFetch(REAL)])
    assert.equal(a.status, 200)
    assert.equal(b.status, 200)
    assert.equal(refreshCalls, 1)
  })

  it('refresh 失败 → 清凭据并抛 UnauthorizedError', async () => {
    mockFetch([{ status: 401 }, { status: 401 }])

    await assert.rejects(() => authFetch(REAL), UnauthorizedError)
    assert.equal(store.get('access_token'), undefined)
    assert.equal(store.get('refresh_token'), undefined)
  })

  it('无 refresh token 的 401 → 直接返回 401 响应', async () => {
    clearTokens()
    const calls = mockFetch([{ status: 401 }])

    const res = await authFetch(REAL)
    assert.equal(res.status, 401)
    assert.equal(calls.length, 1)
  })

  it('重放仍 401 → 返回 401 响应，不再二次刷新', async () => {
    let refreshCalls = 0
    globalThis.fetch = (async (_input: unknown, init?: RequestInit) => {
      const url = String(_input)
      if (url.includes('/api/auth/refresh')) {
        refreshCalls += 1
        return jsonResponse(200, { access_token: 'new-access' })
      }
      return jsonResponse(401)
    }) as typeof fetch

    const res = await authFetch(REAL)
    assert.equal(res.status, 401)
    assert.equal(refreshCalls, 1)
  })
})
