from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import text
from typing import List, Optional, Dict, Any
from app.core.database import get_db
from app.models import (
    CyclonicSystem, Classification, TrackForecast, LandfallEstimate,
    EnvironmentalData, Bulletin, Detection, GISTrackGeometry
)
from app.schemas import (
    CyclonicSystemSummary, SystemDetailResponse, ForecastPoint,
    LandfallSummary, ClassificationSummary, EnvironmentalSummary,
    AnalysisProgressResponse
)
from app.services.cyclone_pipeline import CyclonePipelineService

router = APIRouter(prefix="/api/systems", tags=["cyclonic_systems"])

@router.get("/active", response_model=List[CyclonicSystemSummary])
async def get_active_systems(
    basin: Optional[str] = Query(None, description="Filter by basin name"),
    db: AsyncSession = Depends(get_db)
):
    query = select(CyclonicSystem).order_by(CyclonicSystem.current_wind_kmh.desc())
    if basin and basin != "All Basins":
        query = query.where(CyclonicSystem.basin == basin)
    result = await db.execute(query)
    systems = result.scalars().all()
    return systems

@router.get("/{system_id}/detail", response_model=SystemDetailResponse)
async def get_system_detail(system_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CyclonicSystem).where(CyclonicSystem.id == system_id))
    system = result.scalars().first()
    if not system:
        raise HTTPException(status_code=404, detail="Cyclonic system not found")

    # Fetch latest classification
    cls_res = await db.execute(
        select(Classification).where(Classification.system_id == system_id).order_by(Classification.timestamp.desc())
    )
    classification = cls_res.scalars().first()

    # Fetch latest environmental data
    env_res = await db.execute(
        select(EnvironmentalData).where(EnvironmentalData.system_id == system_id).order_by(EnvironmentalData.timestamp.desc())
    )
    environmental = env_res.scalars().first()

    # Fetch track forecasts
    fc_res = await db.execute(
        select(TrackForecast).where(TrackForecast.system_id == system_id).order_by(TrackForecast.lead_h.asc())
    )
    forecasts = [
        ForecastPoint(
            lead_h=f.lead_h,
            lat=f.lat,
            lon=f.lon,
            uncertainty_km=f.uncertainty_km,
            category=f.category,
            wind_kmh=f.wind_kmh,
            wind_kt=f.wind_kt,
            pressure_hpa=f.pressure_hpa,
            ri_probability=f.ri_probability
        ) for f in fc_res.scalars().all()
    ]

    # Fetch landfall estimates
    lf_res = await db.execute(
        select(LandfallEstimate).where(LandfallEstimate.system_id == system_id).order_by(LandfallEstimate.probability.desc())
    )
    landfalls = [
        LandfallSummary(
            district_id=l.district_id,
            district_name=l.district_name,
            state=l.state,
            probability=l.probability,
            eta_window_start=l.eta_window_start,
            eta_window_end=l.eta_window_end,
            surge_height_m=l.surge_height_m
        ) for l in lf_res.scalars().all()
    ]

    # Fetch latest bulletin hash
    bltn_res = await db.execute(
        select(Bulletin).where(Bulletin.system_id == system_id).order_by(Bulletin.issued_at.desc())
    )
    bulletin = bltn_res.scalars().first()

    return SystemDetailResponse(
        system=system,
        classification=classification,
        environmental=environmental,
        forecasts=forecasts,
        landfall_estimates=landfalls,
        latest_bulletin_hash=bulletin.sha256_hash if bulletin else None,
        blockchain_anchored=bulletin.blockchain_tx_ref is not None if bulletin else False
    )

@router.get("/{system_id}/track")
async def get_system_track_geojson(system_id: int, db: AsyncSession = Depends(get_db)):
    """Returns past and forecast tracks as GeoJSON LineStrings"""
    res = await db.execute(
        text(f"SELECT geom_type, ST_AsGeoJSON(geom) as geojson, properties FROM gis_track_geometry WHERE system_id = {system_id}")
    )
    features = []
    for row in res.fetchall():
        gtype, geojson_str, props = row
        import json
        features.append({
            "type": "Feature",
            "geometry": json.loads(geojson_str),
            "properties": {**(props or {}), "geom_type": gtype, "system_id": system_id}
        })
    return {"type": "FeatureCollection", "features": features}

@router.get("/{system_id}/forecast")
async def get_system_forecast(system_id: int, db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(TrackForecast).where(TrackForecast.system_id == system_id).order_by(TrackForecast.lead_h.asc())
    )
    return res.scalars().all()

@router.get("/{system_id}/landfall")
async def get_system_landfall(system_id: int, db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(LandfallEstimate).where(LandfallEstimate.system_id == system_id).order_by(LandfallEstimate.probability.desc())
    )
    return res.scalars().all()

@router.post("/{system_id}/analyze", response_model=AnalysisProgressResponse)
async def run_cyclone_analysis(system_id: int, db: AsyncSession = Depends(get_db)):
    """
    Triggers the full 12-step AI/ML Satellite Analysis Cycle
    """
    result = await CyclonePipelineService.run_analysis_cycle(db=db, system_id=system_id)
    return result
