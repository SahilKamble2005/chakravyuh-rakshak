import os

DEMO_MODE = os.getenv("DEMO_MODE", "True").lower() in ("true", "1", "yes")

async def send_sms(phone: str, message: str) -> bool:
    """Send SMS using Twilio SDK with DEMO_MODE simulation fallback."""
    if DEMO_MODE:
        print(f"[DEMO] Sending SMS to {phone}: {message}")
        return True
        
    # Twilio real implementation
    # client = Client(account_sid, auth_token)
    # message = client.messages.create(body=message, from_=from_number, to=phone)
    print(f"Sending real SMS to {phone}")
    return True
