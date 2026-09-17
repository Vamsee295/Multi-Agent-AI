"""
Escalation & human-handoff lifecycle tests (production workflow).

Covers the deterministic escalation policy, ticket creation (with the
"never claim a ticket unless the insert succeeded" invariant), duplicate
prevention, support-queue authz, human takeover (AI stops auto-answering),
human replies in the same thread, and resolve/close/reopen transitions.

Runs fully offline: `LLM_PROVIDER=mock`, keyword intent detection, mocked
embeddings, fresh MockDatabase per test, mock Supabase JWTs.
"""
import uuid

import pytest
from httpx import ASGITransport, AsyncClient

from main import app
from database import mongo as mongo_module
from tests.test_auth_supabase import make_mock_supabase_token
from models.user import new_supabase_user_doc, new_message_doc
from escalation.policy import evaluate_escalation, NO_ESCALATION
from escalation.service import escalation_service, SUMMARIZE_FALLBACK
from escalation.handoff import get_conversation_mode


@pytest.fixture(autouse=True)
async def reset_mock_db(tmp_path, monkeypatch):
    """Fresh, isolated MockDatabase per test (per-test persistence file)."""
    from database import mongo as mongo_module
    cache_path = tmp_path / "mock_store.json"
    monkeypatch.setattr(mongo_module, "DB_CACHE_FILE", str(cache_path))
    mongo_module._use_mock_db = True
    mongo_module._mock_db = mongo_module.MockDatabase()
    yield


def seed_user(email="customer@example.com", role="user", name="Test Customer"):
    user_id = str(uuid.uuid4())
    mongo_module._mock_db.users.docs.append(
        new_supabase_user_doc(supabase_uid=user_id, email=email, name=name, role=role)
    )
    token = make_mock_supabase_token(user_id=user_id, email=email, name=name)
    return user_id, token


class FakeIntent:
    def __init__(self, agents=None, confidence=1.0, sentiment="neutral", sentiment_score=0.5):
        self.agents = agents or []
        self.confidence = confidence
        self.sentiment = sentiment
        self.sentiment_score = sentiment_score


# ─────────────────────────────────────────────────────────────────────────────
# 1. Deterministic escalation policy (unit)
# ─────────────────────────────────────────────────────────────────────────────

def test_policy_explicit_human_request():
    d = evaluate_escalation(
        "I want to talk to a human agent, please.",
        FakeIntent(agents=["general"]),
        routed_context=[{"source": "kb", "text": "x"}],
    )
    assert d.should_escalate
    assert d.reason == "USER_REQUESTED_HUMAN"
    assert d.source == "USER"


def test_policy_normal_question_no_escalation():
    d = evaluate_escalation(
        "What are your store hours on weekends?",
        FakeIntent(agents=["faq"], confidence=0.95),
        routed_context=[{"source": "kb", "text": "We are open 9-6."}],
    )
    assert not d.should_escalate
    assert d == NO_ESCALATION


def test_policy_single_unhelpful_no_escalation():
    # One failure signal is under REPEATED_FAILURE_THRESHOLD (=2).
    d = evaluate_escalation(
        "This didn't help at all.",
        FakeIntent(agents=["faq"], confidence=0.9),
        routed_context=[{"source": "kb", "text": "y"}],
    )
    assert not d.should_escalate


def test_policy_repeated_failure_escalates():
    d = evaluate_escalation(
        "This didn't help.",
        FakeIntent(agents=["faq"], confidence=0.9),
        routed_context=[{"source": "kb", "text": "y"}],
        history_turns=[{"role": "user", "content": "that is still not working"}],
    )
    assert d.should_escalate
    assert d.reason == "REPEATED_FAILURE"
    assert d.source == "AI"


def test_policy_low_confidence_escalates():
    d = evaluate_escalation(
        "What is the warranty on my Bluetooth speaker?",
        FakeIntent(agents=["product"], confidence=0.2),
        routed_context=[{"source": "kb", "text": "warranty"}],
    )
    assert d.should_escalate
    assert d.reason == "LOW_CONFIDENCE"


def test_policy_knowledge_not_found_when_no_context():
    d = evaluate_escalation(
        "Tell me about the quantum motel rewards program.",
        FakeIntent(agents=["faq"], confidence=0.9),
        routed_context=[],  # nothing retrieved
        rag_enabled=True,
    )
    assert d.should_escalate
    assert d.reason == "KNOWLEDGE_NOT_FOUND"


def test_policy_refund_high_priority():
    d = evaluate_escalation("I need a refund for my last order.", FakeIntent(), routed_context=[{"source": "kb"}])
    assert d.should_escalate
    assert d.reason == "REFUND_REQUEST"
    assert d.priority == "HIGH"


def test_policy_payment_dispute_high_priority():
    d = evaluate_escalation("I was charged twice for my order.", FakeIntent(), routed_context=[{"source": "kb"}])
    assert d.should_escalate
    assert d.reason == "PAYMENT_DISPUTE"
    assert d.priority == "HIGH"


def test_policy_fraud_critical_priority():
    d = evaluate_escalation("There is a fraudulent charge on my card.", FakeIntent(), routed_context=[{"source": "kb"}])
    assert d.should_escalate
    assert d.reason == "FRAUD"
    assert d.priority == "CRITICAL"


def test_policy_security_critical_priority():
    d = evaluate_escalation("My account was hacked someone logged in.", FakeIntent(), routed_context=[{"source": "kb"}])
    assert d.should_escalate
    assert d.reason == "SECURITY_ISSUE"
    assert d.priority == "CRITICAL"


def test_policy_angry_sentiment_escalates():
    d = evaluate_escalation("I am furious with your terrible service!",
                            FakeIntent(sentiment="angry"),
                            routed_context=[{"source": "kb"}])
    assert d.should_escalate
    assert d.reason == "SERIOUS_COMPLAINT"


def test_policy_complaint_low_confidence_parity():
    d = evaluate_escalation("Whatever, just give me an answer.",
                            FakeIntent(agents=["complaint"], confidence=0.5),
                            routed_context=[{"source": "kb"}])
    assert d.should_escalate
    assert d.reason == "SERIOUS_COMPLAINT"


# ─────────────────────────────────────────────────────────────────────────────
# 2. Escalation service (unit)
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_duplicate_active_escalation_reuses_ticket():
    db = mongo_module._mock_db
    kwargs = dict(
        session_id="s-1", user_id="u-1", trigger_message="I want a human",
        agents_invoked=[], intent_confidence=0.5,
        reason="USER_REQUESTED_HUMAN", source="USER", priority="MEDIUM",
    )
    doc1, created1 = await escalation_service.create_escalation(db, **kwargs)
    assert created1 is True
    doc2, created2 = await escalation_service.create_escalation(db, **kwargs)
    assert created2 is False
    assert doc2["ticket_id"] == doc1["ticket_id"]
    assert len(db.escalations.docs) == 1


@pytest.mark.asyncio
async def test_ai_summary_failure_still_creates_ticket(monkeypatch):
    import agents.llm_client as llm_client

    def boom(*_args, **_kwargs):
        raise RuntimeError("LLM is down")

    monkeypatch.setattr(llm_client, "generate", boom)

    db = mongo_module._mock_db
    await db.messages.insert_one(
        new_message_doc("s-1", "u-1", "user", "I want to talk to a human please", [])
    )
    doc, created = await escalation_service.create_escalation(
        db,
        session_id="s-1", user_id="u-1", trigger_message="I want to talk to a human please",
        agents_invoked=[], intent_confidence=0.8,
        reason="USER_REQUESTED_HUMAN", source="USER",
    )
    assert created is True
    assert doc["ai_summary"] == SUMMARIZE_FALLBACK


# ─────────────────────────────────────────────────────────────────────────────
# 3. API: ticket creation & customer-facing behavior
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_human_request_creates_ticket_and_confirms():
    user_id, token = seed_user()
    headers = {"Authorization": f"Bearer {token}"}
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post(
            "/api/chat",
            json={"message": "I want to talk to a human agent, please."},
            headers=headers,
        )
    assert resp.status_code == 200
    data = resp.json()
    assert data["escalated"] is True
    ed = data["escalation_details"]
    assert ed is not None
    assert ed["ticket_id"].startswith("HF-")
    assert "escalated to human support" in data["message"]
    assert ed["ticket_id"] in data["message"]

    escalations = mongo_module._mock_db.escalations.docs
    assert len(escalations) == 1
    assert escalations[0]["ticket_id"] == ed["ticket_id"]
    assert escalations[0]["user_id"] == user_id
    assert escalations[0]["source"] == "USER"
    assert escalations[0]["status"] == "PENDING_HUMAN"


@pytest.mark.asyncio
async def test_duplicate_human_request_reuses_ticket_through_api():
    _, token = seed_user()
    headers = {"Authorization": f"Bearer {token}"}
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        first = await client.post(
            "/api/chat", json={"message": "Please connect me to a human."}, headers=headers
        )
        assert first.status_code == 200
        session_id = first.json()["session_id"]
        first_ticket = first.json()["escalation_details"]["ticket_id"]

        second = await client.post(
            "/api/chat",
            json={"message": "I still want to talk to a human.", "session_id": session_id},
            headers=headers,
        )
    assert second.status_code == 200
    assert second.json()["escalation_details"]["ticket_id"] == first_ticket
    assert len(mongo_module._mock_db.escalations.docs) == 1


@pytest.mark.asyncio
async def test_ticket_creation_failure_is_honest(monkeypatch):
    async def boom(*_args, **_kwargs):
        raise RuntimeError("database insert failed")

    monkeypatch.setattr(escalation_service, "create_escalation", boom)

    _, token = seed_user()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post(
            "/api/chat",
            json={"message": "I want to talk to a human agent, please."},
            headers={"Authorization": f"Bearer {token}"},
        )
    assert resp.status_code == 200
    data = resp.json()
    assert data["escalated"] is True
    assert data["escalation_details"] is None
    assert "went wrong while creating the escalation" in data["message"]
    assert "HF-" not in data["message"]
    assert len(mongo_module._mock_db.escalations.docs) == 0


@pytest.mark.asyncio
async def test_refund_ticket_lands_in_support_queue_as_high():
    customer_uid, customer_token = seed_user("billing@example.com")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post(
            "/api/chat",
            json={"message": "I need a refund for my last order."},
            headers={"Authorization": f"Bearer {customer_token}"},
        )
        assert resp.status_code == 200
        ed = resp.json()["escalation_details"]
        assert ed["reason"] == "REFUND_REQUEST"
        assert ed["priority"] == "HIGH"

        support_uid, support_token = seed_user("support@example.com", role="support", name="Sue Support")
        queue = await client.get(
            "/api/tickets/support/queue",
            headers={"Authorization": f"Bearer {support_token}"},
        )
    assert queue.status_code == 200
    body = queue.json()
    assert any(item["ticket_id"] == ed["ticket_id"] for item in body["items"])
    item = next(i for i in body["items"] if i["ticket_id"] == ed["ticket_id"])
    assert item["priority"] == "HIGH"
    assert item["customer_email"] == "billing@example.com"
    assert body["stats"]["high"] >= 1


# ─────────────────────────────────────────────────────────────────────────────
# 4. API: authorization boundaries
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_support_queue_requires_support_role():
    _, customer_token = seed_user()
    _, support_token = seed_user("support@example.com", role="support", name="Support Agent")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        denied = await client.get(
            "/api/tickets/support/queue", headers={"Authorization": f"Bearer {customer_token}"}
        )
        allowed = await client.get(
            "/api/tickets/support/queue", headers={"Authorization": f"Bearer {support_token}"}
        )
    assert denied.status_code == 403
    assert allowed.status_code == 200


@pytest.mark.asyncio
async def test_customer_cannot_view_another_ticket():
    _, token_a = seed_user("usera@example.com")
    _, token_b = seed_user("userb@example.com")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        created = await client.post(
            "/api/chat", json={"message": "I want to talk to a human please."},
            headers={"Authorization": f"Bearer {token_a}"},
        )
        ticket_id = created.json()["escalation_details"]["ticket_id"]

        denied = await client.get(
            f"/api/tickets/{ticket_id}", headers={"Authorization": f"Bearer {token_b}"}
        )
        allowed = await client.get(
            f"/api/tickets/{ticket_id}", headers={"Authorization": f"Bearer {token_a}"}
        )
    assert denied.status_code in (403, 404)
    assert allowed.status_code == 200
    assert allowed.json()["ticket_id"] == ticket_id


@pytest.mark.asyncio
async def test_support_detail_includes_customer_profile():
    _, customer_token = seed_user("customer@example.com", name="Cara Customer")
    _, support_token = seed_user("support@example.com", role="support", name="Support Agent")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        created = await client.post(
            "/api/chat", json={"message": "I want a human please."},
            headers={"Authorization": f"Bearer {customer_token}"},
        )
        ticket_id = created.json()["escalation_details"]["ticket_id"]
        detail = await client.get(
            f"/api/tickets/support/{ticket_id}",
            headers={"Authorization": f"Bearer {support_token}"},
        )
    assert detail.status_code == 200
    body = detail.json()
    assert body["customer_name"] == "Cara Customer"
    assert body["customer_email"] == "customer@example.com"


# ─────────────────────────────────────────────────────────────────────────────
# 5. API: human takeover & handoff behavior
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_support_take_case_hands_over_conversation():
    _, customer_token = seed_user()
    support_uid, support_token = seed_user("support@example.com", role="support", name="Sue Support")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        created = await client.post(
            "/api/chat", json={"message": "I want to speak to a human please."},
            headers={"Authorization": f"Bearer {customer_token}"},
        )
        session_id = created.json()["session_id"]
        ticket_id = created.json()["escalation_details"]["ticket_id"]

        taken = await client.post(
            f"/api/tickets/{ticket_id}/take",
            headers={"Authorization": f"Bearer {support_token}"},
        )
    assert taken.status_code == 200
    assert taken.json()["status"] == "IN_PROGRESS"

    mode = await get_conversation_mode(mongo_module._mock_db, session_id)
    assert mode == "HUMAN"


@pytest.mark.asyncio
async def test_human_owned_session_stops_ai_pipeline():
    _, customer_token = seed_user()
    support_uid, support_token = seed_user("support@example.com", role="support", name="Support Agent")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        created = await client.post(
            "/api/chat", json={"message": "Talk to someone please."},
            headers={"Authorization": f"Bearer {customer_token}"},
        )
        session_id = created.json()["session_id"]
        ticket_id = created.json()["escalation_details"]["ticket_id"]

        await client.post(
            f"/api/tickets/{ticket_id}/take",
            headers={"Authorization": f"Bearer {support_token}"},
        )

        before = len([m for m in mongo_module._mock_db.messages.docs if m["role"] == "assistant"])
        handoff = await client.post(
            "/api/chat",
            json={"message": "Are you still there?", "session_id": session_id},
            headers={"Authorization": f"Bearer {customer_token}"},
        )
        after = len([m for m in mongo_module._mock_db.messages.docs if m["role"] == "assistant"])

    assert handoff.status_code == 200
    body = handoff.json()
    assert body["conversation_mode"] == "HUMAN"
    assert "human support team" in body["message"].lower()
    assert body["agents_invoked"] == []
    assert after == before  # no new assistant auto-reply was generated

    # The customer's message was still stored, and the ticket was notified.
    user_msgs = [m for m in mongo_module._mock_db.messages.docs
                 if m["role"] == "user" and m["content"] == "Are you still there?"]
    assert len(user_msgs) == 1
    ticket = mongo_module._mock_db.escalations.docs[0]
    assert any(e["type"] == "CUSTOMER_REPLIED" for e in ticket.get("events", []))


@pytest.mark.asyncio
async def test_human_reply_appears_in_conversation_history():
    _, customer_token = seed_user()
    _, support_token = seed_user("support@example.com", role="support", name="Sue Support")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        created = await client.post(
            "/api/chat", json={"message": "I want to connect to a real person."},
            headers={"Authorization": f"Bearer {customer_token}"},
        )
        session_id = created.json()["session_id"]
        ticket_id = created.json()["escalation_details"]["ticket_id"]

        await client.post(f"/api/tickets/{ticket_id}/take",
                          headers={"Authorization": f"Bearer {support_token}"})

        reply = await client.post(
            f"/api/tickets/{ticket_id}/messages",
            json={"content": "Hi Cara, I've looked into this for you.", "mark_waiting": True},
            headers={"Authorization": f"Bearer {support_token}"},
        )
        assert reply.status_code == 200

        history = await client.get(
            f"/api/chat/{session_id}/history",
            headers={"Authorization": f"Bearer {customer_token}"},
        )
    turns = history.json()["turns"]
    human_turns = [t for t in turns if t["role"] == "human"]
    assert any("looked into this" in t["content"] for t in human_turns)

    ticket = mongo_module._mock_db.escalations.docs[0]
    assert ticket["status"] == "WAITING_FOR_CUSTOMER"
    assert any(e["type"] == "AGENT_REPLIED" for e in ticket.get("events", []))


# ─────────────────────────────────────────────────────────────────────────────
# 6. API: lifecycle transitions
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_support_resolve_and_reopen():
    _, customer_token = seed_user()
    _, support_token = seed_user("support@example.com", role="support", name="Support Agent")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        created = await client.post(
            "/api/chat", json={"message": "I want to talk to a human please."},
            headers={"Authorization": f"Bearer {customer_token}"},
        )
        session_id = created.json()["session_id"]
        ticket_id = created.json()["escalation_details"]["ticket_id"]

        # Work the case first (PENDING_HUMAN → IN_PROGRESS), then resolve.
        await client.post(f"/api/tickets/{ticket_id}/take",
                          headers={"Authorization": f"Bearer {support_token}"})
        resolved = await client.post(
            f"/api/tickets/{ticket_id}/resolve",
            headers={"Authorization": f"Bearer {support_token}"},
        )
        assert resolved.status_code == 200
        assert resolved.json()["status"] == "RESOLVED"
        assert resolved.json()["resolved_at"] is not None

        mode = await get_conversation_mode(mongo_module._mock_db, session_id)
        assert mode == "RESOLVED"

        reopened = await client.post(
            f"/api/tickets/{ticket_id}/reopen",
            headers={"Authorization": f"Bearer {support_token}"},
        )
    assert reopened.status_code == 200
    assert reopened.json()["status"] == "REOPENED"


@pytest.mark.asyncio
async def test_invalid_status_transition_rejected():
    _, customer_token = seed_user()
    _, support_token = seed_user("support@example.com", role="support", name="Support Agent")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        created = await client.post(
            "/api/chat", json={"message": "I want to talk to a human please."},
            headers={"Authorization": f"Bearer {customer_token}"},
        )
        ticket_id = created.json()["escalation_details"]["ticket_id"]

        # From RESOLVED you cannot jump to ASSIGNED.
        await client.post(f"/api/tickets/{ticket_id}/take",
                          headers={"Authorization": f"Bearer {support_token}"})
        await client.post(f"/api/tickets/{ticket_id}/resolve",
                          headers={"Authorization": f"Bearer {support_token}"})
        bad = await client.post(
            f"/api/tickets/{ticket_id}/reopen",
            headers={"Authorization": f"Bearer {support_token}"},
        )
        assert bad.status_code == 200  # REOPENED is legal from RESOLVED

        invalid = await client.patch(
            f"/api/tickets/{ticket_id}/status",
            json={"status": "CLOSED"},
            headers={"Authorization": f"Bearer {support_token}"},
        )
    # REOPENED → CLOSED is not in the transition map.
    assert invalid.status_code == 400


# ─────────────────────────────────────────────────────────────────────────────
# 7. Manual button escalation endpoint: POST /api/tickets/escalate
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_manual_escalate_button_creates_ticket_and_maps_reasons():
    user_id, token = seed_user("manual@example.com")
    db = mongo_module._mock_db
    await db.messages.insert_one(new_message_doc("s-setup", user_id, "user", "How do I setup my smart device?", []))
    await db.messages.insert_one(new_message_doc("s-setup", None, "assistant", "Follow these setup steps.", ["faq"]))

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Click Escalate to Human with "I need human assistance"
        esc_resp = await client.post(
            "/api/tickets/escalate",
            json={"session_id": "s-setup", "reason": "USER_REQUESTED_HUMAN"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert esc_resp.status_code == 200
        data = esc_resp.json()
        assert data["ticket_id"].startswith("HF-")
        assert data["reason"] == "USER_REQUESTED_HUMAN"
        assert data["source"] == "USER"
        assert data["priority"] == "MEDIUM"
        assert data["status"] == "PENDING_HUMAN"

        # Check DB
        escalation_doc = await db.escalations.find_one({"ticket_id": data["ticket_id"]})
        assert escalation_doc is not None
        assert escalation_doc["session_id"] == "s-setup"
        assert escalation_doc["user_id"] == user_id
        assert escalation_doc["trigger_message"] == "How do I setup my smart device?"

        # Calling again returns same ticket (duplicate prevention)
        second_resp = await client.post(
            "/api/tickets/escalate",
            json={"session_id": "s-setup", "reason": "AI_RESPONSE_UNHELPFUL"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert second_resp.status_code == 200
        assert second_resp.json()["ticket_id"] == data["ticket_id"]


@pytest.mark.asyncio
async def test_manual_escalate_reasons():
    user_id, token = seed_user("reasons@example.com")
    db = mongo_module._mock_db
    await db.messages.insert_one(new_message_doc("s-100", user_id, "user", "I need help with my account", []))
    await db.messages.insert_one(new_message_doc("s-100", None, "assistant", "Here is your account info", ["general"]))
    await db.messages.insert_one(new_message_doc("s-200", user_id, "user", "Can you check my shipping?", []))
    await db.messages.insert_one(new_message_doc("s-200", None, "assistant", "Your shipment is on the way", ["faq"]))

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. AI_RESPONSE_UNHELPFUL
        e1 = await client.post("/api/tickets/escalate", json={"session_id": "s-100", "reason": "AI_RESPONSE_UNHELPFUL"}, headers={"Authorization": f"Bearer {token}"})
        assert e1.status_code == 200
        assert e1.json()["reason"] == "AI_RESPONSE_UNHELPFUL"

        # 2. OTHER
        e2 = await client.post("/api/tickets/escalate", json={"session_id": "s-200", "reason": "OTHER"}, headers={"Authorization": f"Bearer {token}"})
        assert e2.status_code == 200
        assert e2.json()["reason"] == "OTHER"


@pytest.mark.asyncio
async def test_manual_escalate_ownership_and_auth():
    user_a, token_a = seed_user("user_a@example.com")
    _, token_b = seed_user("user_b@example.com")
    db = mongo_module._mock_db
    await db.messages.insert_one(new_message_doc("s-private", user_a, "user", "Private query", []))

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Unauthorized
        unauth = await client.post("/api/tickets/escalate", json={"session_id": "s-private"})
        assert unauth.status_code == 401

        # Forbidden (User B tries to escalate User A's session)
        forbidden = await client.post("/api/tickets/escalate", json={"session_id": "s-private"}, headers={"Authorization": f"Bearer {token_b}"})
        assert forbidden.status_code == 403