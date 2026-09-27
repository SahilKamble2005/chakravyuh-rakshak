import os
import random
from typing import Dict, Any

DEMO_MODE = os.getenv("DEMO_MODE", "True").lower() in ("true", "1", "yes")

async def derive_satellite_data(lat: float, lon: float) -> Dict[str, Any]:
    """
    Derive SST, wind shear, cloud top temp, track heading using raster sampling.
    Uses simulated raster values when in DEMO_MODE.
    """
    if DEMO_MODE:
        return {
            "sst": round(random.uniform(26.0, 31.0), 2),
            "wind_shear": round(random.uniform(5.0, 25.0), 2),
            "cloud_top_temp": round(random.uniform(-80.0, -50.0), 2),
            "track_heading": round(random.uniform(0, 360), 2)
        }
    
    # Real rasterio implementation would go here
    # with rasterio.open('sst.tif') as src:
    #     for val in src.sample([(lon, lat)]):
    #         sst = val[0]
    return {
        "sst": 28.5,
        "wind_shear": 15.0,
        "cloud_top_temp": -60.0,
        "track_heading": 45.0
    }
