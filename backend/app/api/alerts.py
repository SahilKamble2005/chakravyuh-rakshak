from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from app.core.security import get_current_user
from app.models import Alert, User
from app.schemas import AlertResponse, AlertAcknowledgeRequest

router = APIRouter(prefix="/api/alerts", tags=["alerts"])

@router.get("", response_model=List[AlertResponse])
async def get_alerts(
    system_id: Optional[int] = None,
    level: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(Alert).order_by(Alert.created_at.desc())
    if system_id:
        query = query.where(Alert.system_id == system_id)
    if level and level != "ALL":
        query = query.where(Alert.level == level.upper())
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/{alert_id}/acknowledge", response_model=AlertResponse)
async def acknowledge_alert(
    alert_id: int,
    req: AlertAcknowledgeRequest,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalars().first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.acknowledged = req.acknowledged
    alert.acknowledged_at = datetime.utcnow()
    await db.commit()
    await db.refresh(alert)
    return alert

@router.post("/test-siren")
async def test_siren(level: str = "SEVERE"):
    """
    Returns audio siren configuration parameters for testing software audio tones
    """
    configs = {
        "WATCH": {"type": "SINGLE_BEEP", "frequency_hz": 520, "pulse_ms": 300, "repeats": 1},
        "WARNING": {"type": "TRIPLE_BEEP", "frequency_hz": 680, "pulse_ms": 200, "repeats": 3},
        "SEVERE": {"type": "CONTINUOUS_SIREN", "low_freq_hz": 600, "high_freq_hz": 1200, "cycle_s": 1.2, "repeats": 5}
    }
    return {
        "status": "triggered",
        "level": level.upper(),
        "siren_profile": configs.get(level.upper(), configs["SEVERE"]),
        "timestamp": datetime.utcnow().isoformat()
    }

@router.post("/verify-phone")
async def verify_phone_number(phone_number: str = "+919876543210", language: str = "en"):
    """
    Simulates SMS-first phone verification with OTP for emergency disaster alerts
    """
    return {
        "status": "OTP_DISPATCHED",
        "phone_number": phone_number,
        "language": language,
        "channel": "SMS_PRIMARY_OFFLINE_FALLBACK",
        "mock_otp": "739201",
        "message": f"Verification code sent via SMS to {phone_number}. Offline emergency broadcasts enabled."
    }

@router.get("/sms-templates")
async def get_multilingual_sms_templates():
    """
    Returns pre-compiled emergency SMS broadcast templates in 13+ Indian languages
    """
    return {
        "en": "EMERGENCY IMD ALERT: Severe Cyclone DANA warning for coastal Odisha/WB. Move to cyclone shelters. Great Danger Signal 10.",
        "hi": "आपातकालीन चेतावनी: ओडिशा और पश्चिम बंगाल तट के लिए चक्रवात दाना की चेतावनी। तुरंत सुरक्षित आश्रयों में जाएं।",
        "or": "ଜରୁରୀ ସୂଚନା: ବାତ୍ୟା ଦାନା ପାଇଁ ଉପକୂଳ ଓଡ଼ିଶାରେ ୧୦ ନମ୍ବର ବିପଦ ସଙ୍କେତ। ସମସ୍ତେ ବାତ୍ୟା ଆଶ୍ରୟସ୍ଥଳକୁ ଯାଆନ୍ତୁ।",
        "bn": "জরুরি সতর্কতা: উপকূলীয় অঞ্চলে ঘূর্ণিঝড় দানার লাল সতর্কতা। অবিলম্বে সাইক্লোন সেন্টারে আশ্রয় নিন।",
        "ta": "அவசர புயல் எச்சரிக்கை: டானா புயல் காரணமாக மீனவர்கள் கடலுக்கு செல்ல வேண்டாம். பாதுகாப்பு மையங்களுக்கு செல்லவும்.",
        "te": "అత్యవసర హెచ్చరిక: దానా తుఫాను తీరప్రాంతాన్ని తాకే అవకాశం ఉంది. తీరప్రాంత ప్రజలు సురక్షిత ప్రాంతాలకు తరలివెళ్లండి.",
        "mr": "तातडीचा इशारा: किनारपट्टीवर चक्रीवादळाचा इशारा. सुरक्षित स्थळी आश्रय घ्या आणि समुद्रात जाऊ नका.",
        "gu": "કટોકટી ચેતવણી: ચક્રવાતની ગંભીર ચેતવણી. દરિયાકાંઠાના વિસ્તારો ખાલી કરો અને સુરક્ષિત રહો.",
        "ml": "അടിയന്തര മുന്നറിയിപ്പ്: ശക്തമായ ചുഴലിക്കാറ്റ് മുന്നറിയിപ്പ്. സുരക്ഷിത സ്ഥാനങ്ങളിലേക്ക് മാറുക.",
        "kn": "ತುರ್ತು ಎಚ್ಚರಿಕೆ: ಚಂಡಮಾರುತದ ಹಿನ್ನೆಲೆಯಲ್ಲಿ ಕರಾವಳಿ ಪ್ರದೇಶದ ಜನರು ಸುರಕ್ಷಿತ ಆಶ್ರಯ ತಾಣಗಳಿಗೆ ತೆರಳಲು ಸೂಚನೆ.",
        "pa": "ਐਮਰਜੈਂਸੀ ਅਲਰਟ: ਤੂਫਾਨ ਦੇ ਖ਼ਤਰੇ ਕਾਰਨ ਤੱਟਵਰਤੀ ਖੇਤਰਾਂ ਨੂੰ ਖਾਲੀ ਕਰਨ ਦੀ ਹਦਾਇਤ।",
        "as": "জৰুৰী সতৰ্কবাণী: উপকূলীয় জিলাসমূহত ঘূৰ্ণী বতাহৰ সতৰ্কতা। নিৰাপদ আশ্ৰয়স্থললৈ যাওক।",
        "ur": "ہنگامی انتباہ: سمندری طوفان کے پیش نظر ساحلی علاقوں کے لوگ فوری طور پر محفوظ پناہ گاہوں میں منتقل ہوں۔"
    }

@router.post("/preferences")
async def update_notification_preferences(prefs: dict):
    return {
        "status": "UPDATED",
        "preferences": prefs,
        "updated_at": datetime.utcnow().isoformat()
    }

