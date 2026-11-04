import { authFetch, UnauthorizedError } from './auth.ts'

const API_BASE: string = import.meta.env?.VITE_API_BASE ?? 'http://localhost:8000'

export { UnauthorizedError }

export interface AnalyticsSummary {
  activeDaysTotal: number
  activeDaysThisWeek: number
  streak: number
  messageCount: number
  xp: number
}

export interface TrendDay {
  date: string
  messageCount: number
}

export interface AnalyticsTrend {
  period: 'week' | 'month'
  days: TrendDay[]
}

export interface CalendarDay {
  date: string
  active: boolean
  messageCount: number
}

export interface AnalyticsCalendar {
  month: string
  days: CalendarDay[]
}

export interface AchievementItem {
  id: string
  name: string
  description: string
  dimension: string
  target: number
  progress: number
  unlocked: boolean
}

export interface AnalyticsAchievements {
  achievements: AchievementItem[]
}

async function getJson<T>(path: string): Promise<T> {
  const res = await authFetch(`${API_BASE}${path}`)
  if (res.status === 401) throw new UnauthorizedError()
  if (!res.ok) throw new Error(`请求失败（${res.status}）`)
  return (await res.json()) as T
}

export function fetchSummary(): Promise<AnalyticsSummary> {
  return getJson<AnalyticsSummary>('/api/analytics/summary')
}

export function fetchTrend(period: 'week' | 'month'): Promise<AnalyticsTrend> {
  return getJson<AnalyticsTrend>(`/api/analytics/trend?period=${period}`)
}

export function fetchCalendar(month: string): Promise<AnalyticsCalendar> {
  return getJson<AnalyticsCalendar>(`/api/analytics/calendar?month=${month}`)
}

export function fetchAchievements(): Promise<AnalyticsAchievements> {
  return getJson<AnalyticsAchievements>('/api/analytics/achievements')
}
