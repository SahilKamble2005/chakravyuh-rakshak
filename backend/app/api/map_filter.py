from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class FilterRequest(BaseModel):
    severity: str
    
@router.post("/filter")
async def filter_map(req: FilterRequest):
    return {"filtered_features": []}
