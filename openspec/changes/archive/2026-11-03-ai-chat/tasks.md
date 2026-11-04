# Tasks

## 1. 后端数据层

- [x] 1.1 在 `backend/app/models.py` 新增 `ChatMessage` 模型（`chat_messages` 表：`id`、`user_id` 外键索引、`role`、`content`、`created_at`），编写 Alembic 迁移 `0002_create_chat_messages` 并执行 `alembic upgrade head`，验证 `sqlite3` 或 `alembic current` 确认表结构
- [x] 1.2 为 `ChatMessage` 编写 pytest（参照 `backend/tests/test_auth.py` 风格）：写入/按 user_id 查询隔离两条用例，验证测试通过

## 2. 后端对话端点

- [x] 2.1 在 `backend/app/config.py` 的 `Settings` 增加 `deepseek_api_key` 环境变量字段，验证 `.env` 注入可读取（打印脱敏值）
- [x] 2.2 新增 `backend/app/routers/chat.py` 的 `GET /api/chat/messages`：复用 `get_current_user` 鉴权，返回当前用户消息按时间升序；无效 token 返回 401；编写 pytest 覆盖正常、401、用户隔离三条用例并验证通过
- [x] 2.3 新增个性化上下文组装函数：读 `User`（username、xp、streak）拼 system prompt + 最近 20 条历史消息；为 xp=0 新用户与有数据用户各写一条 pytest，验证 prompt 内容正确
- [x] 2.4 实现 `POST /api/chat/messages` SSE 流式端点：httpx `AsyncClient` 调 DeepSeek（`stream=true`）逐段转发 `delta`/`done` 事件；用户消息发送即落库，done 时落库完整 assistant 回复；编写 pytest（mock DeepSeek 响应）验证事件序列与落库
- [x] 2.5 实现错误路径：DeepSeek 失败/超时返回 `error` 事件（SSE 内）且不崩溃、请求体超长返回 422、落库失败在 error message 注明；编写 pytest 覆盖并验证通过；`main.py` 注册 chat 路由后运行 `pytest backend/tests` 全量回归

## 3. 前端路由与 API client

- [x] 3.1 安装 `react-router-dom`、`react-markdown`、`remark-gfm`，验证 `npm run build` 通过且无新增告警
- [x] 3.2 改造 `App.tsx`：HashRouter 包裹，`/` 保持原 sections 不动，新增 `/chat` 路由挂载占位 `ChatPage`；验证 `npm run dev` 打开 `#/` 品牌站与变更前一致、`#/chat` 渲染占位页
- [x] 3.3 新增 `src/api/chat.ts`：`sendMessage`（fetch POST + ReadableStream 解析 SSE data 行，返回 delta/error 回调式接口）与 `fetchHistory`；base URL 读 `VITE_API_BASE`（默认 `http://localhost:8000`）；编写一条针对 SSE 行解析的纯函数测试（node 断言脚本或 vitest 单测）并验证通过

## 4. 前端对话 UI

- [x] 4.1 新增 `useChat` hook：消息状态、发送、流式增量追加、错误态管理（断连保留已收增量）；在 ChatPage 接线后手动验证：发送消息可见流式逐字出现、错误时展示失败提示
- [x] 4.2 新增 `ChatPage`、`MessageList`、`MessageBubble`、`ChatInput`、`ChatHeader` 组件（Tailwind 工具类 + `dark:` 前缀，复用 theme 主题系统，无内联 style）；手动验证亮/暗模式下气泡、输入框样式正确
- [x] 4.3 AI 消息接入 react-markdown + remark-gfm 渲染；实现自动滚动（距底 < 40px 才跟随）；手动验证：含标题/列表/代码块的回复正确渲染、流式期间贴底自动滚、上滚查看历史不强制拉回
- [x] 4.4 页面加载时调用 `fetchHistory` 渲染历史消息；手动验证：刷新页面后历史按时间序展示，未登录（无 token）时展示引导提示

## 5. 集成验证

- [x] 5.1 端到端验证：启动 `uvicorn` + `npm run dev`，注册/登录 → 进入 `#/chat` → 发送消息 → 流式回复 → 刷新页面历史仍在；对照 specs 中每个 Scenario 逐条核对
- [x] 5.2 品牌站回归：`npm run build` + `npm run deploy` 前置检查（`predeploy`），确认根路由 sections、主题切换、首屏加载（< 2s）与变更前一致；对照 proposal 的回滚方案确认回滚路径可行

## Workflow follow-up

- 全部任务完成后运行 `openspec validate ai-chat`，review 通过后 `/opsx-archive` 归档。
