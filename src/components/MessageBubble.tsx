import type { ComponentPropsWithoutRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import type { ChatUiMessage } from '../hooks/useChat.ts'

const markdownComponents: {
  [K in 'h1' | 'h2' | 'h3' | 'p' | 'ul' | 'ol' | 'li' | 'blockquote' | 'code' | 'pre' | 'a' | 'table' | 'th' | 'td']: (
    props: ComponentPropsWithoutRef<K>,
  ) => React.ReactElement
} = {
  h1: (props) => <h1 className="mt-3 mb-2 text-lg font-bold first:mt-0" {...props} />,
  h2: (props) => <h2 className="mt-3 mb-2 text-base font-bold first:mt-0" {...props} />,
  h3: (props) => <h3 className="mt-2 mb-1 text-sm font-bold first:mt-0" {...props} />,
  p: (props) => <p className="my-2 whitespace-pre-wrap first:mt-0 last:mb-0" {...props} />,
  ul: (props) => <ul className="my-2 list-disc space-y-1 pl-5" {...props} />,
  ol: (props) => <ol className="my-2 list-decimal space-y-1 pl-5" {...props} />,
  li: (props) => <li className="leading-relaxed" {...props} />,
  blockquote: (props) => (
    <blockquote className="my-2 border-l-4 border-zinc-300 pl-3 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400" {...props} />
  ),
  code: (props) => <code className="rounded bg-zinc-200 px-1 py-0.5 font-mono text-[0.85em] dark:bg-zinc-700" {...props} />,
  pre: (props) => <pre className="my-2 overflow-x-auto rounded-lg bg-zinc-200 p-3 text-sm dark:bg-zinc-700" {...props} />,
  a: (props) => <a className="text-indigo-600 underline dark:text-indigo-400" {...props} />,
  table: (props) => <table className="my-2 w-full border-collapse text-sm" {...props} />,
  th: (props) => <th className="border border-zinc-300 px-2 py-1 text-left dark:border-zinc-700" {...props} />,
  td: (props) => <td className="border border-zinc-300 px-2 py-1 dark:border-zinc-700" {...props} />,
}

export function MessageBubble({ message }: { message: ChatUiMessage }) {
  const isUser = message.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed md:max-w-[70%] ${
          isUser
            ? 'rounded-br-sm bg-indigo-600 text-white'
            : 'rounded-bl-sm bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {message.content || (message.streaming ? '' : '（空回复）')}
            </ReactMarkdown>
            {message.streaming ? (
              <span
                className="ml-0.5 inline-block h-4 w-2 animate-pulse rounded-sm bg-zinc-400 align-middle dark:bg-zinc-500"
                aria-label="正在输入"
              />
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}
