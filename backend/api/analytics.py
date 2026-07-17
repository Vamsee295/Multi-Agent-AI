"""
Analytics API — aggregates conversation, agent usage, response time,
and satisfaction statistics from the MongoDB collections.
"""
from fastapi import APIRouter, Depends
from models.schemas import AnalyticsSummary, AgentUsageStat
from database.mongo import get_db
from auth.security import get_current_user_id

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

AGENT_NAMES = ["billing", "technical", "product", "complaint", "faq"]


@router.get("/summary", response_model=AnalyticsSummary)
async def get_analytics_summary(user_id: str = Depends(get_current_user_id)):
    db = get_db()

    # ── Total distinct sessions ───────────────────────────────────────────
    total_sessions = 0
    total_messages = 0
    avg_response_ms = 0.0
    escalation_count = 0
    open_tickets = 0
    agent_counts: dict[str, int] = {a: 0 for a in AGENT_NAMES}
    satisfaction_score = 0.0

    try:
        # Count distinct sessions
        sessions_pipeline = [
            {"$group": {"_id": "$session_id"}},
            {"$count": "total"},
        ]
        async for doc in db.messages.aggregate(sessions_pipeline):
            total_sessions = doc.get("total", 0)

        # Count messages + avg response time
        msg_pipeline = [
            {"$match": {"role": "assistant"}},
            {
                "$group": {
                    "_id": None,
                    "total": {"$sum": 1},
                    "avg_rt": {"$avg": "$response_time_ms"},
                }
            },
        ]
        async for doc in db.messages.aggregate(msg_pipeline):
            total_messages = doc.get("total", 0)
            avg_response_ms = round(doc.get("avg_rt") or 0.0, 1)

        # Agent usage
        agent_pipeline = [
            {"$match": {"role": "assistant"}},
            {"$unwind": "$agents_invoked"},
            {"$group": {"_id": "$agents_invoked", "count": {"$sum": 1}}},
        ]
        async for doc in db.messages.aggregate(agent_pipeline):
            agent = doc["_id"]
            if agent in agent_counts:
                agent_counts[agent] = doc["count"]

        # Escalations
        async for doc in db.escalations.aggregate([{"$count": "total"}]):
            escalation_count = doc.get("total", 0)

        # Open tickets
        async for doc in db.escalations.aggregate([
            {"$match": {"status": "open"}},
            {"$count": "total"},
        ]):
            open_tickets = doc.get("total", 0)

        # Satisfaction score (thumbs-up / total feedback)
        async for doc in db.feedback.aggregate([
            {"$group": {"_id": "$rating", "count": {"$sum": 1}}},
        ]):
            pass  # Will process below
        up_count = 0
        total_feedback = 0
        async for doc in db.feedback.aggregate([
            {"$group": {"_id": "$rating", "count": {"$sum": 1}}},
        ]):
            total_feedback += doc["count"]
            if doc["_id"] == "up":
                up_count = doc["count"]
        satisfaction_score = round(up_count / total_feedback, 2) if total_feedback > 0 else 0.0

    except Exception:
        # Graceful degradation for mock/offline DB
        pass

    # Build agent usage list with percentages
    total_agent_invocations = sum(agent_counts.values()) or 1
    agent_usage = [
        AgentUsageStat(
            agent=agent,
            count=count,
            percentage=round(count / total_agent_invocations * 100, 1),
        )
        for agent, count in sorted(agent_counts.items(), key=lambda x: -x[1])
    ]

    return AnalyticsSummary(
        total_conversations=total_sessions,
        total_messages=total_messages,
        avg_response_time_ms=avg_response_ms,
        satisfaction_score=satisfaction_score,
        escalation_count=escalation_count,
        open_ticket_count=open_tickets,
        agent_usage=agent_usage,
    )


@router.get("/agent-usage", response_model=list[AgentUsageStat])
async def get_agent_usage(user_id: str = Depends(get_current_user_id)):
    """Per-agent message counts — same data as summary.agent_usage, standalone endpoint."""
    db = get_db()
    agent_counts: dict[str, int] = {a: 0 for a in AGENT_NAMES}

    try:
        pipeline = [
            {"$match": {"role": "assistant"}},
            {"$unwind": "$agents_invoked"},
            {"$group": {"_id": "$agents_invoked", "count": {"$sum": 1}}},
        ]
        async for doc in db.messages.aggregate(pipeline):
            agent = doc["_id"]
            if agent in agent_counts:
                agent_counts[agent] = doc["count"]
    except Exception:
        pass

    total = sum(agent_counts.values()) or 1
    return [
        AgentUsageStat(
            agent=agent,
            count=count,
            percentage=round(count / total * 100, 1),
        )
        for agent, count in sorted(agent_counts.items(), key=lambda x: -x[1])
    ]

