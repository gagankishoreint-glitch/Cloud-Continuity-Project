import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, Integer, Text, JSON
from backend.app.database import Base

class CloudWatchMetric(Base):
    __tablename__ = "cloudwatch_metrics"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    namespace = Column(String(100), default="WorkContinuityCloud/App", index=True)
    metric_name = Column(String(100), nullable=False, index=True)
    value = Column(Float, nullable=False)
    unit = Column(String(50), default="Milliseconds")  # Milliseconds, Count, Bytes, Percent, Seconds
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    dimensions = Column(JSON, default=dict)  # {"Environment": "Production", "Region": "us-east-1", "Service": "CheckpointAPI"}


class ArchitectureReview(Base):
    __tablename__ = "architecture_reviews"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workload_name = Column(String(255), default="Work Continuity Cloud Production Workload")
    pillar_scores = Column(JSON, default=dict) # {"operational_excellence": 92, "security": 96, "reliability": 94, "performance_efficiency": 90, "cost_optimization": 88, "sustainability": 85}
    well_architected_findings = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)


class AWSCostModel(Base):
    __tablename__ = "aws_cost_models"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tier_name = Column(String(100), default="Standard Startup Deployment")
    user_count = Column(Integer, default=500)
    checkpoints_per_day = Column(Integer, default=2500)
    
    # Cost Breakdown (USD / month)
    compute_ec2_cost = Column(Float, default=28.40)
    compute_lambda_cost = Column(Float, default=4.20)
    database_rds_cost = Column(Float, default=32.85)
    storage_s3_cost = Column(Float, default=5.60)
    networking_cloudfront_cost = Column(Float, default=7.10)
    monitoring_cloudwatch_cost = Column(Float, default=6.50)
    total_monthly_cost = Column(Float, default=84.65)
    
    on_premises_tco_comparison = Column(Float, default=480.00) # Estimated on-prem hardware + admin cost
    cost_savings_percent = Column(Float, default=82.3)
    created_at = Column(DateTime, default=datetime.utcnow)
