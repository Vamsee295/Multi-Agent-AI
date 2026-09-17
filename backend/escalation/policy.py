"""
Deterministic escalation policy — decides WHEN a conversation becomes a ticket
and WHY. The decision path is pure Python (regex + thresholds + sentiment),
so it is fast, testable, and never depends on an LLM call succeeding.

Precedence (first match wins):
  1. High-risk intent (fraud / security / payment dispute / refund)
  2. Explicit human request
  3. Angry sentiment
  4. Knowledge not found
  5. Low confidence
  6. Repeated failure (across conversation history)
  7. Complaint agent active + low confidence (legacy heuristic parity)
"""
import re
from dataclasses import dataclass, field
from typing import Optional

from config import get_settings
from models.escalation_constants import PRIORITY_FOR_REASON


HUMAN_REQUEST_REGEX = re.compile(
    r"\b(talk|speak|connect|transfer|put)\b.{0,40}\b(human|person|agent|representative|someone)\b"
    r"|\b(human agent|human support|support agent|customer service|service representative|real person)\b"
    r"|\bescalat(e|ion)\b"
    r"|\b(open|create|raise)\b.{0,20}\bticket\b"
    r"|\b(i want|i need|can i|can you|please)\b.{0,30}\b(human|representative|real person)\b"
    r"|\bget me\b.{0,20}\bhuman\b"
    r"|\bsomeone from (your )?(support|team)\b"
    r"|\btalk to someone\b"
    r"|\bspeak to\b.{0,20}\bsomeone\b",
    re.IGNORECASE,
)

REFUND_PATTERNS = [
    r"\brefund(ed|s)?\b",
    r"\bmoney back\b",
]

DISPUTE_PATTERNS = [
    r"\b(was |got |get )?(charged|charge) (me )?twice\b",
    r"\bdouble.?charge\w*\b",
    r"\bduplicate charge\b",
    r"\bdisput(e|ed|ing)\b",
    r"\bwrong (amount|charge|price)\b",
    r"\bincorrect (charge|amount|billing)\b",
]

FRAUD_PATTERNS = [
    r"\bfraud(ul(ent)?|s|sters)?\b",
    r"\bunauthorized\b",
    r"\bidentity theft\b",
    r"\bstolen (card|credit card|account|identity)\b",
]

SECURITY_PATTERNS = [
    r"\bhack(ed|ing|er)?\b",
    r"\bsecurity breach\b",
    r"\bcompromis(ed|ing)\b",
    r"\bsuspicious activity\b",
]

FAILURE_PATTERNS = [
    r"\bdidn'?t (help|work|solve|resolve)\b",
    r"\b(that|this|it) (was|is) not (help(ful)?|useful|solved|fixed)\b",
    r"\bstill not (working|solved|fixed|helping|resolved)\b",
    r"\bnot (solved|resolved)\b",
    r"\bstill (having|have) (the )?(same )?(problem|issue)\b",
    r"\bkeep(s|ing)? (failing|giving me issues)\b",
    r"\bno (help|progress|luck)\b",
]

_HIGH_RISK_PATTERNS = [
    ("FRAUD", FRAUD_PATTERNS),
    ("SECURITY_ISSUE", SECURITY_PATTERNS),
    ("PAYMENT_DISPUTE", DISPUTE_PATTERNS),
    ("REFUND_REQUEST", REFUND_PATTERNS),
]

HIGH_RISK_REGEX = re.compile(
    "|".join(f"(?:{p})" for _, patterns in _HIGH_RISK_PATTERNS for p in patterns),
    re.IGNORECASE,
)


def user_flags(message: str) -> dict[str, bool]:
    """Cheap, non-LLM booleans about the user's utterance (shared with intent detection)."""
    return {
        "human_requested": bool(HUMAN_REQUEST_REGEX.search(message)),
        "high_risk": bool(HIGH_RISK_REGEX.search(message)),
    }


@dataclass
class EscalationDecision:
    should_escalate: bool = False
    reason: Optional[str] = None
    source: Optional[str] = None
    priority: Optional[str] = None
    category: Optional[str] = None
    # Optional extra context for diagnostics / logging.
    detail: Optional[str] = None


NO_ESCALATION = EscalationDecision()


def _count_failures(message: str, history_turns: Optional[list[dict]]) -> int:
    turns = (history_turns or []) + [{"role": "user", "content": message}]
    count = 0
    for turn in turns:
        if turn.get("role") not in ("user", None):
            continue
        text = str(turn.get("content", "")).lower()
        if any(re.search(p, text) for p in FAILURE_PATTERNS):
            count += 1
    return count


def evaluate_escalation(
    message: str,
    intent,
    routed_context: list,
    history_turns: Optional[list[dict]] = None,
    rag_enabled: bool = True,
) -> EscalationDecision:
    """Deterministically decide whether this turn should create an escalation ticket.

    `intent` — anything exposing `.agents`, `.confidence`, `.sentiment`
    (an `IntentResult` from intent_detection) or None.
    `routed_context` — list of retrieved RAG chunks for this turn.
    `history_turns` — prior conversation turns `[{"role", "content"}, ...]`.
    """
    settings = get_settings()
    text = (message or "").lower()
    agents = list(getattr(intent, "agents", None) or [])
    confidence = float(getattr(intent, "confidence", None) or 1.0)
    sentiment = getattr(intent, "sentiment", None) or "neutral"

    # 1 ── High-risk intents (highest urgency).
    for reason, patterns in _HIGH_RISK_PATTERNS:
        if any(re.search(p, text) for p in patterns):
            return EscalationDecision(
                should_escalate=True,
                reason=reason,
                source="USER",
                priority=PRIORITY_FOR_REASON.get(reason, "HIGH"),
                category=agents[0] if agents else None,
                detail="high-risk keyword match",
            )

    # 2 ── Explicit human request.
    if HUMAN_REQUEST_REGEX.search(message):
        return EscalationDecision(
            should_escalate=True,
            reason="USER_REQUESTED_HUMAN",
            source="USER",
            priority=settings.HUMAN_REQUEST_PRIORITY,
            category=agents[0] if agents else None,
            detail="explicit human request detected",
        )

    # 3 ── Angry sentiment.
    if sentiment == "angry":
        return EscalationDecision(
            should_escalate=True,
            reason="SERIOUS_COMPLAINT",
            source="USER",
            priority=PRIORITY_FOR_REASON.get("SERIOUS_COMPLAINT", "HIGH"),
            category=agents[0] if agents else None,
            detail="angry sentiment detected",
        )

    # 4 ── Knowledge not found (only when RAG was actually consulted).
    if rag_enabled and not routed_context:
        return EscalationDecision(
            should_escalate=True,
            reason="KNOWLEDGE_NOT_FOUND",
            source="AI",
            priority=PRIORITY_FOR_REASON.get("KNOWLEDGE_NOT_FOUND", "LOW"),
            category=agents[0] if agents else None,
            detail="no context retrieved for the query",
        )

    # 5 ── Low confidence.
    if confidence < settings.ESCALATION_CONFIDENCE_THRESHOLD:
        return EscalationDecision(
            should_escalate=True,
            reason="LOW_CONFIDENCE",
            source="AI",
            priority=PRIORITY_FOR_REASON.get("LOW_CONFIDENCE", "LOW"),
            category=agents[0] if agents else None,
            detail=f"confidence {confidence} below threshold",
        )

    # 6 ── Repeated failure across the conversation.
    failure_count = _count_failures(message, history_turns)
    if failure_count >= settings.REPEATED_FAILURE_THRESHOLD:
        return EscalationDecision(
            should_escalate=True,
            reason="REPEATED_FAILURE",
            source="AI",
            priority=PRIORITY_FOR_REASON.get("REPEATED_FAILURE", "MEDIUM"),
            category=agents[0] if agents else None,
            detail=f"{failure_count} failure signals in conversation",
        )

    # 7 ── Legacy heuristic parity: complaint agent + low-ish confidence.
    if "complaint" in agents and confidence < 0.8:
        return EscalationDecision(
            should_escalate=True,
            reason="SERIOUS_COMPLAINT",
            source="USER",
            priority=PRIORITY_FOR_REASON.get("SERIOUS_COMPLAINT", "HIGH"),
            category="complaint",
            detail="complaint intent with low confidence",
        )

    return NO_ESCALATION