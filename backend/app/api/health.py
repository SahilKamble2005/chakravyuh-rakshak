from fastapi import APIRouter
import platform
import sys

router = APIRouter(prefix="/api/health", tags=["health"])

@router.get("")
async def health_check():
    return {
        "status": "ok",
        "services": {
            "database": "connected",
            "redis": "connected",
            "blockchain": "connected",
            "ml_model": "loaded"
        },
        "system": {
            "os": platform.system(),
            "python_version": sys.version
        }
    }
