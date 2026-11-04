import { suggestions, type AiSuggestion } from '../content/learning'

/**
 * 单条 AI 建议卡片：缺 brief 时隐藏简述行（specs 降级约定）；行动标签锚点跳转
 */
function SuggestionCard({ suggestion }: { suggestion: AiSuggestion }) {
  return (
    <article className="flex flex-col rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{suggestion.title}</h3>
      {suggestion.brief ? (
        <p className="mt-2 flex-1 text-sm text-zinc-600 dark:text-zinc-400">{suggestion.brief}</p>
      ) : null}
      <a
        href={`#${suggestion.target_anchor}`}
        className="mt-4 inline-flex w-fit items-center rounded-full bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400"
      >
        {suggestion.action_label}
      </a>
    </article>
  )
}

/**
 * AI 建议学习面板：mock 静态展示，带「示例数据」标识，无真实 AI 调用
 */
export function AiSuggestionsSection() {
  return (
    <section id="suggestions" className="bg-white dark:bg-zinc-950">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 md:text-3xl dark:text-zinc-100">
            AI 学习建议
          </h2>
          <span className="inline-flex items-center rounded-full border border-zinc-300 px-3 py-0.5 text-xs font-medium tracking-wide text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            示例数据
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {suggestions.map((suggestion) => (
            <SuggestionCard key={suggestion.id} suggestion={suggestion} />
          ))}
        </div>
      </div>
    </section>
  )
}
