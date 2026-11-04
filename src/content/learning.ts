/**
 * 学习助手 mock 数据 —— 【接入后端时替换为 fetch 封装入口】
 * interface 字段名与 design.md 预留契约表一致（snake_case，对应 FastAPI 端点）；
 * 本阶段所有组件仅消费本文件常量，禁止发起网络请求。
 */
import type { ProjectItem } from './projects'

/** 对应预留端点 GET /api/v1/learning/stats */
export interface LearningStats {
  total_days?: number | null
  week_minutes?: number | null
  goal_hits?: number | null
  streak_days?: number | null
}

export const statsData: LearningStats = {
  total_days: 128,
  week_minutes: 425,
  goal_hits: 47,
  streak_days: 12,
}

/** 对应预留端点 GET /api/v1/learning/trends（周/月两个数组） */
export interface TrendPoint {
  period: string
  minutes: number
  date: string
}

export const trendWeekly: TrendPoint[] = [
  { period: '周一', minutes: 50, date: '2026-10-19' },
  { period: '周二', minutes: 45, date: '2026-10-20' },
  { period: '周三', minutes: 60, date: '2026-10-21' },
  { period: '周四', minutes: 0, date: '2026-10-22' },
  { period: '周五', minutes: 55, date: '2026-10-23' },
  { period: '周六', minutes: 75, date: '2026-10-24' },
  { period: '周日', minutes: 40, date: '2026-10-25' },
]

export const trendMonthly: TrendPoint[] = [
  { period: '第1周', minutes: 285, date: '2026-09-28' },
  { period: '第2周', minutes: 320, date: '2026-10-05' },
  { period: '第3周', minutes: 410, date: '2026-10-12' },
  { period: '第4周', minutes: 205, date: '2026-10-19' },
]

/** 学习模块卡片数据，类型复用 ProjectCard 已有 ProjectItem，零改动复用 */
export const modules: ProjectItem[] = [
  {
    title: 'AI 学习路线',
    description: '从基础到进阶的系统化人工智能学习路径。',
    githubUrl: 'https://github.com/owner/ai-roadmap',
  },
  {
    title: 'Prompt 工程实践',
    description: '提示词设计与调试的实战练习集。',
    githubUrl: 'https://github.com/owner/prompt-practice',
  },
  {
    title: '机器学习基础',
    description: '经典算法与数学基础的可视化学习笔记。',
    githubUrl: 'https://github.com/owner/ml-basics',
  },
  {
    title: '数据结构复习',
    description: '高频数据结构与算法题的每日训练清单。',
    githubUrl: 'https://github.com/owner/ds-review',
  },
]

/** 对应预留端点 GET /api/v1/learning/suggestions */
export interface AiSuggestion {
  id: string
  title: string
  brief?: string | null
  action_label: string
  target_anchor: string
}

export const suggestions: AiSuggestion[] = [
  {
    id: 's1',
    title: '优先完成 Prompt 工程实践',
    brief: '你的活跃时段在晚间，建议 19:00 后集中 45 分钟完成本模块第一节。',
    action_label: '去学习',
    target_anchor: 'modules',
  },
  {
    id: 's2',
    title: '复习昨日错题',
    brief: '数据结构复习的队列章节已中断 2 天，建议先完成 3 道基础题。',
    action_label: '去复习',
    target_anchor: 'modules',
  },
  {
    id: 's3',
    title: '查看本周学习趋势',
    brief: '本周学习时长已提升 8%，建议保持当前节奏并补齐周四空档。',
    action_label: '看趋势',
    target_anchor: 'trends',
  },
]
