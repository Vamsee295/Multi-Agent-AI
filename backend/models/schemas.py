"""
Pydantic request/response schemas (DTOs) shared across the API layer.
"""
from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, EmailStr, Field


# ---------- Auth ----------
class UserRegister(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in_minutes: int


class UserPublic(BaseModel):
    id: str
    name: str
    email: EmailStr
    created_at: datetime


# ---------- Chat ----------
AgentName = Literal["billing", "technical", "product", "complaint", "faq", "general"]
SentimentLabel = Literal["positive", "neutral", "frustrated", "angry"]


class ChatRequest(BaseModel):
    session_id: Optional[str] = None
    message: str = Field(min_length=1, max_length=4000)


class RetrievedChunk(BaseModel):
    source: str
    text: str
    score: float


class ChatResponse(BaseModel):
    session_id: str
    message: str
    agents_invoked: list[AgentName]
    intent_confidence: float
    retrieved_context: list[RetrievedChunk]
    escalated: bool
    sentiment: SentimentLabel = "neutral"
    sentiment_score: float = 0.5
    response_time_ms: int = 0
    created_at: datetime


class ConversationTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str
    timestamp: datetime
    agents_invoked: list[AgentName] = []


class ConversationHistory(BaseModel):
    session_id: str
    turns: list[ConversationTurn]


class SessionSummary(BaseModel):
    session_id: str
    last_message: str
    last_timestamp: datetime
    message_count: int
    title: Optional[str] = None


# ---------- Feedback ----------
class FeedbackRequest(BaseModel):
    rating: Literal["up", "down"]
    comment: Optional[str] = Field(default=None, max_length=500)


class FeedbackResponse(BaseModel):
    session_id: str
    rating: str
    created_at: datetime


# ---------- Analytics ----------
class AgentUsageStat(BaseModel):
    agent: str
    count: int
    percentage: float


class AnalyticsSummary(BaseModel):
    total_conversations: int
    total_messages: int
    avg_response_time_ms: float
    satisfaction_score: float        # 0.0–1.0 based on thumbs up %
    escalation_count: int
    open_ticket_count: int
    agent_usage: list[AgentUsageStat]


# ---------- Tickets ----------
class TicketSummary(BaseModel):
    ticket_id: str
    session_id: str
    trigger_message: str
    agents_invoked: list[str]
    intent_confidence: float
    status: str
    created_at: datetime


class SummarizeResponse(BaseModel):
    session_id: str
    summary: str


class SessionTitleResponse(BaseModel):
    session_id: str
    title: str
