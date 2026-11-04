from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, HttpUrl


class RegisterRequest(BaseModel):
    username: str = Field(min_length=1, max_length=50)
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=50)
    password: str = Field(min_length=1, max_length=128)


class RefreshRequest(BaseModel):
    refresh_token: str


class UserPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserPublic


class RefreshResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ProfileResponse(BaseModel):
    id: int
    username: str
    avatar_url: str | None
    streak: int
    level: int
    xp: int


class ProfileUpdateRequest(BaseModel):
    avatar_url: HttpUrl


class ChatMessageRequest(BaseModel):
    content: str = Field(min_length=1, max_length=4000)


class ChatMessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    role: str
    content: str
    created_at: datetime


class ChatHistoryResponse(BaseModel):
    messages: list[ChatMessageOut]


# ---------- 学习数据分析（analysis-deploy） ----------


class AnalyticsSummaryResponse(BaseModel):
    activeDaysTotal: int
    activeDaysThisWeek: int
    streak: int
    messageCount: int
    xp: int


class TrendDay(BaseModel):
    date: str
    messageCount: int


class AnalyticsTrendResponse(BaseModel):
    period: str
    days: list[TrendDay]


class CalendarDay(BaseModel):
    date: str
    active: bool
    messageCount: int


class AnalyticsCalendarResponse(BaseModel):
    month: str
    days: list[CalendarDay]


class AchievementItem(BaseModel):
    id: str
    name: str
    description: str
    dimension: str
    target: int
    progress: int
    unlocked: bool


class AnalyticsAchievementsResponse(BaseModel):
    achievements: list[AchievementItem]
