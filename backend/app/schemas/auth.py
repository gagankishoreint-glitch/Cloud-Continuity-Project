from datetime import datetime
from typing import Optional, Any, Dict, List
from pydantic import BaseModel, EmailStr, Field, ConfigDict

class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: Optional[str] = "Cloud Engineer"

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    username_or_email: str
    password: str

class UserSettingsUpdate(BaseModel):
    retention_days: Optional[int] = 90
    auto_mask_tokens: Optional[bool] = True
    enable_telemetry: Optional[bool] = True
    capture_mode: Optional[str] = "explicit"
    default_device_name: Optional[str] = "Primary Workstation"
    briefing_format: Optional[str] = "concise"

class UserResponse(UserBase):
    id: str
    is_active: bool
    created_at: datetime
    settings: Dict[str, Any]
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class TokenData(BaseModel):
    user_id: Optional[str] = None
    username: Optional[str] = None

class DeviceSessionBase(BaseModel):
    device_name: str
    device_type: str = "laptop"
    ip_address: Optional[str] = "10.0.1.42"
    user_agent: Optional[str] = "WorkContinuity/1.0"

class DeviceSessionCreate(DeviceSessionBase):
    pass

class DeviceSessionResponse(DeviceSessionBase):
    id: str
    user_id: str
    last_active_at: datetime
    is_current: bool
    sync_status: str
    active_task_id: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)
