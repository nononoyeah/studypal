import { statsData } from '../content/learning'
import { StatCard } from './StatCard'

/**
 * 数据统计区：4 张学习统计卡片，数据全部来自 content mock，无网络请求
 */
export function StatsCardsSection() {
  return (
    <section id="stats" className="bg-white dark:bg-zinc-950">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-6 py-16 sm:grid-cols-4">
        <StatCard title="累计学习天数" value={statsData.total_days} />
        <StatCard title="本周学习时长(分)" value={statsData.week_minutes} />
        <StatCard title="目标达标次数" value={statsData.goal_hits} />
        <StatCard title="连续打卡天数" value={statsData.streak_days} />
      </div>
    </section>
  )
}
