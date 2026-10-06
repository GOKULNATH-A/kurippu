import os
import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func
from app.database import get_db, AsyncSessionLocal
from app.models import (
    Document, DocumentChunk, AIExtraction, Action, User,
    DocumentStatus, AuditLog, AuditAction
)
from app.schemas import DocumentOut, DocumentListResponse, ExtractionOut
from app.auth import get_current_user
from app.storage import get_storage_provider
from app.pipeline import DocumentPipeline
from app.config import settings

router = APIRouter(prefix="/api/documents", tags=["Documents"])

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc", ".txt", ".md", ".png", ".jpg", ".jpeg", ".webp"}


async def _process_in_background(document_id: str, file_bytes: bytes):
    async with AsyncSessionLocal() as session:
        try:
            await DocumentPipeline.process_document(document_id, file_bytes, session)
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Background task failed: {e}")


@router.post("/upload", response_model=DocumentOut)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Validate extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Supported: PDF, DOCX, TXT, PNG, JPG, JPEG",
        )

    # Read bytes
    file_bytes = await file.read()
    if len(file_bytes) > settings.max_upload_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds maximum upload size of {settings.MAX_UPLOAD_SIZE_MB}MB",
        )

    # Unique stored filename
    doc_id = str(uuid.uuid4())
    stored_name = f"{doc_id}_{file.filename}"

    # Save to storage
    storage = get_storage_provider()
    storage_path = await storage.save(file_bytes, stored_name, current_user.id)

    # Create document record
    doc = Document(
        id=doc_id,
        user_id=current_user.id,
        filename=stored_name,
        original_filename=file.filename,
        file_size=len(file_bytes),
        mime_type=file.content_type or "application/octet-stream",
        storage_path=storage_path,
        status=DocumentStatus.UPLOADING,
    )
    db.add(doc)

    # Audit log
    audit = AuditLog(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        action=AuditAction.DOCUMENT_UPLOADED,
        entity_type="document",
        entity_id=doc.id,
        details={"filename": file.filename, "size": len(file_bytes)},
    )
    db.add(audit)
    await db.commit()
    await db.refresh(doc)

    # Process document right away in background task
    background_tasks.add_task(_process_in_background, doc.id, file_bytes)

    return DocumentOut.model_validate(doc)


@router.get("", response_model=DocumentListResponse)
async def list_documents(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    status_filter: Optional[DocumentStatus] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Document).where(Document.user_id == current_user.id)

    if status_filter:
        query = query.where(Document.status == status_filter)

    if search:
        query = query.where(Document.original_filename.ilike(f"%{search}%"))

    # Total count
    count_query = select(func.count()).select_from(query.subquery())
    total_res = await db.execute(count_query)
    total = total_res.scalar_one()

    # Pagination
    query = query.order_by(desc(Document.created_at)).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    documents = result.scalars().all()

    return DocumentListResponse(
        documents=[DocumentOut.model_validate(d) for d in documents],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{document_id}")
async def get_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Document).where(Document.id == document_id, Document.user_id == current_user.id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Get chunks
    chunk_res = await db.execute(
        select(DocumentChunk).where(DocumentChunk.document_id == document_id).order_by(DocumentChunk.chunk_index)
    )
    chunks = chunk_res.scalars().all()

    # Get extraction
    ext_res = await db.execute(
        select(AIExtraction).where(AIExtraction.document_id == document_id).order_by(desc(AIExtraction.created_at))
    )
    extraction = ext_res.scalar_one_or_none()

    # Get associated actions
    action_res = await db.execute(
        select(Action).where(Action.document_id == document_id)
    )
    actions = action_res.scalars().all()

    return {
        "document": DocumentOut.model_validate(doc),
        "chunks": [{"page": c.page_number, "content": c.content} for c in chunks],
        "extraction": ExtractionOut.model_validate(extraction) if extraction else None,
        "actions_count": len(actions),
        "actions": [{
            "id": a.id,
            "title": a.title,
            "status": a.status,
            "priority": a.priority,
            "due_date": a.due_date,
            "assignee": a.assignee,
            "confidence": a.confidence,
        } for a in actions],
    }


@router.get("/{document_id}/extractions", response_model=Optional[ExtractionOut])
async def get_extractions(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Verify ownership
    doc_res = await db.execute(
        select(Document).where(Document.id == document_id, Document.user_id == current_user.id)
    )
    if not doc_res.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Document not found")

    ext_res = await db.execute(
        select(AIExtraction).where(AIExtraction.document_id == document_id).order_by(desc(AIExtraction.created_at))
    )
    extraction = ext_res.scalar_one_or_none()
    return ExtractionOut.model_validate(extraction) if extraction else None


@router.get("/{document_id}/timeline")
async def get_document_timeline(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Document -> Action lifecycle timeline."""
    doc_res = await db.execute(
        select(Document).where(Document.id == document_id, Document.user_id == current_user.id)
    )
    doc = doc_res.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    ext_res = await db.execute(
        select(AIExtraction).where(AIExtraction.document_id == document_id)
    )
    extraction = ext_res.scalar_one_or_none()

    act_res = await db.execute(
        select(Action).where(Action.document_id == document_id)
    )
    actions = act_res.scalars().all()

    timeline = [
        {
            "step": "uploaded",
            "title": "Document Uploaded",
            "timestamp": doc.created_at.isoformat(),
            "status": "completed",
            "details": f"{doc.original_filename} ({round(doc.file_size / 1024, 1)} KB)",
        },
        {
            "step": "analyzed",
            "title": "Document Analyzed",
            "timestamp": doc.processed_at.isoformat() if doc.processed_at else None,
            "status": "completed" if doc.processed_at else ("in_progress" if doc.status != DocumentStatus.FAILED else "failed"),
            "details": f"{doc.page_count or 1} pages parsed, {doc.word_count or 0} words",
        },
        {
            "step": "actions_detected",
            "title": "Actions Detected",
            "timestamp": extraction.created_at.isoformat() if extraction else None,
            "status": "completed" if extraction else "pending",
            "details": f"{len(extraction.actions_raw) if extraction else 0} potential actions found by AI",
        },
        {
            "step": "actions_confirmed",
            "title": "Actions Confirmed",
            "timestamp": actions[0].created_at.isoformat() if actions else None,
            "status": "completed" if actions else "pending",
            "details": f"{len(actions)} actions confirmed by user",
        },
        {
            "step": "completed",
            "title": "Tasks Completed",
            "timestamp": None,
            "status": "completed" if any(a.status == "completed" for a in actions) else "pending",
            "details": f"{len([a for a in actions if a.status == 'completed'])} / {len(actions)} completed",
        }
    ]

    return {"document_id": document_id, "timeline": timeline}


@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Document).where(Document.id == document_id, Document.user_id == current_user.id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Delete from storage
    storage = get_storage_provider()
    await storage.delete(doc.storage_path)

    # Delete record (cascades chunks and extractions)
    await db.delete(doc)
    await db.commit()

    return {"message": "Document deleted successfully"}
