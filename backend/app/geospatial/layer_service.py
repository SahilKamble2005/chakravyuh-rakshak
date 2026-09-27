from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
import json
from typing import Dict, Any, List

async def get_layer_features(db: AsyncSession, layer_name: str) -> Dict[str, Any]:
    """Fetch GeoJSON features for a specific GIS layer."""
    query = text("""
        SELECT ST_AsGeoJSON(geom) as geom, properties
        FROM gis_layers
        WHERE layer_name = :layer_name
    """)
    result = await db.execute(query, {"layer_name": layer_name})
    
    features = []
    for row in result.fetchall():
        geom_json = json.loads(row.geom) if row.geom else None
        props = row.properties if row.properties else {}
        features.append({
            "type": "Feature",
            "geometry": geom_json,
            "properties": props
        })
        
    return {
        "type": "FeatureCollection",
        "features": features
    }
    
async def create_layer_feature(db: AsyncSession, layer_name: str, geojson: Dict[str, Any]) -> None:
    """Create a new feature in a GIS layer."""
    geom_str = json.dumps(geojson.get("geometry"))
    props_str = json.dumps(geojson.get("properties", {}))
    
    query = text("""
        INSERT INTO gis_layers (layer_name, geom, properties)
        VALUES (:layer_name, ST_GeomFromGeoJSON(:geom), :props)
    """)
    await db.execute(query, {
        "layer_name": layer_name,
        "geom": geom_str,
        "props": props_str
    })
    await db.commit()
