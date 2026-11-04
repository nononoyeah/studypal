from datetime import date, datetime, time, timedelta

from fastapi.testclient import TestClient

from app.models import ChatMessage, User

SUMMARY = "/api/analytics/summary"
TREND = "/api/analytics/trend"
CALENDAR = "/api/analytics/calendar"
ACHIEVEMENTS = "/api/analytics/achievements"


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


def add_messages(db_session, user_id, messages: list[date], count_per_day=1):
    for day in messages:
        for _ in range(count_per_day):
            db_session.add(
                ChatMessage(
                    user_id=user_id,
                    role="user",
                    content="hello",
                    created_at=datetime.combine(day, time(12, 0)),
                )
            )
    db_session.commit()


def get_user(db_session, username="alice") -> User:
    return db_session.query(User).filter_by(username=username).first()


# ---------- summary（3 场景） ----------


def test_summary_success(client: TestClient, db_session):
    headers = auth_header(client)
    user = get_user(db_session)
    user.xp = 240
    today = date.today()
    add_messages(db_session, user.id, [today, today - timedelta(days=1)], 2)
    add_messages(db_session, user.id, [today - timedelta(days=8)], 1)

    res = client.get(SUMMARY, headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["activeDaysTotal"] == 3
    assert body["activeDaysThisWeek"] == 2
    assert body["streak"] == 2
    assert body["messageCount"] == 5
    assert body["xp"] == 240


def test_summary_unauthorized(client: TestClient):
    assert client.get(SUMMARY).status_code == 401
    res = client.get(SUMMARY, headers={"Authorization": "Bearer not-a-token"})
    assert res.status_code == 401


def test_summary_new_user_all_zero(client: TestClient, db_session):
    headers = auth_header(client)
    res = client.get(SUMMARY, headers=headers)
    assert res.status_code == 200
    assert res.json() == {
        "activeDaysTotal": 0,
        "activeDaysThisWeek": 0,
        "streak": 0,
        "messageCount": 0,
        "xp": 0,
    }


# ---------- trend（4 场景） ----------


def test_trend_week_success(client: TestClient, db_session):
    headers = auth_header(client)
    user = get_user(db_session)
    today = date.today()
    add_messages(db_session, user.id, [today], 2)
    add_messages(db_session, user.id, [today - timedelta(days=1)], 1)

    res = client.get(TREND, headers=headers, params={"period": "week"})
    assert res.status_code == 200
    body = res.json()
    assert body["period"] == "week"
    assert len(body["days"]) == 7
    assert body["days"][-1] == {"date": today.isoformat(), "messageCount": 2}
    assert body["days"][-2]["messageCount"] == 1
    assert body["days"][0]["messageCount"] == 0


def test_trend_month_success(client: TestClient, db_session):
    headers = auth_header(client)
    user = get_user(db_session)
    today = date.today()
    add_messages(db_session, user.id, [today.replace(day=1)], 3)

    res = client.get(TREND, headers=headers, params={"period": "month"})
    assert res.status_code == 200
    body = res.json()
    assert body["period"] == "month"
    assert len(body["days"]) == today.day
    assert body["days"][0] == {
        "date": today.replace(day=1).isoformat(),
        "messageCount": 3,
    }


def test_trend_invalid_period(client: TestClient):
    headers = auth_header(client)
    res = client.get(TREND, headers=headers, params={"period": "year"})
    assert res.status_code == 400


def test_trend_unauthorized(client: TestClient):
    assert client.get(TREND, params={"period": "week"}).status_code == 401


# ---------- calendar（4 场景） ----------


def test_calendar_success(client: TestClient, db_session):
    headers = auth_header(client)
    user = get_user(db_session)
    today = date.today()
    add_messages(db_session, user.id, [today], 4)

    res = client.get(
        CALENDAR, headers=headers, params={"month": today.strftime("%Y-%m")}
    )
    assert res.status_code == 200
    body = res.json()
    assert body["month"] == today.strftime("%Y-%m")
    assert body["days"] == [
        {"date": today.isoformat(), "active": True, "messageCount": 4}
    ]


def test_calendar_invalid_month(client: TestClient):
    headers = auth_header(client)
    for bad in ("2026-13", "not-a-month", "2026/11"):
        res = client.get(CALENDAR, headers=headers, params={"month": bad})
        assert res.status_code == 400


def test_calendar_unauthorized(client: TestClient):
    res = client.get(CALENDAR, params={"month": "2026-11"})
    assert res.status_code == 401


def test_calendar_future_month_empty(client: TestClient):
    headers = auth_header(client)
    next_month = date.today().replace(day=28) + timedelta(days=7)
    res = client.get(
        CALENDAR,
        headers=headers,
        params={"month": next_month.strftime("%Y-%m")},
    )
    assert res.status_code == 200
    assert res.json()["days"] == []


# ---------- achievements（4 场景） ----------


def test_achievements_progress_and_unlock(client: TestClient, db_session):
    headers = auth_header(client)
    user = get_user(db_session)
    user.xp = 120
    today = date.today()
    add_messages(db_session, user.id, [today, today - timedelta(days=1)], 2)

    res = client.get(ACHIEVEMENTS, headers=headers)
    assert res.status_code == 200
    items = {item["id"]: item for item in res.json()["achievements"]}
    assert items["xp-100"]["unlocked"] is True
    assert items["xp-100"]["progress"] == 120
    assert items["streak-3"]["unlocked"] is False
    assert items["streak-3"]["progress"] == 2
    assert items["messages-50"]["progress"] == 4
    assert items["active-days-7"]["progress"] == 2
    # 同维度低档解锁时高档保持未解锁
    assert items["xp-500"]["unlocked"] is False


def test_achievements_new_user_all_locked(client: TestClient):
    headers = auth_header(client)
    res = client.get(ACHIEVEMENTS, headers=headers)
    assert res.status_code == 200
    items = res.json()["achievements"]
    assert len(items) == 8
    assert all(item["unlocked"] is False and item["progress"] == 0 for item in items)


def test_achievements_unauthorized(client: TestClient):
    assert client.get(ACHIEVEMENTS).status_code == 401


def test_achievements_dimension_coverage():
    from app.routers.analytics import ACHIEVEMENT_RULES

    dimensions = {rule[3] for rule in ACHIEVEMENT_RULES}
    assert dimensions == {"xp", "streak", "messages", "active_days"}
