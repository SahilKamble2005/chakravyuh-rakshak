from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.prediction import BlockchainStatus

class AlertResponse(BaseModel):
    id: int
    location_id: int
    probability: float
    severity: str
    trigger: str
    audio_status: Optional[str]
    acknowledged: bool
    acknowledged_by: Optional[int]
    acknowledged_at: Optional[datetime]
    data_hash: Optional[str]
    blockchain_status: BlockchainStatus
    created_at: datetime

    class Config:
        from_attributes = True

class AlertAcknowledge(BaseModel):
    acknowledged: bool = True
