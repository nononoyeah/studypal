"""实机冒烟：按 design D6 逐项验证 API 契约。

用法：先启动 uvicorn，再执行 python scripts/smoke.py <base_url>
"""
import sys

import httpx

base = sys.argv[1].rstrip("/")
ok = []


def step(name: str, got: int, want: int, extra=None):
    assert got == want, f"{name}: 期望 {want} 实际 {got} {extra or ''}"
    ok.append(name)


client = httpx.Client(base_url=base, timeout=10)

# 注册
r = client.post(
    "/api/auth/register",
    json={"username": "alice_smoke", "password": "password123"},
)
step("注册 201", r.status_code, 201)
step("注册响应不含密码字段", ("password" in r.json()), False)

# 重复注册 409
r = client.post(
    "/api/auth/register",
    json={"username": "alice_smoke", "password": "password123"},
)
step("重复注册 409", r.status_code, 409)

# 登录
r = client.post(
    "/api/auth/login",
    json={"username": "alice_smoke", "password": "password123"},
)
step("登录 200", r.status_code, 200)
tokens = r.json()
assert tokens["token_type"] == "bearer"
assert "refresh_token" in tokens and "access_token" in tokens
ok.append("登录返回双 token")

# 错误密码 401
r = client.post(
    "/api/auth/login",
    json={"username": "alice_smoke", "password": "wrong-password"},
)
step("错误密码 401", r.status_code, 401)

# 刷新
r = client.post(
    "/api/auth/refresh", json={"refresh_token": tokens["refresh_token"]}
)
step("刷新 200", r.status_code, 200)
new_access = r.json()["access_token"]

# 用 access token 冒充 refresh → 401
r = client.post("/api/auth/refresh", json={"refresh_token": tokens["access_token"]})
step("access 冒充 refresh 401", r.status_code, 401)

# 读 Profile
headers = {"Authorization": f"Bearer {new_access}"}
r = client.get("/api/users/me", headers=headers)
step("读 Profile 200", r.status_code, 200)
me = r.json()
assert me == {
    "id": me["id"],
    "username": "alice_smoke",
    "avatar_url": None,
    "streak": 1,
    "level": 1,
    "xp": 0,
}, me
ok.append(f"Profile 字段完整 {me}")

# 改头像
r = client.patch(
    "/api/users/me", headers=headers, json={"avatar_url": "https://example.com/a.png"}
)
step("改头像 200", r.status_code, 200)
assert r.json()["avatar_url"] == "https://example.com/a.png"
ok.append("头像已更新")

# 非法 URL 422
r = client.patch("/api/users/me", headers=headers, json={"avatar_url": "not-a-url"})
step("非法 URL 422", r.status_code, 422)

# 伪造 token 401
forged = new_access[:-3] + "xyz"
r = client.get("/api/users/me", headers={"Authorization": f"Bearer {forged}"})
step("伪造 token 401", r.status_code, 401)

# 无 token 401
r = client.get("/api/users/me")
step("缺失 token 401", r.status_code, 401)

print(f"冒烟通过 {len(ok)} 项：")
for name in ok:
    print(f"  - {name}")
