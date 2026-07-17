import pytest
from httpx import ASGITransport, AsyncClient
from bson import ObjectId
from datetime import datetime, timezone

from main import app
from database import mongo as mongo_module
from auth.security import create_access_token


@pytest.fixture(autouse=True)
async def reset_mock_db():
    mongo_module._use_mock_db = True
    mongo_module._mock_db = mongo_module.MockDatabase()
    yield


def _seed_user(email: str = "owner@example.com") -> tuple[str, str]:
    user_id = ObjectId()
    mongo_module._mock_db.users.docs.append(
        {
            "_id": user_id,
            "name": "Test User",
            "email": email,
            "hashed_password": "stub",
            "created_at": datetime.now(timezone.utc),
        }
    )
    token = create_access_token(str(user_id))
    return str(user_id), token


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
