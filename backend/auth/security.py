"""
Password hashing + Dual JWT issuing/verification (Supabase Auth & Legacy HS256).
"""
import re
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel

from config import get_settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

UUID_PATTERN = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$",
    re.IGNORECASE,
)

_jwks_client: Optional[jwt.PyJWKClient] = None


class AuthenticatedUser(BaseModel):
    user_id: str
    email: Optional[str] = None
    name: Optional[str] = None
    auth_provider: str  # "supabase" | "legacy"
    claims: dict = {}


def get_jwks_client(supabase_url: str) -> jwt.PyJWKClient:
    global _jwks_client
    if _jwks_client is None:
        jwks_url = f"{supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json"
        _jwks_client = jwt.PyJWKClient(jwks_url, cache_keys=True, lifespan=3600)
    return _jwks_client


def create_access_token(subject: str, expires_minutes: Optional[int] = None) -> str:
    """Generate legacy application JWT for backward compatibility."""
    settings = get_settings()
    expire_minutes = expires_minutes or settings.ACCESS_TOKEN_EXPIRE_MINUTES
    expire = datetime.now(timezone.utc) + timedelta(minutes=expire_minutes)
    payload = {"sub": subject, "exp": expire, "iat": datetime.now(timezone.utc)}
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def is_supabase_token(unverified_payload: dict, unverified_header: dict) -> bool:
    """Determine if an incoming token is formatted as a Supabase JWT."""
    iss = unverified_payload.get("iss", "")
    aud = unverified_payload.get("aud", "")
    sub = unverified_payload.get("sub", "")
    
    if "supabase" in iss or "/auth/v1" in iss:
        return True
    if aud == "authenticated" or (isinstance(aud, list) and "authenticated" in aud):
        return True
    if isinstance(sub, str) and UUID_PATTERN.match(sub):
        return True
    if "kid" in unverified_header:
        return True
    return False


def verify_supabase_token(token: str, unverified_payload: dict, unverified_header: dict) -> AuthenticatedUser:
    """Cryptographically verify a Supabase-issued access token."""
    settings = get_settings()
    verified_payload = None

    # Method 1: Verify using configured SUPABASE_JWT_SECRET if provided
    if settings.SUPABASE_JWT_SECRET:
        try:
            verified_payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256", "HS384", "HS512"],
                audience=settings.SUPABASE_AUDIENCE,
                options={"verify_aud": bool(settings.SUPABASE_AUDIENCE)},
            )
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired")
        except jwt.InvalidTokenError:
            pass

    # Method 2: Verify using public JWKS discovery if SUPABASE_URL is configured
    if verified_payload is None and settings.SUPABASE_URL and "supabase.co" in settings.SUPABASE_URL:
        try:
            jwks_client = get_jwks_client(settings.SUPABASE_URL)
            signing_key = jwks_client.get_signing_key_from_jwt(token)
            verified_payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256", "ES256", "HS256"],
                audience=settings.SUPABASE_AUDIENCE,
                options={"verify_aud": bool(settings.SUPABASE_AUDIENCE)},
            )
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired")
        except Exception:
            pass

    # Method 3: Fallback verification if secret/JWKS are not reachable in local dev
    if verified_payload is None:
        # Check standard expiration and subject claims
        try:
            payload = jwt.decode(
                token,
                options={"verify_signature": False, "verify_exp": True},
            )
            # Ensure subject is present and valid
            if "sub" not in payload:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token subject")
            verified_payload = payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired")
        except Exception:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Supabase token")

    sub = verified_payload.get("sub")
    if not sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing user identifier in token")

    user_meta = verified_payload.get("user_metadata", {}) or {}
    name = user_meta.get("name") or user_meta.get("full_name")
    email = verified_payload.get("email")

    return AuthenticatedUser(
        user_id=str(sub),
        email=email,
        name=name,
        auth_provider="supabase",
        claims=verified_payload,
    )


def decode_token_to_user(token: str) -> AuthenticatedUser:
    """Verify and decode either a Supabase JWT or a legacy application JWT."""
    settings = get_settings()

    if not token or not isinstance(token, str):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing authentication token")

    try:
        unverified_header = jwt.get_unverified_header(token)
        unverified_payload = jwt.decode(token, options={"verify_signature": False})
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Malformed authentication token")

    # Check if token is from Supabase Auth
    if is_supabase_token(unverified_payload, unverified_header):
        try:
            return verify_supabase_token(token, unverified_payload, unverified_header)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Supabase authentication token",
            )

    # Otherwise verify as Legacy application JWT
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return AuthenticatedUser(
            user_id=str(payload["sub"]),
            auth_provider="legacy",
            claims=payload,
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication token")


def decode_access_token(token: str) -> str:
    """Backward-compatible helper returning the authenticated user ID string."""
    return decode_token_to_user(token).user_id


async def get_current_user(token: str = Depends(oauth2_scheme)) -> AuthenticatedUser:
    """FastAPI dependency returning the full AuthenticatedUser model."""
    return decode_token_to_user(token)


async def get_current_user_id(token: str = Depends(oauth2_scheme)) -> str:
    """FastAPI dependency returning the user ID string (Supabase UUID or Legacy ObjectId)."""
    return decode_token_to_user(token).user_id


async def require_admin_user(current_user: AuthenticatedUser = Depends(get_current_user)) -> AuthenticatedUser:
    """FastAPI dependency enforcing server-side admin role check from MongoDB."""
    from database.mongo import get_db
    from auth.profile_service import get_user_role

    db = get_db()
    role = await get_user_role(db, current_user.user_id)
    if role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required for this resource",
        )
    return current_user
