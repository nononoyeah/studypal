# Tasks

## 1. 后端聚合接口

- [x] 1.1 `schemas.py` 追加 summary/trend/calendar/achievements 响应模型（字段口径见 design「API 端点规范」）；验证：`python -m pytest --collect-only` 无导入错误
- [x] 1.2 新建 `routers/analytics.py` 实现 `GET /api/analytics/summary`（活跃日=当日 chat_messages≥1 条），`main.py` 注册路由；验证：pytest 新增用例通过
- [x] 1.3 `backend/tests/` 新增 summary 用例：200 数据正确、401 未认证、新用户全 0；验证：`python -m pytest backend/tests -k summary` 通过
- [x] 1.4 实现 `GET /api/analytics/trend`（period=week|month，非法返回 400）并用例：200 序列正确、400 非法参数、401；验证：`pytest -k trend` 通过
- [x] 1.5 实现 `GET /api/analytics/calendar`（month=YYYY-MM，非法返回 400）并用例：200 各日状态、400、401；验证：`pytest -k calendar` 通过
- [x] 1.6 实现 `GET /api/analytics/achievements`（服务端规则表四维度，unlocked=progress>=target）并用例：达标解锁、未达标进度正确、401、新用户全未解锁；验证：`pytest -k achievement` 通过
- [x] 1.7 Phase 验证：全量 `python -m pytest backend/tests` 通过；本地 uvicorn 冒烟 `/docs` 可访问、三个 analytics 接口未带 token 均返回 401

## 2. 前端 API 层与分析区路由壳

- [x] 2.1 新建 `src/api/analytics.ts`：四个 GET 请求复用 `authFetch` 与 `VITE_API_BASE`，类型与 design 响应一致（复用现有 api 模式，不新建封装层）；验证：`npx tsc -b` 通过
- [x] 2.2 新建 `AnalysisLayout.tsx`：左侧导航（学习数据、AI 对话建议、学习目标，依次排序）+ `<Outlet/>` + 激活高亮 + `dark:` 样式 + `Navigate` 兜底；验证：dev 下三路由渲染正确、当前项高亮
- [x] 2.3 `App.tsx` 注册 `/analysis` 嵌套路由；新建 `AiSuggestionsPage.tsx`、`LearningGoalsPage.tsx` 薄壳复用现有 `AiSuggestionsSection`、`DailyGoalsSection`；验证：dev 下首页不变、三页可达、未知子路径回默认页且控制台无报错
- [x] 2.4 首页加入分析区入口（客户端跳转至 `/analysis`），首页 sections 结构不动；验证：dev 点击入口跳转成功
- [x] 2.5 Phase 验证：`npm run lint` 与 `npm run build` 通过；首页各 section 视觉与交互回归无变化

## 3. 学习数据页

- [x] 3.1 新建 `AnalyticsPage.tsx` 概览卡片：读 summary 接口渲染统计卡片（复用 `StatCard` 视觉结构与 dark: 配色），含加载态；验证：dev 登录后数值与接口返回一致、刷新可见加载占位
- [x] 3.2 新建数据驱动趋势图组件（沿用 `TrendChart` SVG/CSS 结构，周/月切换，区间无数据显示「暂无学习数据」空态）；验证：dev 切换周/月重渲染、清空数据账号见空态
- [x] 3.3 未认证与失败降级：捕获 `UnauthorizedError` 跳转 `/login`，接口 5xx/不可达展示错误提示与重试按钮，重试成功恢复渲染；验证：dev 清除 token 跳登录、停掉后端见错误态、恢复后重试成功
- [x] 3.4 Phase 验证：`npm run lint` 与 `npm run build` 通过；对照 analytics spec 逐场景核对（加载/空态/错误/重试）

## 4. 学习日历

- [x] 4.1 新建 `LearningCalendar.tsx` 月历组件：日网格、活跃日打卡样式、今日标识、未来日期未发生样式、上一月/下一月切换；验证：dev 手动核对月历渲染与切换（含未来月份空网格）
- [x] 4.2 对接 calendar 接口：仅发送合法 `YYYY-MM`，加载态、失败降级错误提示与重试；验证：dev 停后端见降级态、恢复后重试正常
- [x] 4.3 Phase 验证：`npm run lint` 与 `npm run build` 通过；对照 calendar spec 逐场景核对

## 5. 成就系统

- [x] 5.1 新建 `AchievementsList.tsx`：已解锁彩色徽章、未解锁灰态 + 「当前值/目标值」进度、加载态占位；验证：dev 核对解锁/未解锁两种样式与进度展示
- [x] 5.2 对接 achievements 接口 + 失败降级错误提示与重试（不本地推断解锁状态）；验证：dev 停后端见降级态、恢复后重试正常
- [x] 5.3 Phase 验证：`npm run lint` 与 `npm run build` 通过；对照 achievements spec 逐场景核对

## 6. 上线部署

- [ ] 6.1 创建 Render Web Service：build `pip install -r requirements.txt`、start `uvicorn app.main:app --host 0.0.0.0 --port $PORT`，环境变量 `cors_origins` 追加 `https://<user>.github.io`；验证：Render 分配域名 `/docs` 返回 200、`/api/health` 返回 ok
- [ ] 6.2 前端配置 `VITE_API_BASE=https://<render-domain>` 后执行 `npm run deploy`；验证：线上直接打开 `/analysis` 页面 URL 正常渲染、静态资源无 404
- [ ] 6.3 线上联通验证：登录后学习数据页/日历/成就展示真实数据、控制台无 CORS 报错、休眠唤醒时展示加载态或可重试；验证：线上浏览器逐项核对
- [x] 6.4 README 记录部署步骤与回滚步骤（Render rollback 上一 deployment；用上一发布 commit 重新 `npm run deploy`）；验证：按文档逐步执行命令均有效
- [ ] 6.5 Phase 验证（集成）：线上全流程回归——首页、登录、分析区三页、本地 `npm run dev` 行为与部署前一致

## Workflow follow-up

- 按 AGENTS.md 纪律：每个 Phase 完成后暂停，总结变更并等待 review 确认后再继续
- 全部完成后运行 `openspec validate analysis-deploy`，再执行 `/opsx-verify` 与 `/opsx-archive`
