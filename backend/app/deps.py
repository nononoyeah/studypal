import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.security import decode_token

bearer_scheme = HTTPBearer(auto_error=False)

credentials_error = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="凭据缺失、无效或已过期",
    headers={"WWW-Authenticate": "Bearer"},
)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise credentials_error
    try:
        payload = decode_token(credentials.credentials, "access")
    except jwt.ExpiredSignatureError as exc:
        raise credentials_error from exc
    except jwt.InvalidTokenError as exc:
        raise credentials_error from exc
    user = db.get(User, int(payload["sub"]))
    if user is None:
        raise credentials_error
    return user
