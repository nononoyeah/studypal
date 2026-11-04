# Design

## Context

项目当前为纯前端 Vite 站点（无 Python 代码），后端从零新增，位于独立
`backend/` 目录，不触碰 `src/` 与构建部署流程。存储、身份、计算口径的
技术选型需在本阶段定型。动机见 proposal.md，行为契约见 specs/。

## Goals / Non-Goals

**Goals:**

- 可独立运行的最小 FastAPI 服务：注册 / 登录 / 刷新 / Profile 四组端点
- SQLite + Alembic 版本化建库，可 `downgrade base` 一键回滚
- 密码只存哈希；JWT 双 token（access / refresh）带类型声明

**Non-Goals:**

- proposal 的 out-of-scope 清单全部沿用（OAuth、邮箱验证、RBAC、多会话、前端 UI）
- 不做异步 ORM、连接池调优等单机 SQLite 用不到的复杂度

## Decisions

### D1 目录结构（组件层级）

```
backend/
├── alembic/                  # 迁移环境 + versions/
├── alembic.ini
├── app/
│   ├── main.py               # FastAPI 实例、CORS、路由挂载
│   ├── config.py             # pydantic-settings 读 .env（SECRET_KEY 等）
│   ├── database.py           # SQLAlchemy engine / SessionLocal
│   ├── models.py             # User ORM 模型
│   ├── schemas.py            # Pydantic 请求/响应模型
│   ├── security.py           # 密码哈希 + JWT 签发/校验（唯一安全模块）
│   ├── deps.py               # get_current_user 依赖（受保护端点入口）
│   └── routers/
│       ├── auth.py           # register / login / refresh
│       └── users.py          # GET/PATCH /users/me
├── requirements.txt
└── tests/                    # 端到端 API 测试（TestClient + 内存 SQLite）
```

层级：router → deps（身份）→ security（令牌/哈希）→ models/database（数据）。
备选：单文件 main.py —— 否决，router/deps 分层是 FastAPI 官方推荐且本变更
已含 2 个能力域，单文件不可维护。

### D2 关键依赖选型

| 用途 | 选择 | 否决项及原因 |
|---|---|---|
| JWT | **PyJWT** | python-jose 有已知 CVE 且停更 |
| 密码哈希 | **bcrypt（直接调用）** | passlib 停更且与 bcrypt>=4.1 存在兼容性问题 |
| ORM/迁移 | SQLAlchemy 2（同步）+ Alembic | 异步 ORM 对单机 SQLite 是无谓复杂度 |
| 配置 | pydantic-settings（.env） | 纯 os.environ 无类型校验 |

### D3 JWT 策略

- HS256 + `SECRET_KEY`（.env 注入，默认值仅供本地开发并在日志中警告）
- access token 有效期 30 分钟，refresh token 7 天
- 两类 token 均含 `type` claim（`access` / `refresh`）；刷新端点只接受
  `type=refresh`，`get_current_user` 只接受 `type=access` —— 互斥防混用
- 单用户单 refresh token：本版本不落库不轮换，靠短有效期 + 7 天上限兜底
  （对应 proposal 的多会话 out-of-scope）

### D4 streak 计算口径（登录时后端计算）

登录成功时比对 `last_login_date`：为空 → streak=1（注册即首日）；
等于今天 → 不变；等于昨天 → +1；更早 → 重置 1。字段存 `DATE` 类型，
比较用本地日期，不做时区换算（单机单时区假设，跨时区属后续 change）。

### D5 level 映射表

xp → level 固定区间（代码内常量表，不落库）：
`0→L1, 100→L2, 300→L3, 600→L4, 1000→L5`（阈值向上封顶）。本版本 xp
恒为 0，端点只负责按表映射返回；xp 增长来源为后续学习行为 change。

### D6 API 端点规范（全部挂 `/api` 前缀）

| 端点 | 方法 | 认证 | 请求体 | 成功响应 | 错误 |
|---|---|---|---|---|---|
| `/api/auth/register` | POST | 无 | `{username, password}` | 201 `{id, username}` | 409 重复 / 422 校验 |
| `/api/auth/login` | POST | 无 | `{username, password}` | 200 `{access_token, refresh_token, token_type, user}` | 401 凭据不符 |
| `/api/auth/refresh` | POST | 无（凭 refresh token） | `{refresh_token}` | 200 `{access_token}` | 401 无效/过期/类型错 |
| `/api/users/me` | GET | Bearer access | — | 200 `{id, username, avatar_url, streak, level, xp}` | 401 |
| `/api/users/me` | PATCH | Bearer access | `{avatar_url}` | 200 同上（新值） | 401 / 422 URL 非法 |

`user` / Profile 响应中永远不包含密码哈希字段（Pydantic 响应模型白名单控制）。
`token_type` 固定 `bearer`。登录/刷新端点返回体不使用 OAuth2 表单编码，统一
JSON（前端尚未接入，无历史包袱）。

### D7 部署形态

GitHub Pages 仍只发前端静态产物；FastAPI 由 `uvicorn` 独立运行（本地开发
`uvicorn app.main:app --reload`），与 gh-pages 流水线零耦合。上线后前端经
CORS 访问本服务（开发期放开 `localhost:5173`）。

## Risks / Trade-offs

- [SQLite 单写者并发] → 本版本用户量级为个人站，锁等待可接受；换 Postgres 仅改连接串
- [refresh token 不落库，无法主动吊销] → 7 天有效期上限 + 属 proposal 明确的 out-of-scope；泄露场景后续以轮换/黑名单 change 处理
- [SECRET_KEY 弱默认值] → 启动时检测默认值并打印警告；生产环境必须注入 .env
- [streak 用服务器本地日期] → 单机部署时区一致；多区域部署前需改为 UTC+用户时区口径

## Migration Plan

1. `pip install -r requirements.txt`
2. `alembic upgrade head` 建库（`studypal.db`）
3. 回滚：`alembic downgrade base` 删表；代码回滚 = 删除 `backend/` 目录

## Open Questions

（无 —— 影响契约的决策均已在 D3/D4/D5 定型）
