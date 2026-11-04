/**
 * 导航项内容配置 —— 【替换真实内容入口】
 * 学习助手锚点导航：stats 数据统计 / goals 今日目标 / modules 学习模块
 * / suggestions AI 建议 / trends 趋势图；
 * 注意：锚点 id 必须与对应 Section 的 id 保持一致。
 */
export interface NavItem {
  id: string
  label: string
}

export const navItems: NavItem[] = [
  { id: 'home', label: '首页' },
  { id: 'stats', label: '数据统计' },
  { id: 'goals', label: '今日目标' },
  { id: 'modules', label: '学习模块' },
  { id: 'suggestions', label: 'AI 建议' },
  { id: 'trends', label: '趋势图' },
]
