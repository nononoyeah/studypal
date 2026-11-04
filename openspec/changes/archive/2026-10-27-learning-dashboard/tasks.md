# Tasks

## 1. 数据层：learning mock 数据文件

- [x] 1.1 新建 `src/content/learning.ts`：定义 `LearningStats`、`TrendPoint`、`LearningModule`、`AiSuggestion` 四个 interface（字段名与 design 预留契约表一致，snake_case）并填入 mock 常量；验证：`tsc -b` 通过且字段与 interface 匹配
- [x] 1.2 新建 `src/content/dailyGoals.ts`：定义 `DailyGoal` interface 与 3-5 条 mock 目标；验证：`tsc -b` 通过
- [x] 1.3 复用检查：确认 `projects.ts`/`profile.ts` 中可迁移复用的类型与文案，不重复定义已有 interface；验证：新建文件中无与现有类型重复的字段定义

## 2. Hero 与导航改造

- [x] 2.1 改造 `HeroSection.tsx`：保留骨架，内文换学习问候语、今日摘要与「继续学习」按钮（锚点指向 modules）；验证：浏览器点击按钮平滑滚动至 modules 锚点
- [x] 2.2 更新 `nav.ts`：锚点改为 stats / goals / modules / suggestions / trends，label 换学习语义；验证：Navbar 各锚点跳转正确
- [x] 2.3 暗色模式回归：切换亮/暗模式检查 Hero 与 Navbar 配色（dark: 前缀）；验证：两种模式无样式断层

## 3. 统计卡片与趋势图

- [x] 3.1 新建 `StatCard.tsx` 并改造 `AboutSection.tsx` 为 StatsCardsSection：渲染 4 张统计卡片；验证：数值与 `learning.ts` statsData 一致
- [x] 3.2 实现降级：statsData 字段缺失时该卡片渲染 `--`；验证：手动注释某个字段后页面无崩溃且显示 `--`
- [x] 3.3 新建 `TrendChart.tsx`：SVG/CSS 条形图实现周（7 根）/月（4 组）视图与标签切换，不引入图表库；验证：`grep package.json` 无新增依赖，切换标签图表重渲染
- [x] 3.4 趋势图空态：数据数组为空时渲染「暂无学习数据」；验证：空数组场景下无空白坐标轴

## 4. 每日目标清单

- [x] 4.1 新建 `DailyGoalsSection.tsx` + `GoalItem.tsx`：渲染 goalList，useState 管理勾选状态；验证：点击目标状态在已完成/未完成间切换
- [x] 4.2 边界处理：goalList 为空渲染空态文案；快速连点状态确定性切换；验证：模拟空数据与连点场景行为符合 specs

## 5. 学习模块与 AI 建议面板

- [x] 5.1 改造 `ProjectsSection.tsx` 为 ModulesSection：数据源换 `learning.ts` modules，`ProjectCard` 结构零改动；验证：模块卡片渲染且渐变占位图/懒加载约定生效
- [x] 5.2 新建 `AiSuggestionsSection.tsx`：渲染 2-3 条建议卡片 + 「示例数据」标识；验证：mock 字段缺失时卡片隐藏简述行不崩溃
- [x] 5.3 建议行动标签锚点跳转：target_anchor 对应锚点存在时平滑滚动，不存在时停留当前位置；验证：手动构造错误锚点验证无报错

## 6. 组装与集成验证

- [x] 6.1 更新 `App.tsx` 组合顺序与各 Section id；验证：整页锚点导航串联通顺，无 console 报错
- [x] 6.2 网络请求检查：确认页面无任何 fetch/XHR（mock 阶段契约）；验证：开发者工具 Network 面板为空
- [x] 6.3 全量验证：`npm run lint` 与 `npm run build` 通过，gh-pages 构建流程不受影响；验证：dist 产物正常生成
