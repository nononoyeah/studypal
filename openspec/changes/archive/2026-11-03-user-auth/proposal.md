# Proposal: user-auth

## Why

StudyPal（本项目 AI 学习平台）目前是纯前端静态站：mock 数据、无用户概念，
学习数据无法归属到人，用户等级/连续打卡等数据也无从产生。引入首个后端服务
与用户认证，是平台从展示型升级为服务型的第一步，为后续 AI 功能提供身份前提。

## What Changes

- 新增 FastAPI 后端服务（Python 侧，首个后端目录）：
  - 用户注册（用户名 + 密码）
  - 用户登录（成功签发 access token + refresh token）**BREAKING**（首次引入后端 API 契约）
  - JWT token 刷新（refresh 换新 access token）
  - JWT 校验依赖（受保护端点附着 token 校验）
- 新增用户 Profile 端点（受保护）：
  - 头像（URL 字段）
  - 连续学习天数（streak，由 login 后端计算，首版本按注册/登录日累计口径落地）
  - 用户等级（level，按经验值规则映射）
- 基础设施：
  - SQLite3 存储 + Alembic 数据库迁移
  - 密码哈希存储（禁止明文）

明确不做的事项（out-of-scope / NOT doing 清单）：
- 第三方 OAuth 登录（GitHub / Google 等）
- 邮箱验证、找回密码、改密码
- 角色权限体系（RBAC / 管理员后台）
- 多设备多会话管理（单用户单 refresh token）
- 前端登录/注册 UI 及前端接入改造（独立 change，Cataloged later）
- 真实连续学习天数的行为分析与学习功能联动（本版本为该字段的存储与返回口径）

## Capabilities

### New Capabilities

- `auth/user-auth`: 用户注册、登录、JWT access/refresh 签发与刷新、密码哈希存储
  的完整认证行为契约（含失败场景：重复注册、错误密码、过期/伪造 token）
- `user/profile`: 受保护的用户资料读取与更新行为（头像 URL、连续学习天数、
  用户等级），含等级/streak 计算口径

### Modified Capabilities

（无 —— 现有 specs 的 learning/* 能力均为 mock 阶段契约，本变更不修改其
requirement；前端接入 auth 属后续独立 change）

## Impact

- 新增代码：FastAPI 服务目录（应用、路由、模型、Alembic 迁移），不改现有
  `src/` 前端代码
- 依赖：FastAPI、SQLAlchemy/Alembic、JWT 与密码哈希库（Python 侧），前端零新增依赖
- 部署形态：GitHub Pages 仍只承载前端静态产物；FastAPI 服务需独立运行/部署
  （具体形态在 design.md 决策，与 config 中「统一 GitHub Pages」的表述差异留待
  design 折中处理，不阻塞本 proposal）
- 现有 mock 数据契约不变；未来 fetch 封装将对接本变更签立的 API 契约

## 回滚方案

- 本变更不触碰前端构建与 dist 流水线；后端为全新独立目录，删除目录即完成代码回滚
- 数据库通过 Alembic 迁移创建：`alembic downgrade base` 可回到空库；
  若尚无线上数据（初始版本无存量用户），回滚无数据迁移风险
