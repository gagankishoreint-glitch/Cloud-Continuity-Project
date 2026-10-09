from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.user import User, DeviceSession, PrivacyAuditLog
from backend.app.schemas.auth import (
    UserCreate,
    UserLogin,
    UserResponse,
    Token,
    UserSettingsUpdate,
    DeviceSessionCreate,
    DeviceSessionResponse
)
from backend.app.services.auth_service import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_current_user
)

router = APIRouter(prefix="/auth", tags=["Authentication & Devices"])

@router.post("/register", response_model=Token)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    # Check existing username or email
    if db.query(User).filter((User.username == user_in.username) | (User.email == user_in.email)).first():
        raise HTTPException(status_code=400, detail="Username or email already registered")
        
    user = User(
        email=user_in.email,
        username=user_in.username,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name or "Cloud Engineer"
    )
    db.add(user)
    db.flush()
    
    # Add initial device session
    device = DeviceSession(
        user_id=user.id,
        device_name="Primary Workstation",
        device_type="laptop",
        is_current=True,
        sync_status="in_sync"
    )
    db.add(device)
    
    # Audit log
    audit = PrivacyAuditLog(
        user_id=user.id,
        action="USER_REGISTERED",
        resource_type="user",
        resource_id=user.id
    )
    db.add(audit)
    db.commit()
    db.refresh(user)
    
    access_token = create_access_token(data={"sub": user.id, "username": user.username})
    return Token(access_token=access_token, token_type="bearer", user=user)

@router.post("/login", response_model=Token)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(
        (User.username == login_in.username_or_email) | (User.email == login_in.username_or_email)
    ).first()
    
    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token = create_access_token(data={"sub": user.id, "username": user.username})
    return Token(access_token=access_token, token_type="bearer", user=user)

@router.post("/token", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(
        (User.username == form_data.username) | (User.email == form_data.username)
    ).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token = create_access_token(data={"sub": user.id, "username": user.username})
    return Token(access_token=access_token, token_type="bearer", user=user)

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/settings", response_model=UserResponse)
def update_settings(settings_in: UserSettingsUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    current_settings = current_user.settings or {}
    updated_dict = current_settings.copy()
    
    for k, v in settings_in.model_dump(exclude_unset=True).items():
        updated_dict[k] = v
        
    current_user.settings = updated_dict
    db.commit()
    db.refresh(current_user)
    return current_user

@router.get("/devices", response_model=List[DeviceSessionResponse])
def list_devices(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(DeviceSession).filter(DeviceSession.user_id == current_user.id).order_by(DeviceSession.last_active_at.desc()).all()

@router.post("/devices", response_model=DeviceSessionResponse)
def register_device(device_in: DeviceSessionCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    device = DeviceSession(
        user_id=current_user.id,
        device_name=device_in.device_name,
        device_type=device_in.device_type,
        ip_address=device_in.ip_address or "10.0.1.42",
        user_agent=device_in.user_agent or "WorkContinuity/1.0",
        is_current=True,
        sync_status="in_sync"
    )
    # Set other devices to is_current=False
    db.query(DeviceSession).filter(DeviceSession.user_id == current_user.id).update({"is_current": False})
    db.add(device)
    db.commit()
    db.refresh(device)
    return device

@router.post("/devices/{device_id}/switch-current", response_model=DeviceSessionResponse)
def switch_active_device(device_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    target_device = db.query(DeviceSession).filter(DeviceSession.id == device_id, DeviceSession.user_id == current_user.id).first()
    if not target_device:
        raise HTTPException(status_code=404, detail="Device not found")
        
    db.query(DeviceSession).filter(DeviceSession.user_id == current_user.id).update({"is_current": False})
    target_device.is_current = True
    target_device.last_active_at = datetime.utcnow()
    target_device.sync_status = "in_sync"
    db.commit()
    db.refresh(target_device)
    return target_device
