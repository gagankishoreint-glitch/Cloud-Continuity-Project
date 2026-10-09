from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_research_experiment_suite():
    # 1. Fetch Benchmarks
    b_res = client.get("/api/experiments/benchmarks")
    assert b_res.status_code == 200
    benchmarks = b_res.json()
    assert len(benchmarks) >= 3
    assert any("IAM" in b["name"] for b in benchmarks)
    
    # 2. Fetch Statistical Analysis
    stats_res = client.get("/api/experiments/stats")
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["total_trials"] >= 10
    assert stats["mean_difference_sec"] > 0
    assert stats["statistically_significant"] is True
    assert "scientific_conclusions" in stats
    assert len(stats["confidence_interval_95"]) == 2
    
    # 3. Submit New Participant Trial
    trial_data = {
        "participant_id": "P-99",
        "task_id": "bench-01",
        "task_name": "AWS IAM AccessDenied Debugging",
        "condition": "B_STRUCTURED",
        "task_order": 1,
        "interruption_duration_sec": 180,
        "resumption_time_sec": 12.8,
        "recovery_accuracy_percent": 100.0,
        "repeated_work_count": 0,
        "first_action_correct": True,
        "nasa_mental_demand": 25,
        "nasa_physical_demand": 5,
        "nasa_temporal_demand": 20,
        "nasa_performance": 10,
        "nasa_effort": 25,
        "nasa_frustration": 15,
        "confidence_rating": 9,
        "qualitative_notes": "Very fast context restoration."
    }
    t_res = client.post("/api/experiments/trials", json=trial_data)
    assert t_res.status_code == 200
    assert t_res.json()["participant_id"] == "P-99"
    
    # 4. Export Scientific Report
    rep_res = client.get("/api/experiments/export-report?format=markdown")
    assert rep_res.status_code == 200
    assert "Cognitive Workload & Resumption Lag" in rep_res.text
