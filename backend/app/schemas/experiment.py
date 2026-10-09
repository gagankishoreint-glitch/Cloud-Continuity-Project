from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

class BenchmarkTaskSchema(BaseModel):
    id: str
    name: str
    domain: str
    complexity: str
    brief_description: str
    scenario_details: Dict[str, Any]
    initial_tabs: List[Dict[str, Any]]
    pre_interruption_progress: List[Dict[str, Any]]
    current_blocker: str
    intended_next_action: str
    verification_check: Dict[str, Any]

class ExperimentTrialCreate(BaseModel):
    study_id: Optional[str] = "default-study"
    participant_id: str
    task_id: str
    task_name: str
    condition: str = Field(..., description="A_MANUAL or B_STRUCTURED")
    task_order: int = 1
    interruption_duration_sec: int = 180
    interruption_type: Optional[str] = "distractor_math_puzzle"
    resumption_time_sec: float
    briefing_reading_time_sec: Optional[float] = 0.0
    recovery_accuracy_percent: float = 100.0
    repeated_work_count: int = 0
    first_action_correct: bool = True
    nasa_mental_demand: int = 50
    nasa_physical_demand: int = 10
    nasa_temporal_demand: int = 40
    nasa_performance: int = 30
    nasa_effort: int = 45
    nasa_frustration: int = 25
    confidence_rating: int = 8
    qualitative_notes: Optional[str] = ""

class ExperimentTrialResponse(ExperimentTrialCreate):
    id: str
    nasa_overall_score: float
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class StudyStatisticsResponse(BaseModel):
    study_id: str
    total_participants: int
    total_trials: int
    
    # Manual (Condition A) Stats
    condition_a_mean_resumption_sec: float
    condition_a_median_resumption_sec: float
    condition_a_std_sec: float
    condition_a_mean_tlx: float
    condition_a_accuracy_pct: float
    condition_a_repeated_work_mean: float
    
    # Structured (Condition B) Stats
    condition_b_mean_resumption_sec: float
    condition_b_median_resumption_sec: float
    condition_b_std_sec: float
    condition_b_mean_tlx: float
    condition_b_accuracy_pct: float
    condition_b_repeated_work_mean: float
    
    # Paired Statistical Inference
    mean_difference_sec: float  # D_i = T_A - T_B (Positive = improvement)
    resumption_speedup_percent: float
    confidence_interval_95: List[float] # [lower, upper]
    t_statistic: float
    p_value: float
    statistically_significant: bool
    cohens_d_effect_size: float
    wilcoxon_statistic: Optional[float]
    wilcoxon_p_value: Optional[float]
    
    # NASA-TLX Subscales Comparison
    tlx_subscale_breakdown: Dict[str, Dict[str, float]]
    
    # Scientific Findings Summary
    scientific_conclusions: List[str]
