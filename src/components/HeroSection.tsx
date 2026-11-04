import { profile } from '../content/profile'
import { statsData } from '../content/learning'
import { goalList } from '../content/dailyGoals'
import { StaticParticles } from './StaticParticles'

const doneCount = goalList.filter((goal) => goal.status === 'done').length

/**
 * 学习助手入口：保留原 Hero 骨架（粒子背景 + 渐变 + 亮/暗模式），内文换学习语义
 */
export function HeroSection() {
  return (
    <section
      id="home"
      className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-sky-50 to-slate-100 dark:from-zinc-950 dark:via-indigo-950 dark:to-black"
    >
      <StaticParticles />
      <div className="min-h-hero flex flex-col items-center justify-center gap-6 px-6 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-zinc-900 md:text-7xl dark:text-zinc-100">
          早上好，{profile.name}
        </h1>
        <p className="text-xl font-medium tracking-wide text-indigo-600 md:text-2xl dark:text-indigo-300">
          今日目标 {doneCount}/{goalList.length} 已完成 · 连续打卡 {statsData.streak_days ?? '--'} 天
        </p>
        <p className="max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
          {profile.tagline}
        </p>
        <a
          href="#modules"
          className="rounded-full bg-indigo-600 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400"
        >
          继续学习
        </a>
      </div>
    </section>
  )
}
