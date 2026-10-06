import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import User, AuditLog, AuditAction
from app.schemas import RegisterRequest, LoginRequest, TokenResponse, UserOut
from app.auth import verify_password, hash_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    # Check if email already exists
    existing = await db.execute(select(User).where(User.email == req.email.lower()))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email is already registered")

    user_id = str(uuid.uuid4())
    user = User(
        id=user_id,
        name=req.name.strip(),
        email=req.email.lower().strip(),
        hashed_password=hash_password(req.password),
        is_demo=False,
    )
    db.add(user)

    # Log audit
    audit = AuditLog(
        id=str(uuid.uuid4()),
        user_id=user.id,
        action=AuditAction.USER_REGISTERED,
        entity_type="user",
        entity_id=user.id,
        details={"email": user.email},
    )
    db.add(audit)

    await db.commit()
    await db.refresh(user)

    token = create_access_token({"sub": user.id, "email": user.email})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserOut.model_validate(user),
    )


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.email.lower().strip()))
    user = result.scalar_one_or_none()

    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is deactivated")

    # Audit log
    audit = AuditLog(
        id=str(uuid.uuid4()),
        user_id=user.id,
        action=AuditAction.USER_LOGGED_IN,
        entity_type="user",
        entity_id=user.id,
    )
    db.add(audit)
    await db.commit()

    token = create_access_token({"sub": user.id, "email": user.email})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserOut.model_validate(user),
    )


@router.post("/demo-login", response_model=TokenResponse)
async def demo_login(db: AsyncSession = Depends(get_db)):
    """One-click instant login into demo account with pre-seeded data."""
    result = await db.execute(select(User).where(User.email == "demo@kurippu.ai"))
    user = result.scalar_one_or_none()

    if not user:
        # Create demo user on the fly if not exists
        user_id = str(uuid.uuid4())
        user = User(
            id=user_id,
            name="Alex Morgan",
            email="demo@kurippu.ai",
            hashed_password=hash_password("DemoPassword123!"),
            is_demo=True,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    token = create_access_token({"sub": user.id, "email": user.email})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserOut.model_validate(user),
    )


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserOut.model_validate(current_user)


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    return {"message": "Logged out successfully"}
