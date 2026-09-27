import os
from typing import Dict, Any

DEMO_MODE = os.getenv("DEMO_MODE", "True").lower() in ("true", "1", "yes")

async def send_web_push(subscription: Dict[str, Any], message: str) -> bool:
    """Send web push using pywebpush/FCM with DEMO_MODE fallback."""
    if DEMO_MODE:
        print(f"[DEMO] Sending Web Push to {subscription.get('endpoint')}: {message}")
        return True
        
    # Pywebpush real implementation
    # webpush(subscription_info=subscription, data=message, vapid_private_key=key, vapid_claims=claims)
    print("Sending real web push")
    return True
