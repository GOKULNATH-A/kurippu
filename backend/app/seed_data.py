import uuid
from datetime import datetime, date, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models import (
    User, Document, DocumentChunk, AIExtraction, Action, Event,
    Reminder, Notification, AuditLog, DocumentStatus, ActionStatus,
    ActionPriority, NotificationType, AuditAction
)
from app.auth import hash_password

SAMPLE_GUIDELINES_TEXT = """
COLLEGE OF ENGINEERING & TECHNOLOGY
DEPARTMENT OF COMPUTER SCIENCE
CAPSTONE PROJECT GUIDELINES — ACADEMIC YEAR 2026-2027

1. PROJECT SUBMISSION DEADLINE
All teams must submit the final project report, codebase repository link, and video demonstration by October 15, 2026 at 11:59 PM. Late submissions will incur a 10% penalty per day.

2. TEAM REVIEW & MENTOR MEETING
The mid-term review meeting will be held on October 10, 2026 at 3:00 PM in Conference Room B.
Mentors will evaluate project architecture and current sprint progress.

3. INDIVIDUAL RESPONSIBILITIES
- Sakthi is responsible for preparing the presentation deck and system architecture diagram.
- Alex is assigned to complete the database indexing and API performance benchmarks.
- Priya is required to draft the security assessment documentation and verify GDPR compliance.

4. MANDATORY DELIVERABLES
Each group must submit:
a. Software Requirements Specification (SRS) v2.0
b. User Manual and Installation Guide
c. System Test Report with minimum 80% code coverage
d. Final Presentation Slide Deck (.pptx or .pdf)

5. FINAL DEFENSE & DEMO
The project viva defense session is scheduled for October 22, 2026 at 10:00 AM before the academic evaluation committee.
"""

SAMPLE_CONTRACT_TEXT = """
MUTUAL NON-DISCLOSURE & SERVICE AGREEMENT
Executed on October 1, 2026 between CloudScale Solutions Inc. ("Client") and Apex Dynamics LLC ("Vendor").

1. SCOPE OF SERVICES
Vendor agrees to deliver cloud migration services, containerization with Kubernetes, and enterprise monitoring setup by November 5, 2026.

2. MILESTONE DELIVERABLES & DATES
- Milestone 1: Infrastructure audit and Terraform scripts delivery by October 18, 2026.
- Milestone 2: Staging deployment and validation review on October 28, 2026 at 2:00 PM.
- Milestone 3: Production cutover and handover completion by November 5, 2026.

3. KEY PERSONNEL
- Marcus Vance (Lead Solutions Architect, CloudScale) will oversee sign-off.
- David Chen (Apex Dynamics) will coordinate DevOps pipelines and deployment runs.

4. COMPLIANCE & AUDIT
Client requires annual SOC2 Type II compliance report submission before contract commencement.
"""

SAMPLE_CIRCULAR_TEXT = """
ANNUAL INNOVATION HACKATHON 2026
CIRCULAR NO: CIR-INNO-2026-08

Dear Students and Faculty,
We are excited to announce the Annual Innovation Hackathon 2026.

KEY DATES & ACTIONS:
1. Team Registration Deadline: October 12, 2026 at 6:00 PM via the portal.
2. Problem Statement Release: October 14, 2026 at 9:00 AM.
3. Prototype Submission: October 16, 2026 by 5:00 PM.
4. Grand Finale Jury Evaluation: October 17, 2026 starting at 10:00 AM in the Auditorium.

Team leads must verify student ID credentials and submit prototype pitch video under 3 minutes.
Contact Dr. R. Sundaram (Convener) for queries regarding themes.
"""


async def seed_database_if_empty(db: AsyncSession):
    # Check if demo user exists
    user_res = await db.execute(select(User).where(User.email == "demo@kurippu.ai"))
    demo_user = user_res.scalar_one_or_none()

    if demo_user:
        return  # already seeded

    # Create demo user
    demo_user = User(
        id=str(uuid.uuid4()),
        name="Alex Morgan",
        email="demo@kurippu.ai",
        hashed_password=hash_password("DemoPassword123!"),
        is_demo=True,
    )
    db.add(demo_user)
    await db.flush()

    today = date.today()
    oct10 = (today + timedelta(days=2)).isoformat()
    oct12 = (today + timedelta(days=4)).isoformat()
    oct15 = (today + timedelta(days=7)).isoformat()
    oct18 = (today + timedelta(days=10)).isoformat()
    oct22 = (today + timedelta(days=14)).isoformat()
    oct28 = (today + timedelta(days=20)).isoformat()
    nov05 = (today + timedelta(days=28)).isoformat()

    # Document 1: College Project Guidelines
    doc1_id = str(uuid.uuid4())
    doc1 = Document(
        id=doc1_id,
        user_id=demo_user.id,
        filename=f"{doc1_id}_College_Project_Guidelines.pdf",
        original_filename="College Project Guidelines.pdf",
        file_size=245800,
        mime_type="application/pdf",
        storage_path=f"{demo_user.id}/College_Project_Guidelines.pdf",
        status=DocumentStatus.COMPLETED,
        page_count=3,
        word_count=480,
        created_at=datetime.utcnow() - timedelta(days=2),
        processed_at=datetime.utcnow() - timedelta(days=2),
    )
    db.add(doc1)

    chunk1 = DocumentChunk(
        id=str(uuid.uuid4()),
        document_id=doc1_id,
        chunk_index=1,
        content=SAMPLE_GUIDELINES_TEXT,
        page_number=1,
    )
    db.add(chunk1)

    ext1 = AIExtraction(
        id=str(uuid.uuid4()),
        document_id=doc1_id,
        summary="Capstone Project Guidelines outlining submission requirements, team milestone meetings, and role-based responsibilities for report submission and viva defense.",
        key_points=[
            "All deliverables due on final deadline",
            "Mandatory mid-term mentor review session",
            "Minimum 80% test code coverage required in software test report",
            "Late submissions incur a 10% daily grade penalty",
        ],
        actions_raw=[
            {
                "title": "Prepare Presentation Deck",
                "description": "Prepare the presentation deck and system architecture diagram for mentor review.",
                "deadline": oct10,
                "deadline_time": "15:00",
                "priority": "high",
                "assignee": "Sakthi",
                "confidence": 0.96,
                "evidence": "Sakthi is responsible for preparing the presentation deck and system architecture diagram.",
                "evidence_page": 1,
            },
            {
                "title": "Complete Database Indexing & Benchmarks",
                "description": "Complete database indexing and API performance benchmarks for the system.",
                "deadline": oct15,
                "priority": "medium",
                "assignee": "Alex",
                "confidence": 0.94,
                "evidence": "Alex is assigned to complete the database indexing and API performance benchmarks.",
                "evidence_page": 1,
            },
            {
                "title": "Draft Security Assessment Documentation",
                "description": "Draft security assessment documentation and verify GDPR compliance standards.",
                "deadline": oct15,
                "priority": "medium",
                "assignee": "Priya",
                "confidence": 0.91,
                "evidence": "Priya is required to draft the security assessment documentation and verify GDPR compliance.",
                "evidence_page": 1,
            },
            {
                "title": "Submit Final Project Report & Codebase",
                "description": "Submit final report, repo link, and video demo before the strict deadline.",
                "deadline": oct15,
                "deadline_time": "23:59",
                "priority": "urgent",
                "assignee": "Team",
                "confidence": 0.98,
                "evidence": "All teams must submit the final project report, codebase repository link, and video demonstration by October 15, 2026.",
                "evidence_page": 1,
            },
        ],
        events_raw=[
            {"title": "Team Review Meeting", "event_date": oct10, "event_time": "15:00", "location": "Conference Room B"},
            {"title": "Final Viva Defense Session", "event_date": oct22, "event_time": "10:00", "location": "Academic Hall"},
        ],
        people=["Sakthi", "Alex", "Priya"],
        decisions=["10% grade penalty enforced for late submissions"],
        requirements=["SRS v2.0", "User Manual", "System Test Report (80% coverage)", "Presentation Slides"],
        important_dates=[{"date": oct10, "label": "Review Meeting"}, {"date": oct15, "label": "Submission Deadline"}, {"date": oct22, "label": "Viva Defense"}],
        ai_provider="openai",
        ai_model="gpt-4o-mini",
        confidence_score=0.95,
    )
    db.add(ext1)

    # Document 2: Service Agreement
    doc2_id = str(uuid.uuid4())
    doc2 = Document(
        id=doc2_id,
        user_id=demo_user.id,
        filename=f"{doc2_id}_Cloud_Service_Agreement.docx",
        original_filename="Cloud Service Agreement.docx",
        file_size=182400,
        mime_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        storage_path=f"{demo_user.id}/Cloud_Service_Agreement.docx",
        status=DocumentStatus.COMPLETED,
        page_count=2,
        word_count=350,
        created_at=datetime.utcnow() - timedelta(days=1),
        processed_at=datetime.utcnow() - timedelta(days=1),
    )
    db.add(doc2)

    # Document 3: Hackathon Circular
    doc3_id = str(uuid.uuid4())
    doc3 = Document(
        id=doc3_id,
        user_id=demo_user.id,
        filename=f"{doc3_id}_Hackathon_Innovation_Circular.pdf",
        original_filename="Hackathon Innovation Circular.pdf",
        file_size=98200,
        mime_type="application/pdf",
        storage_path=f"{demo_user.id}/Hackathon_Innovation_Circular.pdf",
        status=DocumentStatus.COMPLETED,
        page_count=1,
        word_count=210,
        created_at=datetime.utcnow() - timedelta(hours=6),
        processed_at=datetime.utcnow() - timedelta(hours=6),
    )
    db.add(doc3)

    # 10 Sample Actions across the documents
    actions_seed = [
        # Doc 1 Actions
        (doc1_id, "Prepare presentation deck & architecture", "Prepare slides for the mid-term mentor evaluation", ActionStatus.TODO, ActionPriority.HIGH, oct10, "15:00", "Sakthi", 0.96, "Sakthi is responsible for preparing the presentation deck and system architecture diagram.", 1),
        (doc1_id, "Submit final project report & repo", "Upload final report, git repository link, and demo video", ActionStatus.TODO, ActionPriority.URGENT, oct15, "23:59", "Alex", 0.98, "All teams must submit the final project report, codebase repository link, and video demonstration by October 15, 2026.", 1),
        (doc1_id, "Draft security assessment & GDPR audit", "Write compliance checks and verify test coverage above 80%", ActionStatus.IN_PROGRESS, ActionPriority.MEDIUM, oct15, "18:00", "Priya", 0.91, "Priya is required to draft the security assessment documentation and verify GDPR compliance.", 1),
        (doc1_id, "Complete database indexing & benchmarks", "Run performance profiling on Postgres queries", ActionStatus.COMPLETED, ActionPriority.MEDIUM, oct10, "12:00", "Alex", 0.94, "Alex is assigned to complete the database indexing and API performance benchmarks.", 1),
        (doc1_id, "Final Viva Defense Presentation", "Defend capstone architecture in front of academic committee", ActionStatus.TODO, ActionPriority.HIGH, oct22, "10:00", "Team", 0.97, "The project viva defense session is scheduled for October 22, 2026 at 10:00 AM.", 1),

        # Doc 2 Actions
        (doc2_id, "Deliver Terraform scripts & audit", "Milestone 1 infrastructure audit and IaC configurations", ActionStatus.TODO, ActionPriority.HIGH, oct18, "17:00", "David Chen", 0.93, "Milestone 1: Infrastructure audit and Terraform scripts delivery by October 18, 2026.", 1),
        (doc2_id, "Staging deployment validation review", "Joint staging sign-off meeting with solutions architect", ActionStatus.TODO, ActionPriority.MEDIUM, oct28, "14:00", "Marcus Vance", 0.89, "Milestone 2: Staging deployment and validation review on October 28, 2026 at 2:00 PM.", 1),
        (doc2_id, "Submit SOC2 Type II compliance report", "Provide signed compliance verification certificate to client", ActionStatus.COMPLETED, ActionPriority.LOW, today.isoformat(), None, "David Chen", 0.85, "Client requires annual SOC2 Type II compliance report submission before contract commencement.", 1),

        # Doc 3 Actions
        (doc3_id, "Complete hackathon team registration", "Register 4-member team on innovation portal", ActionStatus.TODO, ActionPriority.URGENT, oct12, "18:00", "Alex", 0.95, "Team Registration Deadline: October 12, 2026 at 6:00 PM via the portal.", 1),
        (doc3_id, "Submit 3-minute prototype pitch video", "Record screencast and upload prototype repository", ActionStatus.TODO, ActionPriority.HIGH, (today + timedelta(days=5)).isoformat(), "17:00", "Team", 0.92, "Prototype Submission: October 16, 2026 by 5:00 PM. Submit prototype pitch video under 3 minutes.", 1),
    ]

    for (doc_id, title, desc_text, st, pri, d_date, d_time, person, conf, evid, page_n) in actions_seed:
        act = Action(
            id=str(uuid.uuid4()),
            user_id=demo_user.id,
            document_id=doc_id,
            title=title,
            description=desc_text,
            status=st,
            priority=pri,
            due_date=d_date,
            due_time=d_time,
            assignee=person,
            confidence=conf,
            evidence=evid,
            evidence_page=page_n,
            is_ai_suggested=True,
            completed_at=datetime.utcnow() - timedelta(hours=4) if st == ActionStatus.COMPLETED else None,
        )
        db.add(act)

    # 3 Sample Calendar Events
    ev1 = Event(
        id=str(uuid.uuid4()),
        user_id=demo_user.id,
        document_id=doc1_id,
        title="Team Review Meeting with Mentors",
        description="Review capstone architecture and sprint velocity in Conference Room B",
        event_date=oct10,
        event_time="15:00",
        location="Conference Room B",
    )
    ev2 = Event(
        id=str(uuid.uuid4()),
        user_id=demo_user.id,
        document_id=doc1_id,
        title="Capstone Project Viva Defense",
        description="Formal project evaluation before the academic committee",
        event_date=oct22,
        event_time="10:00",
        location="Academic Evaluation Hall",
    )
    ev3 = Event(
        id=str(uuid.uuid4()),
        user_id=demo_user.id,
        document_id=doc3_id,
        title="Hackathon Grand Finale & Jury Pitch",
        description="Live demonstration of working prototype to industry judges",
        event_date=(today + timedelta(days=6)).isoformat(),
        event_time="10:00",
        location="Main Auditorium",
    )
    db.add(ev1)
    db.add(ev2)
    db.add(ev3)

    # 5 Sample Notifications
    notifs_seed = [
        (NotificationType.OVERDUE, "Action Attention Required", "Submission deadline approaching for Capstone Project Guidelines.", f"/documents/{doc1_id}"),
        (NotificationType.REMINDER, "Meeting Tomorrow", "Team Review Meeting is scheduled for tomorrow at 3:00 PM.", "/calendar"),
        (NotificationType.SUCCESS, "Document Processed", "'College Project Guidelines.pdf' was analyzed. 4 actionable items detected.", f"/documents/{doc1_id}"),
        (NotificationType.INFO, "New Action Suggested", "AI detected 'Deliver Terraform scripts' with 93% confidence.", "/actions"),
        (NotificationType.SUCCESS, "Task Completed", "'Complete database indexing & benchmarks' marked as completed.", "/actions"),
    ]
    for ntype, title, msg, link in notifs_seed:
        n = Notification(
            id=str(uuid.uuid4()),
            user_id=demo_user.id,
            type=ntype,
            title=title,
            message=msg,
            link=link,
            is_read=False,
        )
        db.add(n)

    # Audit Logs
    audit1 = AuditLog(
        id=str(uuid.uuid4()),
        user_id=demo_user.id,
        action=AuditAction.DOCUMENT_PROCESSED,
        entity_type="document",
        entity_id=doc1_id,
        details={"filename": "College Project Guidelines.pdf", "actions_detected": 4},
    )
    audit2 = AuditLog(
        id=str(uuid.uuid4()),
        user_id=demo_user.id,
        action=AuditAction.ACTION_CONFIRMED,
        entity_type="action",
        details={"title": "Prepare presentation deck & architecture", "confirmed_by": "Alex Morgan"},
    )
    db.add(audit1)
    db.add(audit2)

    await db.commit()
    print("Demo dataset seeded successfully for demo@kurippu.ai")
