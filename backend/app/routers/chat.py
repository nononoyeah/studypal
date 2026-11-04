import json

import httpx
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.deps import get_current_user
from app.models import ChatMessage, User
from app.routers.users import xp_to_level
from app.schemas import ChatHistoryResponse, ChatMessageOut, ChatMessageRequest

router = APIRouter(prefix="/chat", tags=["chat"])

HISTORY_CONTEXT_LIMIT = 20


def _sse(payload: dict) -> str:
    return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"


def build_chat_messages(user: User, history: list[ChatMessage]) -> list[dict]:
    """个性化上下文：system prompt 注入真实学习数据 + 最近对话历史。"""
    system_prompt = (
        "你是 StudyPal 平台的 AI 学习助手，用简体中文回复，回答要具体、可执行。\n"
        f"当前用户资料：用户名 {user.username}；经验值 xp {user.xp}；"
        f"等级 {xp_to_level(user.xp)}；连续学习 streak {user.streak} 天；"
        f"注册于 {user.created_at:%Y-%m-%d}。\n"
        "回复建议时应结合以上真实学习数据；数据为零或缺失时不要虚构，"
        "给出通用学习建议。"
    )
    messages = [{"role": "system", "content": system_prompt}]
    messages.extend({"role": m.role, "content": m.content} for m in history)
    return messages


def _recent_history(db: Session, user_id: int) -> list[ChatMessage]:
    rows = (
        db.query(ChatMessage)
        .filter(ChatMessage.user_id == user_id)
        .order_by(ChatMessage.id.desc())
        .limit(HISTORY_CONTEXT_LIMIT)
        .all()
    )
    return list(reversed(rows))


@router.get("/messages", response_model=ChatHistoryResponse)
def get_history(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(ChatMessage)
        .filter(ChatMessage.user_id == user.id)
        .order_by(ChatMessage.id)
        .all()
    )
    return ChatHistoryResponse(
        messages=[ChatMessageOut.model_validate(r) for r in rows]
    )


@router.post("/messages")
async def send_message(
    body: ChatMessageRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    history = _recent_history(db, user.id)
    db.add(ChatMessage(user_id=user.id, role="user", content=body.content))
    db.commit()

    settings = get_settings()
    payload_messages = build_chat_messages(history=[*history], user=user)

    async def stream():
        if not settings.deepseek_api_key:
            yield _sse({"type": "error", "message": "AI 服务未配置（deepseek_api_key 为空）"})
            return

        collected: list[str] = []
        try:
            async with httpx.AsyncClient(
                timeout=httpx.Timeout(60.0)
            ) as client:
                async with client.stream(
                    "POST",
                    f"{settings.deepseek_base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {settings.deepseek_api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": settings.deepseek_model,
                        "messages": payload_messages,
                        "stream": True,
                    },
                ) as response:
                    if response.status_code != 200:
                        await response.aread()
                        yield _sse(
                            {
                                "type": "error",
                                "message": f"AI 服务返回状态 {response.status_code}",
                            }
                        )
                        return
                    async for line in response.aiter_lines():
                        if not line.startswith("data:"):
                            continue
                        data = line[5:].strip()
                        if data == "[DONE]":
                            break
                        delta = json.loads(data)["choices"][0]["delta"].get("content")
                        if delta:
                            collected.append(delta)
                            yield _sse({"type": "delta", "content": delta})
        except (httpx.HTTPError, json.JSONDecodeError, KeyError, IndexError) as exc:
            partial = "".join(collected)
            if partial:
                db.add(ChatMessage(user_id=user.id, role="assistant", content=partial))
                try:
                    db.commit()
                except Exception:
                    yield _sse(
                        {
                            "type": "error",
                            "message": f"AI 调用中断（{exc}），且已产生内容存储失败",
                        }
                    )
                    return
            yield _sse({"type": "error", "message": f"AI 服务调用失败：{exc}"})
            return

        try:
            db.add(
                ChatMessage(
                    user_id=user.id, role="assistant", content="".join(collected)
                )
            )
            db.commit()
        except Exception as exc:
            yield _sse({"type": "error", "message": f"回复存储失败：{exc}"})
            return
        yield _sse({"type": "done"})

    return StreamingResponse(
        stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
