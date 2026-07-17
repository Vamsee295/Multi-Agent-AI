"""
Authentication routes: register, login, session/me.
"""
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status, Depends

from database.mongo import get_db
from models.schemas import UserRegister, UserLogin, TokenResponse, UserPublic
from models.user import new_user_doc
from auth.security import hash_password, verify_password, create_access_token, get_current_user_id
from config import get_settings

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
async def register(payload: UserRegister):
    db = get_db()
    existing = await db.users.find_one({"email": payload.email.lower()})
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    doc = new_user_doc(payload.name, payload.email, hash_password(payload.password))
    result = await db.users.insert_one(doc)

    return UserPublic(
        id=str(result.inserted_id),
        name=doc["name"],
        email=doc["email"],
        created_at=doc["created_at"],
    )


@router.post("/login", response_model=TokenResponse)
async def login(payload: UserLogin):
    db = get_db()
    user = await db.users.find_one({"email": payload.email.lower()})
    if not user or not verify_password(payload.password, user["hashed_password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    settings = get_settings()
    token = create_access_token(subject=str(user["_id"]))
    return TokenResponse(access_token=token, expires_in_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)


@router.get("/me", response_model=UserPublic)
async def me(user_id: str = Depends(get_current_user_id)):
    from bson import ObjectId
    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return UserPublic(
        id=str(user["_id"]), name=user["name"], email=user["email"], created_at=user["created_at"]
    )
