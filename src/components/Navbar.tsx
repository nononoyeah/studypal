import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { navItems } from '../content/nav'
import { profile } from '../content/profile'

export function Navbar() {
  const [isOffTop, setIsOffTop] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  // HashRouter 下哈希属于路由命名空间，锚点点击必须受控滚动，禁止改写哈希
  const scrollToAnchor = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    event.preventDefault()
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    try {
      const observer = new IntersectionObserver(([entry]) => {
        setIsOffTop(!entry.isIntersecting)
      })
      observer.observe(sentinel)
      return () => observer.disconnect()
    } catch {
      // IntersectionObserver 构造异常时降级为常驻毛玻璃，页面不报错
      queueMicrotask(() => setIsOffTop(true))
    }
  }, [])

  return (
    <>
      <div
        ref={sentinelRef}
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 h-px w-px"
      />
      <header
        className={
          'fixed top-0 inset-x-0 z-40 flex h-16 items-center justify-between gap-3 px-3 sm:px-6 ' +
          (isOffTop
            ? 'border-b border-zinc-900/10 bg-white/70 backdrop-blur-md dark:border-white/10 dark:bg-zinc-950/70'
            : 'bg-transparent')
        }
      >
        <a
          href="#home"
          onClick={(event) => scrollToAnchor(event, 'home')}
          className="max-w-[9rem] truncate text-sm font-medium text-zinc-900 hover:text-zinc-600 sm:max-w-none sm:text-base dark:text-zinc-100 dark:hover:text-zinc-300"
        >
          {profile.name}
        </a>
        <nav aria-label="主导航" className="flex items-center gap-3 text-sm sm:gap-8 sm:text-base">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(event) => scrollToAnchor(event, item.id)}
              className="hidden whitespace-nowrap sm:inline text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
            >
              {item.label}
            </a>
          ))}
          <Link
            to="/analysis"
            className="whitespace-nowrap rounded-full bg-indigo-600 px-3 py-1 text-white transition-colors hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400"
          >
            学习分析
          </Link>
          <Link
            to="/chat"
            className="whitespace-nowrap rounded-full bg-indigo-600 px-3 py-1 text-white transition-colors hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400"
          >
            AI 助手
          </Link>
        </nav>
      </header>
    </>
  )
}
