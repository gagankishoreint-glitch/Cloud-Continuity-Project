from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def get_auth_token():
    login_res = client.post("/api/auth/login", json={
        "username_or_email": "demo_engineer",
        "password": "continuity2026"
    })
    return login_res.json()["access_token"]

def test_tasks_crud_and_switch():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Create Task
    task_data = {
        "title": "Configure CloudWatch Custom Alarms",
        "description": "Set up alarms for resumption lag threshold > 30s.",
        "category": "DevOps",
        "priority": "high",
        "tags": ["CloudWatch", "Alarms", "Monitoring"],
        "initial_goal": "Deploy CloudWatch alarm for recovery latency exceeding SLA.",
        "initial_next_action": "Write SNS topic subscription terraform resource."
    }
    
    res = client.post("/api/tasks", json=task_data, headers=headers)
    assert res.status_code == 200
    task = res.json()
    assert task["title"] == task_data["title"]
    assert task["active_checkpoint_id"] is not None
    task_id = task["id"]
    
    # 2. Get Task
    get_res = client.get(f"/api/tasks/{task_id}", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["id"] == task_id
    
    # 3. Update Task
    update_res = client.put(f"/api/tasks/{task_id}", json={"priority": "low", "status": "paused"}, headers=headers)
    assert update_res.status_code == 200
    assert update_res.json()["priority"] == "low"
    assert update_res.json()["status"] == "paused"
    
    # 4. Switch Task Context
    switch_res = client.post("/api/tasks/switch", json={"target_task_id": task_id, "reason": "priority_shift"}, headers=headers)
    assert switch_res.status_code == 200
    assert switch_res.json()["status"] == "active"
    
    # 5. List Tasks
    list_res = client.get("/api/tasks", headers=headers)
    assert list_res.status_code == 200
    tasks = list_res.json()
    assert len(tasks) >= 1
    assert any(t["id"] == task_id for t in tasks)
