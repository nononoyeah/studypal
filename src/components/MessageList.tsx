import { useEffect, useRef } from 'react'

import type { ChatUiMessage } from '../hooks/useChat.ts'
import { MessageBubble } from './MessageBubble.tsx'

// 距底部小于该阈值时视为「贴底」，流式输出跟随滚动；用户上滚后不打扰（specs 约定）
const STICK_THRESHOLD_PX = 40

export function MessageList({ messages, historyLoading }: {
  messages: ChatUiMessage[]
  historyLoading: boolean
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const stickToBottomRef = useRef(true)

  const handleScroll = () => {
    const el = containerRef.current
    if (!el) return
    stickToBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < STICK_THRESHOLD_PX
  }

  useEffect(() => {
    const el = containerRef.current
    if (el && stickToBottomRef.current) {
      el.scrollTop = el.scrollHeight
    }
  }, [messages])

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
    >
      {historyLoading ? (
        <p className="text-center text-sm text-zinc-400 dark:text-zinc-500">正在加载历史消息…</p>
      ) : messages.length === 0 ? (
        <div className="mx-auto mt-16 max-w-md text-center">
          <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">你好，我是你的 AI 学习助手</p>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            提问我任何学习相关的问题，我会结合你的学习数据给出个性化建议。
          </p>
        </div>
      ) : (
        messages.map((message, index) => (
          <MessageBubble key={index} message={message} />
        ))
      )}
    </div>
  )
}
