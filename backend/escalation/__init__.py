"""
Escalation & human-handoff package.

- `policy.py`   deterministic, non-LLM decision logic (when to escalate + why)
- `service.py`  the ticket workflow service (create, queue, take, resolve, ...)
- `handoff.py`  conversation ownership (AI / HUMAN / RESOLVED)

The policy decision path is intentional pure Python — no model is called when
deciding whether to escalate, so runs are fast and predictable.
"""
from escalation.constants import (
    HUMAN_REQUEST_PRIORITY,
    ACTIVE_TICKET_STATUSES,
    RESOLVED_STATUSES,
    STATUS_TRANSITIONS,
    PRIORITY_FOR_REASON,
    TEAM_FOR_REASON,
)

__all__ = [
    "HUMAN_REQUEST_PRIORITY",
    "ACTIVE_TICKET_STATUSES",
    "RESOLVED_STATUSES",
    "STATUS_TRANSITIONS",
    "PRIORITY_FOR_REASON",
    "TEAM_FOR_REASON",
]