from datetime import date, timedelta

from fastapi.testclient import TestClient

from app.models import User
from app.security import create_access_token, decode_token

PWD = "password123"


def register(client, username="alice"):
    return client.post(
        "/api/auth/register", json={"username": username, "password": PWD}
    )


def login(client, username="alice", password=PWD):
    return client.post(
        "/api/auth/login", json={"username": username, "password": password}
    )


# ---------- 注册（3 场景） ----------


def test_register_success(client: TestClient, db_session):
    res = register(client)
    assert res.status_code == 201
    body = res.json()
    assert body["username"] == "alice"
    assert "password" not in body and "password_hash" not in body
    user = db_session.query(User).filter_by(username="alice").first()
    assert user.password_hash != PWD


def test_register_duplicate_username(client: TestClient):
    register(client)
    res = register(client)
    assert res.status_code == 409


def test_register_validation_failed(client: TestClient):
    assert client.post(
        "/api/auth/register", json={"username": "", "password": PWD}
    ).status_code == 422
    assert client.post(
        "/api/auth/register", json={"username": "bob", "password": "short"}
    ).status_code == 422


# ---------- 登录（3 场景） ----------


def test_login_success(client: TestClient):
    register(client)
    res = login(client)
    assert res.status_code == 200
    body = res.json()
    assert body["token_type"] == "bearer"
    assert body["user"]["username"] == "alice"
    assert decode_token(body["access_token"], "access")["sub"] == str(
        body["user"]["id"]
    )
    assert decode_token(body["refresh_token"], "refresh")["sub"] == str(
        body["user"]["id"]
    )


def test_login_wrong_password(client: TestClient):
    register(client)
    res = login(client, password="wrong-password")
    assert res.status_code == 401


def test_login_unknown_user_same_error(client: TestClient):
    register(client)
    wrong_pwd = login(client, password="wrong-password").json()
    unknown = login(client, username="nobody").json()
    assert unknown["detail"] == wrong_pwd["detail"]


# ---------- 刷新（3 场景） ----------


def test_refresh_success(client: TestClient):
    register(client)
    refresh_token = login(client).json()["refresh_token"]
    res = client.post("/api/auth/refresh", json={"refresh_token": refresh_token})
    assert res.status_code == 200
    new_access = res.json()["access_token"]
    res = client.get("/protected", headers={"Authorization": f"Bearer {new_access}"})
    assert res.status_code == 200


def test_refresh_invalid_or_expired(client: TestClient):
    assert (
        client.post("/api/auth/refresh", json={"refresh_token": "garbage"}).status_code
        == 401
    )
    forged = create_access_token(1)[:-3] + "xyz"
    assert (
        client.post(
            "/api/auth/refresh", json={"refresh_token": forged}
        ).status_code
        == 401
    )


def test_refresh_rejects_access_token(client: TestClient):
    register(client)
    access_token = login(client).json()["access_token"]
    res = client.post("/api/auth/refresh", json={"refresh_token": access_token})
    assert res.status_code == 401


# ---------- streak 口径（D4 三分支） ----------


def test_streak_first_login(client: TestClient, db_session):
    register(client)
    login(client)
    user = db_session.query(User).filter_by(username="alice").first()
    assert user.streak == 1
    assert user.last_login_date == date.today()


def test_streak_same_day_unchanged(client: TestClient, db_session):
    register(client)
    user = db_session.query(User).filter_by(username="alice").first()
    user.streak = 3
    user.last_login_date = date.today()
    db_session.commit()

    login(client)
    db_session.refresh(user)
    assert user.streak == 3


def test_streak_next_day_increment(client: TestClient, db_session):
    register(client)
    user = db_session.query(User).filter_by(username="alice").first()
    user.streak = 3
    user.last_login_date = date.today() - timedelta(days=1)
    db_session.commit()

    login(client)
    db_session.refresh(user)
    assert user.streak == 4
    assert user.last_login_date == date.today()


def test_streak_broken_resets(client: TestClient, db_session):
    register(client)
    user = db_session.query(User).filter_by(username="alice").first()
    user.streak = 5
    user.last_login_date = date.today() - timedelta(days=2)
    db_session.commit()

    login(client)
    db_session.refresh(user)
    assert user.streak == 1
