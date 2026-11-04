# Proposal

## Why

`auth/user-auth` 后端 API 已实现归档，但前端没有任何登录入口：用户无法通过界面登录，`ai-chat` 对话页的「请先登录」只是一段提示文案，token 只能靠手动写入 localStorage——平台所有受保护功能（AI 对话等）对真实用户不可用。补齐前端登录闭环是平台可用的前提。

## What Changes

- 新增登录/注册二合一页面（`#/login`）：同一表单切换登录/注册模式，注册成功自动登录
- 新增前端 token 管理：登录后存储 access/refresh token（复用 ai-chat 已有的 `access_token` localStorage 约定）；access token 过期时用 refresh token 自动刷新并重放原请求，刷新失败清除凭据回登录页
- 登录成功后跳回登录前想访问的页面（默认对话页）
- 对话页未登录引导接入「去登录」跳转；新增退出登录入口（清除本地凭据回首页）
- out-of-scope（本变更明确不做）：
  - 第三方 OAuth 登录（GitHub / Google 等）
  - 邮箱验证、找回密码、修改密码
  - 记住我 / 免登录续期策略调整（沿用后端现有 30 分钟 access / 7 天 refresh 配置）
  - 个人中心页面（仅做退出登录入口）

## Capabilities

### New Capabilities

- `auth/login-ui`: 前端登录能力——登录/注册页面、token 存储与过期自动恢复（refresh 刷新重放）、登录后回跳、未登录访问受保护页面的引导、退出登录

### Modified Capabilities

（无——`auth/user-auth` 的全部 requirement 是后端 API 行为，本变更不改变它们；`learning/ai-chat` 的 spec 行为同样不变，对话页仅接入登录跳转属于实现层接线）

## Impact

- **前端**：新增 `LoginPage` 组件与 `#/login` 路由；新增 `src/api/auth.ts`（register/login/refresh 调用 + token 存取）；`src/api/chat.ts` 改为共享 token 模块（消除重复的 TOKEN_KEY 定义）并接入 401 自动刷新重放；`App.tsx` 增加路由；`ChatPage` 未登录引导改为跳转登录页
- **后端**：零改动（三个 auth 端点契约已由 user-auth spec 固定）
- **部署**：纯前端改动，不影响 gh-pages 构建与部署
- **回滚方案**：登录页为独立路由、token 管理为独立模块，移除路由与模块即回退；chat 模块回退为直接读 `access_token`，对话页恢复纯提示文案
