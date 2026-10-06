import uuid
import logging
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models import (
    Document, DocumentChunk, AIExtraction, DocumentStatus,
    AuditLog, AuditAction, Notification, NotificationType
)
from app.extractor import TextExtractor
from app.ai_provider import safe_extract

logger = logging.getLogger(__name__)


class DocumentPipeline:
    """End-to-end document processing pipeline."""

    @classmethod
    async def process_document(
        cls,
        document_id: str,
        file_bytes: bytes,
        db: AsyncSession
    ) -> bool:
        # Fetch document
        result = await db.execute(select(Document).where(Document.id == document_id))
        doc = result.scalar_one_or_none()
        if not doc:
            logger.error(f"Document {document_id} not found in pipeline")
            return False

        try:
            # 1. Status -> PROCESSING
            doc.status = DocumentStatus.PROCESSING
            await db.commit()

            # 2. Extract text & pages
            extracted = await TextExtractor.extract(file_bytes, doc.filename, doc.mime_type)
            doc.page_count = extracted["page_count"]
            doc.word_count = extracted["word_count"]
            full_text = extracted["full_text"]

            # 3. Status -> ANALYZING (save chunks)
            doc.status = DocumentStatus.ANALYZING
            await db.commit()

            # Create document chunks for search & citation
            for page in extracted["pages"]:
                chunk = DocumentChunk(
                    id=str(uuid.uuid4()),
                    document_id=doc.id,
                    chunk_index=page["page"],
                    content=page["text"][:5000],  # cap per chunk
                    page_number=page["page"]
                )
                db.add(chunk)
            await db.commit()

            # 4. Status -> EXTRACTING (Run AI analysis)
            doc.status = DocumentStatus.EXTRACTING
            await db.commit()

            # Run safe AI extraction (uses OpenAI if key provided, else mock)
            ai_data, provider_name, model_name = await safe_extract(full_text)

            # Calculate average confidence
            actions_list = ai_data.get("actions", [])
            avg_conf = 0.85
            if actions_list:
                confidences = [a.get("confidence", 0.8) for a in actions_list if isinstance(a, dict)]
                if confidences:
                    avg_conf = round(sum(confidences) / len(confidences), 2)

            # 5. Save AI Extraction results
            extraction = AIExtraction(
                id=str(uuid.uuid4()),
                document_id=doc.id,
                summary=ai_data.get("summary", ""),
                key_points=ai_data.get("key_points", []),
                actions_raw=actions_list,
                events_raw=ai_data.get("events", []),
                people=ai_data.get("people", []),
                decisions=ai_data.get("decisions", []),
                requirements=ai_data.get("requirements", []),
                important_dates=ai_data.get("important_dates", []),
                ai_provider=provider_name,
                ai_model=model_name,
                confidence_score=avg_conf,
            )
            db.add(extraction)

            # 6. Status -> COMPLETED
            doc.status = DocumentStatus.COMPLETED
            doc.processed_at = datetime.utcnow()

            # 7. Audit Log
            audit = AuditLog(
                id=str(uuid.uuid4()),
                user_id=doc.user_id,
                action=AuditAction.DOCUMENT_PROCESSED,
                entity_type="document",
                entity_id=doc.id,
                details={
                    "filename": doc.original_filename,
                    "pages": doc.page_count,
                    "actions_found": len(actions_list),
                    "provider": provider_name,
                }
            )
            db.add(audit)

            # 8. Create Notification for user
            notif = Notification(
                id=str(uuid.uuid4()),
                user_id=doc.user_id,
                type=NotificationType.SUCCESS,
                title="Document Processed",
                message=f"'{doc.original_filename}' has been analyzed. {len(actions_list)} actionable items detected.",
                link=f"/documents/{doc.id}",
            )
            db.add(notif)

            await db.commit()
            logger.info(f"Document {doc.id} processed successfully. {len(actions_list)} actions detected.")
            return True

        except Exception as e:
            logger.error(f"Pipeline error processing document {document_id}: {e}", exc_info=True)
            doc.status = DocumentStatus.FAILED
            doc.error_message = str(e)
            await db.commit()
            return False
