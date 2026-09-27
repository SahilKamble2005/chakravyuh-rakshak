from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from app.core.database import get_db
from app.schemas.environmental import EnvironmentalDataResponse
from app.models.environmental import EnvironmentalData

router = APIRouter(prefix="/api/environmental", tags=["environmental"])

@router.get("/data", response_model=List[EnvironmentalDataResponse])
async def get_environmental_data(location_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(EnvironmentalData)
        .where(EnvironmentalData.location_id == location_id)
        .order_by(EnvironmentalData.timestamp.desc())
    )
    return result.scalars().all()

@router.get("/satellite-data")
async def get_satellite_data(lat: float, lon: float):
    # In a full implementation, this would interface with a raster processing service
    return {"message": f"Satellite data fetch simulated for {lat}, {lon}"}

@router.get("/ocean-basin-check")
async def check_ocean_basin(lat: float, lon: float):
    # This would call PostGIS ST_Contains logic
    return {"in_basin": True, "basin_name": "Indian Ocean Basin"}
