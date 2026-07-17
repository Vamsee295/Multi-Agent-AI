"""
MongoDB document models (plain dict-shaped helpers; no ODM dependency required).
"""
from datetime import datetime, timezone
from typing import Optional
from bson import ObjectId


def new_user_doc(name: str, email: str, hashed_password: str) -> dict:
    return {
        "name": name,
        "email": email.lower(),
        "hashed_password": hashed_password,
        "created_at": datetime.now(timezone.utc),
    }


def new_message_doc(
    session_id: str,
    user_id: Optional[str],
    role: str,
    content: str,
    agents_invoked: list[str],
    response_time_ms: int = 0,
    sentiment: str = "neutral",
    sentiment_score: float = 0.5,
) -> dict:
    return {
        "session_id": session_id,
        "user_id": user_id,
        "role": role,
        "content": content,
        "agents_invoked": agents_invoked,
        "response_time_ms": response_time_ms,
        "sentiment": sentiment,
        "sentiment_score": sentiment_score,
        "timestamp": datetime.now(timezone.utc),
    }


def new_escalation_doc(
    session_id: str,
    user_id: Optional[str],
    trigger_message: str,
    agents_invoked: list[str],
    intent_confidence: float,
) -> dict:
    return {
        "session_id": session_id,
        "user_id": user_id,
        "trigger_message": trigger_message,
        "agents_invoked": agents_invoked,
        "intent_confidence": intent_confidence,
        "status": "open",
        "created_at": datetime.now(timezone.utc),
    }


def new_feedback_doc(
    session_id: str,
    user_id: Optional[str],
    rating: str,
    comment: Optional[str] = None,
) -> dict:
    return {
        "session_id": session_id,
        "user_id": user_id,
        "rating": rating,
        "comment": comment,
        "created_at": datetime.now(timezone.utc),
    }


def oid(value: str) -> ObjectId:
    return ObjectId(value)
