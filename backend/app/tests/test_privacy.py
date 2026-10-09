from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def get_auth_token():
    login_res = client.post("/api/auth/login", json={
        "username_or_email": "demo_engineer",
        "password": "continuity2026"
    })
    return login_res.json()["access_token"]

def test_privacy_governance_and_gdpr_export():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Test GDPR Full Data Export
    export_res = client.get("/api/privacy/export", headers=headers)
    assert export_res.status_code == 200
    export_data = export_res.json()
    assert "cryptographic_checksum_sha256" in export_data
    assert len(export_data["cryptographic_checksum_sha256"]) == 64
    assert "data_payload" in export_data
    assert "tasks" in export_data["data_payload"]
    assert "checkpoints" in export_data["data_payload"]
    
    # 2. Test Audit Log
    logs_res = client.get("/api/privacy/audit-logs", headers=headers)
    assert logs_res.status_code == 200
    logs = logs_res.json()
    assert len(logs) >= 1
    
    # 3. Update Privacy Settings
    settings_res = client.put("/api/privacy/settings", json={
        "retention_days": 60,
        "auto_mask_tokens": True,
        "enable_telemetry": True,
        "capture_mode": "explicit",
        "allow_cross_device_push": True
    }, headers=headers)
    assert settings_res.status_code == 200
    assert settings_res.json()["settings"]["retention_days"] == 60
