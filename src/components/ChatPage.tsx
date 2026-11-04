import { Link } from 'react-router-dom'

import { hasToken } from '../api/chat.ts'
import { useChat } from '../hooks/useChat.ts'
import { ChatHeader } from './ChatHeader.tsx'
import { ChatInput } from './ChatInput.tsx'
import { MessageList } from './MessageList.tsx'
import { ThemeToggle } from './ThemeToggle.tsx'

function UnauthorizedNotice() {
  return (
    <div className="flex flex-1 items-center justify-center px-6">
      <div className="max-w-md rounded-xl border border-zinc-200 bg-zinc-50 p-6 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">请先登录</p>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          对话需要登录后使用，登录成功后将自动回到本页。
        </p>
        <Link
          to="/login"
          state={{ from: '/chat' }}
          className="mt-4 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400"
        >
          去登录
        </Link>
      </div>
    </div>
  )
}

export function ChatPage() {
  const { messages, historyLoading, streaming, error, send } = useChat()
  const unauthorized = error?.kind === 'unauthorized' || !hasToken()

  return (
    <div className="flex h-dvh flex-col bg-white dark:bg-zinc-950">
      <ChatHeader />
      {unauthorized ? (
        <UnauthorizedNotice />
      ) : (
        <>
          {error?.kind === 'message' ? (
            <p
              role="alert"
              className="mx-4 mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
            >
              {error.text}
            </p>
          ) : null}
          <MessageList messages={messages} historyLoading={historyLoading} />
          <ChatInput onSend={send} disabled={streaming} />
        </>
      )}
      <ThemeToggle />
    </div>
  )
}
