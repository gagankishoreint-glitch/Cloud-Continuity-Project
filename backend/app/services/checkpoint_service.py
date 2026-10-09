import json
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from backend.app.models.checkpoint import Checkpoint
from backend.app.models.task import Task
from backend.app.models.user import PrivacyAuditLog
from backend.app.schemas.checkpoint import CheckpointCreate, CheckpointDiffResponse, CheckpointDiffItem

def create_new_checkpoint(db: Session, checkpoint_in: CheckpointCreate, user_id: str) -> Checkpoint:
    # 1. Verify task belongs to user
    task = db.query(Task).filter(Task.id == checkpoint_in.task_id, Task.user_id == user_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found or access denied")
    
    # 2. Check for duplicate mutation (Idempotency)
    if checkpoint_in.client_mutation_id:
        existing = db.query(Checkpoint).filter(
            Checkpoint.client_mutation_id == checkpoint_in.client_mutation_id,
            Checkpoint.user_id == user_id
        ).first()
        if existing:
            return existing

    # 3. Determine version number
    latest = db.query(Checkpoint).filter(
        Checkpoint.task_id == task.id,
        Checkpoint.user_id == user_id
    ).order_by(Checkpoint.version_number.desc()).first()
    
    next_version = (latest.version_number + 1) if latest else 1
    parent_id = latest.id if latest else None
    
    # 4. Normalize data structures
    progress_data = [item.model_dump() if hasattr(item, 'model_dump') else dict(item) for item in checkpoint_in.confirmed_progress]
    resources_data = [item.model_dump() if hasattr(item, 'model_dump') else dict(item) for item in checkpoint_in.resources]
    
    # 5. Build field-level provenance if not specified
    now_iso = datetime.utcnow().isoformat()
    provenance_data = checkpoint_in.provenance or {
        "goal": {"source": "user", "updated_at": now_iso, "confidence": 1.0},
        "next_action": {"source": "user", "updated_at": now_iso, "confidence": 1.0},
        "blocker": {"source": "user", "updated_at": now_iso, "confidence": 1.0},
        "resources": {"source": "user", "updated_at": now_iso, "confidence": 1.0}
    }
    
    checkpoint = Checkpoint(
        task_id=task.id,
        user_id=user_id,
        version_number=next_version,
        parent_checkpoint_id=parent_id,
        goal=checkpoint_in.goal,
        confirmed_progress=progress_data,
        blocker_or_question=checkpoint_in.blocker_or_question or "",
        next_action=checkpoint_in.next_action,
        resources=resources_data,
        user_notes=checkpoint_in.user_notes or "",
        provenance=provenance_data,
        is_draft=checkpoint_in.is_draft,
        client_mutation_id=checkpoint_in.client_mutation_id,
        device_origin=checkpoint_in.device_origin or "Primary Workstation",
        tags=checkpoint_in.tags or task.tags or []
    )
    
    db.add(checkpoint)
    db.flush()
    
    # Update active checkpoint on task
    if not checkpoint_in.is_draft:
        task.active_checkpoint_id = checkpoint.id
        task.updated_at = datetime.utcnow()
        
    # Privacy audit logging
    audit = PrivacyAuditLog(
        user_id=user_id,
        action="CHECKPOINT_CREATED",
        resource_type="checkpoint",
        resource_id=checkpoint.id,
        details={
            "task_id": task.id,
            "version": next_version,
            "is_draft": checkpoint_in.is_draft,
            "device": checkpoint_in.device_origin
        }
    )
    db.add(audit)
    db.commit()
    db.refresh(checkpoint)
    return checkpoint

def diff_checkpoints(db: Session, checkpoint_a_id: str, checkpoint_b_id: str, user_id: str) -> CheckpointDiffResponse:
    chk_a = db.query(Checkpoint).filter(Checkpoint.id == checkpoint_a_id, Checkpoint.user_id == user_id).first()
    chk_b = db.query(Checkpoint).filter(Checkpoint.id == checkpoint_b_id, Checkpoint.user_id == user_id).first()
    
    if not chk_a or not chk_b:
        raise HTTPException(status_code=404, detail="One or both checkpoints not found")
        
    diffs: List[CheckpointDiffItem] = []
    summary_parts: List[str] = []
    
    # Compare Goal
    if chk_a.goal != chk_b.goal:
        diffs.append(CheckpointDiffItem(
            field="goal",
            old_value=chk_a.goal,
            new_value=chk_b.goal,
            change_type="modified"
        ))
        summary_parts.append(f"Goal updated from '{chk_a.goal[:30]}...' to '{chk_b.goal[:30]}...'")
    else:
        diffs.append(CheckpointDiffItem(
            field="goal",
            old_value=chk_a.goal,
            new_value=chk_b.goal,
            change_type="unchanged"
        ))
        
    # Compare Next Action
    if chk_a.next_action != chk_b.next_action:
        diffs.append(CheckpointDiffItem(
            field="next_action",
            old_value=chk_a.next_action,
            new_value=chk_b.next_action,
            change_type="modified"
        ))
        summary_parts.append(f"Next action changed from '{chk_a.next_action[:30]}' to '{chk_b.next_action[:30]}'")
        
    # Compare Blocker
    if chk_a.blocker_or_question != chk_b.blocker_or_question:
        diffs.append(CheckpointDiffItem(
            field="blocker_or_question",
            old_value=chk_a.blocker_or_question,
            new_value=chk_b.blocker_or_question,
            change_type="modified" if chk_b.blocker_or_question else "resolved"
        ))
        if not chk_b.blocker_or_question and chk_a.blocker_or_question:
            summary_parts.append("Blocker resolved")
        else:
            summary_parts.append("Blocker updated")
            
    # Compare Progress Items
    prog_a = {p.get("id", p.get("text")): p for p in (chk_a.confirmed_progress or [])}
    prog_b = {p.get("id", p.get("text")): p for p in (chk_b.confirmed_progress or [])}
    
    added_progress = [v for k, v in prog_b.items() if k not in prog_a]
    if added_progress:
        diffs.append(CheckpointDiffItem(
            field="confirmed_progress",
            old_value=chk_a.confirmed_progress,
            new_value=chk_b.confirmed_progress,
            change_type="added"
        ))
        summary_parts.append(f"{len(added_progress)} new milestone(s) completed")
        
    # Compare Resources
    res_a = {r.get("id", r.get("title")): r for r in (chk_a.resources or [])}
    res_b = {r.get("id", r.get("title")): r for r in (chk_b.resources or [])}
    added_res = [v for k, v in res_b.items() if k not in res_a]
    if added_res:
        diffs.append(CheckpointDiffItem(
            field="resources",
            old_value=chk_a.resources,
            new_value=chk_b.resources,
            change_type="added"
        ))
        summary_parts.append(f"{len(added_res)} new resource(s) pinned")
        
    if not summary_parts:
        summary_text = "No material differences detected between versions."
    else:
        summary_text = "; ".join(summary_parts) + "."
        
    return CheckpointDiffResponse(
        checkpoint_a_id=chk_a.id,
        checkpoint_b_id=chk_b.id,
        version_a=chk_a.version_number,
        version_b=chk_b.version_number,
        diffs=diffs,
        summary_text=summary_text
    )
