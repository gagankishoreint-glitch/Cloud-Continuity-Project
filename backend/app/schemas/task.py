from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict

class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = ""
    category: Optional[str] = "AWS Cloud Lab"
    priority: Optional[str] = "medium"
    color: Optional[str] = "#3b82f6"
    tags: Optional[List[str]] = []

class TaskCreate(TaskBase):
    initial_goal: Optional[str] = None
    initial_next_action: Optional[str] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None  # active, paused, completed, archived
    priority: Optional[str] = None
    color: Optional[str] = None
    tags: Optional[List[str]] = None
    active_checkpoint_id: Optional[str] = None
    total_time_spent_seconds: Optional[int] = None

class TaskSwitchRequest(BaseModel):
    target_task_id: str
    reason: Optional[str] = "manual_switch"
    save_current_draft: Optional[bool] = True

class TaskResponse(TaskBase):
    id: str
    user_id: str
    status: str
    active_checkpoint_id: Optional[str] = None
    total_time_spent_seconds: int
    resumption_count: int
    created_at: datetime
    updated_at: datetime
    checkpoints_count: Optional[int] = 0
    model_config = ConfigDict(from_attributes=True)
