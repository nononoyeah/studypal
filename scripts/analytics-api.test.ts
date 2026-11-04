import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'

import {
  fetchAchievements,
  fetchCalendar,
  fetchSummary,
  fetchTrend,
  UnauthorizedError,
} from '../src/api/analytics.ts'

// node 环境内存版 localStorage（与 auth-flow.test.ts 相同约定）
const store = new Map<string, string>()
globalThis.localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
} as Storage

function jsonResponse(status: number, body: unknown = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

let nextResponses: Array<{ status: number; body?: unknown }> = []
let lastUrl: string | null = null
let lastAuth: string | null = null

beforeEach(() => {
  store.set('access_token', 'token-1')
  store.set('refresh_token', 'refresh-1')
})

// mock fetch：按脚本依次返回，记录 URL 与 Authorization
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  lastUrl = String(input)
  lastAuth = (init?.headers as Headers)?.get('Authorization') ?? null
  const step = nextResponses.shift()
  if (!step) throw new Error('意外请求')
  return jsonResponse(step.status, step.body)
}) as typeof fetch

describe('analytics api', () => {
  beforeEach(() => {
    nextResponses = []
    lastUrl = null
    lastAuth = null
  })

  it('fetchSummary 携带 JWT 并解析响应', async () => {
    nextResponses = [
      {
        status: 200,
        body: {
          activeDaysTotal: 3,
          activeDaysThisWeek: 2,
          streak: 2,
          messageCount: 5,
          xp: 240,
        },
      },
    ]
    const summary = await fetchSummary()
    assert.equal(lastUrl, 'http://localhost:8000/api/analytics/summary')
    assert.equal(lastAuth, 'Bearer token-1')
    assert.equal(summary.streak, 2)
    assert.equal(summary.xp, 240)
  })

  it('fetchTrend 传递 period 参数', async () => {
    nextResponses = [{ status: 200, body: { period: 'week', days: [] } }]
    const trend = await fetchTrend('week')
    assert.equal(lastUrl, 'http://localhost:8000/api/analytics/trend?period=week')
    assert.equal(trend.period, 'week')
  })

  it('fetchCalendar 传递 month 参数', async () => {
    nextResponses = [{ status: 200, body: { month: '2026-11', days: [] } }]
    const calendar = await fetchCalendar('2026-11')
    assert.equal(lastUrl, 'http://localhost:8000/api/analytics/calendar?month=2026-11')
    assert.equal(calendar.month, '2026-11')
  })

  it('fetchAchievements 解析成就列表', async () => {
    nextResponses = [
      {
        status: 200,
        body: {
          achievements: [
            {
              id: 'xp-100',
              name: '初露锋芒',
              description: '累计经验值达到 100',
              dimension: 'xp',
              target: 100,
              progress: 120,
              unlocked: true,
            },
          ],
        },
      },
    ]
    const { achievements } = await fetchAchievements()
    assert.equal(achievements[0].unlocked, true)
  })

  it('401 时抛出 UnauthorizedError', async () => {
    nextResponses = [{ status: 401, body: { detail: '凭据缺失' } }]
    await assert.rejects(fetchSummary(), UnauthorizedError)
    nextResponses = [{ status: 401, body: { detail: '凭据缺失' } }]
    await assert.rejects(fetchAchievements(), UnauthorizedError)
  })

  it('5xx 时抛出普通错误', async () => {
    nextResponses = [{ status: 500, body: { detail: '服务器错误' } }]
    await assert.rejects(fetchCalendar('2026-11'), /请求失败（500）/)
    nextResponses = [{ status: 400, body: { detail: 'month 须为 YYYY-MM 格式' } }]
    await assert.rejects(fetchCalendar('bad'), /请求失败（400）/)
  })
})
