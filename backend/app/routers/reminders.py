import uuid
from datetime import datetime, date, timedelta
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.database import get_db
from app.models import Reminder, Action, User
from app.schemas import ReminderCreate, ReminderOut
from app.auth import get_current_user

router = APIRouter(prefix="/api/reminders", tags=["Reminders"])


@router.get("", response_model=List[ReminderOut])
async def list_reminders(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(Reminder)
        .where(Reminder.user_id == current_user.id)
        .order_by(Reminder.remind_at)
    )
    result = await db.execute(query)
    reminders = result.scalars().all()
    return [ReminderOut.model_validate(r) for r in reminders]


@router.post("", response_model=ReminderOut)
async def create_reminder(
    req: ReminderCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    reminder = Reminder(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        action_id=req.action_id,
        title=req.title.strip(),
        message=req.message,
        remind_at=req.remind_at,
    )
    db.add(reminder)
    await db.commit()
    await db.refresh(reminder)
    return ReminderOut.model_validate(reminder)


@router.delete("/{reminder_id}")
async def delete_reminder(
    reminder_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Reminder).where(Reminder.id == reminder_id, Reminder.user_id == current_user.id)
    )
    rem = result.scalar_one_or_none()
    if not rem:
        raise HTTPException(status_code=404, detail="Reminder not found")

    await db.delete(rem)
    await db.commit()
    return {"message": "Reminder deleted"}
