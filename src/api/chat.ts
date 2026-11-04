import {
  authFetch,
  getAccessToken,
  UnauthorizedError as ChatUnauthorizedError,
} from './auth.ts'

const API_BASE: string = import.meta.env?.VITE_API_BASE ?? 'http://localhost:8000'

export interface ChatMessageItem {
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

export type StreamEvent =
  | { type: 'delta'; content: string }
  | { type: 'done' }
  | { type: 'error'; message: string }

export { UnauthorizedError as ChatUnauthorizedError } from './auth.ts'

export function hasToken(): boolean {
  return getAccessToken() !== null
}

export function extractSseEvents(buffer: string): {
  events: StreamEvent[]
  rest: string
} {
  const events: StreamEvent[] = []
  const parts = buffer.split('\n\n')
  const rest = parts.pop() ?? ''
  for (const part of parts) {
    const dataLine = part.split('\n').find((line) => line.startsWith('data:'))
    if (!dataLine) continue
    try {
      events.push(JSON.parse(dataLine.slice(5).trim()) as StreamEvent)
    } catch {
      // 单个坏事件跳过，不中断整个流
    }
  }
  return { events, rest }
}

export async function fetchHistory(): Promise<ChatMessageItem[]> {
  const res = await authFetch(`${API_BASE}/api/chat/messages`)
  if (res.status === 401) throw new ChatUnauthorizedError()
  if (!res.ok) throw new Error(`加载历史消息失败（${res.status}）`)
  const data = (await res.json()) as {
    messages: { role: string; content: string; created_at: string }[]
  }
  return data.messages.map((m) => ({
    role: m.role as ChatMessageItem['role'],
    content: m.content,
    createdAt: m.created_at,
  }))
}

export async function sendMessage(
  content: string,
  onEvent: (event: StreamEvent) => void,
): Promise<void> {
  const res = await authFetch(`${API_BASE}/api/chat/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
  if (res.status === 401) throw new ChatUnauthorizedError()
  if (!res.ok || !res.body) throw new Error(`发送失败（${res.status}）`)

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const { events, rest } = extractSseEvents(buffer)
    buffer = rest
    for (const event of events) onEvent(event)
  }
  const { events } = extractSseEvents(buffer + '\n\n')
  for (const event of events) onEvent(event)
}
