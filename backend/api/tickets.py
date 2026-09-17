"""
Ticket management API — the customer's "My escalations" surface and the
support team's queue/handoff workflows.

Authorization model:
- Customer routes: scoped by `user_id` (authenticated owner only).
- Support routes: gated by `require_support_user` (role in "support" | "admin").

All workflow logic delegates to `escalation.service` so status transitions and
conversation ownership stay consistent with the chat pipeline.
"""
from typing import Optional
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId

from database.mongo import get_db
from models.schemas import (
    TicketSummary,
    TicketDetail,
    EscalationEvent,
    EscalationDetail,
    SupportQueueItem,
    SupportQueueResponse,
    SupportQueueStats,
    EscalateRequest,
    AssignTicketRequest,
    StatusUpdateRequest,
    PriorityUpdateRequest,
    HumanMessageRequest,
)
from models.escalation_constants import (
    ACTIVE_TICKET_STATUSES,
    RESOLVED_STATUSES,
    ESCALATION_STATUSES,
    is_valid_priority,
)
from escalation.service import (
    escalation_service,
    TicketNotFoundError,
    InvalidTransitionError,
)
from auth.security import (
    get_current_user_id,
    AuthenticatedUser,
    require_support_user,
)
from api.chat import _verify_session_access

router = APIRouter(prefix="/api/tickets", tags=["tickets"])


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _customer_profile(db, user_id: Optional[str]):
    if not user_id:
        return None, None
    try:
        user = await db.users.find_one({"supabase_uid": user_id})
        if not user:
            user = await db.users.find_one({"_id": ObjectId(user_id)})
        if user:
            return user.get("name"), user.get("email")
    except Exception:
        pass
    return None, None


def _ticket_summary(doc: dict) -> TicketSummary:
    ai_summary = doc.get("ai_summary")
    if isinstance(ai_summary, dict):
        ai_summary = ai_summary.get("trigger", str(ai_summary))

    return TicketSummary(
        ticket_id=doc.get("ticket_id", str(doc.get("_id", ""))),
        priority=doc.get("priority", "MEDIUM"),
        status=doc.get("status", "ESCALATED"),
        session_id=doc["session_id"],
        trigger_message=doc.get("trigger_message", ""),
        agents_invoked=doc.get("agents_invoked", []),
        intent_confidence=doc.get("intent_confidence", 0.0),
        reason=doc.get("reason", "OTHER"),
        source=doc.get("source", "AI"),
        category=doc.get("category"),
        assigned_team=doc.get("assigned_team", "Customer Success"),
        assigned_agent=doc.get("assigned_agent"),
        ai_summary=ai_summary,
        created_at=doc.get("created_at") or datetime.now(timezone.utc),
        updated_at=doc.get("updated_at"),
        resolved_at=doc.get("resolved_at"),
        resolved_by=doc.get("resolved_by"),
    )


def _ticket_detail(doc: dict) -> TicketDetail:
    detail = TicketDetail(**_ticket_summary(doc).model_dump(), user_id=doc.get("user_id"))
    detail.events = [
        EscalationEvent(
            type=e.get("type", ""),
            status=e.get("status"),
            message=e.get("message"),
            actor=e.get("actor"),
            actor_type=e.get("actor_type"),
            created_at=e["created_at"],
        )
        for e in (doc.get("events") or [])
        if e.get("created_at")
    ]
    return detail


async def _last_customer_message(db, session_id: str) -> Optional[str]:
    try:
        cursor = db.messages.find({"session_id": session_id, "role": "user"}).sort("timestamp", -1).limit(1)
        async for doc in cursor:
            return doc.get("content")
    except Exception:
        pass
    return None


async def _owned_ticket(db, ticket_id: str, user_id: str, *, include_legacy: bool = True) -> dict:
    """Fetch a ticket the authenticated customer owns. 404/403 otherwise."""
    doc = await escalation_service.get_escalation(db, ticket_id=ticket_id)
    if not doc and include_legacy:
        try:
            doc = await escalation_service.get_escalation(db, _id=ticket_id)
        except Exception:
            doc = None
    if not doc:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if str(doc.get("user_id", "")) != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this ticket")
    return doc


# ── Customer routes ──────────────────────────────────────────────────────────

@router.get("", response_model=list[TicketSummary])
async def list_own_tickets(
    status: Optional[str] = "active",
    user_id: str = Depends(get_current_user_id),
):
    """List the authenticated customer's tickets, bucketed by lifecycle status."""
    db = get_db()
    statuses = None
    target_status = None
    _status = (status or "").lower()
    if _status in ("open", "active"):
        statuses = list(ACTIVE_TICKET_STATUSES)
    elif _status in ("resolved", "closed"):
        statuses = list(RESOLVED_STATUSES)
    elif _status and _status.upper() in ESCALATION_STATUSES:
        target_status = _status.upper()
    else:
        target_status = None
    tickets = await escalation_service.list_user_escalations(db, user_id, status=target_status, statuses=statuses)
    return [_ticket_summary(doc) for doc in tickets]


@router.get("/{ticket_id}", response_model=TicketDetail)
async def get_own_ticket(
    ticket_id: str,
    user_id: str = Depends(get_current_user_id),
):
    """Full ticket detail (customer-owned)."""
    db = get_db()
    doc = await _owned_ticket(db, ticket_id, user_id, include_legacy=False)
    detail = _ticket_detail(doc)
    detail.last_customer_message = await _last_customer_message(db, doc["session_id"])
    return detail


@router.get("/{ticket_id}/events", response_model=list[EscalationEvent])
async def get_ticket_events(
    ticket_id: str,
    user_id: str = Depends(get_current_user_id),
):
    db = get_db()
    doc = await _owned_ticket(db, ticket_id, user_id, include_legacy=False)
    return _ticket_detail(doc).events


@router.post("/escalate", response_model=EscalationDetail)
async def escalate_conversation(
    payload: EscalateRequest,
    user_id: str = Depends(get_current_user_id),
):
    """Manually escalate the current conversation from the customer UI.
    Reuses any active ticket for the session (no duplicates)."""
    db = get_db()
    await _verify_session_access(db, payload.session_id, user_id)

    existing = await escalation_service.find_active_for_session(db, payload.session_id)
    if existing:
        return EscalationDetail(
            ticket_id=existing["ticket_id"],
            reason=existing.get("reason", "USER_REQUESTED_HUMAN"),
            source=existing.get("source", "USER"),
            priority=existing.get("priority", "MEDIUM"),
            status=existing.get("status", "PENDING_HUMAN"),
            assigned_team=existing.get("assigned_team", "Customer Success"),
            ai_summary=existing.get("ai_summary"),
            category=existing.get("category"),
            created_at=existing.get("created_at"),
        )

    # Best-effort carry-over of routing metadata from the last assistant turn.
    agents_invoked: list[str] = []
    intent_confidence = 0.5
    cursor = db.messages.find({"session_id": payload.session_id, "role": "assistant"}).sort("timestamp", -1)
    async for doc in cursor:
        agents_invoked = list(doc.get("agents_invoked") or [])
        intent_confidence = float(doc.get("sentiment_score") or 0.5)
        break

    trigger_message = "Manually escalated from the chat UI"
    if payload.message_id:
        try:
            msg_doc = await db.messages.find_one({"_id": ObjectId(payload.message_id), "session_id": payload.session_id})
            if msg_doc and msg_doc.get("content"):
                trigger_message = msg_doc["content"]
        except Exception:
            pass
    if trigger_message == "Manually escalated from the chat UI":
        user_cursor = db.messages.find({"session_id": payload.session_id, "role": "user"}).sort("timestamp", -1)
        async for umsg in user_cursor:
            if umsg.get("content"):
                trigger_message = umsg["content"]
                break

    doc, _created = await escalation_service.create_escalation(
        db,
        session_id=payload.session_id,
        user_id=user_id,
        trigger_message=trigger_message,
        agents_invoked=agents_invoked,
        intent_confidence=intent_confidence,
        reason=payload.reason or "USER_REQUESTED_HUMAN",
        source="USER",
        priority=payload.priority or "MEDIUM",
        category=payload.category,
    )
    return EscalationDetail(
        ticket_id=doc["ticket_id"],
        reason=doc.get("reason", "USER_REQUESTED_HUMAN"),
        source=doc.get("source", "USER"),
        priority=doc.get("priority", "MEDIUM"),
        status=doc.get("status", "PENDING_HUMAN"),
        assigned_team=doc.get("assigned_team", "Customer Success"),
        ai_summary=doc.get("ai_summary"),
        category=doc.get("category"),
        created_at=doc["created_at"],
    )


# ── Support routes (role-gated) ──────────────────────────────────────────────

@router.get("/support/queue", response_model=SupportQueueResponse)
async def support_queue(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    category: Optional[str] = None,
    assigned_agent: Optional[str] = None,
    search: Optional[str] = None,
    sort: str = "created_at",
    limit: int = 100,
    _: None = Depends(require_support_user),
):
    db = get_db()
    items, stats = await escalation_service.list_support_escalations(
        db,
        status=status.upper() if status else None,
        priority=priority.upper() if priority else None,
        category=category,
        assigned_agent=assigned_agent,
        search=search,
        sort=sort,
        limit=limit,
    )
    queue_items: list[SupportQueueItem] = []
    for doc in items:
        name, email = await _customer_profile(db, doc.get("user_id"))
        queue_items.append(SupportQueueItem(
            ticket_id=doc.get("ticket_id", ""),
            subject=doc.get("trigger_message", "") or "No subject",
            customer_name=name,
            customer_email=email,
            category=doc.get("category"),
            reason=doc.get("reason", "OTHER"),
            source=doc.get("source", "AI"),
            priority=doc.get("priority", "MEDIUM"),
            status=doc.get("status", "ESCALATED"),
            assigned_team=doc.get("assigned_team", "Customer Success"),
            assigned_agent=doc.get("assigned_agent"),
            ai_summary=doc.get("ai_summary"),
            last_customer_message=await _last_customer_message(db, doc["session_id"]),
            created_at=doc.get("created_at"),
            updated_at=doc.get("updated_at"),
        ))
    return SupportQueueResponse(
        items=queue_items,
        total=len(queue_items),
        stats=SupportQueueStats(**stats),
    )


@router.get("/support/{ticket_id}", response_model=TicketDetail)
async def support_ticket_detail(
    ticket_id: str,
    _: AuthenticatedUser = Depends(require_support_user),
):
    """Support-only full detail for any ticket (customer 403s on others' tickets,
    so the queue uses its own read endpoint)."""
    db = get_db()
    doc = await escalation_service.get_escalation(db, ticket_id=ticket_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Ticket not found")
    detail = _ticket_detail(doc)
    name, email = await _customer_profile(db, doc.get("user_id"))
    detail.customer_name = name
    detail.customer_email = email
    detail.last_customer_message = await _last_customer_message(db, doc["session_id"])
    return detail


@router.get("/{ticket_id}/conversation", response_model=list[dict])
async def ticket_conversation(
    ticket_id: str,
    _: AuthenticatedUser = Depends(require_support_user),
):
    db = get_db()
    doc = await escalation_service.get_escalation(db, ticket_id=ticket_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Ticket not found")
    conversations = await escalation_service.get_ticket_conversation(db, doc["session_id"])
    return [
        {
            "role": c.get("role", "user"),
            "content": c.get("content", ""),
            "timestamp": c.get("timestamp"),
            "agents_invoked": c.get("agents_invoked", []),
            "author_name": c.get("author_name"),
        }
        for c in conversations
    ]


@router.post("/{ticket_id}/take", response_model=TicketSummary)
async def take_case(
    ticket_id: str,
    current_user: AuthenticatedUser = Depends(require_support_user),
):
    db = get_db()
    try:
        doc = await escalation_service.take_case(db, ticket_id, current_user)
    except TicketNotFoundError:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return _ticket_summary(doc)


@router.post("/{ticket_id}/assign", response_model=TicketSummary)
async def assign_case(
    ticket_id: str,
    payload: AssignTicketRequest,
    current_user: AuthenticatedUser = Depends(require_support_user),
):
    db = get_db()
    try:
        doc = await escalation_service.assign(db, ticket_id, current_user, payload.agent_id)
    except TicketNotFoundError:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return _ticket_summary(doc)


@router.patch("/{ticket_id}/priority", response_model=TicketSummary)
async def change_priority(
    ticket_id: str,
    payload: PriorityUpdateRequest,
    _: AuthenticatedUser = Depends(require_support_user),
):
    db = get_db()
    if not is_valid_priority(payload.priority.upper()):
        raise HTTPException(status_code=400, detail="Invalid priority")
    try:
        doc = await escalation_service.update_priority(db, ticket_id, payload.priority.upper(), note=payload.note)
    except TicketNotFoundError:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return _ticket_summary(doc)


@router.patch("/{ticket_id}/status", response_model=TicketSummary)
async def change_status(
    ticket_id: str,
    payload: StatusUpdateRequest,
    current_user: AuthenticatedUser = Depends(require_support_user),
):
    db = get_db()
    new_status = payload.status.upper()
    if new_status not in ESCALATION_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid status")
    try:
        doc = await escalation_service.update_status(
            db, ticket_id, new_status,
            note=payload.note,
            actor=current_user.user_id,
            actor_type="support",
        )
    except TicketNotFoundError:
        raise HTTPException(status_code=404, detail="Ticket not found")
    except InvalidTransitionError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return _ticket_summary(doc)


@router.post("/{ticket_id}/resolve", response_model=TicketSummary)
async def resolve_ticket_support(
    ticket_id: str,
    current_user: AuthenticatedUser = Depends(require_support_user),
):
    db = get_db()
    try:
        doc = await escalation_service.resolve(db, ticket_id, actor=current_user.user_id)
    except TicketNotFoundError:
        raise HTTPException(status_code=404, detail="Ticket not found")
    except InvalidTransitionError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return _ticket_summary(doc)


@router.post("/{ticket_id}/close", response_model=TicketSummary)
async def close_ticket(
    ticket_id: str,
    current_user: AuthenticatedUser = Depends(require_support_user),
):
    db = get_db()
    try:
        doc = await escalation_service.close(db, ticket_id, actor=current_user.user_id)
    except TicketNotFoundError:
        raise HTTPException(status_code=404, detail="Ticket not found")
    except InvalidTransitionError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return _ticket_summary(doc)


@router.post("/{ticket_id}/reopen", response_model=TicketSummary)
async def reopen_ticket(
    ticket_id: str,
    current_user: AuthenticatedUser = Depends(require_support_user),
):
    db = get_db()
    try:
        doc = await escalation_service.reopen(db, ticket_id, actor=current_user.user_id)
    except TicketNotFoundError:
        raise HTTPException(status_code=404, detail="Ticket not found")
    except InvalidTransitionError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return _ticket_summary(doc)


@router.post("/{ticket_id}/messages", response_model=dict)
async def send_human_message(
    ticket_id: str,
    payload: HumanMessageRequest,
    current_user: AuthenticatedUser = Depends(require_support_user),
):
    """Support replies in the customer's conversation thread as `role: human`."""
    db = get_db()
    doc = await escalation_service.get_escalation(db, ticket_id=ticket_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Ticket not found")
    result = await escalation_service.add_human_message(
        db,
        ticket_id=ticket_id,
        session_id=doc["session_id"],
        content=payload.content,
        author_id=current_user.user_id,
        author_name=current_user.name or current_user.email,
        mark_waiting=payload.mark_waiting,
    )
    return {
        "session_id": doc["session_id"],
        "status": result.get("status"),
        "role": "human",
        "message": "Reply posted to the conversation thread",
    }


# ── Legacy wrapper (kept for backward compatibility) ─────────────────────────

@router.patch("/{ticket_id}/resolve", response_model=TicketSummary)
async def legacy_resolve(
    ticket_id: str,
    user_id: str = Depends(get_current_user_id),
):
    """Legacy customer self-resolve (demoted). Resolves only when the lifecycle
    permits it (IN_PROGRESS/WAITING_FOR_CUSTOMER); otherwise returns 400."""
    db = get_db()
    doc = await _owned_ticket(db, ticket_id, user_id, include_legacy=True)
    try:
        updated = await escalation_service.resolve(db, doc["ticket_id"], actor=user_id)
    except InvalidTransitionError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return _ticket_summary(updated)


@router.delete("/{ticket_id}")
async def delete_ticket(
    ticket_id: str,
    user_id: str = Depends(get_current_user_id),
):
    """Delete a customer-owned resolved or closed ticket."""
    db = get_db()
    doc = await _owned_ticket(db, ticket_id, user_id, include_legacy=True)
    if doc.get("status") not in RESOLVED_STATUSES:
        raise HTTPException(
            status_code=400,
            detail="Only resolved or closed escalations can be deleted.",
        )
    deleted = await escalation_service.delete_escalation(db, doc["ticket_id"])
    if not deleted:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return {"status": "ok", "deleted": True, "ticket_id": doc["ticket_id"]}