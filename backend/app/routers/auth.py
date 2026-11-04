from datetime import date, timedelta

import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import credentials_error
from app.models import User
from app.schemas import (
    LoginRequest,
    RefreshRequest,
    RefreshResponse,
    RegisterRequest,
    TokenResponse,
    UserPublic,
)
from app.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])


def apply_streak_on_login(user: User, today: date) -> None:
    if user.last_login_date == today:
        return
    if user.last_login_date is None:
        user.streak = 1
    elif user.last_login_date == today - timedelta(days=1):
        user.streak += 1
    else:
        user.streak = 1
    user.last_login_date = today


@router.post("/register", response_model=UserPublic, status_code=201)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    exists = db.query(User).filter(User.username == body.username).first()
    if exists is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="用户名已被注册"
        )
    user = User(username=body.username, password_hash=hash_password(body.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == body.username).first()
    if user is None or not verify_password(body.password, user.password_hash):
        raise credentials_error
    apply_streak_on_login(user, date.today())
    db.commit()
    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
        user=UserPublic.model_validate(user),
    )


@router.post("/refresh", response_model=RefreshResponse)
def refresh(body: RefreshRequest):
    try:
        payload = decode_token(body.refresh_token, "refresh")
    except jwt.InvalidTokenError as exc:
        raise credentials_error from exc
    return RefreshResponse(access_token=create_access_token(int(payload["sub"])))
