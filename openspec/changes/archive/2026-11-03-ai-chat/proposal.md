# Proposal

## Why

现有「AI 建议学习面板」是 mock 静态数据，无法回答用户的具体问题。学习平台需要一个真实可对话的 AI 学习助手：用户就学习内容提问，AI 结合该用户的学习数据给出个性化建议，补齐平台从「展示数据」到「交互辅导」的关键一环。

## What Changes

- 新增 AI 学习助手对话页面：气泡式 chat UI、markdown 渲染、流式输出自动滚动
- 新增后端流式对话端点（SSE），接入 DeepSeek API（OpenAI 兼容协议）
- 对话消息持久化到 SQLite，按用户隔离；复用 user-auth 的 token 体系做端点鉴权
- 后端在每次对话前组装该用户的学习数据（统计、目标等）注入 system prompt，实现个性化回复
- 前端引入路由方案，对话页面挂载在独立路由下；品牌站单页 sections 结构保持不变
- out-of-scope（本变更明确不做）：
  - 语音输入
  - 文件上传
  - 模型切换（固定 DeepSeek 单模型）
  - 多会话管理界面（仅保留当前用户最近一个会话的上下文连续性）

## Capabilities

### New Capabilities

- `learning/ai-chat`: AI 学习助手对话能力——对话页面 UI（气泡、markdown、自动滚动）、流式对话端点（SSE）、消息持久化、基于学习数据的个性化上下文注入与端点鉴权

### Modified Capabilities

（无——`learning/ai-suggestions` 保持 mock 静态展示行为不变；本变更不触碰其任何 requirement）

## Impact

- **前端**：新增 Chat 页面组件与路由；新增依赖 `react-router-dom`、`react-markdown`；新增 chat API client；`App.tsx` 改为路由挂载（`/` 仍渲染品牌站 sections）
- **后端**：扩展现有 FastAPI 应用（backend/）；SQLite 新增 `chat_messages` 表（单会话模型）；依赖 DeepSeek API 密钥（环境变量），无新增 Python 依赖（httpx 已有）
- **用户体系**：对话端点为受保护端点，复用 `auth/user-auth` 的 access token 校验
- **部署**：前端仍走 gh-pages；后端不影响现有构建与部署流程
- **回滚方案**：前端对话页为独立路由，移除路由项即回退，品牌站不受影响；后端为独立应用，停用即回滚，SQLite 数据保留不丢失
