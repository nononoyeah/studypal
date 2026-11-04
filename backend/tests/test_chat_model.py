from app.models import ChatMessage, User


def _add_message(db, user_id: int, role: str, content: str) -> ChatMessage:
    message = ChatMessage(user_id=user_id, role=role, content=content)
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


def test_chat_message_persist_and_query(db_session, test_user):
    message = _add_message(db_session, test_user.id, "user", "你好")
    _add_message(db_session, test_user.id, "assistant", "你好！我是你的学习助手。")

    rows = (
        db_session.query(ChatMessage)
        .filter(ChatMessage.user_id == test_user.id)
        .order_by(ChatMessage.id)
        .all()
    )
    assert [r.role for r in rows] == ["user", "assistant"]
    assert rows[0].content == "你好"
    assert rows[0].user_id == test_user.id


def test_chat_message_user_isolation(db_session, test_user):
    other = User(username="bob", password_hash="x")
    db_session.add(other)
    db_session.commit()
    db_session.refresh(other)

    _add_message(db_session, test_user.id, "user", "alice 的消息")
    _add_message(db_session, other.id, "user", "bob 的消息")

    alice_rows = (
        db_session.query(ChatMessage)
        .filter(ChatMessage.user_id == test_user.id)
        .all()
    )
    assert len(alice_rows) == 1
    assert alice_rows[0].content == "alice 的消息"
