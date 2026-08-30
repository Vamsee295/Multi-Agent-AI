"""
Authentication routes: session/me, migration diagnostics, and legacy deprecation stubs.
Supabase Auth is the primary production authentication system.
"""
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status, Depends
from bson import ObjectId

from database.mongo import get_db
from models.schemas import UserRegister, UserLogin, TokenResponse, UserPublic
from auth.security import (
    get_current_user,
    AuthenticatedUser,
)
from auth.profile_service import resolve_or_provision_user_profile

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", status_code=status.HTTP_410_GONE)
async def register(payload: dict = None):
    """
    Deprecated legacy registration endpoint.
    All user registrations are handled through Supabase Auth.
    """
    raise HTTPException(
        status_code=status.HTTP_410_GONE,
        detail="Legacy registration endpoint is deprecated. Please create an account through Supabase Auth.",
    )


@router.post("/login", status_code=status.HTTP_410_GONE)
async def login(payload: dict = None):
    """
    Deprecated legacy login endpoint.
    All authentication is handled through Supabase Auth.
    """
    raise HTTPException(
        status_code=status.HTTP_410_GONE,
        detail="Legacy login endpoint is deprecated. Please sign in through Supabase Auth.",
    )


@router.get("/me", response_model=UserPublic)
async def me(current_user: AuthenticatedUser = Depends(get_current_user)):
    """
    Get current authenticated user profile.
    Resolves verified Supabase identities to their corresponding MongoDB application profile.
    """
    db = get_db()
    user_doc = await resolve_or_provision_user_profile(db, current_user)

    user_id_out = current_user.user_id if current_user.auth_provider == "supabase" else str(user_doc["_id"])
    return UserPublic(
        id=user_id_out,
        name=user_doc.get("name", "User"),
        email=user_doc.get("email", ""),
        created_at=user_doc.get("created_at", datetime.now(timezone.utc)),
    )


@router.get("/migration-status")
async def migration_status(current_user: AuthenticatedUser = Depends(get_current_user)):
    """
    Diagnostic report for Supabase Auth migration auditing.
    """
    db = get_db()

    total_users = 0
    supabase_users_count = 0
    legacy_users_count = 0

    cursor = db.users.find({})
    async for doc in cursor:
        total_users += 1
        if doc.get("supabase_uid"):
            supabase_users_count += 1
        else:
            legacy_users_count += 1

    return {
        "status": "active",
        "total_users": total_users,
        "supabase_linked_users": supabase_users_count,
        "legacy_only_users": legacy_users_count,
        "migration_ready": True,
    }
