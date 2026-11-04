# Design

## Context

后端 `backend/` 已有 FastAPI + SQLAlchemy + Alembic + JWT 鉴权（`get_current_user` 依赖、`User` 表含 `xp`/`streak` 学习字段、httpx 已在 requirements.txt）。前端为无路由单页站（`App.tsx` 直接组合 sections），无 markdown 渲染依赖。学习目标（daily-goals）目前是前端 mock，未入库。动机见 proposal.md，行为契约见 specs。

## Goals / Non-Goals

**Goals:**
- 最小可用对话链路：前端气泡 UI ↔ FastAPI SSE ↔ DeepSeek ↔ SQLite 持久化
- 个性化上下文基于已入库的真实数据（`User.xp`/`streak`），不虚构
- 复用现有鉴权、配置、测试设施；品牌站 sections 零改动

**Non-Goals:**
- 语音输入、文件上传、模型切换（proposal out-of-scope）
- 多会话管理、会话列表 UI（单会话模型：每用户一条消息时间线）
- daily-goals 入库（维持前端 mock，个性化上下文不用它）

## Decisions

### D1: 前端路由用 HashRouter（react-router-dom）

gh-pages 静态托管没有 history fallback，`/chat` 刷新会 404。HashRouter（`#/chat`）零配置可用。备选 BrowserRouter + 404.html hack——复杂且 gh-pages 行为不稳定，放弃。

### D2: 流式传输用 fetch + ReadableStream 读 SSE

后端 FastAPI `StreamingResponse(media_type="text/event-stream")` 输出 SSE；前端用 `fetch` POST + 手工解析 `data:` 行。备选 `EventSource`——只支持 GET 且无法携带 `Authorization` header，直接排除。不引 SSE 客户端库（解析 `data:` 行约 20 行代码）。

### D3: DeepSeek 用 httpx 直连 OpenAI 兼容接口

`POST https://api.deepseek.com/chat/completions`（`stream=true`），后端 httpx `AsyncClient` 流式转发并逐段组装 SSE 事件。不引 `openai` SDK——httpx 已有，SDK 只省几十行且引入间接层。

### D4: 数据模型为单表 `chat_messages`

```sql
chat_messages(
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),  -- 索引
  role TEXT NOT NULL,       -- 'user' | 'assistant'
  content TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
)
```

单会话模型下不需要 `conversations` 表。Alembic 迁移编号顺延现有 `0001_create_users`。

### D5: 个性化上下文 = system prompt 注入 User 表数据

每次请求组装 system prompt：用户名、xp、streak、注册时长，附固定助手人设（学习辅导、简体中文回复）。上下文消息取该用户最近 20 条 `chat_messages`。备选读取 daily-goals——数据未持久化（勾选不落库），注入会虚构，放弃。

### D6: markdown 用 react-markdown + remark-gfm；自动滚动用阈值判断

react-markdown 默认不渲染 raw HTML（安全）。自动滚动：监听容器 scroll，仅当用户位于底部附近（距底 < 40px）时流式期间 `scrollTop = scrollHeight`；否则不打扰（对应 spec「上滚不强制拉回」）。

### D7: API base URL 用 Vite 环境变量

`import.meta.env.VITE_API_BASE`（默认 `http://localhost:8000`）。生产后端地址部署时注入，不硬编码。

## 组件层级

```
App.tsx（HashRouter 包裹，"/" 原 sections 不动）
└── Routes
    ├── "/" → 原品牌站 sections（不变）
    └── "/chat" → ChatPage
                  ├── ChatHeader（标题 + 返回入口，复用 Navbar 视觉风格）
                  ├── MessageList
                  │   ├── MessageBubble（用户/AI 两种气泡样式）
                  │   │   └── Markdown 渲染（react-markdown，AI 消息）
                  │   └── StreamingBubble（流式中的 AI 占位气泡）
                  ├── ChatInput（textarea + 发送按钮）
                  └── （逻辑层）useChat hook：消息状态、SSE 解析、发送、自动滚动
src/api/chat.ts：sendMessage（fetch 流式）、fetchHistory（GET）
```

样式全部 Tailwind 工具类 + `dark:` 前缀，复用 `theme/` 主题系统。

## API 端点规范

### `POST /api/chat/messages`

- 鉴权：`Authorization: Bearer <access token>`（复用 `get_current_user`），无效 → `401`
- 请求体：`{ "content": string }`（1-4000 字符，超长 → `422`）
- 响应：`Content-Type: text/event-stream`，事件序列：
  - `data: {"type": "delta", "content": "<增量文本>"}`
  - `data: {"type": "done"}`（成功结束；此时用户消息与完整 AI 回复已落库）
  - `data: {"type": "error", "message": "<原因>"}`（DeepSeek 失败/超时；已产生的增量仍会尽力落库，落库失败时 message 中注明）
- 流式响应头含 `Cache-Control: no-cache`、`X-Accel-Buffering: no`

### `GET /api/chat/messages`

- 鉴权：同上，无效 → `401`
- 响应 200：`{ "messages": [{ "role", "content", "created_at" }, ...] }` 按时间升序，仅当前用户记录
- 数据库异常 → `500`（`{ "detail": "..." }`）

## Risks / Trade-offs

- [DeepSeek API key 泄漏] → key 仅存后端 `.env`（`deepseek_api_key` 进 `Settings`），前端代码与仓库不含 key
- [反向代理缓冲导致 SSE 卡顿] → 响应头带 `X-Accel-Buffering: no`；本地开发 uvicorn 直连无此问题
- [gh-pages 站点无后端可达] → 对话页请求失败时展示明确离线提示（复用 spec 错误场景）；后端部署地址通过 `VITE_API_BASE` 注入，本变更不含后端部署
- [流式中途断连丢消息] → 前端保留已收到的增量文本于页面会话；done 前断连不落库 assistant 消息，用户消息先行落库（发送即存）
- [长对话超上下文] → 仅送最近 20 条历史；后续需要时再做摘要压缩（不在本变更）

## Migration Plan

1. 后端：新增 Alembic 迁移建 `chat_messages` 表 → 新增 `routers/chat.py` → pytest 通过后与现有端点同进程部署
2. 前端：新增 `react-router-dom`、`react-markdown`、`remark-gfm` → `App.tsx` 加 HashRouter 与 `/chat` 路由 → 品牌站构建产物行为不变
3. 回滚：前端移除 `/chat` 路由项即回退，根路由不受影响；后端停用 chat 路由即回滚，`chat_messages` 表数据保留

## Open Questions

（无——API base URL、数据模型、上下文策略均已定，可安全延后的事项仅有长对话摘要策略，见 Risks）
