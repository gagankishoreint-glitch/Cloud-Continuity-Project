import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data

import uuid

def test_auth_register_and_login():
    rand_id = uuid.uuid4().hex[:8]
    test_user = {
        "email": f"test_user_{rand_id}@cloudcontinuity.io",
        "username": f"user_{rand_id}",
        "password": "Password123!",
        "full_name": "Test Engineer"
    }
    
    # 1. Register
    reg_res = client.post("/api/auth/register", json=test_user)
    assert reg_res.status_code == 200
    reg_data = reg_res.json()
    assert "access_token" in reg_data
    assert reg_data["user"]["username"] == test_user["username"]
    
    token = reg_data["access_token"]
    
    # 2. Get Me
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == test_user["email"]
    
    # 3. Login
    login_res = client.post("/api/auth/login", json={
        "username_or_email": test_user["username"],
        "password": test_user["password"]
    })
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()

def test_device_management():
    # Login as demo user
    login_res = client.post("/api/auth/login", json={
        "username_or_email": "demo_engineer",
        "password": "continuity2026"
    })
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # List devices
    dev_res = client.get("/api/auth/devices", headers=headers)
    assert dev_res.status_code == 200
    devices = dev_res.json()
    assert len(devices) >= 1
    
    # Add new device
    new_dev_res = client.post("/api/auth/devices", json={
        "device_name": "Linux ThinkPad X1",
        "device_type": "laptop"
    }, headers=headers)
    assert new_dev_res.status_code == 200
    assert new_dev_res.json()["device_name"] == "Linux ThinkPad X1"
