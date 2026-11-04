# Design

## Context

前端已是 React 19 + HashRouter 单页应用（首页 sections + `/chat` + `/login`），
`src/api/auth.ts` 已提供 `VITE_API_BASE`、token 存储与 `authFetch`（自动携带
JWT 并在 401 时刷新重试）。后端 FastAPI 已有 auth/chat/users 三个路由、CORS
中间件（`settings.cors_origins`）与 `/api/health`。数据库仅两张表：
`users`（含 `xp`、`streak`、`last_login_date`）与 `chat_messages`。
部署现状：前端 `npm run deploy` 发布 gh-pages（base `/my-website/`），后端未部署。
动机见 proposal.md「Why」，行为契约见各 delta spec。

## Goals / Non-Goals

**Goals:**

- 最小成本新增学习分析区：一个嵌套路由布局壳 + 三个子页面，首页零改动
- 统计全部由现有两表 SQL 聚合派生，不引入新表、新依赖、新构建工具
- 后端上 Render、前端保持 gh-pages，复用现有环境变量与 CORS 机制打通

**Non-Goals:**

- 不做学习时长记录、实时通知、数据导出（proposal Out of Scope）
- 不改造现有组件内部实现，AI 建议/学习目标页仅做容器级复用
- 不引入路由库变更（沿用 react-router-dom v7）、图表库、UI 组件库

## Decisions

### D1: 嵌套路由 + AnalysisLayout 布局壳

`App.tsx` 新增 `<Route path="/analysis" element={<AnalysisLayout />}>` 及三个子
路由（`index`、`suggestions`、`goals`），布局壳内用 `<Outlet />` 渲染子页，
`Navigate` 兜底未知子路径。沿用现有 HashRouter，gh-pages 无需 rewrite 规则。
备选：BrowserRouter + 404.html hack——被现有 HashRouter 约定否决；三个平级
顶层路由 + 每页重复侧边栏——重复代码，否决。

### D2: 聚合不加表，「活跃日」= 当日 ≥1 条 chat_messages

累计/连续活跃天数、周月活跃、日历打卡均从 `chat_messages.created_at` 按日
`COUNT` 聚合；概览口径含 `users.xp`。`streak` 统一为「连续学习活跃天数」，
由活跃日推导（今日或昨日活跃即延续），与 `users.streak`（登录打卡）解耦——
注册后首登即置 `users.streak=1`，直接读取会让零学习记录的新用户面板显示 1，
违背 spec「新用户统计全 0」契约。备选：新增 `study_logs` 学习时长表
——属 Out of Scope 且需迁移，将来需要时长统计时再引入；本设计在聚合 SQL 中
收敛口径，后续换数据源只动 routers/analytics.py。

### D3: 前端 API 层复用 authFetch 与 VITE_API_BASE

新增 `src/api/analytics.ts`，模式与 `chat.ts` 一致：`authFetch` 发请求、复用
`UnauthorizedError`，类型化响应接口。不新建请求封装层。
备选：引入 axios/react-query——两三个 GET 请求不值得新依赖。

### D4: 成就解锁由服务端纯函数规则表计算

`routers/analytics.py` 内定义成就规则表（维度阈值：累计 xp、连续活跃天数、
累计对话数、累计活跃天数），请求时用聚合结果即时计算，无新表、无定时任务。
备选：入库成就表记录解锁时间——本阶段无解锁通知/历史需求，Out of Scope 的
延伸，保持最小。

### D5: Render 免费托管 + SQLite

Render Web Service 从仓库分支自动构建（pip install -r requirements.txt，启动
`uvicorn app.main:app`）。已知免费层文件系统非持久：重启/重新部署后 SQLite
数据丢失，本阶段接受（见 Risks）。备选：付费持久盘/迁移 Postgres——超出本阶段。

### D6: CORS 复用 settings.cors_origins

仅在后端环境变量追加线上来源（`https://<user>.github.io`），代码零改动。
`/docs` 与现有 `/api/health` 作为部署健康检查。

## 组件层级图

```
App.tsx (HashRouter)
├── Route "/"                      ← 现有首页，不动
├── Route "/chat" / "/login"       ← 现有，不动
└── Route "/analysis"
    └── AnalysisLayout             ← 新增：侧边栏 + <Outlet/>
        ├── index    → AnalyticsPage        ← 新增
        │   ├── StatsCardsSection（改造为读 API 数据）  ← 复用组件骨架
        │   ├── TrendChart（改造为读 API 数据）          ← 复用组件骨架
        │   ├── LearningCalendar              ← 新增
        │   └── AchievementsList              ← 新增
        ├── suggestions → AiSuggestionsPage  ← 新增薄壳，复用 AiSuggestionsSection
        └── goals       → LearningGoalsPage  ← 新增薄壳，复用 DailyGoalsSection

src/api/analytics.ts               ← 新增：summary/trend/calendar/achievements 请求
backend/app/routers/analytics.py   ← 新增：4 个聚合端点
backend/app/schemas.py             ← 追加聚合响应模型
```

说明：StatsCardsSection / TrendChart 现有实现直接读 `src/content/` mock 常量。
为不破坏首页行为，学习数据页不改动这两个组件本体，而是新建数据驱动的展示
组件（复用其卡片/图表的视觉结构），首页保持 mock 展示不变。

## API 端点规范

全部挂载在 `/api` 前缀下，均要求 JWT（复用 `deps.get_current_user`），仅返回
当前用户数据。

### GET /api/analytics/summary

- 请求：无参数
- 响应 200：
  ```json
  {
    "activeDaysTotal": 12,
    "activeDaysThisWeek": 4,
    "streak": 3,
    "messageCount": 156,
    "xp": 240
  }
  ```
- 字段口径：活跃日 = 当日该用户 chat_messages ≥ 1 条；周 = 近 7 天自然日；
  streak = 连续学习活跃天数（今日或昨日活跃即延续，由活跃日推导）
- 错误：401 未认证（`detail` 错误信息）；无记录用户返回全 0，不返回 null

### GET /api/analytics/calendar

- 请求：query `month=YYYY-MM`（必填）
- 响应 200：
  ```json
  {
    "month": "2026-11",
    "days": [
      { "date": "2026-11-01", "active": true, "messageCount": 8 }
    ]
  }
  ```
- `days` 仅包含该月存在消息记录的日期；未列出的日期视为非活跃
- 错误：400 月份格式非法；401 未认证

### GET /api/analytics/trend

- 请求：query `period=week|month`（必填）
- 响应 200：
  ```json
  {
    "period": "week",
    "days": [
      { "date": "2026-10-28", "messageCount": 5 }
    ]
  }
  ```
- 口径：`week` = 近 7 个自然日（含今日）；`month` = 当月 1 日至今日；
  每日返回当日 messageCount（无记录为 0），按日期升序
- 错误：400 period 非法；401 未认证

### GET /api/analytics/achievements

- 请求：无参数
- 响应 200：
  ```json
  {
    "achievements": [
      {
        "id": "active-days-7",
        "name": "坚持一周",
        "description": "累计活跃 7 天",
        "dimension": "active_days",
        "target": 7,
        "progress": 7,
        "unlocked": true
      }
    ]
  }
  ```
- 规则表覆盖四维度（累计 xp / 连续活跃 / 累计对话数 / 累计活跃天数），
  每维度至少一档；`unlocked = progress >= target`，服务端计算
- 错误：401 未认证

## Risks / Trade-offs

- [Render 免费层文件系统非持久，重启后 SQLite 数据丢失] → 本阶段接受并在
  README 标注；后续升级持久盘或迁移数据库，接口口径不变
- [免费实例休眠导致首个请求慢或超时] → 前端加载态 + 失败重试入口（spec 已覆盖）
- [聚合查询全表扫 chat_messages] → 个人规模数据量小，按 `user_id` 索引过滤即可；
  数据量增长后再加日期索引（不动接口契约）
- [「活跃日」以对话代替学习时长，口径偏窄] → 无时长数据源下的最优近似；
  规则收敛在 analytics.py 单处，将来接入时长数据只改聚合层
- [复用 StatsCardsSection/TrendChart 需新组件，存在视觉不一致风险] → 新组件
  复用其 Tailwind 类名结构与 dark: 配色，Phase 内做视觉核对

## Migration Plan

1. 合并前后端代码（无 DB 迁移，schema 不变）
2. 创建 Render Web Service：Python 环境、build `pip install -r requirements.txt`、
   start `uvicorn app.main:app --host 0.0.0.0 --port $PORT`；环境变量配置
   `cors_origins` 追加 `https://<user>.github.io`
3. 前端设置 `VITE_API_BASE=https://<render-domain>` 后 `npm run deploy`
4. 验证：线上打开分析区页面，登录后确认三个接口返回真实数据、无 CORS 报错
- 回滚：后端 Render 控制台 rollback 上一个 deployment；前端用上一发布 commit
  重新 `npm run deploy`；两端独立回滚互不影响

## Open Questions

（无——部署目标与侧边栏范围已由用户确认，其余决策均在上面给出。）
