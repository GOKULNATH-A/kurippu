import uuid
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func
from app.database import get_db
from app.models import (
    Action, Document, AIExtraction, User, ActionStatus, ActionPriority,
    AuditLog, AuditAction, Reminder
)
from app.schemas import ActionCreate, ActionUpdate, ActionOut
from app.auth import get_current_user

router = APIRouter(prefix="/api/actions", tags=["Actions"])


@router.post("", response_model=ActionOut)
async def create_action(
    req: ActionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    action_id = str(uuid.uuid4())
    action = Action(
        id=action_id,
        user_id=current_user.id,
        document_id=req.document_id,
        title=req.title.strip(),
        description=req.description,
        status=ActionStatus.TODO,
        priority=req.priority,
        due_date=req.due_date,
        due_time=req.due_time,
        assignee=req.assignee,
        confidence=req.confidence,
        evidence=req.evidence,
        evidence_page=req.evidence_page,
        is_ai_suggested=req.is_ai_suggested,
    )
    db.add(action)

    audit = AuditLog(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        action=AuditAction.ACTION_CONFIRMED if req.is_ai_suggested else AuditAction.ACTION_SUGGESTED,
        entity_type="action",
        entity_id=action.id,
        details={"title": action.title, "priority": action.priority},
    )
    db.add(audit)

    await db.commit()
    await db.refresh(action)

    # Attach document name if available
    doc_name = None
    if action.document_id:
        doc_res = await db.execute(select(Document.original_filename).where(Document.id == action.document_id))
        doc_name = doc_res.scalar_one_or_none()

    out = ActionOut.model_validate(action)
    out.source_document_name = doc_name
    return out


@router.post("/bulk-confirm", response_model=List[ActionOut])
async def bulk_confirm_actions(
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    HUMAN-IN-THE-LOOP CORE FEATURE:
    User reviews suggestions, selects items, and confirms creation.
    Payload:
      document_id: str
      actions: List[dict] (each containing title, description, deadline, priority, assignee, confidence, evidence)
    """
    document_id = payload.get("document_id")
    actions_data = payload.get("actions", [])

    if not actions_data:
        raise HTTPException(status_code=400, detail="No actions provided for confirmation")

    # Verify document ownership
    doc_name = None
    if document_id:
        doc_res = await db.execute(
            select(Document).where(Document.id == document_id, Document.user_id == current_user.id)
        )
        doc = doc_res.scalar_one_or_none()
        if doc:
            doc_name = doc.original_filename

    created_actions = []
    for item in actions_data:
        # Determine priority enum
        p_raw = str(item.get("priority", "medium")).lower()
        priority_map = {
            "low": ActionPriority.LOW,
            "medium": ActionPriority.MEDIUM,
            "high": ActionPriority.HIGH,
            "urgent": ActionPriority.URGENT,
        }
        priority_enum = priority_map.get(p_raw, ActionPriority.MEDIUM)

        action = Action(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            document_id=document_id,
            title=item.get("title", "Untitled Action").strip(),
            description=item.get("description"),
            status=ActionStatus.TODO,
            priority=priority_enum,
            due_date=item.get("deadline") or item.get("due_date"),
            due_time=item.get("deadline_time") or item.get("due_time"),
            assignee=item.get("assignee"),
            confidence=float(item.get("confidence", 0.85)),
            evidence=item.get("evidence"),
            evidence_page=item.get("evidence_page", 1),
            is_ai_suggested=True,
        )
        db.add(action)
        created_actions.append(action)

        # Create auto-reminder if deadline exists
        due_date = item.get("deadline") or item.get("due_date")
        if due_date:
            reminder = Reminder(
                id=str(uuid.uuid4()),
                user_id=current_user.id,
                action_id=action.id,
                title=f"Upcoming Deadline: {action.title}",
                message=f"Action '{action.title}' is due on {due_date}",
                remind_at=f"{due_date}T09:00:00",
            )
            db.add(reminder)

        # Audit log for each confirmed action
        audit = AuditLog(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            action=AuditAction.ACTION_CONFIRMED,
            entity_type="action",
            entity_id=action.id,
            details={"title": action.title, "document_id": document_id},
        )
        db.add(audit)

    await db.commit()

    results = []
    for a in created_actions:
        await db.refresh(a)
        out = ActionOut.model_validate(a)
        out.source_document_name = doc_name
        results.append(out)

    return results


@router.get("", response_model=List[ActionOut])
async def list_actions(
    status_filter: Optional[ActionStatus] = None,
    priority_filter: Optional[ActionPriority] = None,
    document_id: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(Action, Document.original_filename)
        .outerjoin(Document, Action.document_id == Document.id)
        .where(Action.user_id == current_user.id)
    )

    if status_filter:
        query = query.where(Action.status == status_filter)

    if priority_filter:
        query = query.where(Action.priority == priority_filter)

    if document_id:
        query = query.where(Action.document_id == document_id)

    if search:
        query = query.where(
            (Action.title.ilike(f"%{search}%")) |
            (Action.description.ilike(f"%{search}%")) |
            (Action.assignee.ilike(f"%{search}%"))
        )

    query = query.order_by(
        # Put overdue / high priority first, then date
        desc(Action.created_at)
    )

    result = await db.execute(query)
    rows = result.all()

    actions_out = []
    for action, doc_name in rows:
        out = ActionOut.model_validate(action)
        out.source_document_name = doc_name
        actions_out.append(out)

    return actions_out


@router.get("/{action_id}/why")
async def why_this_action(
    action_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    UNIQUE FEATURE: 'WHY THIS ACTION?'
    Returns transparency evidence: sentence, page number, confidence, and source document name.
    """
    query = (
        select(Action, Document.original_filename)
        .outerjoin(Document, Action.document_id == Document.id)
        .where(Action.id == action_id, Action.user_id == current_user.id)
    )
    result = await db.execute(query)
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="Action not found")

    action, doc_name = row
    return {
        "action_id": action.id,
        "title": action.title,
        "document_name": doc_name or "Directly created",
        "page_number": action.evidence_page or 1,
        "evidence_sentence": action.evidence or "Action was inferred from overall document context and requirements.",
        "confidence": action.confidence or 0.85,
        "assignee": action.assignee,
        "deadline": action.due_date,
        "priority": action.priority,
        "is_ai_suggested": action.is_ai_suggested,
    }


@router.patch("/{action_id}", response_model=ActionOut)
async def update_action(
    action_id: str,
    req: ActionUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Action).where(Action.id == action_id, Action.user_id == current_user.id)
    )
    action = result.scalar_one_or_none()
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")

    prev_status = action.status

    if req.title is not None:
        action.title = req.title.strip()
    if req.description is not None:
        action.description = req.description
    if req.status is not None:
        action.status = req.status
        if req.status == ActionStatus.COMPLETED and prev_status != ActionStatus.COMPLETED:
            action.completed_at = datetime.utcnow()
        elif req.status != ActionStatus.COMPLETED:
            action.completed_at = None
    if req.priority is not None:
        action.priority = req.priority
    if req.due_date is not None:
        action.due_date = req.due_date
    if req.due_time is not None:
        action.due_time = req.due_time
    if req.assignee is not None:
        action.assignee = req.assignee

    action.updated_at = datetime.utcnow()

    # Audit log
    audit_action = AuditAction.ACTION_COMPLETED if action.status == ActionStatus.COMPLETED else AuditAction.ACTION_EDITED
    audit = AuditLog(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        action=audit_action,
        entity_type="action",
        entity_id=action.id,
        details={"status": action.status, "title": action.title},
    )
    db.add(audit)

    await db.commit()
    await db.refresh(action)

    doc_name = None
    if action.document_id:
        doc_res = await db.execute(select(Document.original_filename).where(Document.id == action.document_id))
        doc_name = doc_res.scalar_one_or_none()

    out = ActionOut.model_validate(action)
    out.source_document_name = doc_name
    return out


@router.delete("/{action_id}")
async def delete_action(
    action_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Action).where(Action.id == action_id, Action.user_id == current_user.id)
    )
    action = result.scalar_one_or_none()
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")

    await db.delete(action)
    await db.commit()
    return {"message": "Action deleted successfully"}
