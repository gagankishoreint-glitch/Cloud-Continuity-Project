from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def get_auth_token():
    login_res = client.post("/api/auth/login", json={
        "username_or_email": "demo_engineer",
        "password": "continuity2026"
    })
    return login_res.json()["access_token"]

def test_recovery_briefing_workflow():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get seeded IAM lab task
    tasks_res = client.get("/api/tasks", headers=headers)
    assert tasks_res.status_code == 200
    tasks = tasks_res.json()
    iam_task = [t for t in tasks if "IAM" in t["title"]][0]
    
    # 1. Fetch Recovery Briefing
    briefing_res = client.get(f"/api/recovery/briefing/{iam_task['id']}", headers=headers)
    assert briefing_res.status_code == 200
    briefing = briefing_res.json()
    assert "what_you_were_doing" in briefing
    assert len(briefing["what_was_completed"]) >= 1
    assert "explicit_next_action" in briefing
    assert "resources" in briefing
    
    # 2. Start Recovery Session (timer begins)
    sess_res = client.post("/api/recovery/session/start", json={
        "task_id": iam_task["id"],
        "interruption_type": "short_break",
        "interruption_duration_seconds": 600,
        "recovery_condition": "structured_briefing"
    }, headers=headers)
    assert sess_res.status_code == 200
    session = sess_res.json()
    session_id = session["id"]
    
    # 3. Record First Action (measures resumption lag)
    action_res = client.post(f"/api/recovery/session/{session_id}/first-action", json={
        "first_action_type": "resource_open",
        "first_action_description": "Opened S3 AccessDenied troubleshooting guide."
    }, headers=headers)
    assert action_res.status_code == 200
    action_data = action_res.json()
    assert action_data["first_action_type"] == "resource_open"
    assert action_data["resumption_lag_ms"] >= 0
    
    # 4. Submit NASA-TLX Workload Rating
    rating_res = client.post(f"/api/recovery/session/{session_id}/rating", json={
        "nasa_tlx_mental": 25,
        "nasa_tlx_physical": 10,
        "nasa_tlx_temporal": 20,
        "nasa_tlx_performance": 15,
        "nasa_tlx_effort": 30,
        "nasa_tlx_frustration": 15,
        "perceived_confidence": 9,
        "recovery_accuracy_score": 1.0,
        "repeated_work_count": 0,
        "qualitative_feedback": "The briefing immediately reminded me of the AccessDenied blocker and next command."
    }, headers=headers)
    assert rating_res.status_code == 200
    rating_data = rating_res.json()
    assert rating_data["nasa_tlx_overall"] is not None
    assert rating_data["perceived_confidence"] == 9
    
    # 5. Fetch Recovery Stats
    stats_res = client.get("/api/recovery/stats", headers=headers)
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["total_recoveries"] >= 1
