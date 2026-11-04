# Design

## Context

纯前端品牌站为单页 sections 滚动布局（App.tsx 直接组合 4 个 Section），无路由、
无网络层、无图表依赖。改造动机见 proposal.md，行为契约见 specs/ 下三个 capability。

## Goals / Non-Goals

**Goals:**

- 保留 Hero 骨架与主题系统，组件级复用最大化
- 建立 `src/content/` learning 主题 mock 数据层，接口形态贴近未来后端返回结构
- 不新增运行时依赖（不引入图表库、状态库、路由库）

**Non-Goals:**

- 后端 API、真实 AI、用户认证（proposal out-of-scope）
- 路由引入（单页锚点足够；待多页面需求出现再评估）
- localStorage 持久化每日目标状态（后续接入后端时由数据库承载）

## 决策

1. **布局沿用纵向 sections，不新建 Grid 壳**
   - 选择：保持 App.tsx 组合结构，依次为 Hero → StatsCards（AboutSection 改造）
     → DailyGoals → Modules（ProjectsSection 改造）→ AiSuggestions → 趋势图
   - 备选：侧栏式 Dashboard Grid —— 样式迁移成本高，与 gh-pages 单页锚点不冲突，
     推迟到来导航航需求时再评估
2. **mock 数据文件按 capability 拆分并预留类型**：`src/content/` 下新建
   `learning.ts`（统计卡片 + 趋势图 + AI 建议）与 `dailyGoals.ts`；interface
   字段名与未来 FastAPI 返回的 JSON 字段对齐（snake_case），降低后续接入成本
   - 备选：一个 `dashboard.ts` 大文件 —— 字段集会随功能增长膨胀，按 capability
     拆分与 specs 组织一致
   - 补充：目标清单勾选状态为组件内 `useState`，不放 content 层（content 只给
     只读数据）
3. **趋势图自绘 SVG/CSS 条形图**：周视图 7 根、月视图 4 组（按周聚合）柱状条，
   高度按时长比例映射；数据经归一化函数处理，区分亮/暗色使用 `currentColor`
   或 dark: 前缀类，不用内联样式
   - 备选：引入 recharts —— 违反不新增图表依赖的决策，且数据量小（7~4 个点）
4. **组件复用方式**：
   - `ProjectCard` 保持通用（title/description/url/image），学习模块直接换数据
     源；渐变占位图机制沿用
   - `StaticParticles`、`ThemeProvider`、`Navbar` 零改动复用
5. **降级策略（对应 specs 错误场景）**：mock 数据字段缺失时组件渲染 `--`/隐藏
   行/空态文案，不抛异常；空数组渲染空态而非空容器。实现为简单的条件渲染，
   不引入错误边界库

## 组件层级图

```
App.tsx
├── ThemeProvider（零改动）
│   └── Navbar（nav.ts 锚点更新）
└── main（纵向 sections，锚点导航）
    ├── HeroSection（骨架保留，内文换学习问候 + 继续学习按钮）
    │   └── StaticParticles（零改动复用）
    ├── StatsCardsSection（AboutSection 改造）
    │   └── StatCard × 4（新增，读 learning.ts statsData）
    ├── DailyGoalsSection（新增）
    │   └── GoalItem × n（useState 勾选状态，读 dailyGoals.ts）
    ├── ModulesSection（ProjectsSection 改造）
    │   └── ProjectCard × n（复用，读 learning.ts modules）
    ├── AiSuggestionsSection（新增）
    │   └── SuggestionCard × 2-3（读 learning.ts suggestions，含「示例数据」
    │        标识 + 锚点跳转标签）
    └── TrendChart（新增，SVG 自绘）
         └── 周/月标签切换（读 learning.ts trendWeekly / trendMonthly）
```

Mock 数据流向（单向，无网络请求）：

```
src/content/learning.ts ──> StatsCardsSection / ModulesSection
               │      │                     AiSuggestionsSection / TrendChart
src/content/dailyGoals.ts ──> DailyGoalsSection
```

## API 端点规范

本变更不实现任何 API 端点（out-of-scope）。为降低后续接入成本，mock 数据
interface 按以下预留契约组织字段（snake_case，对应未来 FastAPI 端点）：

| 未来端点（预留）                | 对应 mock interface          | 关键字段                                                    |
| ------------------------------- | ---------------------------- | ----------------------------------------------------------- |
| `GET /api/v1/learning/stats`    | `LearningStats`              | `total_days`, `week_minutes`, `goal_hits`, `streak_days`     |
| `GET /api/v1/learning/trends`   | `TrendPoint`                 | `period`, `minutes`, `date`（周/月两个数组分别归一化归一化映射） |
| `GET /api/v1/learning/goals`    | `DailyGoal`                  | `id`, `title`, `status`                                      |
| `GET /api/v1/learning/suggestions` | `AiSuggestion`            | `id`, `title`, `brief`, `action_label`, `target_anchor`      |

前端消费方式约定：所有组件 SHALL 从 content 常量读取，SHALL NOT 直接构造字面
量数据；未来接入后端时只需将 content 文件替换为 fetch 封装，组件与 specs 行为
契约不变。

## Risks / Trade-offs

- [ProjectCard 双语义（项目展示/学习模块）导致后续管理混乱] → specs 已将
  ProgramsSection 数据语义切换为决策的一部分，未来如需恢复品牌站形态走
  proposal 的回滚方案
- [趋势图自绘与真实图表需求差距] → 数据层已按 `TrendPoint` 数组隔离，引入
  图表库时仅替换绘图组件
- [mock 数据与未来后端字段不一致] → design 的预留契约表为 specs/tasks 的
  字段命名基准，接入后端时在 proposal 中单独立项核对
- [每日目标勾选刷新后丢失] → 已在 Non-Goals 声明，持久化属后端阶段任务

## Migration Plan

1. 新建 content mock 文件（不动旧文件）
2. 改造 Hero / StatsCards / Modules 三个 Section，新建 DailyGoals /
   AiSuggestions / TrendChart
3. 更新 nav.ts 锚点与 App.tsx 组合顺序
4. 回滚：git revert 或将 App.tsx 引用切回旧 content 文件（见 proposal 回滚方案）
