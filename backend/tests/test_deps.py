from datetime import timedelta

import jwt as pyjwt
import pytest
from fastapi.testclient import TestClient

from app.security import create_access_token, create_token


def test_valid_token_passes(client: TestClient, test_user):
    token = create_access_token(test_user.id)
    res = client.get(
        "/protected", headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    assert res.json()["username"] == test_user.username


def test_missing_token_rejected(client: TestClient):
    res = client.get("/protected")
    assert res.status_code == 401


def test_malformed_header_rejected(client: TestClient):
    res = client.get("/protected", headers={"Authorization": "Bearer"})
    assert res.status_code == 401
    res = client.get("/protected", headers={"Authorization": "Basic abc"})
    assert res.status_code == 401


def test_expired_token_rejected(client: TestClient, test_user):
    token = create_token(test_user.id, "access", timedelta(minutes=-1))
    res = client.get(
        "/protected", headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 401


def test_refresh_type_token_rejected(client: TestClient, test_user):
    token = create_token(test_user.id, "refresh", timedelta(days=1))
    res = client.get(
        "/protected", headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 401


def test_tampered_token_rejected(client: TestClient):
    token = create_access_token(1)[:-3] + "xyz"
    res = client.get(
        "/protected", headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 401


def test_deleted_user_token_rejected(client: TestClient, test_user):
    token = create_access_token(test_user.id + 999)
    res = client.get(
        "/protected", headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 401
