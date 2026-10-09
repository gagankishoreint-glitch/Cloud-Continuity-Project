from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_aws_syllabus_and_operations():
    # 1. Verify 10 Syllabus Modules
    s_res = client.get("/api/aws/syllabus")
    assert s_res.status_code == 200
    modules = s_res.json()
    assert len(modules) == 10
    assert modules[0]["module_number"] == 1
    assert modules[9]["module_number"] == 10
    
    # 2. Test TCO Calculator
    tco_res = client.post("/api/aws/tco-calculator", json={
        "user_count": 500,
        "checkpoints_per_day": 2500,
        "average_checkpoint_kb": 25.0,
        "retention_days": 90,
        "include_multi_az": True,
        "include_waf_cloudfront": True
    })
    assert tco_res.status_code == 200
    tco = tco_res.json()
    assert tco["total_monthly_aws_cost"] > 0
    assert tco["savings_percentage"] > 50.0
    assert len(tco["pricing_model_notes"]) >= 2
    
    # 3. Test Well-Architected Framework Review
    wa_res = client.post("/api/aws/well-architected", json={
        "workload_name": "Work Continuity Cloud Production Workload",
        "answers": {
            "sec_least_privilege": True,
            "sec_encryption": True,
            "rel_multi_az": True,
            "rel_backup": True,
            "perf_graviton": True,
            "cost_lifecycle": True,
            "ops_iac": True,
            "sus_managed_services": True
        }
    })
    assert wa_res.status_code == 200
    wa = wa_res.json()
    assert wa["pillar_scores"]["security"] >= 90
    assert len(wa["recommendations"]) >= 1
    
    # 4. Test CloudWatch Synthetic Load Generator
    load_res = client.post("/api/aws/cloudwatch/synthetic-load?concurrency=50&iterations=3")
    assert load_res.status_code == 200
    load_data = load_res.json()
    assert load_data["status"] == "COMPLETED"
    assert load_data["successful_requests"] == 150
    assert load_data["average_latency_ms"] > 0
    
    # 5. Test CloudWatch Metrics
    metrics_res = client.get("/api/aws/cloudwatch/metrics")
    assert metrics_res.status_code == 200
    metrics = metrics_res.json()
    assert len(metrics) >= 1
