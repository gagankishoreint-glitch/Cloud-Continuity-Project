from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

class RecoveryBriefingResponse(BaseModel):
    task_id: str
    task_title: str
    task_category: str
    checkpoint_id: str
    version_number: int
    last_saved_at: datetime
    elapsed_time_human: str  # e.g., "45 minutes ago"
    
    # Four Core Sections of the Briefing
    what_you_were_doing: str
    what_was_completed: List[str]
    current_blocker: Optional[str]
    explicit_next_action: str
    
    # Actionable resources to restore
    resources: List[Dict[str, Any]]
    
    # Scientific & Provenance annotations
    provenance_summary: Dict[str, str]
    confidence_warning: Optional[str] = None

class RecoverySessionCreate(BaseModel):
    task_id: str
    checkpoint_id: Optional[str] = None
    interruption_type: Optional[str] = "short_break"  # short_break, long_break, task_switch, cross_device, unexpected
    interruption_duration_seconds: Optional[int] = 300
    recovery_condition: Optional[str] = "structured_briefing"  # structured_briefing vs manual_recovery

class RecoveryFirstActionRequest(BaseModel):
    first_action_type: str = Field(..., description="e.g. resource_open, terminal_exec, code_edit, milestone_check")
    first_action_description: str = Field(..., description="Concrete description of what the user did")
    action_timestamp: Optional[datetime] = None

class RecoveryRatingSubmit(BaseModel):
    # NASA-TLX 6 dimensions (0 to 100)
    nasa_tlx_mental: int = Field(..., ge=0, le=100)
    nasa_tlx_physical: int = Field(..., ge=0, le=100)
    nasa_tlx_temporal: int = Field(..., ge=0, le=100)
    nasa_tlx_performance: int = Field(..., ge=0, le=100)
    nasa_tlx_effort: int = Field(..., ge=0, le=100)
    nasa_tlx_frustration: int = Field(..., ge=0, le=100)
    
    perceived_confidence: int = Field(..., ge=1, le=10)
    recovery_accuracy_score: Optional[float] = Field(1.0, ge=0.0, le=1.0)
    repeated_work_count: Optional[int] = Field(0, ge=0)
    qualitative_feedback: Optional[str] = ""

class RecoverySessionResponse(BaseModel):
    id: str
    user_id: str
    task_id: str
    checkpoint_id: Optional[str] = None
    interruption_type: str = "short_break"
    interruption_duration_seconds: int = 300
    started_at: datetime
    first_action_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    briefing_view_duration_ms: int = 0
    resumption_lag_ms: int = 0
    resumption_lag_seconds: float = 0.0
    first_action_type: Optional[str] = "resource_open"
    first_action_description: Optional[str] = ""
    recovery_condition: str = "structured_briefing"
    recovery_accuracy_score: float = 1.0
    repeated_work_count: int = 0
    nasa_tlx_mental: Optional[int] = None
    nasa_tlx_physical: Optional[int] = None
    nasa_tlx_temporal: Optional[int] = None
    nasa_tlx_performance: Optional[int] = None
    nasa_tlx_effort: Optional[int] = None
    nasa_tlx_frustration: Optional[int] = None
    nasa_tlx_overall: Optional[float] = None
    perceived_confidence: Optional[int] = None
    qualitative_feedback: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class RecoveryStatsSummary(BaseModel):
    total_recoveries: int
    average_resumption_lag_sec: float
    median_resumption_lag_sec: float
    average_nasa_tlx_score: float
    average_confidence: float
    average_accuracy_percent: float
    total_repeated_work_avoided: int
    condition_breakdown: Dict[str, Any]
