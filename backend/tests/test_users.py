import pytest
from fastapi.testclient import TestClient

from app.models import User
from app.routers.users import xp_to_level

URL = "https://example.com/avatar.png"


def auth_header(client: TestClient, username="alice"):
    client.post(
        "/api/auth/register",
        json={"username": username, "password": "password123"},
    )
    token = client.post(
        "/api/auth/login",
        json={"username": username, "password": "password123"},
    ).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# ---------- 读取（2 场景） ----------


def test_get_profile_success(client: TestClient):
    headers = auth_header(client)
    res = client.get("/api/users/me", headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["username"] == "alice"
    assert body["avatar_url"] is None
    assert body["streak"] == 1  # 注册后首登
    assert body["xp"] == 0
    assert body["level"] == 1  # 默认等级 L1
    assert "password_hash" not in body


def test_get_profile_unauthorized(client: TestClient):
    assert client.get("/api/users/me").status_code == 401
    res = client.get(
        "/api/users/me", headers={"Authorization": "Bearer not-a-token"}
    )
    assert res.status_code == 401


# ---------- 更新头像（2 场景） ----------


def test_update_avatar_success(client: TestClient, db_session):
    headers = auth_header(client)
    res = client.patch("/api/users/me", headers=headers, json={"avatar_url": URL})
    assert res.status_code == 200
    assert res.json()["avatar_url"] == URL
    user = db_session.query(User).filter_by(username="alice").first()
    assert user.avatar_url == URL


def test_update_avatar_invalid_url(client: TestClient, db_session):
    headers = auth_header(client)
    res = client.patch(
        "/api/users/me", headers=headers, json={"avatar_url": "not-a-url"}
    )
    assert res.status_code == 422
    user = db_session.query(User).filter_by(username="alice").first()
    assert user.avatar_url is None


# ---------- 等级映射（2 场景） ----------


def test_level_default_and_recalc(client: TestClient, db_session):
    headers = auth_header(client)
    assert client.get("/api/users/me", headers=headers).json()["level"] == 1

    user = db_session.query(User).filter_by(username="alice").first()
    user.xp = 300
    db_session.commit()
    assert client.get("/api/users/me", headers=headers).json()["level"] == 3


@pytest.mark.parametrize(
    "xp,level",
    [(0, 1), (99, 1), (100, 2), (299, 2), (300, 3), (600, 4), (999, 4), (1000, 5), (99999, 5)],
)
def test_xp_to_level_boundaries(xp, level):
    assert xp_to_level(xp) == level


def test_streak_level_not_patchable(client: TestClient, db_session):
    headers = auth_header(client)
    res = client.patch(
        "/api/users/me",
        headers=headers,
        json={"avatar_url": URL, "streak": 99, "level": 5, "xp": 9999},
    )
    assert res.status_code == 200
    user = db_session.query(User).filter_by(username="alice").first()
    assert user.xp == 0
    assert res.json()["level"] == 1
