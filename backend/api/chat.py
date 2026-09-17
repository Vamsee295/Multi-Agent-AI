"""
Chat routes: send a message (runs the full multi-agent + RAG pipeline),
fetch conversation history, list sessions, generate AI summaries & titles,
and record user feedback.
"""
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, status

from database.mongo import get_db
from models.schemas import (
    ChatRequest,
    ChatResponse,
    RetrievedChunk,
    EscalationDetail,
    ConversationHistory,
    ConversationTurn,
    SessionSummary,
    FeedbackRequest,
    FeedbackResponse,
    SummarizeResponse,
    SessionTitleResponse,
)
from models.user import new_message_doc, new_feedback_doc
from agents.router import route_and_respond
from agents.llm_client import generate
from agents.prompts import (
    SUMMARIZER_SYSTEM,
    TITLE_GENERATOR_SYSTEM,
    build_summarizer_user_prompt,
    build_title_user_prompt,
)
from escalation.service import escalation_service
from escalation.handoff import get_conversation_mode
from auth.security import get_current_user_id, decode_access_token

HANDOFF_NOTICE = (
    "This conversation is currently handled by our human support team. "
    "A support agent will respond here shortly. The automated assistant has "
    "paused so they can take over."
)

router = APIRouter(prefix="/api/chat", tags=["chat"])


async def _optional_user_id(authorization: Optional[str] = Header(default=None)) -> Optional[str]:
    """Chat works for guests too; if a bearer token is present, attribute the session to a user."""
    if not authorization or not authorization.lower().startswith("bearer "):
        return None
    try:
        return decode_access_token(authorization.split(" ", 1)[1])
    except Exception:
        return None


async def _load_history_turns(db, session_id: str) -> list[dict]:
    cursor = db.messages.find({"session_id": session_id}).sort("timestamp", 1)
    return [{"role": doc.get("role", "user"), "content": doc.get("content", "")} async for doc in cursor]


async def _build_history_snippet(db, session_id: str) -> str:
    from agents.memory import build_history_snippet

    turns = await _load_history_turns(db, session_id)
    return build_history_snippet(turns)


async def _session_owner_ids(db, session_id: str) -> set[str]:
    cursor = db.messages.find({"session_id": session_id})
    owners: set[str] = set()
    async for doc in cursor:
        uid = doc.get("user_id")
        if uid:
            owners.add(uid)
    return owners


async def _verify_session_access(db, session_id: str, user_id: Optional[str]) -> None:
    owners = await _session_owner_ids(db, session_id)
    if not owners:
        return
    if user_id is None or user_id not in owners:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this conversation",
        )


# ── Session list ──────────────────────────────────────────────────────────────

@router.get("/sessions", response_model=list[SessionSummary])
async def list_sessions(user_id: str = Depends(get_current_user_id)):
    """Return all chat sessions belonging to the authenticated user."""
    db = get_db()
    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$sort": {"timestamp": -1}},
        {
            "$group": {
                "_id": "$session_id",
                "last_message": {"$first": "$content"},
                "last_timestamp": {"$first": "$timestamp"},
                "message_count": {"$sum": 1},
            }
        },
        {"$sort": {"last_timestamp": -1}},
    ]

    if hasattr(db.messages, "aggregate"):
        summaries = []
        async for doc in db.messages.aggregate(pipeline):
            # Try to fetch session title from titles collection
            title_doc = None
            try:
                title_doc = await db.session_titles.find_one({"session_id": doc["_id"]})
            except Exception:
                pass

            summaries.append(
                SessionSummary(
                    session_id=doc["_id"],
                    last_message=doc["last_message"],
                    last_timestamp=doc["last_timestamp"],
                    message_count=doc["message_count"],
                    title=title_doc["title"] if title_doc else None,
                )
            )
        return summaries

    # In-memory mock DB fallback
    cursor = db.messages.find({"user_id": user_id})
    by_session: dict[str, list] = {}
    async for doc in cursor:
        by_session.setdefault(doc["session_id"], []).append(doc)

    summaries = []
    for session_id, docs in by_session.items():
        docs.sort(key=lambda d: d["timestamp"])
        last = docs[-1]
        summaries.append(
            SessionSummary(
                session_id=session_id,
                last_message=last["content"],
                last_timestamp=last["timestamp"],
                message_count=len(docs),
            )
        )
    summaries.sort(key=lambda s: s.last_timestamp, reverse=True)
    return summaries


# ── Send message ──────────────────────────────────────────────────────────────

async def _escalate_or_notify_failure(db, session_id, user_id, message, routed, assistant_id, base_content):
    """Create the escalation ticket for a flagged turn.

    On success: returns clean ticket confirmation and structured escalation details.
    On failure: returns honest failure notice — never claims a ticket was created.
    Returns (final_message, escalation_details).
    """
    escalation_details = None
    try:
        doc, _created = await escalation_service.create_escalation(
            db,
            session_id=session_id,
            user_id=user_id,
            trigger_message=message,
            agents_invoked=routed.agents_invoked,
            intent_confidence=routed.intent_confidence,
            reason=routed.escalation_reason or "OTHER",
            source=routed.escalation_source or "AI",
            priority=routed.escalation_priority or None,
            category=routed.escalation_category or None,
        )
        escalation_details = EscalationDetail(
            ticket_id=doc["ticket_id"],
            reason=doc.get("reason", "OTHER"),
            source=doc.get("source", "AI"),
            priority=doc.get("priority", "MEDIUM"),
            status=doc.get("status", "PENDING_HUMAN"),
            assigned_team=doc.get("assigned_team", "Customer Success"),
            ai_summary=doc.get("ai_summary"),
            category=doc.get("category"),
            created_at=doc["created_at"],
        )
        if routed.escalation_reason == "USER_REQUESTED_HUMAN":
            final_message = (
                f"Your conversation has been escalated to human support. "
                f"Ticket **{doc['ticket_id']}** has been created and assigned to "
                f"{doc.get('assigned_team', 'Customer Success')}. A support specialist "
                f"will review your case and respond here shortly."
            )
        else:
            confirmation = (
                f"\n\n_Your conversation has been escalated to human support. "
                f"Ticket **{doc['ticket_id']}** has been created._"
            )
            final_message = base_content + confirmation
    except Exception:
        if routed.escalation_reason == "USER_REQUESTED_HUMAN":
            final_message = (
                "Something went wrong while creating the escalation ticket due to a system error. "
                "Please try again in a moment."
            )
        else:
            final_message = (
                base_content + "\n\n_Something went wrong while creating the escalation. Please try again._"
            )

    try:
        await db.messages.find_one_and_update(
            {"_id": assistant_id},
            {"$set": {"content": final_message}},
        )
    except Exception:
        pass
    return final_message, escalation_details


@router.post("", response_model=ChatResponse)
async def send_message(payload: ChatRequest, user_id: Optional[str] = Depends(_optional_user_id)):
    db = get_db()
    session_id = payload.session_id or str(uuid.uuid4())

    if payload.session_id:
        await _verify_session_access(db, session_id, user_id)

    # Conversation ownership: when a human owns the session, the AI stops
    # auto-answering. The customer's message is still stored in the thread.
    conversation_mode = await get_conversation_mode(db, session_id)
    is_human_owned = conversation_mode == "HUMAN"

    history_turns = []
    if payload.use_memory:
        history_turns = await _load_history_turns(db, session_id)

    await db.messages.insert_one(new_message_doc(session_id, user_id, "user", payload.message, []))

    if is_human_owned:
        await escalation_service.notify_customer_message(db, session_id, payload.message)
        return ChatResponse(
            session_id=session_id,
            message=HANDOFF_NOTICE,
            agents_invoked=[],
            intent_confidence=0.0,
            retrieved_context=[],
            escalated=False,
            conversation_mode="HUMAN",
            sentiment="neutral",
            sentiment_score=0.5,
            created_at=datetime.now(timezone.utc),
        )

    history_snippet = ""
    if payload.use_memory:
        history_snippet = await _build_history_snippet(db, session_id)

    try:
        routed = route_and_respond(
            message=payload.message,
            history_snippet=history_snippet,
            history_turns=history_turns,
            use_rag=True if payload.use_rag is None else payload.use_rag,
            model=payload.model,
            response_style=payload.response_style or "balanced",
            automatic_routing=True if payload.automatic_routing is None else payload.automatic_routing,
            preferred_agent=payload.preferred_agent,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Support assistant failed to generate a response: {exc}",
        ) from exc

    assistant_result = await db.messages.insert_one(
        new_message_doc(
            session_id, user_id, "assistant",
            routed.final_message, routed.agents_invoked,
            response_time_ms=routed.response_time_ms,
            sentiment=routed.sentiment,
            sentiment_score=routed.sentiment_score,
            retrieval_time_ms=routed.retrieval_time_ms,
            chunks_retrieved=routed.chunks_retrieved,
        )
    )
    assistant_id = assistant_result.inserted_id

    final_message = routed.final_message
    escalation_details = None
    if routed.escalated:
        final_message, escalation_details = await _escalate_or_notify_failure(
            db, session_id, user_id, payload.message, routed, assistant_id, routed.final_message
        )

    # Auto-generate a session title from the first user message
    try:
        existing_title = await db.session_titles.find_one({"session_id": session_id})
        if not existing_title:
            title = generate(TITLE_GENERATOR_SYSTEM, build_title_user_prompt(payload.message))
            title = title.strip().strip('"').strip("'")
            await db.session_titles.insert_one({
                "session_id": session_id,
                "user_id": user_id,
                "title": title,
                "created_at": datetime.now(timezone.utc),
            })
    except Exception:
        pass  # Title generation is best-effort

    return ChatResponse(
        session_id=session_id,
        message=final_message,
        agents_invoked=routed.agents_invoked,
        intent_confidence=routed.intent_confidence,
        retrieved_context=[
            RetrievedChunk(source=c["source"], text=c["text"], score=c.get("score", 0.0))
            for c in routed.retrieved_context
        ],
        escalated=routed.escalated,
        escalation_details=escalation_details,
        sentiment=routed.sentiment,
        sentiment_score=routed.sentiment_score,
        response_time_ms=routed.response_time_ms,
        created_at=datetime.now(timezone.utc),
        conversation_mode=conversation_mode,
    )


# ── History ───────────────────────────────────────────────────────────────────

@router.get("/{session_id}/history", response_model=ConversationHistory)
async def get_history(
    session_id: str,
    user_id: Optional[str] = Depends(_optional_user_id),
):
    db = get_db()
    await _verify_session_access(db, session_id, user_id)

    cursor = db.messages.find({"session_id": session_id}).sort("timestamp", 1)
    turns = [
        ConversationTurn(
            role=doc["role"],
            content=doc["content"],
            timestamp=doc["timestamp"],
            agents_invoked=doc.get("agents_invoked", []),
        )
        async for doc in cursor
    ]
    return ConversationHistory(session_id=session_id, turns=turns)


# ── AI Summarize ──────────────────────────────────────────────────────────────

@router.post("/{session_id}/summarize", response_model=SummarizeResponse)
async def summarize_session(
    session_id: str,
    user_id: Optional[str] = Depends(_optional_user_id),
):
    db = get_db()
    await _verify_session_access(db, session_id, user_id)

    cursor = db.messages.find({"session_id": session_id}).sort("timestamp", 1)
    turns = [{"role": doc["role"], "content": doc["content"]} async for doc in cursor]

    if not turns:
        raise HTTPException(status_code=404, detail="No messages found for this session.")

    try:
        summary = generate(SUMMARIZER_SYSTEM, build_summarizer_user_prompt(turns))
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Summarization failed: {exc}") from exc

    return SummarizeResponse(session_id=session_id, summary=summary.strip())


# ── AI Session Title ──────────────────────────────────────────────────────────

@router.get("/{session_id}/title", response_model=SessionTitleResponse)
async def get_session_title(
    session_id: str,
    user_id: Optional[str] = Depends(_optional_user_id),
):
    db = get_db()
    await _verify_session_access(db, session_id, user_id)

    title_doc = await db.session_titles.find_one({"session_id": session_id})
    if title_doc:
        return SessionTitleResponse(session_id=session_id, title=title_doc["title"])

    # Generate on demand if not cached
    cursor = db.messages.find({"session_id": session_id, "role": "user"}).sort("timestamp", 1)
    first_user = None
    async for doc in cursor:
        first_user = doc["content"]
        break

    if not first_user:
        raise HTTPException(status_code=404, detail="No messages found.")

    try:
        title = generate(TITLE_GENERATOR_SYSTEM, build_title_user_prompt(first_user))
        title = title.strip().strip('"').strip("'")
        await db.session_titles.insert_one({
            "session_id": session_id,
            "user_id": user_id,
            "title": title,
            "created_at": datetime.now(timezone.utc),
        })
        return SessionTitleResponse(session_id=session_id, title=title)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Title generation failed: {exc}") from exc


# ── Feedback ──────────────────────────────────────────────────────────────────

@router.post("/{session_id}/feedback", response_model=FeedbackResponse)
async def submit_feedback(
    session_id: str,
    payload: FeedbackRequest,
    user_id: Optional[str] = Depends(_optional_user_id),
):
    db = get_db()
    await db.feedback.insert_one(
        new_feedback_doc(
            session_id=session_id,
            user_id=user_id,
            rating=payload.rating,
            comment=payload.comment,
            message_id=payload.message_id,
        )
    )
    return FeedbackResponse(
        session_id=session_id,
        message_id=payload.message_id,
        rating=payload.rating,
        created_at=datetime.now(timezone.utc),
    )


# ── Delete Session ────────────────────────────────────────────────────────────

import logging

logger = logging.getLogger(__name__)

@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(
    session_id: str,
    user_id: Optional[str] = Depends(_optional_user_id),
):
    """Delete a chat session and all its associated data (messages, feedback, escalations, titles)."""
    db = get_db()
    # Verify access to ensure only the owner (or guest for guest sessions) can delete
    await _verify_session_access(db, session_id, user_id)

    try:
        await db.messages.delete_many({"session_id": session_id})
        await db.session_titles.delete_many({"session_id": session_id})
        await db.feedback.delete_many({"session_id": session_id})
        await db.escalations.delete_many({"session_id": session_id})
        logger.info(f"Successfully deleted session {session_id} and all cascading data.")
    except Exception as e:
        logger.error(f"Failed to fully delete session {session_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while deleting the conversation."
        )
