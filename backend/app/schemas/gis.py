from pydantic import BaseModel
from typing import Optional, Dict, Any, List

class GeocodeRequest(BaseModel):
    query: str

class GeocodeResponse(BaseModel):
    display_name: str
    lat: float
    lon: float
    boundingbox: Optional[List[str]]

class LayerResponse(BaseModel):
    id: int
    name: str
    layer_type: str
    is_active: bool
    style_config: Optional[Dict[str, Any]]
    
    class Config:
        from_attributes = True

class ExportRequest(BaseModel):
    format: str
    layer_ids: Optional[List[int]]
