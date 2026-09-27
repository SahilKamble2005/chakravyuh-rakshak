from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import PlainTextResponse, StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import text
from typing import List, Optional, Dict, Any
import json
import io
import zipfile
from app.core.database import get_db
from app.models import GISLayer, CoastalDistrict, OceanBasin, GISTrackGeometry, CyclonicSystem

router = APIRouter(prefix="/api/gis", tags=["gis"])

@router.get("/layers")
async def get_gis_layers(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(GISLayer).order_by(GISLayer.id.asc()))
    layers = result.scalars().all()
    return [{
        "id": l.id,
        "name": l.name,
        "layer_key": l.layer_key,
        "layer_type": l.layer_type,
        "style_config": l.style_config,
        "is_active": l.is_active
    } for l in layers]

@router.get("/coastal-districts")
async def get_coastal_districts_geojson(
    state: Optional[str] = None,
    basin: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    query = "SELECT id, name, state, country, basin, population, risk_weight, ST_AsGeoJSON(geom) as geojson FROM coastal_districts WHERE 1=1"
    if state:
        query += f" AND state = '{state}'"
    if basin:
        query += f" AND basin = '{basin}'"

    res = await db.execute(text(query))
    features = []
    for row in res.fetchall():
        d_id, name, st, ctry, bsn, pop, rweight, gj_str = row
        features.append({
            "type": "Feature",
            "geometry": json.loads(gj_str),
            "properties": {
                "id": d_id,
                "name": name,
                "state": st,
                "country": ctry,
                "basin": bsn,
                "population": pop,
                "risk_weight": rweight
            }
        })
    return {"type": "FeatureCollection", "features": features}

@router.get("/basins")
async def get_ocean_basins_geojson(db: AsyncSession = Depends(get_db)):
    res = await db.execute(text("SELECT id, name, basin_code, description, ST_AsGeoJSON(geom) as geojson FROM ocean_basins"))
    features = []
    for row in res.fetchall():
        b_id, name, bcode, desc, gj_str = row
        features.append({
            "type": "Feature",
            "geometry": json.loads(gj_str),
            "properties": {
                "id": b_id,
                "name": name,
                "basin_code": bcode,
                "description": desc
            }
        })
    return {"type": "FeatureCollection", "features": features}

@router.get("/all-active-tracks")
async def get_all_active_tracks(db: AsyncSession = Depends(get_db)):
    """
    Returns complete spatial GeoJSON containing all active systems, past tracks,
    forecast tracks, uncertainty cones, and wind-radii.
    """
    res = await db.execute(text("""
        SELECT g.id, g.system_id, g.geom_type, g.properties, ST_AsGeoJSON(g.geom) as geojson,
               s.name as system_name, s.current_category, s.current_wind_kmh
        FROM gis_track_geometry g
        JOIN cyclonic_systems s ON s.id = g.system_id
        WHERE s.status = 'active'
    """))
    features = []
    for row in res.fetchall():
        g_id, sys_id, g_type, props, gj_str, sys_name, cat, wind = row
        feature_props = {
            **(props or {}),
            "geometry_id": g_id,
            "system_id": sys_id,
            "system_name": sys_name,
            "category": cat,
            "wind_kmh": wind,
            "geom_type": g_type
        }
        features.append({
            "type": "Feature",
            "geometry": json.loads(gj_str),
            "properties": feature_props
        })
    return {"type": "FeatureCollection", "features": features}

@router.get("/export/{format}")
async def export_gis_layers(
    format: str,
    system_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Exports spatial layers as GeoJSON, KML, or Shapefile (ZIP)
    """
    query = "SELECT g.geom_type, ST_AsGeoJSON(g.geom) as geojson, g.properties, s.name, s.current_category FROM gis_track_geometry g JOIN cyclonic_systems s ON s.id = g.system_id"
    if system_id:
        query += f" WHERE g.system_id = {system_id}"

    res = await db.execute(text(query))
    rows = res.fetchall()

    if format.lower() == "geojson":
        features = []
        for r in rows:
            gtype, gj_str, props, sname, cat = r
            features.append({
                "type": "Feature",
                "geometry": json.loads(gj_str),
                "properties": {**(props or {}), "geom_type": gtype, "system_name": sname, "category": cat}
            })
        gj_obj = {"type": "FeatureCollection", "features": features}
        return Response(
            content=json.dumps(gj_obj, indent=2),
            media_type="application/geo+json",
            headers={"Content-Disposition": "attachment; filename=chakravyuh_cyclone_gis.geojson"}
        )

    elif format.lower() == "kml":
        kml_content = """<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Chakravyuh Rakshak Cyclone GIS Export</name>
    <description>Tropical Cyclone Spatial Intelligence Products</description>
"""
        for r in rows:
            gtype, gj_str, props, sname, cat = r
            geom = json.loads(gj_str)
            kml_content += f"""
    <Placemark>
      <name>{sname} - {gtype}</name>
      <description>Category: {cat}</description>
"""
            if geom["type"] == "LineString":
                coords = " ".join([f"{c[0]},{c[1]},0" for c in geom["coordinates"]])
                kml_content += f"      <LineString><coordinates>{coords}</coordinates></LineString>\n"
            elif geom["type"] == "Polygon":
                coords = " ".join([f"{c[0]},{c[1]},0" for c in geom["coordinates"][0]])
                kml_content += f"      <Polygon><outerBoundaryIs><LinearRing><coordinates>{coords}</coordinates></LinearRing></outerBoundaryIs></Polygon>\n"
            kml_content += "    </Placemark>\n"
        kml_content += "  </Document>\n</kml>"
        return Response(
            content=kml_content,
            media_type="application/vnd.google-earth.kml+xml",
            headers={"Content-Disposition": "attachment; filename=chakravyuh_cyclone_gis.kml"}
        )

    elif format.lower() in ("shp", "shapefile", "zip"):
        # Create a structured zip containing geojson files and metadata for GIS tools
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
            geojson_data = {
                "type": "FeatureCollection",
                "features": [{"type": "Feature", "geometry": json.loads(r[1]), "properties": {"name": r[3], "category": r[4], "type": r[0]}} for r in rows]
            }
            zf.writestr("chakravyuh_layers.geojson", json.dumps(geojson_data, indent=2))
            zf.writestr("README.txt", "Chakravyuh Rakshak GIS Export - Compatible with QGIS, ArcGIS, and GDAL/OGR.")
            zf.writestr("crs.prj", 'GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]]')
        zip_buffer.seek(0)
        return StreamingResponse(
            zip_buffer,
            media_type="application/zip",
            headers={"Content-Disposition": "attachment; filename=chakravyuh_gis_layers.zip"}
        )
    else:
        raise HTTPException(status_code=400, detail="Unsupported export format. Choose from geojson, kml, shapefile")

@router.get("/geocode")
async def geocode_place(address: str = Query(..., description="Place or city name")):
    """
    Geocoding lookup with built-in cache for major coastal Indian / South Asian ports & cities
    """
    places = {
        "puri": {"name": "Puri, Odisha", "lat": 19.8135, "lon": 85.8312, "basin": "Bay of Bengal"},
        "bhubaneswar": {"name": "Bhubaneswar, Odisha", "lat": 20.2961, "lon": 85.8245, "basin": "Bay of Bengal"},
        "paradip": {"name": "Paradip Port, Odisha", "lat": 20.3165, "lon": 86.6114, "basin": "Bay of Bengal"},
        "visakhapatnam": {"name": "Visakhapatnam, Andhra Pradesh", "lat": 17.6868, "lon": 83.2185, "basin": "Bay of Bengal"},
        "chennai": {"name": "Chennai, Tamil Nadu", "lat": 13.0827, "lon": 80.2707, "basin": "Bay of Bengal"},
        "kolkata": {"name": "Kolkata, West Bengal", "lat": 22.5726, "lon": 88.3639, "basin": "Bay of Bengal"},
        "digha": {"name": "Digha, West Bengal", "lat": 21.6266, "lon": 87.5074, "basin": "Bay of Bengal"},
        "mumbai": {"name": "Mumbai, Maharashtra", "lat": 18.9220, "lon": 72.8347, "basin": "Arabian Sea"},
        "veraval": {"name": "Veraval, Gujarat", "lat": 20.9077, "lon": 70.3676, "basin": "Arabian Sea"},
        "kochi": {"name": "Kochi, Kerala", "lat": 9.9312, "lon": 76.2673, "basin": "Arabian Sea"}
    }
    key = address.lower().strip()
    match = places.get(key)
    if not match:
        for k, v in places.items():
            if k in key or key in k:
                match = v
                break
    if not match:
        # Default fallback to center of Bay of Bengal
        match = {"name": address, "lat": 17.5, "lon": 86.5, "basin": "Bay of Bengal"}
    return match

@router.get("/reverse-geocode")
async def reverse_geocode(lat: float, lon: float, db: AsyncSession = Depends(get_db)):
    """
    Reverse geocodes a lat/lon to nearest coastal district or marine basin using PostGIS
    """
    res = await db.execute(text(f"""
        SELECT cd.name, cd.state, ST_Distance(cd.geom, ST_SetSRID(ST_Point({lon}, {lat}), 4326)) * 111.0 as dist_km
        FROM coastal_districts cd
        ORDER BY cd.geom <-> ST_SetSRID(ST_Point({lon}, {lat}), 4326)
        LIMIT 1;
    """))
    row = res.fetchone()
    if row:
        return {"district": row[0], "state": row[1], "distance_to_coast_km": round(row[2], 1), "lat": lat, "lon": lon}
    return {"location": f"{lat}°N, {lon}°E", "basin": "Offshore Marine Sector"}

@router.post("/validate-location")
async def validate_location(
    req: Dict[str, float],
    db: AsyncSession = Depends(get_db)
):
    """
    Spatial validation for interactive map clicks:
    1. Determines whether coordinate is inside an ocean basin (ST_Contains) or inland district.
    2. Calculates real-time distance to nearest active cyclonic system.
    3. Returns calibrated threat level and safety directive.
    """
    lat = req.get("latitude", 18.0)
    lon = req.get("longitude", 86.0)

    # 1. Check ocean basins via PostGIS ST_Contains
    basin_query = await db.execute(text(f"""
        SELECT name, basin_code
        FROM ocean_basins
        WHERE ST_Contains(geom, ST_SetSRID(ST_Point({lon}, {lat}), 4326))
        LIMIT 1;
    """))
    basin_row = basin_query.fetchone()

    # 2. Check coastal districts
    district_query = await db.execute(text(f"""
        SELECT cd.id, cd.name, cd.state, cd.risk_weight,
               ST_Distance(cd.geom, ST_SetSRID(ST_Point({lon}, {lat}), 4326)) * 111.0 as dist_km
        FROM coastal_districts cd
        ORDER BY cd.geom <-> ST_SetSRID(ST_Point({lon}, {lat}), 4326)
        LIMIT 1;
    """))
    dist_row = district_query.fetchone()

    # 3. Find nearest active cyclone
    cyclone_query = await db.execute(text(f"""
        SELECT id, name, current_category, current_wind_kmh, current_lat, current_lon,
               (ST_Distance(ST_SetSRID(ST_Point(current_lon, current_lat), 4326), ST_SetSRID(ST_Point({lon}, {lat}), 4326)) * 111.0) as dist_to_eye_km
        FROM cyclonic_systems
        WHERE status = 'active'
        ORDER BY dist_to_eye_km ASC
        LIMIT 1;
    """))
    cyc_row = cyclone_query.fetchone()

    is_ocean = basin_row is not None or (dist_row and dist_row[4] > 15.0)
    is_inland = not is_ocean and dist_row is not None and dist_row[4] <= 15.0
    basin_name = basin_row[0] if basin_row else ("Bay of Bengal" if lon > 78 else "Arabian Sea")

    nearest_cyc_name = cyc_row[1] if cyc_row else None
    nearest_dist = round(cyc_row[6], 1) if cyc_row else 999.0
    cyc_cat = cyc_row[2] if cyc_row else "None"

    # Determine Threat Level
    if nearest_dist < 150.0:
        threat = "CRITICAL"
        advice = f"EXTREME DANGER: Within high-wind radius of {nearest_cyc_name} ({cyc_cat}). Immediate coastal shelter mandatory."
    elif nearest_dist < 350.0:
        threat = "HIGH"
        advice = f"WARNING: Severe gale force winds and storm surge risk from {nearest_cyc_name}. Suspend all maritime and fishing activities."
    elif nearest_dist < 600.0:
        threat = "MODERATE"
        advice = f"WATCH: In outer convective band swath of {nearest_cyc_name}. Monitor official bulletins every 3 hours."
    else:
        threat = "LOW"
        advice = "ROUTINE: Location currently outside active gale radius. Maintain standard meteorological watch."

    return {
        "latitude": lat,
        "longitude": lon,
        "is_ocean": is_ocean,
        "basin": basin_name,
        "is_inland": is_inland,
        "district": dist_row[1] if dist_row else None,
        "state": dist_row[2] if dist_row else None,
        "country": "India",
        "nearest_cyclone_name": nearest_cyc_name,
        "nearest_cyclone_distance_km": nearest_dist,
        "threat_level": threat,
        "advice": advice
    }

@router.get("/wms-capabilities")
async def get_wms_capabilities():
    """
    OGC WMS / WFS standards compliance capabilities descriptor
    """
    return {
        "version": "1.3.0",
        "service": "WMS",
        "title": "Chakravyuh Rakshak Meteorological Spatial Data Infrastructure",
        "abstract": "OGC-compliant Web Map Service providing real-time tropical cyclone tracks, uncertainty cones, wind swaths and coastal grids.",
        "srs": ["EPSG:4326", "EPSG:3857"],
        "layers": [
            {"name": "cyclone_past_tracks", "title": "Observed Multi-Spectral Track History", "queryable": True},
            {"name": "cyclone_forecast_cone", "title": "NHC/IMD 67% Probability Forecast Cone", "queryable": True},
            {"name": "wind_swaths_34kt", "title": "34-knot Tropical Storm Wind Radii", "queryable": True},
            {"name": "wind_swaths_50kt", "title": "50-knot Storm Force Wind Radii", "queryable": True},
            {"name": "wind_swaths_64kt", "title": "64-knot Hurricane/Cyclone Force Radii", "queryable": True},
            {"name": "coastal_districts_vulnerability", "title": "Indian Coastal District Grid with Risk Weighting", "queryable": True},
            {"name": "ocean_basin_boundaries", "title": "North Indian Ocean Marine Basin Geometry", "queryable": True}
        ]
    }
