import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.database import get_db
from app.models import User, Notification, AuditLog, Document, Action, Event, Reminder
from app.schemas import UserOut, UserUpdate, NotificationOut
from app.auth import get_current_user

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("/profile", response_model=UserOut)
async def get_profile(current_user: User = Depends(get_current_user)):
    return UserOut.model_validate(current_user)


@router.patch("/profile", response_model=UserOut)
async def update_profile(
    req: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if req.name is not None:
        current_user.name = req.name.strip()
    if req.notification_enabled is not None:
        current_user.notification_enabled = req.notification_enabled
    if req.ai_provider is not None:
        current_user.ai_provider = req.ai_provider
    if req.ai_model is not None:
        current_user.ai_model = req.ai_model

    await db.commit()
    await db.refresh(current_user)
    return UserOut.model_validate(current_user)


@router.get("/notifications", response_model=List[NotificationOut])
async def get_notifications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .order_by(desc(Notification.created_at))
        .limit(50)
    )
    notifs = result.scalars().all()
    return [NotificationOut.model_validate(n) for n in notifs]


@router.patch("/notifications/{notif_id}/read")
async def mark_notification_read(
    notif_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(Notification).where(Notification.id == notif_id, Notification.user_id == current_user.id)
    )
    n = res.scalar_one_or_none()
    if n:
        n.is_read = True
        await db.commit()
    return {"status": "ok"}


@router.get("/audit-logs")
async def get_audit_logs(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """View traceability of all AI suggestions and user decisions."""
    result = await db.execute(
        select(AuditLog)
        .where(AuditLog.user_id == current_user.id)
        .order_by(desc(AuditLog.created_at))
        .limit(100)
    )
    logs = result.scalars().all()
    return [
        {
            "id": log.id,
            "action": log.action,
            "entity_type": log.entity_type,
            "entity_id": log.entity_id,
            "details": log.details,
            "created_at": log.created_at.isoformat() if log.created_at else None,
        }
        for log in logs
    ]


@router.post("/export")
async def export_user_data(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Export all user data as structured JSON (GDPR / Data Portability)."""
    # Documents
    doc_res = await db.execute(select(Document).where(Document.user_id == current_user.id))
    docs = doc_res.scalars().all()

    # Actions
    act_res = await db.execute(select(Action).where(Action.user_id == current_user.id))
    actions = act_res.scalars().all()

    # Events
    ev_res = await db.execute(select(Event).where(Event.user_id == current_user.id))
    events = ev_res.scalars().all()

    # Reminders
    rem_res = await db.execute(select(Reminder).where(Reminder.user_id == current_user.id))
    reminders = rem_res.scalars().all()

    return {
        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "created_at": current_user.created_at.isoformat(),
        },
        "documents": [
            {
                "id": d.id,
                "filename": d.original_filename,
                "created_at": d.created_at.isoformat(),
                "status": d.status,
            }
            for d in docs
        ],
        "actions": [
            {
                "id": a.id,
                "title": a.title,
                "description": a.description,
                "status": a.status,
                "priority": a.priority,
                "due_date": a.due_date,
                "assignee": a.assignee,
                "evidence": a.evidence,
            }
            for a in actions
        ],
        "events": [
            {"id": e.id, "title": e.title, "event_date": e.event_date, "event_time": e.event_time}
            for e in events
        ],
        "reminders": [
            {"id": r.id, "title": r.title, "remind_at": r.remind_at}
            for r in reminders
        ],
    }


@router.delete("/account")
async def delete_account(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Permanently delete user account and all associated documents & actions."""
    await db.delete(current_user)
    await db.commit()
    return {"message": "Account and all associated data permanently deleted"}
