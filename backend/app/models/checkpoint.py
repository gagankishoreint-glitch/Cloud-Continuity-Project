import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Integer, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from backend.app.database import Base

class Checkpoint(Base):
    __tablename__ = "checkpoints"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    task_id = Column(String(36), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    version_number = Column(Integer, default=1, nullable=False)
    parent_checkpoint_id = Column(String(36), nullable=True)
    
    # 1. Goal (Explicit objective)
    goal = Column(Text, nullable=False)
    
    # 2. Confirmed Progress: list of dicts [{"id": "...", "text": "...", "completed": true, "timestamp": "...", "provenance": "user"}]
    confirmed_progress = Column(JSON, default=list)
    
    # 3. Blocker or Open Question
    blocker_or_question = Column(Text, default="")
    
    # 4. Intended Next Action (Concrete, prospective memory anchor)
    next_action = Column(Text, nullable=False)
    
    # 5. Saved Resources: list of dicts [{"id": "...", "title": "...", "type": "url"|"doc"|"code"|"terminal"|"note", "value": "...", "notes": "..."}]
    resources = Column(JSON, default=list)
    
    # 6. User Notes & Scratchpad (Markdown)
    user_notes = Column(Text, default="")
    
    # 7. Field-level Provenance metadata
    # e.g., {"goal": {"source": "user", "updated_at": "..."}, "next_action": {"source": "user", "confidence": 1.0}}
    provenance = Column(JSON, default=dict)
    
    # 8. Integrity, Draft & Deduplication
    is_draft = Column(Boolean, default=False)  # True for background auto-saved drafts
    client_mutation_id = Column(String(100), nullable=True, index=True)  # Idempotency token
    device_origin = Column(String(100), default="Primary Workstation")
    
    tags = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    user = relationship("User", back_populates="checkpoints")
    task = relationship("Task", back_populates="checkpoints")
    recovery_sessions = relationship("RecoverySession", back_populates="checkpoint")
