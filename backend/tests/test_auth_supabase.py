"""
Comprehensive Phase 4 test suite for Supabase JWT verification, role authorization,
legacy endpoint deprecation, data isolation, and API security.
"""
import uuid
from datetime import datetime, timedelta, timezone
import pytest
import jwt
from httpx import AsyncClient, ASGITransport
from bson import ObjectId

from main import app
from config import get_settings
from auth.security import decode_token_to_user, require_admin_user, AuthenticatedUser
from database import mongo as mongo_module
from database.mongo import get_db
from models.user import new_supabase_user_doc


@pytest.fixture(autouse=True)
async def reset_mock_db():
    mongo_module._use_mock_db = True
    mongo_module._mock_db = mongo_module.MockDatabase()
    yield


def make_mock_supabase_token(
    user_id: str = None,
    email: str = "test@example.com",
    name: str = "Test User",
    expires_in_minutes: int = 60,
) -> str:
    """Generate a mock Supabase-issued JWT token for testing."""
    settings = get_settings()
    uid = user_id or str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    payload = {
        "iss": f"{settings.SUPABASE_URL}/auth/v1",
        "sub": uid,
        "aud": settings.SUPABASE_AUDIENCE,
        "exp": now + timedelta(minutes=expires_in_minutes),
        "iat": now,
        "email": email,
        "role": "authenticated",
        "user_metadata": {"name": name, "full_name": name},
    }
    secret = settings.SUPABASE_JWT_SECRET or "a_very_long_secure_mock_supabase_jwt_secret_key_32bytes"
    return jwt.encode(payload, secret, algorithm="HS256")


@pytest.mark.asyncio
async def test_supabase_token_decoding():
    test_uid = str(uuid.uuid4())
    token = make_mock_supabase_token(user_id=test_uid, email="agent@techmart.com", name="Agent Smith")
    
    auth_user = decode_token_to_user(token)
    assert auth_user.auth_provider == "supabase"
    assert auth_user.user_id == test_uid
    assert auth_user.email == "agent@techmart.com"
    assert auth_user.name == "Agent Smith"


@pytest.mark.asyncio
async def test_expired_token_rejected():
    token = make_mock_supabase_token(expires_in_minutes=-10)
    with pytest.raises(Exception) as exc_info:
        decode_token_to_user(token)
    assert "expired" in str(exc_info.value).lower() or exc_info.value.status_code == 401


@pytest.mark.asyncio
async def test_malformed_token_rejected():
    with pytest.raises(Exception) as exc_info:
        decode_token_to_user("not.a.valid.jwt.token")
    assert exc_info.value.status_code == 401


@pytest.mark.asyncio
async def test_api_auth_me_supabase_user_and_idempotency():
    test_uid = str(uuid.uuid4())
    token = make_mock_supabase_token(user_id=test_uid, email="supabase_user@techmart.com", name="Supa User")

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # First call: Provisions user profile
        res1 = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert res1.status_code == 200
        data1 = res1.json()
        assert data1["id"] == test_uid
        assert data1["email"] == "supabase_user@techmart.com"

        # Second call: Returns existing profile without duplicate creation
        res2 = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert res2.status_code == 200
        data2 = res2.json()
        assert data2["id"] == test_uid

    db = get_db()
    users = [u async for u in db.users.find({"supabase_uid": test_uid})]
    assert len(users) == 1


@pytest.mark.asyncio
async def test_supabase_email_update_sync():
    test_uid = str(uuid.uuid4())
    token_old = make_mock_supabase_token(user_id=test_uid, email="old_email@techmart.com", name="Email User")

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Initial provisioning
        res1 = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token_old}"})
        assert res1.status_code == 200
        assert res1.json()["email"] == "old_email@techmart.com"

        # Email update in Supabase
        token_new = make_mock_supabase_token(user_id=test_uid, email="new_email@techmart.com", name="Email User")
        res2 = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token_new}"})
        assert res2.status_code == 200
        assert res2.json()["email"] == "new_email@techmart.com"


@pytest.mark.asyncio
async def test_two_different_supabase_users_isolated():
    user1_uid = str(uuid.uuid4())
    user2_uid = str(uuid.uuid4())
    token1 = make_mock_supabase_token(user_id=user1_uid, email="user1@techmart.com")
    token2 = make_mock_supabase_token(user_id=user2_uid, email="user2@techmart.com")

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # User 1 creates chat message
        chat1 = await client.post(
            "/api/chat",
            json={"message": "Secret message from user 1"},
            headers={"Authorization": f"Bearer {token1}"},
        )
        assert chat1.status_code == 200
        session1_id = chat1.json()["session_id"]

        # User 1 can view history
        h1 = await client.get(f"/api/chat/{session1_id}/history", headers={"Authorization": f"Bearer {token1}"})
        assert h1.status_code == 200

        # User 2 cannot access User 1's history (403 Forbidden)
        h2 = await client.get(f"/api/chat/{session1_id}/history", headers={"Authorization": f"Bearer {token2}"})
        assert h2.status_code == 403


@pytest.mark.asyncio
async def test_protected_endpoints_require_auth():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Protected endpoints without token should return 401
        res_me = await client.get("/api/auth/me")
        assert res_me.status_code == 401

        res_sessions = await client.get("/api/chat/sessions")
        assert res_sessions.status_code == 401

        res_analytics = await client.get("/api/analytics/summary")
        assert res_analytics.status_code == 401

        res_tickets = await client.get("/api/tickets")
        assert res_tickets.status_code == 401


@pytest.mark.asyncio
async def test_guest_mode_chat_allowed():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Chat without token (guest mode) should work and return 200
        response = await client.post(
            "/api/chat",
            json={"message": "Hi, what are your store hours?"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "session_id" in data


@pytest.mark.asyncio
async def test_legacy_endpoints_return_deprecated_410():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res_login = await client.post("/api/auth/login", json={"email": "u@test.com", "password": "123"})
        assert res_login.status_code == 410
        assert "deprecated" in res_login.json()["detail"].lower()

        res_reg = await client.post("/api/auth/register", json={"name": "u", "email": "u@test.com", "password": "123"})
        assert res_reg.status_code == 410
        assert "deprecated" in res_reg.json()["detail"].lower()


@pytest.mark.asyncio
async def test_admin_role_authorization():
    db = get_db()
    admin_uid = str(uuid.uuid4())
    regular_uid = str(uuid.uuid4())

    # Seed an admin user in MongoDB
    admin_doc = new_supabase_user_doc(supabase_uid=admin_uid, email="admin@techmart.com", name="Admin User", role="admin")
    await db.users.insert_one(admin_doc)

    # Seed a regular user in MongoDB
    user_doc = new_supabase_user_doc(supabase_uid=regular_uid, email="user@techmart.com", name="Regular User", role="user")
    await db.users.insert_one(user_doc)

    # Regular user attempting admin action is forbidden
    regular_user = AuthenticatedUser(user_id=regular_uid, auth_provider="supabase")
    with pytest.raises(Exception) as exc:
        await require_admin_user(regular_user)
    assert exc.value.status_code == 403

    # Admin user is permitted
    admin_user = AuthenticatedUser(user_id=admin_uid, auth_provider="supabase")
    authorized = await require_admin_user(admin_user)
    assert authorized.user_id == admin_uid


@pytest.mark.asyncio
async def test_migration_status_endpoint():
    token = make_mock_supabase_token()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/auth/migration-status", headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 200
        data = res.json()
        assert "total_users" in data
        assert "supabase_linked_users" in data
        assert "legacy_only_users" in data
