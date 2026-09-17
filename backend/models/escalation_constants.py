"""
Escalation domain constants — single source of truth for the ticket lifecycle.

These are plain string constants (not `enum.Enum`) so they persist cleanly as
MongoDB strings and validate transparently through Pydantic `Literal` types.
"""

# ── Escalation reasons ────────────────────────────────────────────────────────
ESCALATION_REASONS = {
    "USER_REQUESTED_HUMAN": "The customer explicitly asked to speak to a human",
    "AI_RESPONSE_UNHELPFUL": "The AI response did not resolve the customer's issue",
    "LOW_CONFIDENCE": "The AI was not confident about its answer",
    "KNOWLEDGE_NOT_FOUND": "No applicable answer was found in the knowledge base",
    "REPEATED_FAILURE": "The issue was not resolved after repeated attempts",
    "PAYMENT_DISPUTE": "The customer disputed a payment or charge",
    "REFUND_REQUEST": "The customer requested a refund",
    "SECURITY_ISSUE": "The customer reported a security concern",
    "FRAUD": "The customer reported a potentially fraudulent event",
    "SERIOUS_COMPLAINT": "The customer expressed a serious complaint",
    "OTHER": "Undetermined reason",
}

# ── Where the escalation signal came from ─────────────────────────────────────
ESCALATION_SOURCES = {"USER", "AI", "SYSTEM"}

# ── Priority levels (sorted most → least urgent) ──────────────────────────────
ESCALATION_PRIORITIES = {"CRITICAL", "HIGH", "MEDIUM", "LOW"}

# ── Status lifecycle ───────────────────────────────────────────────────────────
# OPEN → ESCALATED → PENDING_HUMAN → ASSIGNED → IN_PROGRESS → WAITING_FOR_CUSTOMER
#      → RESOLVED → CLOSED → REOPENED
ESCALATION_STATUSES = {
    "OPEN",
    "ESCALATED",
    "PENDING_HUMAN",
    "ASSIGNED",
    "IN_PROGRESS",
    "WAITING_FOR_CUSTOMER",
    "RESOLVED",
    "CLOSED",
    "REOPENED",
}

# Statuses considered "in flight" (an active case). Used for duplicate-escalation
# detection and for legacy "open ticket" counts.
ACTIVE_TICKET_STATUSES = {"OPEN", "ESCALATED", "PENDING_HUMAN", "ASSIGNED", "IN_PROGRESS", "WAITING_FOR_CUSTOMER", "REOPENED"}

# Terminal / customer-facing resolved statuses.
RESOLVED_STATUSES = {"RESOLVED", "CLOSED"}

# ── Validation helpers ─────────────────────────────────────────────────────────
TICKET_ID_PREFIX = "HF"

HUMAN_ROLE_NAME = "human"

# Allowed status transitions. Any transition not listed here is rejected.
STATUS_TRANSITIONS: dict[str, set[str]] = {
    "OPEN": {"ESCALATED", "PENDING_HUMAN", "CLOSED", "RESOLVED"},
    "ESCALATED": {"PENDING_HUMAN", "ASSIGNED", "CLOSED", "RESOLVED"},
    "PENDING_HUMAN": {"ASSIGNED", "IN_PROGRESS", "WAITING_FOR_CUSTOMER", "CLOSED", "RESOLVED"},
    "ASSIGNED": {"IN_PROGRESS", "PENDING_HUMAN", "WAITING_FOR_CUSTOMER", "CLOSED", "RESOLVED"},
    "IN_PROGRESS": {"WAITING_FOR_CUSTOMER", "RESOLVED", "PENDING_HUMAN", "CLOSED"},
    "WAITING_FOR_CUSTOMER": {"IN_PROGRESS", "RESOLVED", "CLOSED"},
    "RESOLVED": {"CLOSED", "REOPENED"},
    "CLOSED": {"REOPENED"},
    "REOPENED": {"IN_PROGRESS", "PENDING_HUMAN", "RESOLVED"},
}

# Default priority per escalation reason (policy may override).
PRIORITY_FOR_REASON: dict[str, str] = {
    "FRAUD": "CRITICAL",
    "SECURITY_ISSUE": "CRITICAL",
    "PAYMENT_DISPUTE": "HIGH",
    "REFUND_REQUEST": "HIGH",
    "USER_REQUESTED_HUMAN": "MEDIUM",
    "REPEATED_FAILURE": "MEDIUM",
    "LOW_CONFIDENCE": "LOW",
    "KNOWLEDGE_NOT_FOUND": "LOW",
    "AI_RESPONSE_UNHELPFUL": "LOW",
    "SERIOUS_COMPLAINT": "HIGH",
    "OTHER": "LOW",
}

# Default team per escalation reason (policy may override based on intent agents).
TEAM_FOR_REASON: dict[str, str] = {
    "FRAUD": "Fraud & Security",
    "SECURITY_ISSUE": "Fraud & Security",
    "PAYMENT_DISPUTE": "Billing Support",
    "REFUND_REQUEST": "Billing Support",
    "USER_REQUESTED_HUMAN": "Customer Success",
    "REPEATED_FAILURE": "Customer Success",
    "LOW_CONFIDENCE": "Customer Success",
    "KNOWLEDGE_NOT_FOUND": "Customer Success",
    "AI_RESPONSE_UNHELPFUL": "Customer Success",
    "SERIOUS_COMPLAINT": "Customer Success",
    "OTHER": "Customer Success",
}


def is_valid_reason(reason: str) -> bool:
    return reason in ESCALATION_REASONS


def is_valid_status(status: str) -> bool:
    return status in ESCALATION_STATUSES


def is_valid_priority(priority: str) -> bool:
    return priority in ESCALATION_PRIORITIES


def can_transition(from_status: str, to_status: str) -> bool:
    allowed = STATUS_TRANSITIONS.get(from_status, set())
    return to_status in allowed