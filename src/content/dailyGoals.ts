/**
 * 每日目标 mock 数据 —— 【接入后端时替换为 fetch 封装入口】
 * 字段名与 design.md 预留契约表一致（snake_case，对应 GET /api/v1/learning/goals）；
 * 勾选状态仅组件内 useState 维护，不持久化。
 */
export interface DailyGoal {
  id: string
  title: string
  status: 'done' | 'todo'
}

export const goalList: DailyGoal[] = [
  { id: 'g1', title: '完成算法可视化模块第一节', status: 'todo' },
  { id: 'g2', title: '复习队列与栈的 3 道基础题', status: 'done' },
  { id: 'g3', title: '整理 Prompt 工程学习笔记', status: 'todo' },
  { id: 'g4', title: '阅读机器学习基础 30 分钟', status: 'todo' },
]
