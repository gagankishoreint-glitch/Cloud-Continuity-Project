from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.database import get_db
from backend.app.models.user import User, PrivacyAuditLog
from backend.app.models.task import Task, TaskSwitchLog
from backend.app.models.checkpoint import Checkpoint
from backend.app.schemas.task import TaskCreate, TaskUpdate, TaskResponse, TaskSwitchRequest
from backend.app.services.auth_service import get_current_user

router = APIRouter(prefix="/tasks", tags=["Task Management"])

@router.get("", response_model=List[TaskResponse])
def get_tasks(
    status: Optional[str] = None,
    category: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Task).filter(Task.user_id == current_user.id)
    if status:
        query = query.filter(Task.status == status)
    if category:
        query = query.filter(Task.category == category)
        
    tasks = query.order_by(Task.updated_at.desc()).all()
    
    # Enrich with checkpoint counts
    results = []
    for t in tasks:
        cnt = db.query(func.count(Checkpoint.id)).filter(Checkpoint.task_id == t.id).scalar() or 0
        resp = TaskResponse.model_validate(t)
        resp.checkpoints_count = cnt
        results.append(resp)
        
    return results

@router.post("", response_model=TaskResponse)
def create_task(
    task_in: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = Task(
        user_id=current_user.id,
        title=task_in.title,
        description=task_in.description or "",
        category=task_in.category or "AWS Cloud Lab",
        priority=task_in.priority or "medium",
        color=task_in.color or "#3b82f6",
        tags=task_in.tags or [],
        status="active"
    )
    db.add(task)
    db.flush()
    
    # If initial goal was provided, create version 1 checkpoint
    if task_in.initial_goal:
        chk = Checkpoint(
            task_id=task.id,
            user_id=current_user.id,
            version_number=1,
            goal=task_in.initial_goal,
            confirmed_progress=[{"id": "p1", "text": "Task initialized", "completed": True, "timestamp": datetime.utcnow().strftime("%I:%M %p"), "provenance": "user"}],
            blocker_or_question="",
            next_action=task_in.initial_next_action or "Review environment and run initial sanity check.",
            resources=[],
            user_notes="",
            is_draft=False,
            device_origin=current_user.settings.get("default_device_name", "Primary Workstation")
        )
        db.add(chk)
        db.flush()
        task.active_checkpoint_id = chk.id
        
    audit = PrivacyAuditLog(
        user_id=current_user.id,
        action="TASK_CREATED",
        resource_type="task",
        resource_id=task.id,
        details={"title": task.title}
    )
    db.add(audit)
    db.commit()
    db.refresh(task)
    
    resp = TaskResponse.model_validate(task)
    resp.checkpoints_count = 1 if task_in.initial_goal else 0
    return resp

@router.get("/{task_id}", response_model=TaskResponse)
def get_task(task_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    cnt = db.query(func.count(Checkpoint.id)).filter(Checkpoint.task_id == task.id).scalar() or 0
    resp = TaskResponse.model_validate(task)
    resp.checkpoints_count = cnt
    return resp

@router.put("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: str,
    task_in: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    for k, v in task_in.model_dump(exclude_unset=True).items():
        setattr(task, k, v)
        
    task.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(task)
    
    cnt = db.query(func.count(Checkpoint.id)).filter(Checkpoint.task_id == task.id).scalar() or 0
    resp = TaskResponse.model_validate(task)
    resp.checkpoints_count = cnt
    return resp

@router.delete("/{task_id}")
def delete_task(task_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    db.delete(task)
    
    audit = PrivacyAuditLog(
        user_id=current_user.id,
        action="TASK_DELETED",
        resource_type="task",
        resource_id=task_id,
        details={"title": task.title}
    )
    db.add(audit)
    db.commit()
    return {"message": "Task and all associated checkpoints successfully deleted", "id": task_id}

@router.post("/switch", response_model=TaskResponse)
def switch_task_context(
    switch_req: TaskSwitchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target = db.query(Task).filter(Task.id == switch_req.target_task_id, Task.user_id == current_user.id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Target task not found")
        
    # Find previously active task
    prev_active = db.query(Task).filter(Task.user_id == current_user.id, Task.status == "active", Task.id != target.id).first()
    
    if prev_active:
        prev_active.status = "paused"
        prev_active.updated_at = datetime.utcnow()
        
    target.status = "active"
    target.updated_at = datetime.utcnow()
    
    # Log task switch
    log = TaskSwitchLog(
        user_id=current_user.id,
        from_task_id=prev_active.id if prev_active else None,
        to_task_id=target.id,
        reason=switch_req.reason or "manual_switch"
    )
    db.add(log)
    db.commit()
    db.refresh(target)
    
    cnt = db.query(func.count(Checkpoint.id)).filter(Checkpoint.task_id == target.id).scalar() or 0
    resp = TaskResponse.model_validate(target)
    resp.checkpoints_count = cnt
    return resp
