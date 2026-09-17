"""
Escalation constants shared by the service/policy layer.
Re-exports the canonical definitions living in `models/escalation_constants.py`
so the `escalation` package has a single import surface.
"""
from models.escalation_constants import (
    ESCALATION_REASONS,
    ESCALATION_SOURCES,
    ESCALATION_PRIORITIES,
    ESCALATION_STATUSES,
    ACTIVE_TICKET_STATUSES,
    RESOLVED_STATUSES,
    TICKET_ID_PREFIX,
    HUMAN_ROLE_NAME,
    STATUS_TRANSITIONS,
    PRIORITY_FOR_REASON,
    TEAM_FOR_REASON,
    is_valid_reason,
    is_valid_status,
    is_valid_priority,
    can_transition,
)
from config import get_settings

# Priority assigned to an explicit "I want to talk to a human" request
# (configurable via HUMAN_REQUEST_PRIORITY env var).
HUMAN_REQUEST_PRIORITY = get_settings().HUMAN_REQUEST_PRIORITY

__all__ = [
    "ESCALATION_REASONS",
    "ESCALATION_SOURCES",
    "ESCALATION_PRIORITIES",
    "ESCALATION_STATUSES",
    "ACTIVE_TICKET_STATUSES",
    "RESOLVED_STATUSES",
    "TICKET_ID_PREFIX",
    "HUMAN_ROLE_NAME",
    "STATUS_TRANSITIONS",
    "PRIORITY_FOR_REASON",
    "TEAM_FOR_REASON",
    "HUMAN_REQUEST_PRIORITY",
    "is_valid_reason",
    "is_valid_status",
    "is_valid_priority",
    "can_transition",
]