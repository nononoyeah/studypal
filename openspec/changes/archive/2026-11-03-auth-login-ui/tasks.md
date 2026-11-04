# Tasks

## 1. auth API 模块与 token 管理

- [x] 1.1 新增 `src/api/auth.ts`：token 存取（`getAccessToken/setTokens/clearTokens/hasToken`，`ACCESS_KEY='access_token'` 与 chat 现状一致）+ `register/login/refresh` 三个调用 + `authFetch`（401 → 单例 refresh promise → 重放一次 → 失败清凭据抛未登录错误；refresh 调用走裸 fetch）；为 `authFetch` 的刷新/重放/并发单次逻辑编写纯逻辑测试（mock fetch，node --test，参照 `scripts/chat-sse.test.ts`）并验证通过
- [x] 1.2 改造 `src/api/chat.ts`：删除私有 `TOKEN_KEY/hasToken`，改用共享模块与 `authFetch`，对外签名不变；运行既有 `scripts/chat-sse.test.ts` 与 `npm run build` 验证无回归

## 2. 登录页与路由

- [x] 2.1 新增 `src/hooks/useAuthForm.ts`：mode（login/register）状态、就地校验（用户名 1-50、密码 8-128，与后端一致）、提交（注册成功顺序调 login 实现自动登录）、错误信息提取（后端 detail 优先）
- [x] 2.2 新增 `LoginPage`（含 ModeSwitch、AuthForm、返回首页入口，zinc/indigo + dark: 前缀）并在 `App.tsx` 注册 `#/login` 路由；手动验证：登录成功按 state.from 跳转（无意图默认 `/chat`）、注册成功自动登录、凭据错误就地提示不跳转、前端校验拦截不发请求

## 3. 对话页集成

- [x] 3.1 升级 `ChatPage` 的 `UnauthorizedNotice`：引导卡 + 「去登录」`Link`（`state={{ from: '/chat' }}`）；`ChatHeader` 增加已登录「退出」按钮（`clearTokens` + 跳首页），未登录不显示；手动验证：未登录访问 `#/chat` 显示引导并可去登录后回跳对话页、退出后回首页且凭据已清空

## 4. 集成验证

- [x] 4.1 端到端验证：uvicorn + dev server，注册新用户 → 自动登录 → 对话页发消息流式回复 → 手动改坏 localStorage 的 access token 模拟过期 → 再次发消息自动恢复（重放成功）→ 清掉 refresh token 模拟失效 → 引导回登录页；对照 specs 全部 Scenario 核对
- [x] 4.2 回归验证：品牌站根路由 sections 不变、`npm run build` 与 `npm run lint` 通过、`node --test scripts/` 全部通过；确认 proposal 回滚路径（移除路由与模块还原 chat.ts）可行

## Workflow follow-up

- 全部任务完成后运行 `openspec validate auth-login-ui`，review 通过后 `/opsx-archive` 归档。
