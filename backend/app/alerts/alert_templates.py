TEMPLATES = {
    "en": "CYCLONE ALERT: {severity} risk in your area. Stay safe and follow local authorities.",
    "hi": "चक्रवात चेतावनी: आपके क्षेत्र में {severity} जोखिम है। सुरक्षित रहें।",
    "mr": "चक्रीवादळ इशारा: तुमच्या भागात {severity} धोका आहे. सुरक्षित रहा.",
    "bn": "ঘূর্ণিঝড় সতর্কতা: আপনার এলাকায় {severity} ঝুঁকি রয়েছে। নিরাপদ থাকুন।",
    "ta": "புயல் எச்சரிக்கை: உங்கள் பகுதியில் {severity} ஆபத்து. பாதுகாப்பாக இருங்கள்.",
    "te": "తుఫాను హెచ్చరిక: మీ ప్రాంతంలో {severity} ప్రమాదం. సురక్షితంగా ఉండండి."
}

def get_alert_message(lang: str, severity: str) -> str:
    template = TEMPLATES.get(lang, TEMPLATES["en"])
    return template.format(severity=severity)
