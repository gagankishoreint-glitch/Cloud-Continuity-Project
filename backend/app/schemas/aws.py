from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class AWSSyllabusModuleItem(BaseModel):
    module_number: int
    title: str
    syllabus_topic: str
    project_evidence: str
    implementation_details: str
    architecture_components: List[str]
    aws_services: List[str]
    sample_artifacts: Dict[str, Any]

class TCOCalculationRequest(BaseModel):
    user_count: int = Field(500, ge=10, le=100000)
    checkpoints_per_day: int = Field(2500, ge=10, le=1000000)
    average_checkpoint_kb: float = Field(25.0, ge=1.0, le=5000.0)
    retention_days: int = Field(90, ge=7, le=3650)
    include_multi_az: bool = True
    include_waf_cloudfront: bool = True

class TCOCalculationResponse(BaseModel):
    monthly_ec2_cost: float
    monthly_lambda_cost: float
    monthly_rds_cost: float
    monthly_s3_cost: float
    monthly_cloudfront_waf_cost: float
    monthly_cloudwatch_cost: float
    total_monthly_aws_cost: float
    annual_aws_cost: float
    
    comparative_on_premise_monthly: float
    annual_savings_usd: float
    savings_percentage: float
    cost_per_checkpoint_usd: float
    cost_per_active_user_usd: float
    pricing_model_notes: List[str]

class WellArchitectedReviewSubmit(BaseModel):
    workload_name: str = "Work Continuity Cloud Workload"
    answers: Dict[str, bool] # {"sec_iam_least_privilege": true, "rel_multi_az": true, ...}

class WellArchitectedReviewResponse(BaseModel):
    id: str
    workload_name: str
    pillar_scores: Dict[str, int] # operational_excellence, security, reliability, performance, cost, sustainability (0-100)
    high_risk_issues: List[str]
    medium_risk_issues: List[str]
    recommendations: List[str]
    created_at: datetime
