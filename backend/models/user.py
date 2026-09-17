"""
MongoDB document models (plain dict-shaped helpers; no ODM dependency required).
"""
from datetime import datetime, timezone
from typing import Optional
from bson import ObjectId

from models.escalation_constants import TICKET_ID_PREFIX


def new_user_doc(name: str, email: str, hashed_password: str, role: str = "user") -> dict:
    return {
        "name": name,
        "email": email.lower(),
        "hashed_password": hashed_password,
        "role": role,
        "created_at": datetime.now(timezone.utc),
    }


def new_supabase_user_doc(supabase_uid: str, email: str, name: str, role: str = "user") -> dict:
    return {
        "supabase_uid": supabase_uid,
        "name": name,
        "email": email.lower(),
        "role": role,
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
    retrieval_time_ms: float = 0.0,
    chunks_retrieved: int = 0,
    author_name: Optional[str] = None,
) -> dict:
    """Message document. `role` is one of "user" | "assistant" | "human"."""
    doc = {
        "session_id": session_id,
        "user_id": user_id,
        "role": role,
        "content": content,
        "agents_invoked": agents_invoked,
        "response_time_ms": response_time_ms,
        "sentiment": sentiment,
        "sentiment_score": sentiment_score,
        "retrieval_time_ms": retrieval_time_ms,
        "chunks_retrieved": chunks_retrieved,
        "timestamp": datetime.now(timezone.utc),
    }
    if role == "human" and author_name:
        doc["author_name"] = author_name
    return doc


import random

def generate_ticket_id() -> str:
    """Return a `HF-####` ticket identifier."""
    return f"{TICKET_ID_PREFIX}-{random.randint(1000, 9999)}"


def new_escalation_doc(
    session_id: str,
    user_id: Optional[str],
    trigger_message: str,
    agents_invoked: list[str],
    intent_confidence: float,
    *,
    reason: str = "OTHER",
    source: str = "AI",
    priority: str = "MEDIUM",
    status: str = "ESCALATED",
    category: Optional[str] = None,
    assigned_team: Optional[str] = None,
    ai_summary: Optional[str] = None,
    ticket_id: Optional[str] = None,
) -> dict:
    now = datetime.now(timezone.utc)

    # Backward-compatible team fallback based on the agents that ran.
    if assigned_team is None:
        if "billing" in agents_invoked:
            assigned_team = "Billing Support"
        elif "technical" in agents_invoked:
            assigned_team = "Technical Support"
        else:
            assigned_team = "Customer Success"

    return {
        "ticket_id": ticket_id or generate_ticket_id(),
        "priority": priority,
        "assigned_team": assigned_team,
        "assigned_agent": None,
        "session_id": session_id,
        "user_id": user_id,
        "trigger_message": trigger_message,
        "agents_invoked": agents_invoked,
        "intent_confidence": intent_confidence,
        "reason": reason,
        "source": source,
        "status": status,
        "category": category,
        "ai_summary": ai_summary,
        "events": [],
        # Backward-compat flag so existing UI/analytics keep working.
        "escalated": True,
        "created_at": now,
        "updated_at": now,
        "resolved_at": None,
        "resolved_by": None,
    }


def new_escalation_event(
    event_type: str,
    *,
    status: Optional[str] = None,
    message: Optional[str] = None,
    actor: Optional[str] = None,
    actor_type: Optional[str] = None,
) -> dict:
    return {
        "type": event_type,
        "status": status,
        "message": message,
        "actor": actor,
        "actor_type": actor_type,
        "created_at": datetime.now(timezone.utc),
    }


def new_feedback_doc(
    session_id: str,
    user_id: Optional[str],
    rating: str,
    comment: Optional[str] = None,
    message_id: Optional[str] = None,
) -> dict:
    return {
        "session_id": session_id,
        "message_id": message_id,
        "user_id": user_id,
        "rating": rating,
        "comment": comment,
        "created_at": datetime.now(timezone.utc),
    }


def oid(value: str) -> ObjectId:
    return ObjectId(value)