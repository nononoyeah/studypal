# Proposal

## Why

学习数据目前仅为首页 mock 展示，无法反映真实学习过程，站点也缺少系统性的学习分析入口；
同时前后端尚未完成上线部署，平台停留在本地演示态。本次变更新增基于数据库聚合的
学习数据分析面板（含学习日历与成就系统），并打通前后端上线，使平台从演示态进入可用态。

## What Changes

- 新增学习分析区布局：左侧导航栏（学习数据、AI 对话建议、学习目标）+ 三页路由；
  现有首页 sections 与顶部 Navbar 保持不变
- 新增学习数据页：统计概览卡片 + 周/月活跃趋势图，数据由 FastAPI 从 SQLite 聚合返回
  （基于现有 `users` 与 `chat_messages` 表，不新增表），接口复用现有 JWT 认证
- 新增学习日历组件：按月展示学习活跃日打卡情况
- 新增成就系统：基于 xp、连续活跃天数、累计对话数等派生成就徽章与解锁状态
- 分析区「AI 对话建议」「学习目标」两页复用现有组件与数据层，行为不变
- 后端新增 analytics 聚合路由与响应 schema
- 上线部署：前端保持 GitHub Pages（base `/my-website/`，gh-pages 分支），
  后端部署至 Render 免费托管；前端通过环境变量配置 API base URL，后端配置 CORS

## Capabilities

### New Capabilities

- `ui/analysis-shell`: 学习分析区的侧边栏导航壳与三页路由布局行为
- `learning/analytics`: 学习数据统计页：聚合统计 API 行为与概览卡片、趋势图展示
- `learning/calendar`: 学习日历：活跃日历数据接口与月历打卡展示
- `learning/achievements`: 成就系统：成就派生接口与徽章解锁状态展示
- `platform/deployment`: 前端 gh-pages + 后端 Render 的上线部署与回滚行为

### Modified Capabilities

（无。首页各 section 与 auth/learning/user 现有 spec 行为均不改变；
分析区复用 AI 建议与每日目标组件属实现复用，不改变其既有 requirement）

## Out of Scope（不做的事项）

- 实时通知（用户明确排除）
- 数据导出（用户明确排除）
- 首页布局改版及现有 sections 行为调整
- 真实 AI 建议生成（分析区建议页仍使用现有 mock 数据）
- 移动端响应式专项适配（沿用现有 Tailwind 断点习惯）
- CI/CD 流水线搭建（本次采用手动 gh-pages 部署 + Render 分支自动部署）
- 新增数据库表或学习时长记录功能（统计全部由现有表聚合派生）

## 回滚方案

- 前端：gh-pages 重新部署上一发布 commit 的 `dist` 产物即可回滚；
  新页面为独立路由，不改动首页结构，回滚不影响现有功能
- 后端：在 Render 控制台对上一个 deployment 执行 rollback；
  analytics 路由为纯新增文件，回滚不影响既有 auth/chat/users 接口
- 数据库：本次不执行任何 schema 迁移，无数据回滚需求

## Impact

- 前端：新增 `src/api/analytics.ts`（复用现有 api 客户端模式）、分析布局与页面组件
  （侧边栏、学习数据页、学习日历、成就列表）；`App.tsx` 增加路由；
  API base URL 改为复用现有 `VITE_API_BASE` 环境变量（本地默认不变）
- 后端：`backend/app/routers/` 新增 `analytics.py`；`schemas.py` 增加聚合响应模型；
  `backend/tests/` 增加聚合查询用例
- 部署：Render 服务配置（Python 环境、启动命令）；CORS 白名单加入 Render 域名与
  `https://<user>.github.io`；`npm run deploy` 流程保持不变
- 已知风险：Render 免费层文件系统不持久，服务重启或重新部署后 SQLite 数据会丢失。
  本阶段数据为个人学习记录，接受该风险；后续可通过升级付费持久盘或迁移数据库解决
- 依赖：无新增第三方依赖（图表沿用 SVG/CSS 手写，日历与成就组件手写，遵循现有约定）
