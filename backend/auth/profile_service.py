"""
Centralized user profile resolution and synchronization service.
Maps authenticated Supabase identities (supabase_uid) to MongoDB user profile documents.
"""
from datetime import datetime, timezone
from typing import Optional
from fastapi import HTTPException, status
from bson import ObjectId

from auth.security import AuthenticatedUser
from models.user import new_supabase_user_doc


async def resolve_or_provision_user_profile(db, authenticated_user: AuthenticatedUser) -> dict:
    """
    Given an AuthenticatedUser (from verified JWT claims), resolves or auto-provisions
    their MongoDB user profile document.
    
    Rules:
    1. Supabase users are resolved strictly by `supabase_uid`.
    2. If found, verified email changes in Supabase update the MongoDB profile.
    3. If not found, a new MongoDB profile is created with verified identity claims.
    4. Legacy users are resolved by `_id = ObjectId(...)`.
    5. Application roles stored in MongoDB are preserved as the authority for permissions.
    """
    if authenticated_user.auth_provider == "legacy":
        try:
            user = await db.users.find_one({"_id": ObjectId(authenticated_user.user_id)})
        except Exception:
            user = None

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Legacy user profile not found",
            )
        return user

    # ── Supabase Authenticated User ──────────────────────────────────────────
    supabase_uid = authenticated_user.user_id
    user = await db.users.find_one({"supabase_uid": supabase_uid})

    if user:
        # Check if verified email in Supabase has changed
        current_email = (authenticated_user.email or "").strip().lower()
        existing_email = (user.get("email") or "").strip().lower()

        if current_email and current_email != existing_email:
            try:
                user = await db.users.find_one_and_update(
                    {"_id": user["_id"]},
                    {"$set": {"email": current_email, "updated_at": datetime.now(timezone.utc)}},
                )
            except Exception:
                pass  # Fallback to existing if email conflict occurs

        return user

    # ── Initial Provisioning for New Supabase User ────────────────────────────
    display_name = (
        authenticated_user.name
        or (authenticated_user.email.split("@")[0] if authenticated_user.email else "User")
    )
    email = (authenticated_user.email or "").strip().lower()

    doc = new_supabase_user_doc(
        supabase_uid=supabase_uid,
        email=email,
        name=display_name,
        role="user",
    )

    try:
        res = await db.users.insert_one(doc)
        doc["_id"] = res.inserted_id
        return doc
    except Exception:
        # Handle concurrent first-request race conditions gracefully
        existing = await db.users.find_one({"supabase_uid": supabase_uid})
        if existing:
            return existing
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to provision user profile",
        )


async def get_user_role(db, user_id: str) -> str:
    """Return the application authorization role from MongoDB (source of truth)."""
    user = await db.users.find_one({"supabase_uid": user_id})
    if not user:
        try:
            user = await db.users.find_one({"_id": ObjectId(user_id)})
        except Exception:
            user = None
    return user.get("role", "user") if user else "guest"
