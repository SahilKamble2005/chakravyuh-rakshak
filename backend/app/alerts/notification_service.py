from typing import List, Dict, Any
from app.alerts.sms_service import send_sms
from app.alerts.push_service import send_web_push
from app.alerts.websocket_service import broadcast_alert

async def dispatch_alert(alert: Dict[str, Any], channels: List[str]):
    """Fan-out asynchronously to SMS, Web Push, WebSocket."""
    if "sms" in channels:
        # fetch users subscribed to SMS for this location
        await send_sms("+1234567890", alert.get("message", "Cyclone Alert"))
        
    if "push" in channels:
        # fetch subscriptions
        await send_web_push({"endpoint": "dummy"}, alert.get("message", "Cyclone Alert"))
        
    if "websocket" in channels:
        await broadcast_alert(alert)
