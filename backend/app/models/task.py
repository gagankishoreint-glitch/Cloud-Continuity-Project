import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, ForeignKey, JSON, Integer
from sqlalchemy.orm import relationship
from backend.app.database import Base

class Task(Base):
    __tablename__ = "tasks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, default="")
    category = Column(String(100), default="AWS Cloud Lab")  # AWS Cloud Lab, DevOps, System Architecture, Bug Fixing, Research
    status = Column(String(50), default="active", index=True)  # active, paused, completed, archived
    priority = Column(String(20), default="medium")  # high, medium, low
    color = Column(String(20), default="#3b82f6")  # hex color for UI badge
    tags = Column(JSON, default=list)  # ["IAM", "S3", "Security"]
    
    # Pointer to latest active checkpoint version
    active_checkpoint_id = Column(String(36), nullable=True)
    
    total_time_spent_seconds = Column(Integer, default=0)
    resumption_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="tasks")
    checkpoints = relationship("Checkpoint", back_populates="task", cascade="all, delete-orphan", order_by="desc(Checkpoint.version_number)")
    recovery_sessions = relationship("RecoverySession", back_populates="task", cascade="all, delete-orphan")


class TaskSwitchLog(Base):
    __tablename__ = "task_switch_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    from_task_id = Column(String(36), nullable=True)
    to_task_id = Column(String(36), nullable=False)
    reason = Column(String(100), default="manual_switch")  # interruption, priority_shift, meeting, break, manual_switch
    timestamp = Column(DateTime, default=datetime.utcnow)
