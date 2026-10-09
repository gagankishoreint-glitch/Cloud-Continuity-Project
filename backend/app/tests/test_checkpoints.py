import uuid
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def get_auth_token():
    login_res = client.post("/api/auth/login", json={
        "username_or_email": "demo_engineer",
        "password": "continuity2026"
    })
    return login_res.json()["access_token"]

def test_checkpoint_versioning_diff_and_rollback():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Create a task
    t_res = client.post("/api/tasks", json={
        "title": "Database Read Replica Setup",
        "category": "Databases"
    }, headers=headers)
    task_id = t_res.json()["id"]
    
    # 2. Create Checkpoint Version 1
    chk1_data = {
        "task_id": task_id,
        "goal": "Provision RDS PostgreSQL Read Replica in us-east-1b",
        "confirmed_progress": [
            {"id": "m1", "text": "Created subnet group for Multi-AZ", "completed": True, "provenance": "user"}
        ],
        "blocker_or_question": "Need to confirm replication lag SLA.",
        "next_action": "Run AWS CLI create-db-instance-read-replica command.",
        "resources": [
            {"id": "r1", "title": "AWS RDS Replica Docs", "type": "url", "value": "https://aws.amazon.com/rds/postgresql/"}
        ],
        "is_draft": False
    }
    chk1_res = client.post("/api/checkpoints", json=chk1_data, headers=headers)
    assert chk1_res.status_code == 200
    chk1 = chk1_res.json()
    assert chk1["version_number"] == 1
    assert chk1["task_id"] == task_id
    
    # 3. Create Checkpoint Version 2
    chk2_data = {
        "task_id": task_id,
        "goal": "Provision RDS PostgreSQL Read Replica in us-east-1b",
        "confirmed_progress": [
            {"id": "m1", "text": "Created subnet group for Multi-AZ", "completed": True, "provenance": "user"},
            {"id": "m2", "text": "Replica instance created and status is available", "completed": True, "provenance": "user"}
        ],
        "blocker_or_question": "",
        "next_action": "Configure application database read pool endpoint in backend config.",
        "resources": [
            {"id": "r1", "title": "AWS RDS Replica Docs", "type": "url", "value": "https://aws.amazon.com/rds/postgresql/"},
            {"id": "r2", "title": "Replica Endpoint URL", "type": "note", "value": "pg-replica.cb82.rds.amazonaws.com"}
        ],
        "is_draft": False
    }
    chk2_res = client.post("/api/checkpoints", json=chk2_data, headers=headers)
    assert chk2_res.status_code == 200
    chk2 = chk2_res.json()
    assert chk2["version_number"] == 2
    assert chk2["parent_checkpoint_id"] == chk1["id"]
    
    # 4. Check Diff between Version 1 and Version 2
    diff_res = client.get(f"/api/checkpoints/{chk1['id']}/diff/{chk2['id']}", headers=headers)
    assert diff_res.status_code == 200
    diff_data = diff_res.json()
    assert diff_data["version_a"] == 1
    assert diff_data["version_b"] == 2
    assert len(diff_data["diffs"]) >= 1
    assert "milestone" in diff_data["summary_text"].lower() or "next action" in diff_data["summary_text"].lower() or "blocker" in diff_data["summary_text"].lower()
    
    # 5. Rollback to Version 1
    rollback_res = client.post(f"/api/checkpoints/{chk1['id']}/rollback", headers=headers)
    assert rollback_res.status_code == 200
    rb = rollback_res.json()
    assert rb["version_number"] == 3
    assert "Rolled back" in rb["user_notes"]
