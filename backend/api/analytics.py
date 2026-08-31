"""
Analytics API — aggregates conversation, agent usage, response time,
and satisfaction statistics from the MongoDB collections.
"""
import os
import glob
from fastapi import APIRouter, Depends
from models.schemas import AnalyticsSummary, AgentUsageStat
from database.mongo import get_db
from auth.security import get_current_user_id
from config import get_settings

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

AGENT_NAMES = ["billing", "technical", "product", "complaint", "faq"]


@router.get("/summary", response_model=AnalyticsSummary)
async def get_analytics_summary(user_id: str = Depends(get_current_user_id)):
    db = get_db()

    total_sessions = 0
    total_messages = 0
    avg_response_ms = 0.0
    avg_retrieval_ms = 0.0
    avg_chunks = 0.0
    escalation_count = 0
    open_tickets = 0
    agent_counts: dict[str, int] = {a: 0 for a in AGENT_NAMES}
    satisfaction_score = 0.0

    try:
        # Count distinct sessions
        sessions_pipeline = [
            {"$match": {"user_id": user_id}},
            {"$group": {"_id": "$session_id"}},
            {"$count": "total"},
        ]
        async for doc in db.messages.aggregate(sessions_pipeline):
            total_sessions = doc.get("total", 0)

        # Count assistant messages + measure real avg response time & real avg retrieval metrics
        msg_pipeline = [
            {"$match": {"user_id": user_id, "role": "assistant"}},
            {
                "$group": {
                    "_id": None,
                    "total": {"$sum": 1},
                    "avg_rt": {"$avg": "$response_time_ms"},
                    "avg_retrieval_time": {"$avg": "$retrieval_time_ms"},
                    "avg_chunks": {"$avg": "$chunks_retrieved"},
                }
            },
        ]
        async for doc in db.messages.aggregate(msg_pipeline):
            total_messages = doc.get("total", 0)
            avg_response_ms = round(doc.get("avg_rt") or 0.0, 1)
            avg_retrieval_ms = round(doc.get("avg_retrieval_time") or 0.0, 1)
            avg_chunks = round(doc.get("avg_chunks") or 0.0, 1)

        # Agent usage
        agent_pipeline = [
            {"$match": {"user_id": user_id, "role": "assistant"}},
            {"$unwind": "$agents_invoked"},
            {"$group": {"_id": "$agents_invoked", "count": {"$sum": 1}}},
        ]
        async for doc in db.messages.aggregate(agent_pipeline):
            agent = doc["_id"]
            if agent in agent_counts:
                agent_counts[agent] = doc["count"]

        # Escalations
        async for doc in db.escalations.aggregate([
            {"$match": {"user_id": user_id}},
            {"$count": "total"}
        ]):
            escalation_count = doc.get("total", 0)

        # Open tickets
        async for doc in db.escalations.aggregate([
            {"$match": {"user_id": user_id, "status": "open"}},
            {"$count": "total"},
        ]):
            open_tickets = doc.get("total", 0)

        # Satisfaction score (thumbs-up / total feedback)
        up_count = 0
        total_feedback = 0
        async for doc in db.feedback.aggregate([
            {"$match": {"user_id": user_id}},
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
        for agent, count in sorted(agent_counts.items(), key=lambda x: x[1], reverse=True)
    ]
    
    most_used_agent = agent_usage[0].agent if agent_usage and agent_usage[0].count > 0 else "N/A"
    
    # Real KB document count from filesystem / vectorstore
    settings = get_settings()
    try:
        paths = glob.glob(os.path.join(settings.KNOWLEDGE_BASE_DIR, "*.txt")) + glob.glob(os.path.join(settings.KNOWLEDGE_BASE_DIR, "*.pdf"))
        total_kb_documents = len(paths)
    except Exception:
        total_kb_documents = 0

    return AnalyticsSummary(
        total_conversations=total_sessions,
        total_messages=total_messages,
        avg_response_time_ms=avg_response_ms,
        avg_retrieval_time_ms=avg_retrieval_ms,
        most_used_agent=most_used_agent,
        total_kb_documents=total_kb_documents,
        avg_chunks_retrieved=avg_chunks,
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
            {"$match": {"user_id": user_id, "role": "assistant"}},
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
