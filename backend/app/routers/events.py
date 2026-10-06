import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import Event, User
from app.schemas import EventCreate, EventOut
from app.auth import get_current_user

router = APIRouter(prefix="/api/events", tags=["Events"])


@router.get("", response_model=List[EventOut])
async def list_events(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Event).where(Event.user_id == current_user.id).order_by(Event.event_date)
    )
    events = result.scalars().all()
    return [EventOut.model_validate(e) for e in events]


@router.post("", response_model=EventOut)
async def create_event(
    req: EventCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    ev = Event(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        document_id=req.document_id,
        title=req.title.strip(),
        description=req.description,
        event_date=req.event_date,
        event_time=req.event_time,
        location=req.location,
    )
    db.add(ev)
    await db.commit()
    await db.refresh(ev)
    return EventOut.model_validate(ev)


@router.delete("/{event_id}")
async def delete_event(
    event_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(Event).where(Event.id == event_id, Event.user_id == current_user.id)
    )
    ev = res.scalar_one_or_none()
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")
    await db.delete(ev)
    await db.commit()
    return {"message": "Event deleted"}
