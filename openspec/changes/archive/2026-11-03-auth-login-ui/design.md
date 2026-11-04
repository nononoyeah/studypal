# Design

## Context

后端三个 auth 端点契约已由 `auth/user-auth` spec 固定（register 201 返回 `{id, username}` **不含 token**、login 返回双 token、refresh 返回新 access token）。前端 `src/api/chat.ts` 已有 `access_token` localStorage 约定与 `hasToken()`，`ChatPage` 已有 `error.kind === 'unauthorized'` 分支。动机见 proposal.md，行为契约见 specs。

## Goals / Non-Goals

**Goals:**
- 最小登录闭环：二合一页 ↔ 既有后端端点 ↔ localStorage 双 token ↔ 401 自动恢复
- 复用：chat 模块的 token 读取收敛到共享模块，不复制 key 常量

**Non-Goals:**
- OAuth / 找回密码 / 邮箱验证（proposal out-of-scope）
- HttpOnly cookie 方案（需后端同域部署配合，gh-pages 分离部署下超范围；见 Risks）
- 后端任何改动

## Decisions

### D1: 二合一页用 mode state 切换，不拆两个路由

`#/login` 一个路由，组件内 `mode: 'login' | 'register'` 切换按钮组。两个路由需要互相传递来源意图且视觉重复，单路由单状态最简。

### D2: 注册成功自动登录 = 顺序调用 register → login

register 不返回 token（后端契约），注册成功后用同一凭据调 login 是唯一路径，无需后端改动。

### D3: token 存取收敛到 `src/api/auth.ts` 单模块

导出 `getAccessToken()/setTokens(access, refresh)/clearTokens()/hasToken()`。`ACCESS_KEY = 'access_token'`（与 ai-chat 现有约定一致，存量 token 不失效）；新增 `REFRESH_KEY = 'refresh_token'`。`chat.ts` 删除私有 `TOKEN_KEY` 与 `hasToken`，改 import 共享模块。

### D4: 401 恢复用共享 fetch 包装 `authFetch`，单例 refresh promise 防并发

`authFetch(input, init)`：带 access token 发请求 → 401 且有 refresh token → 发起 refresh（进行中则复用同一 promise，满足「并发仅刷新一次」）→ 成功换新 token 重放原请求一次 → 失败 `clearTokens()` 并抛 `ChatUnauthorizedError` 类错误。`chat.ts` 的 `sendMessage/fetchHistory` 内部改走 `authFetch`，对外签名不变。重放仅一次，避免 refresh 间期二次 401 死循环。

### D5: 登录后回跳用路由 state

未登录引导/守卫跳转登录页时传 `state: { from: 当前路径 }`；登录成功 `navigate(state?.from ?? '/chat')`。默认落在 `/chat`（本次登录闭环的主要目标页）。

### D6: 对话页守卫保持页内引导 + 「去登录」按钮跳转，不做路由级重定向

`ChatPage` 现有 `unauthorized` 分支升级为引导卡片 + `Link to="/login" state={{from:'/chat'}}`。不引入路由守卫组件/自动重定向：URL 直达 `#/chat` 时保持可见的引导页，浏览器后退行为更自然，实现最少。

### D7: 退出登录入口放 ChatHeader

已登录时在 `ChatHeader` 右侧显示「退出」按钮（未登录不显示）：`clearTokens()` + `navigate('/')`。品牌站 Navbar 不加登出（无个人中心，避免污染品牌导航）。

## 组件层级

```
App.tsx（HashRouter，新增一条 Route）
├── "/" → 品牌站（不变）
├── "/chat" → ChatPage
│             ├── ChatHeader（新增：已登录时「退出」按钮）
│             ├── UnauthorizedNotice（升级：引导卡 + 「去登录」Link，state.from='/chat'）
│             └── MessageList / ChatInput（不变）
└── "/login" → LoginPage（新）
              ├── ModeSwitch（登录/注册切换）
              ├── AuthForm（用户名/密码 + 就地校验 + 错误提示 + 提交）
              └── （逻辑层）useAuthForm hook：mode 状态、提交、错误处理
src/api/auth.ts（新）：token 存取 + register/login/refresh 调用 + authFetch
src/api/chat.ts（改）：改用 authFetch 与共享 token 模块，对外签名不变
```

`LoginPage` 视觉复用 zinc/indigo 色系与 `dark:` 前缀，居中卡片布局，含返回首页入口。

## API 端点规范（前端调用契约，后端已实现不变）

### `POST /api/auth/register`
- 请求：`{ "username": string(1-50), "password": string(8-128) }`
- 响应 201：`{ "id": int, "username": string }`（无 token，随后自动登录）
- 错误：409 `{"detail": "用户名已被注册"}`；422 校验失败

### `POST /api/auth/login`
- 请求：同上
- 响应 200：`{ "access_token", "refresh_token", "token_type": "bearer", "user": {"id", "username"} }`
- 错误：401 `{"detail": "凭据缺失、无效或已过期"}`（密码错误/用户不存在共用，前端展示该 detail）

### `POST /api/auth/refresh`
- 请求：`{ "refresh_token": string }`
- 响应 200：`{ "access_token", "token_type": "bearer" }`
- 错误：401（refresh token 无效/过期 → 前端清凭据转登录页）

## Risks / Trade-offs

- [XSS 可读 localStorage token] → SPA 常规权衡；缓解：无富文本注入面（react-markdown 默认不渲染 raw HTML），access 30 分钟短有效期 + refresh 7 天；HttpOnly 方案待后端同域部署时再评估
- [refresh 请求本身 401 死循环] → `authFetch` 内 refresh 调用走裸 fetch 不走包装；重放仅一次
- [多 tab 并发刷新竞态] → 单例 refresh promise 在单 tab 内保证仅一次；跨 tab 竞态接受（后 refresh 覆盖前者，最终一致可用）
- [存量手动注入的 token 无 refresh pair] → `authFetch` 无 refresh token 时 401 直接抛未登录错误，行为与现状一致，不劣化

## Migration Plan

1. 新增 `src/api/auth.ts`（含 authFetch）→ chat.ts 切换 → 既有对话功能回归（手动注入 token 的旧路径仍可用）
2. 新增 `LoginPage` + `#/login` 路由 → ChatPage 引导与 ChatHeader 退出接线
3. 回滚：移除 `/login` 路由与 auth.ts、还原 chat.ts 与 ChatPage/ChatHeader 即回退；后端零改动无需回滚

## Open Questions

（无——回跳目标、二合一形态、刷新策略均已定；HttpOnly cookie 为部署期事项，见 Risks）
