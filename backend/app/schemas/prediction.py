from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.prediction import BlockchainStatus

class PredictionRequest(BaseModel):
    location_id: int
    model_version: Optional[str] = "v1"

class PredictionResponse(BaseModel):
    id: int
    location_id: int
    pattern: Optional[str]
    category: Optional[str]
    probability: float
    risk_level: Optional[str]
    confidence: Optional[float]
    model_version: Optional[str]
    data_hash: Optional[str]
    blockchain_status: BlockchainStatus
    timestamp: datetime
    
    class Config:
        from_attributes = True

class RiskZoneResponse(BaseModel):
    id: int
    location_id: Optional[int]
    probability: float
    risk_level: str
    geom_geojson: dict
    timestamp: datetime
