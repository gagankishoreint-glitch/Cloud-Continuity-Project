import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, Integer, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from backend.app.database import Base

class RecoverySession(Base):
    __tablename__ = "recovery_sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    task_id = Column(String(36), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    checkpoint_id = Column(String(36), ForeignKey("checkpoints.id", ondelete="SET NULL"), nullable=True)
    
    # Interruption details
    interruption_type = Column(String(50), default="short_break")  # short_break, long_break, task_switch, cross_device, unexpected
    interruption_duration_seconds = Column(Integer, default=300)
    
    # Recovery workflow timestamps
    started_at = Column(DateTime, default=datetime.utcnow)  # Briefing presented timestamp
    first_action_at = Column(DateTime, nullable=True)      # Timestamp of first meaningful action
    completed_at = Column(DateTime, nullable=True)
    
    # Quantitative timing measurements
    briefing_view_duration_ms = Column(Integer, default=0)
    resumption_lag_ms = Column(Integer, default=0)          # Resumption lag (from briefing open to 1st action)
    
    # Action telemetry
    first_action_type = Column(String(100), default="resource_open")  # resource_open, terminal_exec, code_edit, milestone_check, note_update
    first_action_description = Column(Text, default="")
    recovery_condition = Column(String(50), default="structured_briefing")  # structured_briefing vs manual_recovery
    
    # Evaluation outcomes
    recovery_accuracy_score = Column(Float, default=1.0)  # 0.0 to 1.0 (proportion of verified context correctly recalled)
    repeated_work_count = Column(Integer, default=0)       # Number of duplicate/redundant actions taken
    
    # NASA-TLX Cognitive Workload Dimensions (0 - 100)
    nasa_tlx_mental = Column(Integer, nullable=True)       # Mental Demand
    nasa_tlx_physical = Column(Integer, nullable=True)     # Physical Demand
    nasa_tlx_temporal = Column(Integer, nullable=True)     # Temporal Demand
    nasa_tlx_performance = Column(Integer, nullable=True)  # Own Performance (lower is better or inverted)
    nasa_tlx_effort = Column(Integer, nullable=True)       # Effort
    nasa_tlx_frustration = Column(Integer, nullable=True)  # Frustration
    nasa_tlx_overall = Column(Float, nullable=True)        # Weighted/Average TLX score
    
    # Confidence and qualitative feedback
    perceived_confidence = Column(Integer, nullable=True)  # 1 - 10
    qualitative_feedback = Column(Text, default="")
    device_recovered_on = Column(String(100), default="Primary Workstation")

    # Relationships
    user = relationship("User", back_populates="recovery_sessions")
    task = relationship("Task", back_populates="recovery_sessions")
    checkpoint = relationship("Checkpoint", back_populates="recovery_sessions")
