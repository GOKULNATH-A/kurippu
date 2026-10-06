import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import (
    Column, String, DateTime, Boolean, Text, Float, Integer,
    ForeignKey, Enum as SAEnum, JSON
)
from sqlalchemy.orm import relationship, DeclarativeBase
import enum


class Base(DeclarativeBase):
    pass


class DocumentStatus(str, enum.Enum):
    UPLOADING = "uploading"
    PROCESSING = "processing"
    ANALYZING = "analyzing"
    EXTRACTING = "extracting"
    COMPLETED = "completed"
    FAILED = "failed"


class ActionStatus(str, enum.Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class ActionPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class NotificationType(str, enum.Enum):
    INFO = "info"
    REMINDER = "reminder"
    OVERDUE = "overdue"
    SUCCESS = "success"


class AuditAction(str, enum.Enum):
    DOCUMENT_UPLOADED = "document_uploaded"
    DOCUMENT_PROCESSED = "document_processed"
    AI_EXTRACTION_GENERATED = "ai_extraction_generated"
    ACTION_SUGGESTED = "action_suggested"
    ACTION_CONFIRMED = "action_confirmed"
    ACTION_EDITED = "action_edited"
    ACTION_IGNORED = "action_ignored"
    ACTION_COMPLETED = "action_completed"
    USER_REGISTERED = "user_registered"
    USER_LOGGED_IN = "user_logged_in"


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Settings
    ai_provider = Column(String(50), default="mock")
    ai_model = Column(String(100), default="gpt-4o-mini")
    notification_enabled = Column(Boolean, default=True)

    # Relationships
    documents = relationship("Document", back_populates="user", cascade="all, delete-orphan")
    actions = relationship("Action", back_populates="user", cascade="all, delete-orphan")
    reminders = relationship("Reminder", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user", cascade="all, delete-orphan")
    tags = relationship("Tag", back_populates="user", cascade="all, delete-orphan")


class Document(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    filename = Column(String(500), nullable=False)
    original_filename = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=False)
    mime_type = Column(String(100), nullable=False)
    storage_path = Column(String(1000), nullable=False)
    status = Column(SAEnum(DocumentStatus), default=DocumentStatus.UPLOADING)
    error_message = Column(Text, nullable=True)
    page_count = Column(Integer, nullable=True)
    word_count = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    processed_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", back_populates="documents")
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")
    extractions = relationship("AIExtraction", back_populates="document", cascade="all, delete-orphan")
    actions = relationship("Action", back_populates="source_document")
    events = relationship("Event", back_populates="document", cascade="all, delete-orphan")
    document_tags = relationship("DocumentTag", back_populates="document", cascade="all, delete-orphan")


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String, ForeignKey("documents.id"), nullable=False, index=True)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    page_number = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    document = relationship("Document", back_populates="chunks")


class AIExtraction(Base):
    __tablename__ = "ai_extractions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String, ForeignKey("documents.id"), nullable=False, index=True)
    summary = Column(Text, nullable=True)
    key_points = Column(JSON, default=list)
    actions_raw = Column(JSON, default=list)
    events_raw = Column(JSON, default=list)
    people = Column(JSON, default=list)
    decisions = Column(JSON, default=list)
    requirements = Column(JSON, default=list)
    important_dates = Column(JSON, default=list)
    ai_provider = Column(String(50), nullable=True)
    ai_model = Column(String(100), nullable=True)
    confidence_score = Column(Float, nullable=True)
    raw_response = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    document = relationship("Document", back_populates="extractions")


class Action(Base):
    __tablename__ = "actions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    document_id = Column(String, ForeignKey("documents.id"), nullable=True, index=True)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(SAEnum(ActionStatus), default=ActionStatus.TODO)
    priority = Column(SAEnum(ActionPriority), default=ActionPriority.MEDIUM)
    due_date = Column(String(20), nullable=True)  # ISO date string
    due_time = Column(String(10), nullable=True)  # HH:MM
    assignee = Column(String(255), nullable=True)
    confidence = Column(Float, nullable=True)
    evidence = Column(Text, nullable=True)  # Source sentence
    evidence_page = Column(Integer, nullable=True)
    is_ai_suggested = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="actions")
    source_document = relationship("Document", back_populates="actions")
    reminders = relationship("Reminder", back_populates="action", cascade="all, delete-orphan")
    action_tags = relationship("ActionTag", back_populates="action", cascade="all, delete-orphan")


class Event(Base):
    __tablename__ = "events"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    document_id = Column(String, ForeignKey("documents.id"), nullable=True)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    event_date = Column(String(20), nullable=False)
    event_time = Column(String(10), nullable=True)
    location = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    document = relationship("Document", back_populates="events")


class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    action_id = Column(String, ForeignKey("actions.id"), nullable=True)
    title = Column(String(500), nullable=False)
    message = Column(Text, nullable=True)
    remind_at = Column(String(30), nullable=False)  # ISO datetime
    is_sent = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="reminders")
    action = relationship("Action", back_populates="reminders")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    type = Column(SAEnum(NotificationType), default=NotificationType.INFO)
    title = Column(String(500), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    link = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")


class Tag(Base):
    __tablename__ = "tags"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    color = Column(String(20), default="#6366f1")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="tags")
    document_tags = relationship("DocumentTag", back_populates="tag", cascade="all, delete-orphan")
    action_tags = relationship("ActionTag", back_populates="tag", cascade="all, delete-orphan")


class DocumentTag(Base):
    __tablename__ = "document_tags"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String, ForeignKey("documents.id"), nullable=False)
    tag_id = Column(String, ForeignKey("tags.id"), nullable=False)

    document = relationship("Document", back_populates="document_tags")
    tag = relationship("Tag", back_populates="document_tags")


class ActionTag(Base):
    __tablename__ = "action_tags"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    action_id = Column(String, ForeignKey("actions.id"), nullable=False)
    tag_id = Column(String, ForeignKey("tags.id"), nullable=False)

    action = relationship("Action", back_populates="action_tags")
    tag = relationship("Tag", back_populates="action_tags")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=True, index=True)
    action = Column(SAEnum(AuditAction), nullable=False)
    entity_type = Column(String(50), nullable=True)
    entity_id = Column(String, nullable=True)
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="audit_logs")
