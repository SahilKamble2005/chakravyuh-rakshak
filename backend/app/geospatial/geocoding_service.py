import httpx
from typing import Dict, Any, Optional

async def geocode(address: str) -> Optional[Dict[str, float]]:
    """Geocode an address to lat/lon via Nominatim API."""
    url = f"https://nominatim.openstreetmap.org/search?q={address}&format=json&limit=1"
    headers = {"User-Agent": "ChakravyuhRakshak/1.0"}
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers)
            if response.status_code == 200:
                data = response.json()
                if data:
                    return {
                        "lat": float(data[0]["lat"]),
                        "lon": float(data[0]["lon"])
                    }
        except Exception as e:
            print(f"Geocoding error: {e}")
    return None

async def reverse_geocode(lat: float, lon: float) -> Optional[str]:
    """Reverse geocode lat/lon to address via Nominatim API."""
    url = f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}&format=json"
    headers = {"User-Agent": "ChakravyuhRakshak/1.0"}
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers)
            if response.status_code == 200:
                data = response.json()
                return data.get("display_name")
        except Exception as e:
            print(f"Reverse geocoding error: {e}")
    return None
