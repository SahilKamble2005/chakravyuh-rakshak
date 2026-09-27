TRANSLATIONS = {
    "en": {"greeting": "Hello", "alert": "Alert"},
    "hi": {"greeting": "नमस्ते", "alert": "चेतावनी"},
    "mr": {"greeting": "नमस्कार", "alert": "इशारा"},
    "bn": {"greeting": "নমস্কার", "alert": "সতর্কতা"},
    "ta": {"greeting": "வணக்கம்", "alert": "எச்சரிக்கை"},
    "te": {"greeting": "నమస్కారం", "alert": "హెచ్చరిక"},
    "kn": {"greeting": "ನಮಸ್ಕಾರ", "alert": "ಎಚ್ಚರಿಕೆ"},
    "ml": {"greeting": "നമസ്കാരം", "alert": "മുന്നറിയിപ്പ്"},
    "gu": {"greeting": "નમસ્તે", "alert": "ચેતવણી"},
    "pa": {"greeting": "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ", "alert": "ਚੇਤਾਵਨੀ"},
    "or": {"greeting": "ନମସ୍କାର", "alert": "ସତର୍କତା"},
    "ur": {"greeting": "السلام علیکم", "alert": "انتباہ"}
}

def translate(key: str, lang: str) -> str:
    return TRANSLATIONS.get(lang, TRANSLATIONS["en"]).get(key, key)
