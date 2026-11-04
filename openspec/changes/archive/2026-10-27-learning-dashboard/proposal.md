# Proposal: learning-dashboard

## Why

个人品牌站正在向全栈 AI 学习平台演进。第一步是让首页展示学习助手的实用面板，
使用户在打开站点时即看到学习数据与今日行动指引，而不是纯品牌宣传页。
本阶段仅做前端改造，所有数据使用 mock 常量，为后续接入 FastAPI 后端预留数据层边界。

## What Changes

- 保留 Hero 骨架（粒子背景 + 渐变 + 亮/暗模式），内部文案与操作区重新布局为
  学习助手入口（问候语 + 继续学习按钮）
- ProjectsSection 改造为「学习模块列表」，数据语义从项目展示切换为学习模块，
  复用 ProjectCard 与数据驱动的渲染方式
- AboutSection 改造为「数据统计卡片」区（累计学习天数、本周学习时长、达标次数、连续打卡）
- 新增「每日目标清单」（mock 数据：3-5 条目标，支持本地勾选状态）
- 新增「AI 建议学习面板」（mock 数据静态展示，无真实 AI 调用）
- 新增「周/月学习趋势图」（mock 数据静态渲染，使用 SVG/CSS 实现，不引入图表库）
- `src/content/` 数据层收敛为 learning 主题的 mock 常量文件（缺少任何一项均不创建数据文件）
- 导航 nav.ts 同步更新锚点

不做的事项（out-of-scope / NOT doing 清单）：
- 后端 API（FastAPI 接口、数据库）
- 真实 AI 功能（AI 建议面板仅静态展示 mock 内容）
- 用户认证 / 登录
- 品牌站 sections 的删除（ProjectCard 渲染逻辑保留复用）
- 图表库依赖（不新增 react-chart 等依赖）

## Capabilities

### New Capabilities

- `learning/dashboard`: 学习助手首页的布局骨架与数据统计卡片、周/月趋势图的
  展示行为（mock 数据驱动）
- `learning/daily-goals`: 每日目标清单的展示与勾选交互行为
- `learning/ai-suggestions`: AI 建议学习面板的 mock 静态展示行为

### Modified Capabilities

（无 —— 项目当前没有已归档的 specs，品牌站原有锚点导航行为升级为本变更的
learning 结构的一部分，不构成对已有 capability 的修改）

## Impact

- 受影响代码：
  - `src/App.tsx`（组合顺序微调）
  - `src/content/`（projects.ts 等替换为 learning mock 数据文件）
  - `src/components/HeroSection.tsx`、`ProjectsSection.tsx`、`AboutSection.tsx`（内部重布局）
  - 新增 `src/components/DailyGoalsSection.tsx`、`AiSuggestionsSection.tsx`、`TrendChart.tsx`
  - `src/content/nav.ts`（锚点更新）
- 不受影响：theme/ 主题系统、构建流程（`tsc -b && vite build`）、gh-pages 部署
- 风险：替换 content 常量属于破坏性替换，若未来要回品牌站形态需找回旧数据文件

## 回滚方案

- 本变更仅改动 `src/` 下前端文件，不触碰构建与部署配置；
  回滚时将 `git revert` 本变更对应提交即可恢复原 App.tsx / content 文件；
  若 content 替换采用了「新增文件 + 引用切换」方式，亦可直接把引用切回旧
  content 文件完成 30 分钟内的快速回滚。
