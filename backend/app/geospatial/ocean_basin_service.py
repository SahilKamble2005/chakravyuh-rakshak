from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Optional

async def check_ocean_basin(db: AsyncSession, lat: float, lon: float) -> Optional[str]:
    """
    Check which ocean basin the coordinates belong to using PostGIS ST_Contains.
    Includes a fallback buffer logic.
    """
    query = text("""
        SELECT basin_name
        FROM ocean_basin_polygons
        WHERE ST_Contains(geom, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326))
        LIMIT 1
    """)
    result = await db.execute(query, {"lat": lat, "lon": lon})
    row = result.fetchone()
    if row:
        return row[0]
        
    # Fallback buffer logic (e.g., 1 degree buffer ~ 111km)
    buffer_query = text("""
        SELECT basin_name
        FROM ocean_basin_polygons
        WHERE ST_Contains(geom, ST_Buffer(ST_SetSRID(ST_MakePoint(:lon, :lat), 4326), 1.0))
        LIMIT 1
    """)
    buffer_result = await db.execute(buffer_query, {"lat": lat, "lon": lon})
    buffer_row = buffer_result.fetchone()
    if buffer_row:
        return buffer_row[0]
        
    return None
