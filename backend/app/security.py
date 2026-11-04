from datetime import datetime, timedelta, timezone
from typing import Literal

import bcrypt
import jwt

from app.config import get_settings

TokenType = Literal["access", "refresh"]


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_token(
    user_id: int, token_type: TokenType, expires_delta: timedelta
) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "type": token_type,
        "iat": now,
        "exp": now + expires_delta,
    }
    return jwt.encode(payload, get_settings().secret_key, algorithm="HS256")


def create_access_token(user_id: int) -> str:
    minutes = get_settings().access_token_expire_minutes
    return create_token(user_id, "access", timedelta(minutes=minutes))


def create_refresh_token(user_id: int) -> str:
    days = get_settings().refresh_token_expire_days
    return create_token(user_id, "refresh", timedelta(days=days))


def decode_token(token: str, expected_type: TokenType) -> dict:
    payload = jwt.decode(
        token, get_settings().secret_key, algorithms=["HS256"]
    )
    if payload.get("type") != expected_type:
        raise jwt.InvalidTokenError("token type mismatch")
    return payload
