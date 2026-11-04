from fastapi import APIRouter, Depends
from pydantic import HttpUrl
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import User
from app.schemas import ProfileResponse, ProfileUpdateRequest

# D5 映射表：xp 阈值 → 等级，向上封顶 MAX_LEVEL
LEVEL_THRESHOLDS = [(0, 1), (100, 2), (300, 3), (600, 4), (1000, 5)]
MAX_LEVEL = LEVEL_THRESHOLDS[-1][1]


def xp_to_level(xp: int) -> int:
    level = LEVEL_THRESHOLDS[0][1]
    for threshold, lv in LEVEL_THRESHOLDS:
        if xp >= threshold:
            level = lv
    return level


router = APIRouter(prefix="/users", tags=["users"])


def profile_of(user: User) -> ProfileResponse:
    return ProfileResponse(
        id=user.id,
        username=user.username,
        avatar_url=user.avatar_url,
        streak=user.streak,
        level=xp_to_level(user.xp),
        xp=user.xp,
    )


@router.get("/me", response_model=ProfileResponse)
def get_me(user: User = Depends(get_current_user)):
    return profile_of(user)


@router.patch("/me", response_model=ProfileResponse)
def update_me(
    body: ProfileUpdateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user.avatar_url = str(body.avatar_url)
    db.commit()
    db.refresh(user)
    return profile_of(user)
