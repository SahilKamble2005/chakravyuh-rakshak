from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class EnvironmentalDataResponse(BaseModel):
    id: int
    location_id: int
    sea_surface_temp: Optional[float]
    wind_shear: Optional[float]
    cloud_top_temp: Optional[float]
    rainfall: Optional[float]
    humidity: Optional[float]
    ocean_heat_content: Optional[float]
    timestamp: datetime

    class Config:
        from_attributes = True
