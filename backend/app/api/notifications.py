from fastapi import APIRouter, Depends
from pydantic import BaseModel

router = APIRouter()

class Registration(BaseModel):
    phone: str
    location_id: int

@router.post("/register")
async def register_phone(req: Registration):
    return {"status": "success"}

@router.post("/verify")
async def verify_otp(phone: str, otp: str):
    return {"status": "verified"}
    
@router.get("/preferences")
async def get_preferences():
    return {"preferences": []}
    
@router.put("/preferences")
async def update_preferences():
    return {"status": "updated"}
    
@router.post("/push-subscription")
async def subscribe_push():
    return {"status": "subscribed"}
