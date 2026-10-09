import time
import random
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.aws_metrics import CloudWatchMetric
from backend.app.schemas.aws import (
    AWSSyllabusModuleItem,
    TCOCalculationRequest,
    TCOCalculationResponse,
    WellArchitectedReviewSubmit,
    WellArchitectedReviewResponse
)
from backend.app.services.aws_syllabus_service import (
    SYLLABUS_MODULES,
    calculate_tco,
    perform_well_architected_review
)

router = APIRouter(prefix="/aws", tags=["AWS Architecture & Operations"])

@router.get("/syllabus", response_model=List[AWSSyllabusModuleItem])
def get_syllabus_modules():
    return [AWSSyllabusModuleItem(**m) for m in SYLLABUS_MODULES]

@router.post("/tco-calculator", response_model=TCOCalculationResponse)
def calculate_aws_tco(req: TCOCalculationRequest):
    return calculate_tco(req)

@router.post("/well-architected", response_model=WellArchitectedReviewResponse)
def review_workload(review_in: WellArchitectedReviewSubmit):
    return perform_well_architected_review(review_in)

@router.get("/cloudwatch/metrics")
def get_cloudwatch_metrics(
    namespace: str = "WorkContinuityCloud/App",
    metric_name: Optional[str] = None,
    hours: int = 24,
    db: Session = Depends(get_db)
):
    since = datetime.utcnow() - timedelta(hours=hours)
    query = db.query(CloudWatchMetric).filter(
        CloudWatchMetric.namespace == namespace,
        CloudWatchMetric.timestamp >= since
    )
    if metric_name:
        query = query.filter(CloudWatchMetric.metric_name == metric_name)
        
    metrics = query.order_by(CloudWatchMetric.timestamp.asc()).all()
    
    # Format for chart display
    return [
        {
            "id": m.id,
            "metric_name": m.metric_name,
            "value": round(m.value, 2),
            "unit": m.unit,
            "timestamp": m.timestamp.isoformat(),
            "time_label": m.timestamp.strftime("%H:%M")
        }
        for m in metrics
    ]

@router.post("/cloudwatch/synthetic-load")
def run_synthetic_load_test(
    concurrency: int = 100,
    iterations: int = 5,
    db: Session = Depends(get_db)
):
    """
    Simulates concurrent checkpoint saves and records latency metrics to CloudWatch emulator.
    """
    start_time = time.time()
    latencies = []
    
    # Synthetic latency simulation based on concurrency
    for i in range(iterations):
        # Base latency ~35ms + 0.1ms per concurrent user + random jitter
        sim_latency = 35.0 + (concurrency * 0.08) + random.uniform(2.0, 15.0)
        latencies.append(sim_latency)
        
        # Record metric to DB
        metric = CloudWatchMetric(
            namespace="WorkContinuityCloud/App",
            metric_name="SyntheticSaveLatency_MS",
            value=sim_latency,
            unit="Milliseconds",
            timestamp=datetime.utcnow() - timedelta(seconds=(iterations - i) * 2),
            dimensions={"Concurrency": str(concurrency), "TestType": "StressTest"}
        )
        db.add(metric)
        
    db.commit()
    
    total_duration = time.time() - start_time
    p50 = float(random.choice(latencies))
    p95 = float(max(latencies) * 0.98)
    p99 = float(max(latencies))
    tps = round(concurrency * iterations / max(total_duration, 0.05), 1)
    
    return {
        "status": "COMPLETED",
        "concurrency": concurrency,
        "total_requests": concurrency * iterations,
        "successful_requests": concurrency * iterations,
        "failed_requests": 0,
        "error_rate_pct": 0.0,
        "average_latency_ms": round(sum(latencies) / len(latencies), 2),
        "p50_latency_ms": round(p50, 2),
        "p95_latency_ms": round(p95, 2),
        "p99_latency_ms": round(p99, 2),
        "throughput_tps": tps,
        "aws_auto_scaling_trigger": "ALB TargetResponseTime < 200ms (Healthy: Scale Out Not Required)"
    }
