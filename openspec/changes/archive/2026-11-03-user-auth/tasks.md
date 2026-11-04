# Tasks

## 1. 后端脚手架与数据库（基础设施）

- [x] 1.1 创建 `backend/` 目录结构（app/、routers/、tests/、alembic/）与 `requirements.txt`（fastapi、uvicorn、sqlalchemy、alembic、pyjwt、bcrypt、pydantic-settings、pytest、httpx），验证 `pip install -r requirements.txt` 成功
- [x] 1.2 实现 `app/config.py`（pydantic-settings 读 .env：SECRET_KEY、DATABASE_URL、token 有效期）与 `app/database.py`（engine/SessionLocal/Base），验证模块可导入
- [x] 1.3 实现 `app/models.py` User 模型（id、username 唯一、password_hash、avatar_url、xp 默认 0、streak 默认 0、last_login_date、created_at），验证字段与 design D4/D5 口径一致
- [x] 1.4 配置 Alembic（alembic.ini、env.py 挂接 Base 与 DATABASE_URL）并生成初始迁移，验证 `alembic upgrade head` 建出 users 表、`alembic downgrade base` 可回滚
- [x] 1.5 实现 `app/main.py`（FastAPI 实例、/api 前缀挂载占位、CORS 放开 localhost:5173），验证 `uvicorn app.main:app` 启动且 /docs 可访问

## 2. 安全模块（哈希 + JWT）

- [x] 2.1 实现 `app/security.py`：bcrypt 哈希/校验函数、access/refresh token 签发（HS256、30min/7d、type claim）与解码校验函数，验证 pytest 单测覆盖「哈希可校验、token 含正确 type/exp、伪造签名被拒」
- [x] 2.2 实现 `app/deps.py` 的 `get_current_user` 依赖（仅接受 type=access，解析失败/过期抛 401），验证 pytest 单测：有效 token 通过、缺失/过期/type 不符返回 401

## 3. 认证路由（register / login / refresh）

- [x] 3.1 实现 `app/schemas.py` 认证相关请求/响应模型（注册、登录、刷新、用户输出不含密码哈希），验证模型可导入且字段与 design D6 表一致
- [x] 3.2 实现 `app/routers/auth.py` 三个端点（409 重复注册、401 凭据不符且错误信息不区分密码错误/用户不存在、refresh 仅收 type=refresh），验证 pytest API 测试覆盖 specs 全部 9 个场景
- [x] 3.3 登录成功路径接入 streak 口径更新（D4 四分支逻辑落在用户记录上），验证 pytest API 测试覆盖当日重复/跨日/断签三分支

## 4. Profile 路由（users/me 读写）

- [x] 4.1 实现 `app/routers/users.py`：GET/PATCH `/api/users/me`，level 按 D5 映射表由 xp 计算，PATCH 仅接受合法 avatar_url 且 streak/level/xp 不可直改，验证 pytest API 测试覆盖 specs 全部 6 个场景（含未认证 401、非法 URL 422、默认 L1）

## 5. 集成验证

- [x] 5.1 全量 pytest 通过（backend/tests/），并用 uvicorn 启动后手动冒烟：注册 → 登录 → 刷新 → 读 Profile → 改头像 → 伪造 token 被 401，验证与 design D6 表逐项一致
- [x] 5.2 验证前端零影响：`npm run build` 成功、`src/` 无改动、dev.log 无新错误

## Workflow follow-up

- 按 AGENTS.md 分 Phase 提交 review；全部完成后运行 `openspec validate user-auth --strict`
- Archive 前确认回滚方案可执行（删除 backend/ + downgrade base）
