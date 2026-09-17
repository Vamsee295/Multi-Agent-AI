"""
Pydantic request/response schemas (DTOs) shared across the API layer.
"""
from datetime import datetime
from typing import Optional, Literal, Any
from pydantic import BaseModel, EmailStr, Field

from models.escalation_constants import ESCALATION_REASONS


# ---------- Auth ----------
class UserRegister(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: str
    password: str = Field(min_length=8, max_length=128)


class UserLogin(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in_minutes: int


class UserPublic(BaseModel):
    id: str
    name: str
    email: str
    created_at: datetime
    role: str = "user"


# ---------- Chat ----------
AgentName = Literal["billing", "technical", "product", "complaint", "faq", "general"]
SentimentLabel = Literal["positive", "neutral", "frustrated", "angry"]


class ChatRequest(BaseModel):
    session_id: Optional[str] = None
    message: str = Field(min_length=1, max_length=4000)
    model: Optional[str] = None
    response_style: Optional[Literal["concise", "balanced", "detailed"]] = None
    use_memory: Optional[bool] = True
    use_rag: Optional[bool] = True
    automatic_routing: Optional[bool] = True
    preferred_agent: Optional[AgentName] = None


class RetrievedChunk(BaseModel):
    source: str
    text: str
    score: float


class EscalationDetail(BaseModel):
    ticket_id: str
    reason: str
    source: str
    priority: str
    status: str
    assigned_team: str
    ai_summary: Optional[str] = None
    category: Optional[str] = None
    created_at: datetime


class ChatResponse(BaseModel):
    session_id: str
    message: str
    agents_invoked: list[AgentName]
    intent_confidence: float
    retrieved_context: list[RetrievedChunk]
    escalated: bool
    escalation_details: Optional[EscalationDetail] = None
    sentiment: SentimentLabel = "neutral"
    sentiment_score: float = 0.5
    response_time_ms: int = 0
    created_at: datetime
    # Conversation ownership state (AI / HUMAN / RESOLVED).
    conversation_mode: Optional[str] = None


class ConversationTurn(BaseModel):
    role: Literal["user", "assistant", "human"]
    content: str
    timestamp: datetime
    agents_invoked: list[AgentName] = []
    ticket_id: Optional[str] = None
    author_name: Optional[str] = None
    sentiment: Optional[str] = None
    sentiment_score: Optional[float] = None


class ConversationHistory(BaseModel):
    session_id: str
    turns: list[ConversationTurn]


class ConversationModeResponse(BaseModel):
    session_id: str
    mode: Literal["AI", "HUMAN", "RESOLVED"]
    ticket_id: Optional[str] = None
    human_agent_name: Optional[str] = None


class SessionSummary(BaseModel):
    session_id: str
    last_message: str
    last_timestamp: datetime
    message_count: int
    title: Optional[str] = None


# ---------- Feedback ----------
class FeedbackRequest(BaseModel):
    message_id: Optional[str] = None
    rating: Literal["up", "down"]
    comment: Optional[str] = Field(default=None, max_length=500)


class FeedbackResponse(BaseModel):
    session_id: str
    message_id: Optional[str]
    rating: str
    created_at: datetime


# ---------- Knowledge Base ----------
class KBFileInfo(BaseModel):
    filename: str
    size_bytes: int
    modified_at: datetime


# ---------- Analytics ----------
class AgentUsageStat(BaseModel):
    agent: str
    count: int
    percentage: float


class AnalyticsSummary(BaseModel):
    total_conversations: int
    total_messages: int
    avg_response_time_ms: float
    avg_retrieval_time_ms: float = 0.0
    most_used_agent: str = "N/A"
    total_kb_documents: int = 0
    avg_chunks_retrieved: float = 0.0
    satisfaction_score: float        # 0.0–1.0 based on thumbs up %
    escalation_count: int
    open_ticket_count: int
    agent_usage: list[AgentUsageStat]


class EscalationsAnalytics(BaseModel):
    total: int
    escalation_rate: float
    open_count: int
    resolved_count: int
    avg_resolution_hours: Optional[float] = None
    by_reason: dict[str, int]
    by_priority: dict[str, int]
    by_status: dict[str, int]
    by_category: dict[str, int]
    by_assigned_agent: dict[str, int]


# ---------- Tickets / Escalations ----------
class EscalationEvent(BaseModel):
    type: str
    status: Optional[str] = None
    message: Optional[str] = None
    actor: Optional[str] = None
    actor_type: Optional[str] = None  # "user" | "support" | "system"
    created_at: datetime


class TicketSummary(BaseModel):
    ticket_id: str
    priority: str = "MEDIUM"
    status: str = "ESCALATED"
    session_id: str
    trigger_message: str
    agents_invoked: list[str] = []
    intent_confidence: float = 0.5
    reason: str = "OTHER"
    source: str = "AI"
    category: Optional[str] = None
    assigned_team: str = "Customer Success"
    assigned_agent: Optional[str] = None
    ai_summary: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[str] = None


class TicketDetail(TicketSummary):
    user_id: Optional[str] = None
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    last_customer_message: Optional[str] = None
    events: list[EscalationEvent] = []


# ---- Request models ----
class EscalateRequest(BaseModel):
    session_id: str
    reason: Optional[str] = None  # any of ESCALATION_REASONS keys
    category: Optional[str] = None
    message_id: Optional[str] = None
    priority: Optional[str] = None


class AssignTicketRequest(BaseModel):
    agent_id: str


class StatusUpdateRequest(BaseModel):
    status: str
    note: Optional[str] = None


class PriorityUpdateRequest(BaseModel):
    priority: str
    note: Optional[str] = None


class HumanMessageRequest(BaseModel):
    content: str = Field(min_length=1, max_length=8000)
    mark_waiting: bool = False  # when True, ticket → WAITING_FOR_CUSTOMER after reply


class CommentRequest(BaseModel):
    content: str = Field(min_length=1, max_length=2000)


# ---- Support queue ----
class SupportQueueItem(BaseModel):
    ticket_id: str
    subject: str
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    category: Optional[str] = None
    reason: str
    source: str
    priority: str
    status: str
    assigned_team: str
    assigned_agent: Optional[str] = None
    ai_summary: Optional[str] = None
    last_customer_message: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


class SupportQueueStats(BaseModel):
    open: int
    high: int
    critical: int
    pending_human: int
    in_progress: int
    resolved: int


class SupportQueueResponse(BaseModel):
    items: list[SupportQueueItem]
    total: int
    stats: SupportQueueStats


class SummarizeResponse(BaseModel):
    session_id: str
    summary: str


class SessionTitleResponse(BaseModel):
    session_id: str
    title: str