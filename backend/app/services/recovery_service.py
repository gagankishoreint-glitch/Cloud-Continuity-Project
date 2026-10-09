from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from fastapi import HTTPException
from backend.app.models.checkpoint import Checkpoint
from backend.app.models.task import Task
from backend.app.models.recovery import RecoverySession
from backend.app.models.user import PrivacyAuditLog
from backend.app.schemas.recovery import (
    RecoveryBriefingResponse,
    RecoverySessionCreate,
    RecoveryFirstActionRequest,
    RecoveryRatingSubmit
)

def humanize_timedelta(dt: datetime) -> str:
    now = datetime.utcnow()
    diff = now - dt
    seconds = int(diff.total_seconds())
    if seconds < 60:
        return f"{seconds} seconds ago"
    minutes = seconds // 60
    if minutes < 60:
        return f"{minutes} minute{'s' if minutes != 1 else ''} ago"
    hours = minutes // 60
    if hours < 24:
        return f"{hours} hour{'s' if hours != 1 else ''} ago"
    days = hours // 24
    return f"{days} day{'s' if days != 1 else ''} ago"

def generate_recovery_briefing(db: Session, task_id: str, user_id: str) -> RecoveryBriefingResponse:
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    # Get active or latest checkpoint
    checkpoint = None
    if task.active_checkpoint_id:
        checkpoint = db.query(Checkpoint).filter(Checkpoint.id == task.active_checkpoint_id).first()
    if not checkpoint:
        checkpoint = db.query(Checkpoint).filter(
            Checkpoint.task_id == task.id,
            Checkpoint.user_id == user_id
        ).order_by(Checkpoint.version_number.desc()).first()
        
    if not checkpoint:
        raise HTTPException(status_code=404, detail="No saved checkpoint found for this task. Please save a checkpoint first.")
        
    # Format confirmed progress
    completed_milestones = []
    if checkpoint.confirmed_progress:
        for m in checkpoint.confirmed_progress:
            if isinstance(m, dict):
                completed_milestones.append(m.get("text", ""))
            elif isinstance(m, str):
                completed_milestones.append(m)
                
    if not completed_milestones:
        completed_milestones = ["Initial task setup begun."]

    # Provenance summary map
    provenance_summary = {}
    if checkpoint.provenance and isinstance(checkpoint.provenance, dict):
        for k, v in checkpoint.provenance.items():
            if isinstance(v, dict):
                src = v.get("source", "user")
                provenance_summary[k] = f"Source: {src}"
            else:
                provenance_summary[k] = "Source: user"
    else:
        provenance_summary = {
            "goal": "Source: user-authored",
            "next_action": "Source: user-authored",
            "blocker": "Source: user-authored",
            "progress": "Source: user-verified"
        }

    return RecoveryBriefingResponse(
        task_id=task.id,
        task_title=task.title,
        task_category=task.category or "General",
        checkpoint_id=checkpoint.id,
        version_number=checkpoint.version_number,
        last_saved_at=checkpoint.created_at,
        elapsed_time_human=humanize_timedelta(checkpoint.created_at),
        what_you_were_doing=f"Goal: {checkpoint.goal}",
        what_was_completed=completed_milestones,
        current_blocker=checkpoint.blocker_or_question if checkpoint.blocker_or_question else "No active blockers recorded.",
        explicit_next_action=checkpoint.next_action,
        resources=checkpoint.resources or [],
        provenance_summary=provenance_summary,
        confidence_warning=None if checkpoint.provenance.get("next_action", {}).get("source") == "user" else "Note: Check next action details against active terminal."
    )

def start_recovery_session(db: Session, session_in: RecoverySessionCreate, user_id: str) -> RecoverySession:
    # 1. Verify task
    task = db.query(Task).filter(Task.id == session_in.task_id, Task.user_id == user_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    chk_id = session_in.checkpoint_id or task.active_checkpoint_id
    
    session = RecoverySession(
        user_id=user_id,
        task_id=task.id,
        checkpoint_id=chk_id,
        interruption_type=session_in.interruption_type or "short_break",
        interruption_duration_seconds=session_in.interruption_duration_seconds or 300,
        recovery_condition=session_in.recovery_condition or "structured_briefing",
        started_at=datetime.utcnow(),
    )
    db.add(session)
    
    # Increment task resumption count
    task.resumption_count = (task.resumption_count or 0) + 1
    
    # Audit log
    audit = PrivacyAuditLog(
        user_id=user_id,
        action="RECOVERY_SESSION_STARTED",
        resource_type="recovery_session",
        resource_id=session.id,
        details={"task_id": task.id, "condition": session.recovery_condition}
    )
    db.add(audit)
    db.commit()
    db.refresh(session)
    return session

def record_first_action(db: Session, session_id: str, action_in: RecoveryFirstActionRequest, user_id: str) -> RecoverySession:
    session = db.query(RecoverySession).filter(RecoverySession.id == session_id, RecoverySession.user_id == user_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Recovery session not found")
        
    action_time = action_in.action_timestamp or datetime.utcnow()
    session.first_action_at = action_time
    session.first_action_type = action_in.first_action_type
    session.first_action_description = action_in.first_action_description
    
    # Calculate resumption lag
    lag_ms = int((action_time - session.started_at).total_seconds() * 1000)
    session.resumption_lag_ms = max(0, lag_ms)
    session.briefing_view_duration_ms = session.resumption_lag_ms
    
    db.commit()
    db.refresh(session)
    return session

def submit_workload_rating(db: Session, session_id: str, rating_in: RecoveryRatingSubmit, user_id: str) -> RecoverySession:
    session = db.query(RecoverySession).filter(RecoverySession.id == session_id, RecoverySession.user_id == user_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Recovery session not found")
        
    session.completed_at = datetime.utcnow()
    session.nasa_tlx_mental = rating_in.nasa_tlx_mental
    session.nasa_tlx_physical = rating_in.nasa_tlx_physical
    session.nasa_tlx_temporal = rating_in.nasa_tlx_temporal
    session.nasa_tlx_performance = rating_in.nasa_tlx_performance
    session.nasa_tlx_effort = rating_in.nasa_tlx_effort
    session.nasa_tlx_frustration = rating_in.nasa_tlx_frustration
    
    # Calculate overall NASA-TLX score (unweighted raw TLX average 0-100)
    subscales = [
        rating_in.nasa_tlx_mental,
        rating_in.nasa_tlx_physical,
        rating_in.nasa_tlx_temporal,
        rating_in.nasa_tlx_performance,
        rating_in.nasa_tlx_effort,
        rating_in.nasa_tlx_frustration
    ]
    session.nasa_tlx_overall = round(sum(subscales) / len(subscales), 2)
    session.perceived_confidence = rating_in.perceived_confidence
    session.recovery_accuracy_score = rating_in.recovery_accuracy_score or 1.0
    session.repeated_work_count = rating_in.repeated_work_count or 0
    session.qualitative_feedback = rating_in.qualitative_feedback or ""
    
    db.commit()
    db.refresh(session)
    return session
