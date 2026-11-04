from datetime import timedelta

import jwt as pyjwt
import pytest

from app.config import get_settings
from app.security import (
    create_access_token,
    create_refresh_token,
    create_token,
    decode_token,
    hash_password,
    verify_password,
)


def test_password_hash_roundtrip():
    hashed = hash_password("secret123")
    assert hashed != "secret123"
    assert "secret123" not in hashed
    assert verify_password("secret123", hashed)
    assert not verify_password("wrong-pass", hashed)


def test_access_token_payload():
    token = create_access_token(42)
    payload = decode_token(token, "access")
    assert payload["sub"] == "42"
    assert payload["type"] == "access"
    remaining = payload["exp"] - payload["iat"]
    assert remaining == get_settings().access_token_expire_minutes * 60


def test_refresh_token_payload():
    token = create_refresh_token(7)
    payload = decode_token(token, "refresh")
    assert payload["sub"] == "7"
    assert payload["type"] == "refresh"
    remaining = payload["exp"] - payload["iat"]
    assert remaining == get_settings().refresh_token_expire_days * 86400


def test_access_token_rejected_as_refresh():
    token = create_access_token(1)
    with pytest.raises(pyjwt.InvalidTokenError):
        decode_token(token, "refresh")


def test_forged_signature_rejected():
    token = pyjwt.encode(
        {"sub": "1", "type": "access"}, "attacker-key", algorithm="HS256"
    )
    with pytest.raises(pyjwt.InvalidTokenError):
        decode_token(token, "access")


def test_expired_token_rejected():
    token = create_token(1, "access", timedelta(minutes=-5))
    with pytest.raises(pyjwt.ExpiredSignatureError):
        decode_token(token, "access")
