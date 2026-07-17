"""
Ticket management API — lists and resolves escalation tickets.
"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId

from database.mongo import get_db
from models.schemas import TicketSummary
from auth.security import get_current_user_id

router = APIRouter(prefix="/api/tickets", tags=["tickets"])


@router.get("", response_model=list[TicketSummary])
async def list_tickets(
    status: str = "open",
    user_id: str = Depends(get_current_user_id),
):
    """List escalation tickets (open by default)."""
    db = get_db()
    tickets = []
    try:
        query = {}
        if status in ("open", "resolved"):
            query["status"] = status

        cursor = db.escalations.find(query).sort("created_at", -1).limit(100)
        async for doc in cursor:
            tickets.append(
                TicketSummary(
                    ticket_id=str(doc["_id"]),
                    session_id=doc["session_id"],
                    trigger_message=doc.get("trigger_message", ""),
                    agents_invoked=doc.get("agents_invoked", []),
                    intent_confidence=doc.get("intent_confidence", 0.0),
                    status=doc.get("status", "open"),
                    created_at=doc["created_at"],
                )
            )
    except Exception:
        pass
    return tickets


@router.patch("/{ticket_id}/resolve", response_model=TicketSummary)
async def resolve_ticket(
    ticket_id: str,
    user_id: str = Depends(get_current_user_id),
):
    """Mark an escalation ticket as resolved."""
    db = get_db()
    try:
        oid = ObjectId(ticket_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ticket ID")

    result = await db.escalations.find_one_and_update(
        {"_id": oid},
        {"$set": {"status": "resolved", "resolved_at": datetime.utcnow(), "resolved_by": user_id}},
        return_document=True,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Ticket not found")

    return TicketSummary(
        ticket_id=str(result["_id"]),
        session_id=result["session_id"],
        trigger_message=result.get("trigger_message", ""),
        agents_invoked=result.get("agents_invoked", []),
        intent_confidence=result.get("intent_confidence", 0.0),
        status=result.get("status", "resolved"),
        created_at=result["created_at"],
    )
