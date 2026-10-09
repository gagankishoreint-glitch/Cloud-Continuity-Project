from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.user import User, PrivacyAuditLog
from backend.app.models.task import Task
from backend.app.models.checkpoint import Checkpoint
from backend.app.schemas.checkpoint import (
    CheckpointCreate,
    CheckpointUpdate,
    CheckpointResponse,
    CheckpointDiffResponse
)
from backend.app.services.auth_service import get_current_user
from backend.app.services.checkpoint_service import (
    create_new_checkpoint,
    diff_checkpoints
)

router = APIRouter(prefix="/checkpoints", tags=["Context Checkpoints"])

@router.get("", response_model=List[CheckpointResponse])
def list_checkpoints(
    task_id: Optional[str] = None,
    include_drafts: bool = True,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Checkpoint).filter(Checkpoint.user_id == current_user.id)
    if task_id:
        query = query.filter(Checkpoint.task_id == task_id)
    if not include_drafts:
        query = query.filter(Checkpoint.is_draft == False)
        
    return query.order_by(Checkpoint.version_number.desc(), Checkpoint.created_at.desc()).all()

@router.post("", response_model=CheckpointResponse)
def save_checkpoint(
    checkpoint_in: CheckpointCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return create_new_checkpoint(db, checkpoint_in, current_user.id)

@router.get("/{checkpoint_id}", response_model=CheckpointResponse)
def get_checkpoint(
    checkpoint_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    chk = db.query(Checkpoint).filter(Checkpoint.id == checkpoint_id, Checkpoint.user_id == current_user.id).first()
    if not chk:
        raise HTTPException(status_code=404, detail="Checkpoint not found")
    return chk

@router.put("/{checkpoint_id}", response_model=CheckpointResponse)
def update_checkpoint(
    checkpoint_id: str,
    checkpoint_in: CheckpointUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    chk = db.query(Checkpoint).filter(Checkpoint.id == checkpoint_id, Checkpoint.user_id == current_user.id).first()
    if not chk:
        raise HTTPException(status_code=404, detail="Checkpoint not found")
        
    for k, v in checkpoint_in.model_dump(exclude_unset=True).items():
        if k in ["confirmed_progress", "resources"]:
            # Normalize list of items if needed
            data = [item if isinstance(item, dict) else item.model_dump() for item in v]
            setattr(chk, k, data)
        else:
            setattr(chk, k, v)
            
    # Update provenance
    now_iso = datetime.utcnow().isoformat()
    prov = chk.provenance or {}
    prov["last_edited"] = {"source": "user", "timestamp": now_iso}
    chk.provenance = prov
    
    db.commit()
    db.refresh(chk)
    return chk

@router.delete("/{checkpoint_id}")
def delete_checkpoint(
    checkpoint_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    chk = db.query(Checkpoint).filter(Checkpoint.id == checkpoint_id, Checkpoint.user_id == current_user.id).first()
    if not chk:
        raise HTTPException(status_code=404, detail="Checkpoint not found")
        
    task = db.query(Task).filter(Task.id == chk.task_id).first()
    if task and task.active_checkpoint_id == chk.id:
        # Fall back to parent or previous version
        prev = db.query(Checkpoint).filter(
            Checkpoint.task_id == task.id,
            Checkpoint.id != chk.id
        ).order_by(Checkpoint.version_number.desc()).first()
        task.active_checkpoint_id = prev.id if prev else None
        
    db.delete(chk)
    
    audit = PrivacyAuditLog(
        user_id=current_user.id,
        action="CHECKPOINT_DELETED",
        resource_type="checkpoint",
        resource_id=checkpoint_id
    )
    db.add(audit)
    db.commit()
    return {"message": "Checkpoint deleted successfully", "id": checkpoint_id}

@router.get("/{checkpoint_id}/diff/{other_id}", response_model=CheckpointDiffResponse)
def get_diff(
    checkpoint_id: str,
    other_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return diff_checkpoints(db, checkpoint_id, other_id, current_user.id)

@router.post("/{checkpoint_id}/rollback", response_model=CheckpointResponse)
def rollback_to_checkpoint(
    checkpoint_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_chk = db.query(Checkpoint).filter(Checkpoint.id == checkpoint_id, Checkpoint.user_id == current_user.id).first()
    if not target_chk:
        raise HTTPException(status_code=404, detail="Target checkpoint not found")
        
    task = db.query(Task).filter(Task.id == target_chk.task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    # Create new snapshot with incremented version reflecting rollback
    latest = db.query(Checkpoint).filter(Checkpoint.task_id == task.id).order_by(Checkpoint.version_number.desc()).first()
    next_ver = (latest.version_number + 1) if latest else 1
    
    rollback_snapshot = Checkpoint(
        task_id=task.id,
        user_id=current_user.id,
        version_number=next_ver,
        parent_checkpoint_id=target_chk.id,
        goal=target_chk.goal,
        confirmed_progress=target_chk.confirmed_progress,
        blocker_or_question=target_chk.blocker_or_question,
        next_action=target_chk.next_action,
        resources=target_chk.resources,
        user_notes=f"Rolled back from version {target_chk.version_number}. " + (target_chk.user_notes or ""),
        provenance={"rollback_from_version": target_chk.version_number, "timestamp": datetime.utcnow().isoformat()},
        is_draft=False,
        device_origin=current_user.settings.get("default_device_name", "Primary Workstation")
    )
    db.add(rollback_snapshot)
    db.flush()
    
    task.active_checkpoint_id = rollback_snapshot.id
    task.updated_at = datetime.utcnow()
    
    audit = PrivacyAuditLog(
        user_id=current_user.id,
        action="CHECKPOINT_ROLLED_BACK",
        resource_type="checkpoint",
        resource_id=rollback_snapshot.id,
        details={"rolled_back_to_version": target_chk.version_number, "new_version": next_ver}
    )
    db.add(audit)
    db.commit()
    db.refresh(rollback_snapshot)
    return rollback_snapshot
