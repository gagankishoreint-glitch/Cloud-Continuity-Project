import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Integer, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from backend.app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), default="Cloud Engineer")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # User privacy & retention settings (JSON)
    # e.g. {"retention_days": 90, "auto_mask_tokens": true, "enable_telemetry": true, "capture_mode": "explicit"}
    settings = Column(JSON, default=lambda: {
        "retention_days": 90,
        "auto_mask_tokens": True,
        "enable_telemetry": True,
        "capture_mode": "explicit",
        "default_device_name": "Primary Workstation",
        "briefing_format": "concise"
    })

    # Relationships
    tasks = relationship("Task", back_populates="user", cascade="all, delete-orphan")
    checkpoints = relationship("Checkpoint", back_populates="user", cascade="all, delete-orphan")
    devices = relationship("DeviceSession", back_populates="user", cascade="all, delete-orphan")
    recovery_sessions = relationship("RecoverySession", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("PrivacyAuditLog", back_populates="user", cascade="all, delete-orphan")


class DeviceSession(Base):
    __tablename__ = "device_sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    device_name = Column(String(100), nullable=False)  # e.g., "MacBook Pro M3", "Ubuntu Workstation", "iPad Pro"
    device_type = Column(String(50), default="laptop")  # laptop, desktop, tablet, mobile
    ip_address = Column(String(50), default="10.0.1.42")
    user_agent = Column(String(255), default="WorkContinuity/1.0 (Darwin x86_64)")
    last_active_at = Column(DateTime, default=datetime.utcnow)
    is_current = Column(Boolean, default=False)
    sync_status = Column(String(50), default="in_sync")  # in_sync, syncing, pending, disconnected
    active_task_id = Column(String(36), nullable=True)

    user = relationship("User", back_populates="devices")


class PrivacyAuditLog(Base):
    __tablename__ = "privacy_audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    action = Column(String(100), nullable=False)  # CHECKPOINT_SAVE, RECOVERY_RESTORE, DATA_EXPORT, RETENTION_PURGE, ACCESS_SHARED
    resource_type = Column(String(50), default="checkpoint")
    resource_id = Column(String(36), nullable=True)
    actor_ip = Column(String(50), default="10.0.1.42")
    details = Column(JSON, default=dict)
    timestamp = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="audit_logs")
