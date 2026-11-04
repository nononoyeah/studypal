from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import ChatMessage, User
from app.schemas import (
    AnalyticsAchievementsResponse,
    AnalyticsCalendarResponse,
    AnalyticsSummaryResponse,
    AnalyticsTrendResponse,
    AchievementItem,
    CalendarDay,
    TrendDay,
)

router = APIRouter(prefix="/analytics", tags=["analytics"])

DATE_FORMAT = "%Y-%m-%d"
MONTH_FORMAT = "%Y-%m"

# 成就规则表：(id, 名称, 描述, 维度, 目标值)，unlocked = progress >= target
ACHIEVEMENT_RULES = [
    ("xp-100", "初露锋芒", "累计经验值达到 100", "xp", 100),
    ("xp-500", "经验丰厚", "累计经验值达到 500", "xp", 500),
    ("streak-3", "三日之约", "连续学习活跃 3 天", "streak", 3),
    ("streak-7", "坚持一周", "连续学习活跃 7 天", "streak", 7),
    ("messages-50", "对话健将", "累计对话消息达到 50 条", "messages", 50),
    ("messages-200", "交流达人", "累计对话消息达到 200 条", "messages", 200),
    ("active-days-7", "活跃一周", "累计学习活跃 7 天", "active_days", 7),
    ("active-days-30", "活跃一月", "累计学习活跃 30 天", "active_days", 30),
]


def _daily_counts(db: Session, user_id: int) -> dict[date, int]:
    """按活跃日定义聚合：当日该用户 chat_messages ≥ 1 条。"""
    rows = (
        db.query(func.date(ChatMessage.created_at), func.count(ChatMessage.id))
        .filter(ChatMessage.user_id == user_id)
        .group_by(func.date(ChatMessage.created_at))
        .all()
    )
    return {date.fromisoformat(day): count for day, count in rows}


def _learning_streak(active_dates: dict[date, int], today: date) -> int:
    """连续学习活跃天数：今日或昨日活跃即延续，与登录打卡 streak 解耦。"""
    start = today if today in active_dates else today - timedelta(days=1)
    streak = 0
    while start in active_dates:
        streak += 1
        start -= timedelta(days=1)
    return streak


@router.get("/summary", response_model=AnalyticsSummaryResponse)
def get_summary(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    counts = _daily_counts(db, user.id)
    today = date.today()
    week_start = today - timedelta(days=6)
    return AnalyticsSummaryResponse(
        activeDaysTotal=len(counts),
        activeDaysThisWeek=sum(1 for day in counts if day >= week_start),
        streak=_learning_streak(counts, today),
        messageCount=sum(counts.values()),
        xp=user.xp,
    )


@router.get("/trend", response_model=AnalyticsTrendResponse)
def get_trend(
    period: str = Query(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    today = date.today()
    if period == "week":
        start = today - timedelta(days=6)
    elif period == "month":
        start = today.replace(day=1)
    else:
        raise HTTPException(status_code=400, detail="period 须为 week 或 month")
    counts = _daily_counts(db, user.id)
    days = []
    day = start
    while day <= today:
        days.append(TrendDay(date=day.isoformat(), messageCount=counts.get(day, 0)))
        day += timedelta(days=1)
    return AnalyticsTrendResponse(period=period, days=days)


@router.get("/calendar", response_model=AnalyticsCalendarResponse)
def get_calendar(
    month: str = Query(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        first_day = datetime.strptime(month, MONTH_FORMAT).date()
    except ValueError as exc:
        raise HTTPException(
            status_code=400, detail="month 须为 YYYY-MM 格式"
        ) from exc
    counts = _daily_counts(db, user.id)
    # days 仅包含该月有消息记录的日期；未列出的日期视为非活跃
    days = [
        CalendarDay(date=day.isoformat(), active=True, messageCount=count)
        for day, count in sorted(counts.items())
        if day.year == first_day.year and day.month == first_day.month
    ]
    return AnalyticsCalendarResponse(month=month, days=days)


@router.get("/achievements", response_model=AnalyticsAchievementsResponse)
def get_achievements(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    counts = _daily_counts(db, user.id)
    progress = {
        "xp": user.xp,
        "streak": _learning_streak(counts, date.today()),
        "messages": sum(counts.values()),
        "active_days": len(counts),
    }
    achievements = [
        AchievementItem(
            id=ach_id,
            name=name,
            description=description,
            dimension=dimension,
            target=target,
            progress=progress[dimension],
            unlocked=progress[dimension] >= target,
        )
        for ach_id, name, description, dimension, target in ACHIEVEMENT_RULES
    ]
    return AnalyticsAchievementsResponse(achievements=achievements)
