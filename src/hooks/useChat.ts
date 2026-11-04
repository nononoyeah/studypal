import { useCallback, useEffect, useState } from 'react'

import {
  ChatUnauthorizedError,
  fetchHistory,
  sendMessage as sendMessageApi,
} from '../api/chat.ts'

export interface ChatUiMessage {
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
}

export type ChatError = { kind: 'unauthorized' } | { kind: 'message'; text: string }

export function useChat() {
  const [messages, setMessages] = useState<ChatUiMessage[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<ChatError | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchHistory()
      .then((history) => {
        if (!cancelled) setMessages(history)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        if (err instanceof ChatUnauthorizedError) {
          setError({ kind: 'unauthorized' })
        } else {
          setError({ kind: 'message', text: err instanceof Error ? err.message : '加载历史失败' })
        }
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const finishStreaming = useCallback(() => {
    setStreaming(false)
    setMessages((prev) => prev.map((m) => (m.streaming ? { ...m, streaming: false } : m)))
  }, [])

  const send = useCallback(
    async (content: string) => {
      if (streaming || !content.trim()) return
      setError(null)
      setStreaming(true)
      setMessages((prev) => [
        ...prev,
        { role: 'user', content },
        { role: 'assistant', content: '', streaming: true },
      ])
      try {
        await sendMessageApi(content, (event) => {
          if (event.type === 'delta') {
            setMessages((prev) => {
              const next = [...prev]
              const last = next[next.length - 1]
              if (last?.role === 'assistant') {
                next[next.length - 1] = { ...last, content: last.content + event.content }
              }
              return next
            })
          } else if (event.type === 'error') {
            setError({ kind: 'message', text: event.message })
            finishStreaming()
          }
        })
      } catch (err: unknown) {
        if (err instanceof ChatUnauthorizedError) {
          setError({ kind: 'unauthorized' })
        } else {
          setError({
            kind: 'message',
            text: err instanceof Error ? err.message : '发送失败',
          })
        }
      } finally {
        finishStreaming()
      }
    },
    [streaming, finishStreaming],
  )

  return { messages, historyLoading, streaming, error, send }
}
