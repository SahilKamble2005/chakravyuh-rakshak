from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import List, Dict, Any

async def generate_region_grid(db: AsyncSession, location_id: int, bbox: List[float]) -> List[Dict[str, Any]]:
    """
    Generate a region grid using PostGIS ST_SquareGrid.
    bbox: [min_lon, min_lat, max_lon, max_lat]
    """
    # Grid size in degrees, e.g. 0.1 degree
    grid_size = 0.1 
    query = text("""
        SELECT ST_AsGeoJSON(geom) as geojson
        FROM (
            SELECT (ST_Dump(ST_SquareGrid(:grid_size, ST_MakeEnvelope(:min_lon, :min_lat, :max_lon, :max_lat, 4326)))).geom AS geom
        ) subquery
    """)
    result = await db.execute(query, {
        "grid_size": grid_size,
        "min_lon": bbox[0],
        "min_lat": bbox[1],
        "max_lon": bbox[2],
        "max_lat": bbox[3]
    })
    
    grids = []
    for row in result.fetchall():
        grids.append({
            "type": "Feature",
            "geometry": row[0],
            "properties": {}
        })
    return grids
