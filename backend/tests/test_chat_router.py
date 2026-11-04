import json

import httpx
import pytest
from fastapi.testclient import TestClient

from app.config import Settings
from app.models import ChatMessage, User
from app.routers import chat as chat_router
from app.security import create_access_token


def _auth(user) -> dict:
    return {"Authorization": f"Bearer {create_access_token(user.id)}"}


def _fake_settings(monkeypatch, key="sk-test"):
    settings = Settings(deepseek_api_key=key, _env_file=None)
    monkeypatch.setattr(chat_router, "get_settings", lambda: settings)


def _mock_deepseek(monkeypatch, sse_body: bytes, status_code: int = 200):
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(status_code, content=sse_body)

    real_client = httpx.AsyncClient

    def fake_client(**kwargs):
        return real_client(transport=httpx.MockTransport(handler), **kwargs)

    monkeypatch.setattr(chat_router.httpx, "AsyncClient", fake_client)


def _upstream_sse(chunks: list[str], tail: str = "data: [DONE]") -> bytes:
    lines = [
        "data: " + json.dumps({"choices": [{"delta": {"content": c}}]})
        for c in chunks
    ]
    lines.append(tail)
    return ("\n\n".join(lines) + "\n\n").encode()


def _parse_sse(text: str) -> list[dict]:
    return [
        json.loads(line[len("data: "):])
        for line in text.splitlines()
        if line.startswith("data: ")
    ]


def _add_message(db, user_id: int, role: str, content: str) -> None:
    db.add(ChatMessage(user_id=user_id, role=role, content=content))
    db.commit()


# --- GET /api/chat/messages（task 2.2）---


def test_get_history_normal(client, db_session, test_user):
    _add_message(db_session, test_user.id, "user", "第一问")
    _add_message(db_session, test_user.id, "assistant", "第一答")

    res = client.get("/api/chat/messages", headers=_auth(test_user))
    assert res.status_code == 200
    messages = res.json()["messages"]
    assert [m["role"] for m in messages] == ["user", "assistant"]
    assert messages[0]["content"] == "第一问"
    assert messages[0]["created_at"]


def test_get_history_requires_auth(client):
    assert client.get("/api/chat/messages").status_code == 401


def test_get_history_user_isolation(client, db_session, test_user):
    other = User(username="bob", password_hash="x")
    db_session.add(other)
    db_session.commit()
    db_session.refresh(other)
    _add_message(db_session, test_user.id, "user", "alice 的消息")
    _add_message(db_session, other.id, "user", "bob 的消息")

    res = client.get("/api/chat/messages", headers=_auth(test_user))
    contents = [m["content"] for m in res.json()["messages"]]
    assert contents == ["alice 的消息"]


# --- 个性化上下文（task 2.3）---


def test_build_chat_messages_with_learning_data(db_session, test_user):
    test_user.xp = 120
    test_user.streak = 3
    db_session.commit()

    history = chat_router._recent_history(db_session, test_user.id)
    messages = chat_router.build_chat_messages(test_user, history)
    system = messages[0]["content"]
    assert messages[0]["role"] == "system"
    assert "alice" in system
    assert "120" in system
    assert "等级 2" in system
    assert "3 天" in system


def test_build_chat_messages_new_user(db_session, test_user):
    history = chat_router._recent_history(db_session, test_user.id)
    messages = chat_router.build_chat_messages(test_user, history)
    system = messages[0]["content"]
    assert "不要虚构" in system
    assert "0" in system


# --- POST /api/chat/messages（task 2.4 / 2.5）---


def test_send_message_stream_and_persist(
    client, db_session, test_user, monkeypatch
):
    _fake_settings(monkeypatch)
    _mock_deepseek(monkeypatch, _upstream_sse(["你好", "，加油！"]))

    res = client.post(
        "/api/chat/messages",
        json={"content": "给我一个学习建议"},
        headers=_auth(test_user),
    )
    events = _parse_sse(res.text)
    assert res.headers["content-type"].startswith("text/event-stream")
    assert [e["type"] for e in events] == ["delta", "delta", "done"]
    assert events[0]["content"] == "你好"
    assert events[1]["content"] == "，加油！"

    rows = (
        db_session.query(ChatMessage)
        .filter(ChatMessage.user_id == test_user.id)
        .order_by(ChatMessage.id)
        .all()
    )
    assert [(r.role, r.content) for r in rows] == [
        ("user", "给我一个学习建议"),
        ("assistant", "你好，加油！"),
    ]


def test_send_message_requires_auth(client, db_session):
    res = client.post("/api/chat/messages", json={"content": "hi"})
    assert res.status_code == 401
    assert db_session.query(ChatMessage).count() == 0


def test_send_message_upstream_error(
    client, db_session, test_user, monkeypatch
):
    _fake_settings(monkeypatch)
    _mock_deepseek(monkeypatch, b"", status_code=503)

    res = client.post(
        "/api/chat/messages",
        json={"content": "hi"},
        headers=_auth(test_user),
    )
    events = _parse_sse(res.text)
    assert len(events) == 1
    assert events[0]["type"] == "error"
    assert "503" in events[0]["message"]
    roles = [
        r.role
        for r in db_session.query(ChatMessage)
        .filter(ChatMessage.user_id == test_user.id)
        .all()
    ]
    assert roles == ["user"]


def test_send_message_partial_persist_on_bad_chunk(
    client, db_session, test_user, monkeypatch
):
    _fake_settings(monkeypatch)
    body = _upstream_sse(["部分回复"], tail="data: {broken json")
    _mock_deepseek(monkeypatch, body)

    res = client.post(
        "/api/chat/messages",
        json={"content": "hi"},
        headers=_auth(test_user),
    )
    events = _parse_sse(res.text)
    types = [e["type"] for e in events]
    assert "delta" in types and events[-1]["type"] == "error"

    rows = (
        db_session.query(ChatMessage)
        .filter(ChatMessage.user_id == test_user.id)
        .order_by(ChatMessage.id)
        .all()
    )
    assert [(r.role, r.content) for r in rows] == [
        ("user", "hi"),
        ("assistant", "部分回复"),
    ]


def test_send_message_store_failure_noted(
    client, db_session, test_user, monkeypatch
):
    _fake_settings(monkeypatch)
    _mock_deepseek(monkeypatch, _upstream_sse(["回复"]))

    real_commit = type(db_session).commit
    calls = {"n": 0}

    def flaky_commit(session):
        calls["n"] += 1
        if calls["n"] >= 2:
            raise Exception("db down")
        return real_commit(session)

    monkeypatch.setattr(type(db_session), "commit", flaky_commit)

    res = client.post(
        "/api/chat/messages",
        json={"content": "hi"},
        headers=_auth(test_user),
    )
    events = _parse_sse(res.text)
    assert events[-1]["type"] == "error"
    assert "存储失败" in events[-1]["message"]


def test_send_message_content_too_long(client, test_user):
    res = client.post(
        "/api/chat/messages",
        json={"content": "a" * 4001},
        headers=_auth(test_user),
    )
    assert res.status_code == 422
