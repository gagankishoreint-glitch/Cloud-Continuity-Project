from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

class MilestoneItem(BaseModel):
    id: str
    text: str
    completed: bool = True
    timestamp: Optional[str] = None
    provenance: Optional[str] = "user"  # user, system, inferred

class ResourceItem(BaseModel):
    id: str
    title: str
    type: str = "url"  # url, doc, code, terminal, note
    value: str
    notes: Optional[str] = ""

class CheckpointBase(BaseModel):
    goal: str = Field(..., min_length=1)
    confirmed_progress: List[MilestoneItem] = []
    blocker_or_question: Optional[str] = ""
    next_action: str = Field(..., min_length=1)
    resources: List[ResourceItem] = []
    user_notes: Optional[str] = ""
    provenance: Optional[Dict[str, Any]] = {}
    tags: Optional[List[str]] = []
    device_origin: Optional[str] = "Primary Workstation"

class CheckpointCreate(CheckpointBase):
    task_id: str
    is_draft: Optional[bool] = False
    client_mutation_id: Optional[str] = None

class CheckpointUpdate(BaseModel):
    goal: Optional[str] = None
    confirmed_progress: Optional[List[MilestoneItem]] = None
    blocker_or_question: Optional[str] = None
    next_action: Optional[str] = None
    resources: Optional[List[ResourceItem]] = None
    user_notes: Optional[str] = None
    provenance: Optional[Dict[str, Any]] = None
    is_draft: Optional[bool] = None
    tags: Optional[List[str]] = None

class CheckpointResponse(CheckpointBase):
    id: str
    task_id: str
    user_id: str
    version_number: int
    parent_checkpoint_id: Optional[str] = None
    is_draft: bool
    client_mutation_id: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class CheckpointDiffItem(BaseModel):
    field: str
    old_value: Any
    new_value: Any
    change_type: str  # added, removed, modified, unchanged

class CheckpointDiffResponse(BaseModel):
    checkpoint_a_id: str
    checkpoint_b_id: str
    version_a: int
    version_b: int
    diffs: List[CheckpointDiffItem]
    summary_text: str
