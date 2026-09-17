# Escalation & Human Handoff Implementation Todo

## Backend foundation
- [x] `models/escalation_constants.py` — enum sets, transition map, priority map
- [x] `models/schemas.py` — EscalationDetail/Event/SupportQueueItem, request models, extend UserPublic/ConversationTurn/TicketSummary/ChatResponse
- [x] `models/user.py` — upgraded new_escalation_doc, new_escalation_event
- [x] `config.py` — escalation settings
- [x] `database/mongo.py` — conversation_ownership collection, indexes
- [x] `escalation/` package — constants, policy, service, handoff
- [x] `auth/security.py` — require_support_user
- [x] `api/auth.py` — role in /me

## Backend integration
- [x] `agents/intent_detection.py` — human_requested/high_risk flags
- [x] `agents/router.py` — policy.evaluate_escalation integration
- [x] `api/chat.py` — ownership check, escalation service call, confirmation line
- [x] `api/tickets.py` — full rework (customer + support)
- [x] `api/analytics.py` — escalations endpoint

## Backend verification
- [x] App imports; all 32 routes materialize (OpenAPI verified)
- [x] Existing test suite passes (33 passed)

## Frontend
- [x] `services/api.ts` — types + functions (+ fetchSupportTicketDetail, TicketDetail customer fields)
- [x] `hooks/useChat.ts`, `app/chat/page.tsx`, `components/MessageBubble.tsx`, `components/EscalateModal.tsx`
- [x] `app/tickets/page.tsx` — lifecycle rework
- [x] `app/support/page.tsx` — support queue (3-col: filters+list / detail / actions sidebar)
- [x] `Sidebar.tsx`, `AuthContext.tsx` — role plumbing

## Tests & verification
- [x] `tests/test_escalations.py` (26 tests)
- [x] Update existing tests (`analytics` open→active status filter)
- [x] pytest (59 passed), tsc --noEmit (clean), npm run build (clean); lint skipped (no ESLint config)