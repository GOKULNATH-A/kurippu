from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List, Any
from datetime import datetime
from app.models import DocumentStatus, ActionStatus, ActionPriority, NotificationType


# ── Auth ──────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    confirm_password: str

    @field_validator("password")
    @classmethod
    def password_strength(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v, info):
        if "password" in info.data and v != info.data["password"]:
            raise ValueError("Passwords do not match")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    is_demo: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    name: Optional[str] = None
    notification_enabled: Optional[bool] = None
    ai_provider: Optional[str] = None
    ai_model: Optional[str] = None


# ── Document ──────────────────────────────────────────────────────────────────

class DocumentOut(BaseModel):
    id: str
    filename: str
    original_filename: str
    file_size: int
    mime_type: str
    status: DocumentStatus
    error_message: Optional[str] = None
    page_count: Optional[int] = None
    word_count: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    processed_at: Optional[datetime] = None
    tags: List[str] = []

    class Config:
        from_attributes = True


class DocumentListResponse(BaseModel):
    documents: List[DocumentOut]
    total: int
    page: int
    page_size: int


# ── AI Extraction ─────────────────────────────────────────────────────────────

class ExtractedAction(BaseModel):
    title: str
    description: Optional[str] = None
    deadline: Optional[str] = None
    deadline_time: Optional[str] = None
    priority: str = "medium"
    assignee: Optional[str] = None
    confidence: float = 0.8
    evidence: Optional[str] = None
    evidence_page: Optional[int] = None


class ExtractedEvent(BaseModel):
    title: str
    description: Optional[str] = None
    event_date: Optional[str] = None
    event_time: Optional[str] = None
    location: Optional[str] = None


class ExtractionOut(BaseModel):
    id: str
    document_id: str
    summary: Optional[str] = None
    key_points: List[str] = []
    actions_raw: List[dict] = []
    events_raw: List[dict] = []
    people: List[str] = []
    decisions: List[str] = []
    requirements: List[str] = []
    important_dates: List[dict] = []
    ai_provider: Optional[str] = None
    ai_model: Optional[str] = None
    confidence_score: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ── Action ────────────────────────────────────────────────────────────────────

class ActionCreate(BaseModel):
    title: str
    description: Optional[str] = None
    priority: ActionPriority = ActionPriority.MEDIUM
    due_date: Optional[str] = None
    due_time: Optional[str] = None
    assignee: Optional[str] = None
    document_id: Optional[str] = None
    confidence: Optional[float] = None
    evidence: Optional[str] = None
    evidence_page: Optional[int] = None
    is_ai_suggested: bool = False


class ActionUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[ActionStatus] = None
    priority: Optional[ActionPriority] = None
    due_date: Optional[str] = None
    due_time: Optional[str] = None
    assignee: Optional[str] = None


class ActionOut(BaseModel):
    id: str
    user_id: str
    document_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    status: ActionStatus
    priority: ActionPriority
    due_date: Optional[str] = None
    due_time: Optional[str] = None
    assignee: Optional[str] = None
    confidence: Optional[float] = None
    evidence: Optional[str] = None
    evidence_page: Optional[int] = None
    is_ai_suggested: bool
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None
    source_document_name: Optional[str] = None

    class Config:
        from_attributes = True


class BulkConfirmRequest(BaseModel):
    document_id: str
    selected_action_indices: List[int]  # indices into actions_raw


# ── Event ─────────────────────────────────────────────────────────────────────

class EventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    event_date: str
    event_time: Optional[str] = None
    location: Optional[str] = None
    document_id: Optional[str] = None


class EventOut(BaseModel):
    id: str
    user_id: str
    document_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    event_date: str
    event_time: Optional[str] = None
    location: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ── Reminder ──────────────────────────────────────────────────────────────────

class ReminderCreate(BaseModel):
    title: str
    message: Optional[str] = None
    remind_at: str
    action_id: Optional[str] = None


class ReminderOut(BaseModel):
    id: str
    user_id: str
    action_id: Optional[str] = None
    title: str
    message: Optional[str] = None
    remind_at: str
    is_sent: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ── Notification ──────────────────────────────────────────────────────────────

class NotificationOut(BaseModel):
    id: str
    type: NotificationType
    title: str
    message: str
    is_read: bool
    link: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ── Tag ───────────────────────────────────────────────────────────────────────

class TagCreate(BaseModel):
    name: str
    color: str = "#6366f1"


class TagOut(BaseModel):
    id: str
    name: str
    color: str
    created_at: datetime

    class Config:
        from_attributes = True


# ── Search ────────────────────────────────────────────────────────────────────

class SearchResult(BaseModel):
    documents: List[DocumentOut] = []
    actions: List[ActionOut] = []
    total: int


# ── Analytics ─────────────────────────────────────────────────────────────────

class AnalyticsOut(BaseModel):
    total_documents: int
    total_actions: int
    completed_actions: int
    pending_actions: int
    overdue_actions: int
    completion_rate: float
    documents_per_week: List[dict]
    actions_per_week: List[dict]
    priority_distribution: dict
    actions_by_status: dict
