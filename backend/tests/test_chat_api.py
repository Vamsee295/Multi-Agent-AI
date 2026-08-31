import uuid
from datetime import datetime, timezone
import pytest
from httpx import ASGITransport, AsyncClient
from bson import ObjectId

from main import app
from database import mongo as mongo_module
from tests.test_auth_supabase import make_mock_supabase_token


@pytest.fixture(autouse=True)
async def reset_mock_db():
    mongo_module._use_mock_db = True
    mongo_module._mock_db = mongo_module.MockDatabase()
    yield


def _seed_user(email: str = "owner@example.com") -> tuple[str, str]:
    user_id = str(uuid.uuid4())
    mongo_module._mock_db.users.docs.append(
        {
            "_id": ObjectId(),
            "supabase_uid": user_id,
            "name": "Test User",
            "email": email,
            "role": "user",
            "created_at": datetime.now(timezone.utc),
        }
    )
    token = make_mock_supabase_token(user_id=user_id, email=email)
    return user_id, token


@pytest.mark.asyncio
async def test_guest_can_access_guest_session_history():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        chat = await client.post("/api/chat", json={"message": "What is your refund policy?"})
        assert chat.status_code == 200
        session_id = chat.json()["session_id"]

        history = await client.get(f"/api/chat/{session_id}/history")
        assert history.status_code == 200
        assert len(history.json()["turns"]) >= 2


@pytest.mark.asyncio
async def test_authenticated_session_history_requires_owner():
    _, token = _seed_user()
    headers = {"Authorization": f"Bearer {token}"}

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        chat = await client.post(
            "/api/chat",
            json={"message": "I need help with billing"},
            headers=headers,
        )
        session_id = chat.json()["session_id"]

        denied = await client.get(f"/api/chat/{session_id}/history")
        assert denied.status_code == 403

        allowed = await client.get(f"/api/chat/{session_id}/history", headers=headers)
        assert allowed.status_code == 200


@pytest.mark.asyncio
async def test_list_sessions_requires_auth():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/chat/sessions")
        assert resp.status_code == 401


@pytest.mark.asyncio
async def test_delete_session_success_and_cascade():
    user_id, token = _seed_user()
    headers = {"Authorization": f"Bearer {token}"}
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Create a session
        chat = await client.post(
            "/api/chat",
            json={"message": "I need a refund"},
            headers=headers,
        )
        assert chat.status_code == 200
        session_id = chat.json()["session_id"]
        
        # Verify it exists
        sessions = await client.get("/api/chat/sessions", headers=headers)
        assert any(s["session_id"] == session_id for s in sessions.json())
        
        # Delete it
        delete_resp = await client.delete(f"/api/chat/{session_id}", headers=headers)
        assert delete_resp.status_code == 204
        
        # Verify it's gone
        sessions_after = await client.get("/api/chat/sessions", headers=headers)
        assert not any(s["session_id"] == session_id for s in sessions_after.json())
        
        # Verify messages are gone (history should return empty or error, but we can check the mock db directly)
        db = mongo_module._mock_db
        assert len([m for m in db.messages.docs if m["session_id"] == session_id]) == 0


@pytest.mark.asyncio
async def test_delete_session_requires_owner():
    # User A creates a session
    user_a_id, token_a = _seed_user("usera@example.com")
    headers_a = {"Authorization": f"Bearer {token_a}"}
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        chat = await client.post(
            "/api/chat",
            json={"message": "I need help with billing"},
            headers=headers_a,
        )
        session_id = chat.json()["session_id"]
        
        # User B tries to delete User A's session
        _, token_b = _seed_user("userb@example.com")
        headers_b = {"Authorization": f"Bearer {token_b}"}
        
        delete_denied = await client.delete(f"/api/chat/{session_id}", headers=headers_b)
        assert delete_denied.status_code == 403
