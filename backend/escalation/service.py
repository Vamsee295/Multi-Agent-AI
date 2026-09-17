"""
Escalation service — the single workflow engine behind every ticket operation.

The chat endpoint and the support/customer ticket APIs all funnel through here so
that status transitions, conversation ownership, and event tracking stay
consistent. Authorization is NOT enforced here (callers apply role/ownership
checks); invariants like "never create a duplicate active ticket" and
"never allow an invalid status transition" ARE enforced here.
"""
from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId

from models.user import (
    new_escalation_doc,
    new_escalation_event,
    new_message_doc,
    generate_ticket_id,
)
from models.escalation_constants import (
    ACTIVE_TICKET_STATUSES,
    RESOLVED_STATUSES,
    PRIORITY_FOR_REASON,
    TEAM_FOR_REASON,
    can_transition,
)
from config import get_settings


class EscalationError(Exception):
    """Base class for escalation workflow errors."""


class TicketNotFoundError(EscalationError):
    pass


class InvalidTransitionError(EscalationError):
    pass


SUMMARIZE_FALLBACK = "AI summary unavailable. Review the conversation history."


def _now() -> datetime:
    return datetime.now(timezone.utc)


class EscalationService:

    # ── Creation & reads ─────────────────────────────────────────────────────

    async def create_escalation(
        self,
        db,
        *,
        session_id: str,
        user_id: Optional[str],
        trigger_message: str,
        agents_invoked: list[str],
        intent_confidence: float,
        reason: str = "OTHER",
        source: str = "AI",
        priority: Optional[str] = None,
        category: Optional[str] = None,
        ai_summary: Optional[str] = None,
    ) -> tuple[dict, bool]:
        """Create a ticket. Returns `(doc, created)` — if the session already has
        an active ticket, returns it with `created=False` (no duplicate)."""
        existing = await self.find_active_for_session(db, session_id)
        if existing:
            return existing, False

        status = "PENDING_HUMAN"
        priority = priority or PRIORITY_FOR_REASON.get(reason, "LOW")
        team = TEAM_FOR_REASON.get(reason) or "Customer Success"

        if not ai_summary:
            ai_summary = await self._generate_summary(db, session_id)

        doc = new_escalation_doc(
            session_id=session_id,
            user_id=user_id,
            trigger_message=trigger_message,
            agents_invoked=agents_invoked,
            intent_confidence=intent_confidence,
            reason=reason,
            source=source,
            priority=priority,
            status=status,
            category=category,
            assigned_team=team,
            ai_summary=ai_summary,
        )

        ticket_id = generate_ticket_id()
        for _ in range(50):  # collision guard
            if not await db.escalations.find_one({"ticket_id": ticket_id}):
                break
            ticket_id = generate_ticket_id()
        doc["ticket_id"] = ticket_id

        # The insert is the point of truth: if it fails, the caller must report
        # failure — never a falsely-created ticket.
        await db.escalations.insert_one(doc)

        await self.record_event(
            db, ticket_id=ticket_id,
            event_type="ESCALATED",
            status=status,
            message=f"Conversation escalated (source: {source}, reason: {reason})",
            actor=user_id,
            actor_type="user" if source == "USER" else "system",
        )
        await self.record_event(
            db, ticket_id=ticket_id,
            event_type="TICKET_CREATED",
            status=status,
            message=f"Ticket {ticket_id} created and added to the support queue",
        )
        return doc, True

    async def find_active_for_session(self, db, session_id: str):
        try:
            return await db.escalations.find_one(
                {"session_id": session_id, "status": {"$in": list(ACTIVE_TICKET_STATUSES)}}
            )
        except Exception:
            return None

    async def get_escalation(self, db, *, ticket_id: str = None, _id: str = None):
        if _id:
            try:
                return await db.escalations.find_one({"_id": ObjectId(_id)})
            except Exception:
                return None
        if ticket_id:
            return await db.escalations.find_one({"ticket_id": ticket_id})
        return None

    async def list_user_escalations(
        self,
        db,
        user_id: str,
        status: Optional[str] = None,
        statuses: Optional[list[str]] = None,
        limit: int = 100,
    ) -> list[dict]:
        query = {"user_id": user_id}
        if status:
            query["status"] = status
        elif statuses:
            query["status"] = {"$in": statuses}
        cursor = db.escalations.find(query).sort("created_at", -1).limit(limit)
        return [doc async for doc in cursor]

    async def list_support_escalations(
        self,
        db,
        *,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        category: Optional[str] = None,
        assigned_agent: Optional[str] = None,
        search: Optional[str] = None,
        sort: str = "created_at",
        limit: int = 100,
    ) -> tuple[list[dict], dict]:
        """Query the support queue with stats. Returns `(items, stats)`."""
        items = []
        async for doc in db.escalations.find({}):
            if status and status != doc.get("status"):
                continue
            if priority and priority != doc.get("priority"):
                continue
            if category and category != doc.get("category"):
                continue
            if assigned_agent == "assignee":
                if not doc.get("assigned_agent"):
                    continue
            elif assigned_agent and assigned_agent != doc.get("assigned_agent"):
                continue
            if search:
                haystack = " ".join(
                    str(doc.get(k) or "")
                    for k in ("ticket_id", "trigger_message", "assigned_agent", "category")
                ).lower()
                if search.lower() not in haystack:
                    continue
            items.append(doc)

        # Sort: priority has an explicit rank.
        rank = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
        if sort == "priority":
            items.sort(key=lambda d: rank.get(d.get("priority"), 9))
        elif sort == "updated_at":
            items.sort(key=lambda d: d.get("updated_at") or d.get("created_at"), reverse=True)
        elif sort == "status":
            items.sort(key=lambda d: d.get("status", ""))
        else:  # created_at default
            items.sort(key=lambda d: d.get("created_at"), reverse=True)

        items = items[:limit]
        stats = self._queue_stats(items)
        return items, stats

    @staticmethod
    def _queue_stats(items: list[dict]) -> dict:
        return {
            "open": sum(1 for d in items if d.get("status") in ACTIVE_TICKET_STATUSES),
            "high": sum(1 for d in items if d.get("priority") in ("HIGH", "CRITICAL")),
            "critical": sum(1 for d in items if d.get("priority") == "CRITICAL"),
            "pending_human": sum(1 for d in items if d.get("status") == "PENDING_HUMAN"),
            "in_progress": sum(1 for d in items if d.get("status") in ("ASSIGNED", "IN_PROGRESS")),
            "resolved": sum(1 for d in items if d.get("status") in RESOLVED_STATUSES),
        }

    # ── Support actions ──────────────────────────────────────────────────────

    async def take_case(self, db, ticket_id: str, agent_user, agent_name: str = None) -> dict:
        """Atomically assign a ticket to an agent and hand over the conversation."""
        doc = await self.get_escalation(db, ticket_id=ticket_id)
        if not doc:
            raise TicketNotFoundError("Ticket not found")

        updated = await db.escalations.find_one_and_update(
            {"ticket_id": ticket_id},
            {"$set": {
                "status": "IN_PROGRESS",
                "assigned_agent": agent_user.user_id,
                "updated_at": _now(),
            }},
        )
        await self.record_event(
            db, ticket_id=ticket_id,
            event_type="ASSIGNED",
            status="IN_PROGRESS",
            message=f"Ticket assigned to human support agent",
            actor=agent_user.user_id,
            actor_type="support",
        )
        await self.record_event(
            db, ticket_id=ticket_id,
            event_type="AGENT_STARTED",
            status="IN_PROGRESS",
            message="Human support agent started working on this ticket",
            actor=agent_user.user_id,
            actor_type="support",
        )
        from escalation.handoff import take_over_conversation
        await take_over_conversation(db, doc["session_id"], ticket_id, agent_user, agent_name=agent_name)
        return updated or doc

    async def assign(self, db, ticket_id: str, agent_user, agent_id: str) -> dict:
        doc = await self.get_escalation(db, ticket_id=ticket_id)
        if not doc:
            raise TicketNotFoundError("Ticket not found")
        updated = await db.escalations.find_one_and_update(
            {"ticket_id": ticket_id},
            {"$set": {
                "assigned_agent": agent_id,
                "status": doc.get("status") if doc.get("status") in ("IN_PROGRESS", "ASSIGNED") else "ASSIGNED",
                "updated_at": _now(),
            }},
        )
        await self.record_event(
            db, ticket_id=ticket_id,
            event_type="ASSIGNED",
            status=updated.get("status", "ASSIGNED"),
            message=f"Ticket assigned to {agent_id}",
            actor=agent_user.user_id,
            actor_type="support",
        )
        return updated or doc

    async def update_priority(self, db, ticket_id: str, priority: str, note: Optional[str] = None) -> dict:
        doc = await self.get_escalation(db, ticket_id=ticket_id)
        if not doc:
            raise TicketNotFoundError("Ticket not found")
        updated = await db.escalations.find_one_and_update(
            {"ticket_id": ticket_id},
            {"$set": {"priority": priority, "updated_at": _now()}},
        )
        await self.record_event(
            db, ticket_id=ticket_id,
            event_type="PRIORITY_CHANGED",
            status=doc.get("status"),
            message=f"Priority changed to {priority}" + (f" — {note}" if note else ""),
            actor_type="support",
        )
        return updated or doc

    async def update_status(
        self,
        db,
        ticket_id: str,
        new_status: str,
        note: Optional[str] = None,
        actor: Optional[str] = None,
        actor_type: str = "support",
    ) -> dict:
        doc = await self.get_escalation(db, ticket_id=ticket_id)
        if not doc:
            raise TicketNotFoundError("Ticket not found")

        current = doc.get("status")
        if not can_transition(current, new_status):
            raise InvalidTransitionError(f"Cannot transition ticket {ticket_id} from {current} to {new_status}")

        updated = await db.escalations.find_one_and_update(
            {"ticket_id": ticket_id},
            {"$set": {"status": new_status, "updated_at": _now(), **(
                {"resolved_at": _now(), "resolved_by": actor} if new_status == "RESOLVED" else {}
            )}},
        )
        await self.record_event(
            db, ticket_id=ticket_id,
            event_type="STATUS_CHANGED",
            status=new_status,
            message=f"Status changed to {new_status}" + (f" — {note}" if note else ""),
            actor=actor,
            actor_type=actor_type,
        )
        return updated or doc

    async def resolve(self, db, ticket_id: str, actor: Optional[str] = None) -> dict:
        doc = await self.get_escalation(db, ticket_id=ticket_id)
        if not doc:
            raise TicketNotFoundError("Ticket not found")
        if doc.get("status") in RESOLVED_STATUSES:
            return doc
        current = doc.get("status")
        if not can_transition(current, "RESOLVED"):
            raise InvalidTransitionError(f"Cannot resolve ticket from {current}")
        updated = await db.escalations.find_one_and_update(
            {"ticket_id": ticket_id},
            {"$set": {"status": "RESOLVED", "resolved_at": _now(), "resolved_by": actor, "updated_at": _now()}},
        )
        await self.record_event(
            db, ticket_id=ticket_id,
            event_type="RESOLVED",
            status="RESOLVED",
            message="Ticket marked as resolved by support",
            actor=actor,
            actor_type="support",
        )
        from escalation.handoff import release_conversation
        await release_conversation(db, doc["session_id"], mode="RESOLVED")
        return updated or doc

    async def close(self, db, ticket_id: str, actor: Optional[str] = None) -> dict:
        doc = await self.get_escalation(db, ticket_id=ticket_id)
        if not doc:
            raise TicketNotFoundError("Ticket not found")
        if not can_transition(doc.get("status"), "CLOSED"):
            raise InvalidTransitionError(f"Cannot close ticket from {doc.get('status')}")
        updated = await db.escalations.find_one_and_update(
            {"ticket_id": ticket_id},
            {"$set": {"status": "CLOSED", "updated_at": _now()}},
        )
        await self.record_event(
            db, ticket_id=ticket_id,
            event_type="CLOSED",
            status="CLOSED",
            message="Ticket closed",
            actor=actor,
            actor_type="support",
        )
        from escalation.handoff import release_conversation
        await release_conversation(db, doc["session_id"], mode="RESOLVED")
        return updated or doc

    async def reopen(self, db, ticket_id: str, actor: Optional[str] = None) -> dict:
        doc = await self.get_escalation(db, ticket_id=ticket_id)
        if not doc:
            raise TicketNotFoundError("Ticket not found")
        if not can_transition(doc.get("status"), "REOPENED"):
            raise InvalidTransitionError(f"Cannot reopen ticket from {doc.get('status')}")
        updated = await db.escalations.find_one_and_update(
            {"ticket_id": ticket_id},
            {"$set": {"status": "REOPENED", "updated_at": _now()}},
        )
        await self.record_event(
            db, ticket_id=ticket_id,
            event_type="REOPENED",
            status="REOPENED",
            message="Ticket reopened",
            actor=actor,
            actor_type="support",
        )
        return updated or doc

    # ── Human messaging ──────────────────────────────────────────────────────

    async def add_human_message(
        self,
        db,
        ticket_id: str,
        session_id: str,
        content: str,
        author_id: str,
        author_name: Optional[str] = None,
        mark_waiting: bool = False,
    ) -> dict:
        """Insert a human support reply into the customer's conversation thread."""
        await db.messages.insert_one(
            new_message_doc(
                session_id, None, "human", content, [],
                author_name=author_name or author_id,
            )
        )
        doc = await self.get_escalation(db, ticket_id=ticket_id)
        if doc:
            next_status = "WAITING_FOR_CUSTOMER" if mark_waiting else "IN_PROGRESS"
            await db.escalations.find_one_and_update(
                {"ticket_id": ticket_id},
                {"$set": {"status": next_status, "updated_at": _now()}},
            )
            await self.record_event(
                db, ticket_id=ticket_id,
                event_type="AGENT_REPLIED",
                status=next_status,
                message="Human support agent replied to the customer",
                actor=author_id,
                actor_type="support",
            )
        return {"session_id": session_id, "status": next_status if doc else None}

    async def get_ticket_conversation(self, db, session_id: str) -> list[dict]:
        cursor = db.messages.find({"session_id": session_id}).sort("timestamp", 1)
        return [doc async for doc in cursor]

    async def notify_customer_message(self, db, session_id: str, content: str) -> None:
        """Record when a customer replies inside a human-owned session."""
        doc = await self.find_active_for_session(db, session_id)
        if not doc:
            return
        await self.record_event(
            db, ticket_id=doc["ticket_id"],
            event_type="CUSTOMER_REPLIED",
            status=doc.get("status"),
            message=f"Customer replied: {content[:200]}",
            actor=session_id,
            actor_type="user",
        )

    async def delete_escalation(self, db, ticket_id: str) -> bool:
        """Permanently delete an escalation ticket."""
        res = await db.escalations.delete_one({"ticket_id": ticket_id})
        return res.deleted_count > 0

    # ── Events ───────────────────────────────────────────────────────────────

    async def record_event(
        self,
        db,
        ticket_id: str,
        event_type: str,
        *,
        status: Optional[str] = None,
        message: Optional[str] = None,
        actor: Optional[str] = None,
        actor_type: Optional[str] = None,
    ) -> None:
        try:
            event = new_escalation_event(
                event_type, status=status, message=message, actor=actor, actor_type=actor_type
            )
            await db.escalations.find_one_and_update(
                {"ticket_id": ticket_id},
                {"$push": {"events": event}, "$set": {"updated_at": _now()}},
            )
        except Exception:
            pass  # Event logging is best-effort; never break the flow over it.

    # ── Internals ────────────────────────────────────────────────────────────

    async def _generate_summary(self, db, session_id: str) -> str:
        try:
            turns = []
            cursor = db.messages.find(
                {"session_id": session_id, "role": {"$in": ["user", "assistant", "human"]}}
            ).sort("timestamp", 1)
            async for doc in cursor:
                turns.append({"role": doc.get("role", "user"), "content": doc.get("content", "")})
            if not turns:
                return "No conversation history available."

            from agents.llm_client import generate
            from agents.prompts import SUMMARIZER_SYSTEM, build_summarizer_user_prompt
            return generate(
                SUMMARIZER_SYSTEM, build_summarizer_user_prompt(turns[-12:])
            ).strip()
        except Exception:
            return SUMMARIZE_FALLBACK


escalation_service = EscalationService()