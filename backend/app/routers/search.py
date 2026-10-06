from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.database import get_db
from app.models import Document, Action, User
from app.schemas import SearchResult, DocumentOut, ActionOut
from app.auth import get_current_user

router = APIRouter(prefix="/api/search", tags=["Search"])


@router.get("", response_model=SearchResult)
async def global_search(
    q: str = Query(..., min_length=1),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query_term = f"%{q.strip()}%"

    # Search documents
    doc_res = await db.execute(
        select(Document)
        .where(
            Document.user_id == current_user.id,
            Document.original_filename.ilike(query_term),
        )
        .limit(20)
    )
    docs = doc_res.scalars().all()

    # Search actions
    act_res = await db.execute(
        select(Action, Document.original_filename)
        .outerjoin(Document, Action.document_id == Document.id)
        .where(
            Action.user_id == current_user.id,
            or_(
                Action.title.ilike(query_term),
                Action.description.ilike(query_term),
                Action.assignee.ilike(query_term),
                Action.due_date.ilike(query_term),
            )
        )
        .limit(30)
    )
    actions_rows = act_res.all()

    actions_out = []
    for action, doc_name in actions_rows:
        out = ActionOut.model_validate(action)
        out.source_document_name = doc_name
        actions_out.append(out)

    return SearchResult(
        documents=[DocumentOut.model_validate(d) for d in docs],
        actions=actions_out,
        total=len(docs) + len(actions_out),
    )
