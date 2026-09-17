"""
Conversation ownership — which entity currently owns a chat session.

Document shape (collection `conversation_ownership`, keyed by unique session_id):
{
  "session_id": str,
  "user_id": str,               # the customer owning the session
  "mode": "AI" | "HUMAN" | "RESOLVED",
  "ticket_id": Optional[str],
  "human_agent_id": Optional[str],
  "human_agent_name": Optional[str],
  "created_at": datetime,
  "updated_at": datetime,
}
"""
from datetime import datetime, timezone

MODE_AI = "AI"
MODE_HUMAN = "HUMAN"
MODE_RESOLVED = "RESOLVED"


async def get_conversation_ownership(db, session_id: str):
    """Return the ownership doc or None (which implies AI-owned)."""
    try:
        return await db.conversation_ownership.find_one({"session_id": session_id})
    except AttributeError:
        return None


async def get_conversation_mode(db, session_id: str) -> str:
    """Return the current ownership mode ("AI" | "HUMAN" | "RESOLVED")."""
    doc = await get_conversation_ownership(db, session_id)
    return doc.get("mode", MODE_AI) if doc else MODE_AI


async def take_over_conversation(db, session_id: str, ticket_id: str, agent_user, agent_name: str = None):
    """Hand the conversation to a human support agent (mode → HUMAN)."""
    now = datetime.now(timezone.utc)
    name = (
        agent_name
        or getattr(agent_user, "name", None)
        or getattr(agent_user, "email", None)
        or getattr(agent_user, "user_id", "support")
    )
    fields = {
        "session_id": session_id,
        "user_id": getattr(agent_user, "user_id", None),
        "mode": MODE_HUMAN,
        "ticket_id": ticket_id,
        "human_agent_id": getattr(agent_user, "user_id", None),
        "human_agent_name": name,
        "updated_at": now,
    }
    existing = await get_conversation_ownership(db, session_id)
    if existing:
        existing = await db.conversation_ownership.find_one_and_update(
            {"session_id": session_id},
            {"$set": fields},
        )
        return existing
    doc = {
        "session_id": session_id,
        "mode": MODE_HUMAN,
        "created_at": now,
        **fields,
    }
    await db.conversation_ownership.insert_one(doc)
    return doc


async def release_conversation(db, session_id: str, mode: str = MODE_RESOLVED):
    """Release an owned conversation so the AI may resume (or mark RESOLVED)."""
    existing = await get_conversation_ownership(db, session_id)
    if existing is None:
        return None
    return await db.conversation_ownership.find_one_and_update(
        {"session_id": session_id},
        {"$set": {"mode": mode, "updated_at": datetime.now(timezone.utc)}},
    )