from typing import Dict, Any

async def getSelectedLocation() -> Dict[str, Any]:
    return {"lat": 15.3, "lon": 73.9, "name": "Goa"}

async def checkOceanBasin(lat: float, lon: float) -> str:
    from app.geospatial.ocean_basin_service import check_ocean_basin
    # Mocking db for now
    return "Arabian Sea"

async def getCurrentPrediction(location_id: int) -> Dict[str, Any]:
    return {"probability": 60, "severity": "HIGH"}

async def get_blockchain_status(record_id: int) -> Dict[str, Any]:
    return {"status": "ANCHORED", "tx_hash": "0x123abc"}

async def verify_prediction(prediction_id: int) -> bool:
    return True

async def getSMSStatus(phone: str) -> Dict[str, Any]:
    return {"status": "DELIVERED"}

async def muteAlertSound() -> bool:
    return True
