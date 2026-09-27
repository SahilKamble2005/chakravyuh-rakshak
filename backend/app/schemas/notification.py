from pydantic import BaseModel
from typing import Optional, Dict, Any

class PhoneRegister(BaseModel):
    phone_number: str

class OTPVerify(BaseModel):
    phone_number: str
    otp: str

class NotificationPreferenceUpdate(BaseModel):
    sms_enabled: Optional[bool]
    push_enabled: Optional[bool]
    in_app_enabled: Optional[bool]
    audio_enabled: Optional[bool]
    moderate_channels: Optional[Dict[str, Any]]
    high_channels: Optional[Dict[str, Any]]
    critical_channels: Optional[Dict[str, Any]]

class NotificationStatusResponse(BaseModel):
    id: int
    alert_id: int
    channel: str
    status: str
    error_message: Optional[str]
    sent_at: Optional[datetime]
    delivered_at: Optional[datetime]
    
    class Config:
        from_attributes = True
