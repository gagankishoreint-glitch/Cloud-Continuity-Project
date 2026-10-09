from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict

class PrivacySettingsUpdate(BaseModel):
    retention_days: int = 90
    auto_mask_tokens: bool = True
    enable_telemetry: bool = True
    capture_mode: str = "explicit"  # explicit or prompt_assisted
    allow_cross_device_push: bool = True

class PrivacyAuditLogResponse(BaseModel):
    id: str
    action: str
    resource_type: str
    resource_id: Optional[str]
    actor_ip: str
    timestamp: datetime
    details: Dict[str, Any]
    model_config = ConfigDict(from_attributes=True)

class GDPRDataExportResponse(BaseModel):
    user_id: str
    username: str
    email: str
    exported_at: datetime
    data_retention_days: int
    tasks_count: int
    checkpoints_count: int
    recovery_sessions_count: int
    data_payload: Dict[str, Any]
    cryptographic_checksum_sha256: str
