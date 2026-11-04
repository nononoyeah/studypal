import { useState } from 'react'
import type { KeyboardEvent } from 'react'

export function ChatInput({ onSend, disabled }: {
  onSend: (content: string) => void
  disabled: boolean
}) {
  const [value, setValue] = useState('')

  const submit = () => {
    const content = value.trim()
    if (!content || disabled) return
    onSend(content)
    setValue('')
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      submit()
    }
  }

  return (
    <div className="border-t border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-3xl items-end gap-2">
        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="输入你的问题，Enter 发送，Shift+Enter 换行"
          className="max-h-40 flex-1 resize-y rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
        />
        <button
          type="button"
          onClick={submit}
          disabled={disabled || !value.trim()}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400"
        >
          发送
        </button>
      </div>
    </div>
  )
}
