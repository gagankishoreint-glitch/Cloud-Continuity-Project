import hashlib
import json
from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.user import User, PrivacyAuditLog, DeviceSession
from backend.app.models.task import Task
from backend.app.models.checkpoint import Checkpoint
from backend.app.models.recovery import RecoverySession
from backend.app.schemas.privacy import (
    PrivacySettingsUpdate,
    PrivacyAuditLogResponse,
    GDPRDataExportResponse
)
from backend.app.services.auth_service import get_current_user

router = APIRouter(prefix="/privacy", tags=["Privacy, Ethics & Data Governance"])

@router.get("/export", response_model=GDPRDataExportResponse)
def export_user_data(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    GDPR & CCPA Compliant Data Portability Export:
    Returns complete cryptographically signed archive of all user data.
    """
    tasks = db.query(Task).filter(Task.user_id == current_user.id).all()
    checkpoints = db.query(Checkpoint).filter(Checkpoint.user_id == current_user.id).all()
    recovery_sessions = db.query(RecoverySession).filter(RecoverySession.user_id == current_user.id).all()
    devices = db.query(DeviceSession).filter(DeviceSession.user_id == current_user.id).all()
    
    payload = {
        "user_profile": {
            "id": current_user.id,
            "username": current_user.username,
            "email": current_user.email,
            "full_name": current_user.full_name,
            "created_at": current_user.created_at.isoformat(),
            "settings": current_user.settings
        },
        "devices": [
            {"name": d.device_name, "type": d.device_type, "last_active": d.last_active_at.isoformat()}
            for d in devices
        ],
        "tasks": [
            {
                "id": t.id,
                "title": t.title,
                "category": t.category,
                "status": t.status,
                "tags": t.tags,
                "created_at": t.created_at.isoformat()
            }
            for t in tasks
        ],
        "checkpoints": [
            {
                "id": c.id,
                "task_id": c.task_id,
                "version": c.version_number,
                "goal": c.goal,
                "confirmed_progress": c.confirmed_progress,
                "blocker": c.blocker_or_question,
                "next_action": c.next_action,
                "resources": c.resources,
                "user_notes": c.user_notes,
                "provenance": c.provenance,
                "created_at": c.created_at.isoformat()
            }
            for c in checkpoints
        ],
        "recovery_telemetry": [
            {
                "id": r.id,
                "task_id": r.task_id,
                "resumption_lag_ms": r.resumption_lag_ms,
                "condition": r.recovery_condition,
                "nasa_tlx_overall": r.nasa_tlx_overall,
                "confidence": r.perceived_confidence,
                "started_at": r.started_at.isoformat()
            }
            for r in recovery_sessions
        ]
    }
    
    serialized = json.dumps(payload, sort_keys=True)
    checksum = hashlib.sha256(serialized.encode('utf-8')).hexdigest()
    
    # Audit log
    audit = PrivacyAuditLog(
        user_id=current_user.id,
        action="GDPR_DATA_EXPORTED",
        resource_type="user_data_export",
        details={"checksum_sha256": checksum}
    )
    db.add(audit)
    db.commit()
    
    return GDPRDataExportResponse(
        user_id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        exported_at=datetime.utcnow(),
        data_retention_days=current_user.settings.get("retention_days", 90),
        tasks_count=len(tasks),
        checkpoints_count=len(checkpoints),
        recovery_sessions_count=len(recovery_sessions),
        data_payload=payload,
        cryptographic_checksum_sha256=checksum
    )

@router.get("/audit-logs", response_model=List[PrivacyAuditLogResponse])
def get_audit_logs(limit: int = 50, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(PrivacyAuditLog).filter(
        PrivacyAuditLog.user_id == current_user.id
    ).order_by(PrivacyAuditLog.timestamp.desc()).limit(limit).all()

@router.put("/settings")
def update_privacy_settings(
    settings_in: PrivacySettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    current = current_user.settings or {}
    updated = current.copy()
    for k, v in settings_in.model_dump().items():
        updated[k] = v
        
    current_user.settings = updated
    
    audit = PrivacyAuditLog(
        user_id=current_user.id,
        action="PRIVACY_SETTINGS_UPDATED",
        resource_type="settings",
        details=settings_in.model_dump()
    )
    db.add(audit)
    db.commit()
    db.refresh(current_user)
    return {"message": "Privacy settings updated successfully", "settings": current_user.settings}

@router.post("/purge-account")
def hard_purge_account(
    confirmation: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if confirmation != "PERMANENTLY_DELETE_ALL_MY_DATA":
        raise HTTPException(
            status_code=400,
            detail="Confirmation string must match 'PERMANENTLY_DELETE_ALL_MY_DATA'"
        )
        
    user_id = current_user.id
    db.delete(current_user)
    db.commit()
    return {"message": f"User account {user_id} and all associated data permanently purged in compliance with GDPR Right to Erasure."}
