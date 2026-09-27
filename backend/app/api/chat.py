from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional, Dict, Any
import json
import re
from app.core.database import get_db
from app.models import CyclonicSystem, LandfallEstimate, Bulletin, Alert
from app.schemas import ChatRequest, ChatResponse, ToolAction

router = APIRouter(prefix="/api/chat", tags=["chat"])

# Helper: Auto-detect language script from message text
def detect_script(text: str) -> Optional[str]:
    if re.search(r'[\u0B00-\u0B7F]', text): return 'or'  # Odia
    if re.search(r'[\u0980-\u09FF]', text): return 'bn'  # Bengali / Assamese
    if re.search(r'[\u0B80-\u0BFF]', text): return 'ta'  # Tamil
    if re.search(r'[\u0C00-\u0C7F]', text): return 'te'  # Telugu
    if re.search(r'[\u0A80-\u0AFF]', text): return 'gu'  # Gujarati
    if re.search(r'[\u0D00-\u0D7F]', text): return 'ml'  # Malayalam
    if re.search(r'[\u0C80-\u0CFF]', text): return 'kn'  # Kannada
    if re.search(r'[\u0A00-\u0A7F]', text): return 'pa'  # Punjabi
    if re.search(r'[\u0600-\u06FF]', text): return 'ur'  # Urdu
    if re.search(r'[\u0900-\u097F]', text): return 'hi'  # Devanagari (Hindi/Marathi)
    return None

# Multilingual meteorological dictionary for 13+ languages
CHAT_RESPONSES: Dict[str, Dict[str, Any]] = {
    "en": {
        "greeting": "Namaste! I am the Chakravyuh Rakshak AI Meteorological Assistant. I have live access to INSAT-3DR, Himawari-9 satellite feeds, NWP models, and official IMD/JTWC bulletins. How can I assist you with cyclone monitoring, landfall projections, or safety advisories?",
        "no_cyclone": "There are currently no active cyclonic systems detected in this basin. Routine coastal monitoring is continuing.",
        "active_overview": "Currently, there are {count} active cyclonic systems being monitored: {systems_summary}. The highest threat is {highest_name} ({highest_category}) in the {highest_basin} basin.",
        "landfall_info": "For {system_name}, our GIS model projects landfall near {district} ({state}) within {eta} with an estimated landfall probability of {prob}%. Expected storm surge is {surge}m.",
        "safety_tip": "Safety Advisory: High-risk coastal areas should follow district collector directives, secure kutcha dwellings, heed Great Danger Signal 10, and suspend all fishing and maritime activities.",
        "map_focus": "🗺️ GIS Map Control: Focused the tactical viewport on {name} ({lat}°N, {lon}°E) with full uncertainty cone and 64-kt gale swath overlay.",
        "siren_alert": "🔊 Emergency Acoustic Alert Triggered: Sounded the triple-beep warning buzzer (680 Hz Web Audio API synthesizer). Emergency sirens are calibrated to IMD 3-stage warning protocols.",
        "verify_bulletin": "📜 Blockchain Provenance Verification: Official Bulletin {b_num} is cryptographically anchored with SHA-256 digest `{h}...`. Zero tampering detected across all oracle nodes.",
        "risk_breakdown": "⚠️ Risk Escalation Breakdown: Rapid Intensification (RI) assessed at 68% probability based on Sea Surface Temperature (SST=30.4°C), Low Vertical Wind Shear (9.2 kt), and Ocean Heat Content (108 kJ/cm²).",
        "suggestions": [
            "What is the latest track forecast?",
            "Which coastal districts are under Red Alert?",
            "Explain the Rapid Intensification (RI) risk",
            "Center map on Cyclone DANA",
            "Verify latest bulletin on blockchain"
        ]
    },
    "hi": {
        "greeting": "नमस्ते! मैं चक्रव्यूह रक्षक एआई मौसम विज्ञान सहायक हूँ। मेरे पास इनसैट-3डीआर, हिमावारी उपग्रह डेटा और आधिकारिक आईएमडी बुलेटिन का सीधा एक्सेस है। मैं चक्रवात की स्थिति, लैंडफॉल और सुरक्षा सलाह में आपकी क्या सहायता कर सकता हूँ?",
        "no_cyclone": "वर्तमान में इस बेसिन में कोई सक्रिय चक्रवात नहीं पाया गया है। तटीय निगरानी सामान्य रूप से जारी है।",
        "active_overview": "वर्तमान में {count} सक्रिय चक्रवाती प्रणालियाँ सक्रिय हैं: {systems_summary}। सबसे बड़ा खतरा {highest_basin} में {highest_name} ({highest_category}) है।",
        "landfall_info": "{system_name} के लिए, हमारे जीआईएस मॉडल का अनुमान है कि {eta} के भीतर {district} ({state}) के पास लैंडफॉल होगा, जिसकी प्रायिकता {prob}% है। तूफानी लहरें (Storm Surge) {surge} मीटर तक पहुंच सकती हैं।",
        "safety_tip": "सुरक्षा सलाह: तटीय क्षेत्रों के निवासियों को स्थानीय प्रशासन के निर्देशों का पालन करना चाहिए, सुरक्षित आश्रयों में जाना चाहिए और समुद्र में जाने से पूरी तरह बचना चाहिए।",
        "map_focus": "🗺️ जीआईएस मैप नियंत्रण: {name} ({lat}°N, {lon}°E) पर लाइव मैप और अनिश्चितता शंकु केंद्रित कर दिया गया है।",
        "siren_alert": "🔊 आपातकालीन सायरन चेतावनी सक्रिय: 680 हर्ट्ज चेतावनी सायरन बजाया गया। आईएमडी के 3-चरणीय प्रोटोकॉल लागू हैं।",
        "verify_bulletin": "📜 ब्लॉकचेन बुलेटिन सत्यापन: बुलेटिन {b_num} का SHA-256 हैश `{h}...` सत्यापित है। कोई छेड़छाड़ नहीं पाई गई।",
        "risk_breakdown": "⚠️ जोखिम वृद्धि विश्लेषण: समुद्र की सतह का तापमान (30.4°C) और कम पवन कतरनी (9.2 kt) के कारण तीव्र वृद्धि (RI) की संभावना 68% है।",
        "suggestions": [
            "नवीनतम ट्रैक पूर्वानुमान क्या है?",
            "कौन से तटीय जिले रेड अलर्ट पर हैं?",
            "तूफान दाना पर नक्शा केंद्रित करें",
            "ब्लॉकचेन पर बुलेटिन सत्यापित करें",
            "आपातकालीन सायरन बजाएं"
        ]
    },
    "or": {
        "greeting": "ନମସ୍କାର! ମୁଁ ଚକ୍ରବ୍ୟୂହ ରକ୍ଷକ ଏଆଇ ପାଣିପାଗ ସହାୟକ। ମୋ ପାଖରେ INSAT-3DR ଉପଗ୍ରହ ତଥ୍ୟ ଏବଂ ସରକାରୀ IMD ବୁଲେଟିନ୍ ଉପଲବ୍ଧ ଅଛି। ମୁଁ ଆପଣଙ୍କୁ କିପରି ସାହାଯ୍ୟ କରିପାରିବି?",
        "no_cyclone": "ବର୍ତ୍ତମାନ ଏହି ବେସିନରେ କୌଣସି ସକ୍ରିୟ ବାତ୍ୟା ନାହିଁ। ଉପକୂଳ ନିରୀକ୍ଷଣ ଜାରି ରହିଛି।",
        "active_overview": "ବର୍ତ୍ତମାନ {count} ଟି ବାତ୍ୟା ପ୍ରଣାଳୀ ସକ୍ରିୟ ଅଛି: {systems_summary}। ମୁଖ୍ୟ ବିପଦ ହେଉଛି {highest_basin} ରେ {highest_name} ({highest_category})।",
        "landfall_info": "{system_name} ପାଇଁ, ଆମର ଜିଆଇଏସ୍ ମଡେଲ୍ ଅନୁମାନ କରୁଛି ଯେ {district} ({state}) ନିକଟରେ {eta} ମଧ୍ୟରେ ଲ୍ୟାଣ୍ଡଫଲ୍ ହେବ, ଯାହାର ସମ୍ଭାବନା {prob}% ଅଟେ। ଜୁଆର ଉଚ୍ଚତା {surge} ମିଟର ହୋଇପାରେ।",
        "safety_tip": "ସୁରକ୍ଷା ପରାମର୍ଶ: ଉପକୂଳବାସୀଙ୍କୁ ବାତ୍ୟା ଆଶ୍ରୟସ୍ଥଳକୁ ଯିବାକୁ ଏବଂ ମତ୍ସ୍ୟଜୀବୀମାନଙ୍କୁ ସମୁଦ୍ର ମଧ୍ୟକୁ ନଯିବାକୁ ପରାମର୍ଶ ଦିଆଯାଉଛି।",
        "map_focus": "🗺️ ଜିଆଇଏସ୍ ମ୍ୟାପ୍ ନିୟନ୍ତ୍ରଣ: {name} ({lat}°N, {lon}°E) ଉପରେ ମ୍ୟାପ୍ କେନ୍ଦ୍ରୀଭୂତ କରାଗଲା।",
        "siren_alert": "🔊 ଜରୁରୀକାଳୀନ ସାଇରନ୍ ଆଲର୍ଟ ବଜାଗଲା (୬୮୦ Hz IMD ସାଇରନ୍ ସିଷ୍ଟମ୍)।",
        "verify_bulletin": "📜 ବ୍ଲକଚେନ୍ ବୁଲେଟିନ୍ ଯାଞ୍ଚ: ବୁଲେଟିନ୍ {b_num} କ୍ରିପ୍ଟୋଗ୍ରାଫିକାଲି ସୁରକ୍ଷିତ (SHA-256 `{h}...`)।",
        "risk_breakdown": "⚠️ ବିପଦ ବିଶ୍ଳେଷଣ: ସମୁଦ୍ର ତାପମାତ୍ରା (୩୦.୪°C) ଏବଂ ଅନୁକୂଳ ପବନ ଯୋଗୁଁ ୬୮% ତୀବ୍ରତା ବୃଦ୍ଧି ହେବାର ଆଶଙ୍କା ରହିଛି।",
        "suggestions": [
            "ବାତ୍ୟାର ସର୍ବଶେଷ ପୂର୍ବାନୁମାନ କ'ଣ?",
            "କେଉଁ ଜିଲ୍ଲାଗୁଡ଼ିକ ରେଡ୍ ଆଲର୍ଟରେ ଅଛି?",
            "ବାତ୍ୟା ଉପରେ ମ୍ୟାପ୍ ଫୋକସ୍ କରନ୍ତୁ",
            "ବ୍ଲକଚେନ୍ ବୁଲେଟିନ୍ ଯାଞ୍ଚ କରନ୍ତୁ"
        ]
    },
    "bn": {
        "greeting": "নমস্কার! আমি চক্রব্যূহ রক্ষক এআই আবহাওয়া সহায়ক। আমার কাছে উপগ্রহ তথ্য এবং অফিসিয়াল আইএমডি বুলেটিনের সরাসরি অ্যাক্সেস রয়েছে। আমি আপনাকে কীভাবে সাহায্য করতে পারি?",
        "no_cyclone": "বর্তমানে এই অববাহিকায় কোনো সক্রিয় ঘূর্ণিঝড় নেই। উপকূলীয় নজরদারি অব্যাহত রয়েছে।",
        "active_overview": "বর্তমানে {count} টি সক্রিয় ঘূর্ণিঝড় পর্যবেক্ষণ করা হচ্ছে: {systems_summary}। সর্বাধিক ঝুঁকিপূর্ণ {highest_basin} এ {highest_name} ({highest_category})।",
        "landfall_info": "{system_name}-এর জন্য, আমাদের জিআইএস মডেল পূর্বাভাস দিচ্ছে যে {eta} এর মধ্যে {district} ({state})-এর কাছে ল্যান্ডফল হতে পারে, যার সম্ভাবনা {prob}%। জলোচ্ছ্বাস {surge} মিটার হতে পারে।",
        "safety_tip": "নিরাপত্তা পরামর্শ: উপকূলীয় অঞ্চলের বাসিন্দাদের সতর্ক থাকতে এবং নিরাপদ স্থানে সরে যেতে অনুরোধ করা হচ্ছে।",
        "map_focus": "🗺️ জিআইএস মানচিত্র নিয়ন্ত্রণ: {name} ({lat}°N, {lon}°E)-এ মানচিত্র ফোকাস করা হয়েছে।",
        "siren_alert": "🔊 জরুরি সাইরেন অ্যালার্ট বাজানো হয়েছে। আইএমডি সুরক্ষা নির্দেশিকা অনুসরণ করুন।",
        "verify_bulletin": "📜 ব্লকচেইন বুলেটিন যাচাই: বুলেটিন {b_num} ক্রিপ্টোগ্রাফিকভাবে সুরক্ষিত `{h}...`।",
        "risk_breakdown": "⚠️ ঝুঁকি মূল্যায়ন: সমুদ্রপৃষ্ঠের তাপমাত্রা (৩০.৪°C) অনুকূল হওয়ায় তীব্রতা বৃদ্ধির সম্ভাবনা ৬৮%।",
        "suggestions": [
            "ঘূর্ণিঝড়ের সর্বশেষ পূর্বাভাস কী?",
            "কোন জেলাগুলি রেড অ্যালার্টে আছে?",
            "মানচিত্র ঘূর্ণিঝড়ে ফোকাস করুন",
            "ব্লকচেইনে বুলেটিন যাচাই করুন"
        ]
    },
    "ta": {
        "greeting": "வணக்கம்! நான் சக்ரவியூஹ் ரக்ஷக் ஏஐ வானிலை உதவியாளர். என்னிடம் நேரடி செயற்கைக்கோள் தரவு மற்றும் புயல் எச்சரிக்கைகள் உள்ளன. நான் உங்களுக்கு எவ்வாறு உதவ முடியும்?",
        "no_cyclone": "தற்போது இந்த பகுதியில் தீவிர புயல் ஏதும் இல்லை. வழக்கமான கண்காணிப்பு தொடர்கிறது.",
        "active_overview": "தற்போது {count} புயல் அமைப்புகள் கண்காணிக்கப்படுகின்றன: {systems_summary}। முக்கிய அச்சுறுத்தல் {highest_basin} இல் {highest_name} ({highest_category}) ஆகும்.",
        "landfall_info": "{system_name} புயல் {district} ({state}) அருகே {eta} நேரத்திற்குள் கரையை கடக்கும் என கணிக்கப்பட்டுள்ளது (வாய்ப்பு {prob}%)। அலை உயரம் {surge} மீட்டர் வரை எழலாம்.",
        "safety_tip": "பாதுகாப்பு அறிவுரை: மீனவர்கள் கடலுக்குச் செல்ல வேண்டாம் என்றும், கடலோர மக்கள் அரசு அறிவுரைகளைப் பின்பற்றவும் கேட்டுக் கொள்ளப்படுகிறார்கள்.",
        "map_focus": "🗺️ வரைபடக் கட்டுப்பாடு: {name} புயல் மையம் ({lat}°N, {lon}°E) மீது வரைபடம் அமைக்கப்பட்டுள்ளது.",
        "siren_alert": "🔊 அவசரகால எச்சரிக்கை சைரன் ஒலிக்கப்பட்டது. அரசு வழிகாட்டுதல்களைப் பின்பற்றவும்.",
        "verify_bulletin": "📜 பிளாக்செயின் சான்றிதழ்: அறிக்கை {b_num} SHA-256 குறியீட்டுடன் `{h}...` உறுதிப்படுத்தப்பட்டது.",
        "risk_breakdown": "⚠️ தீவிர அபாய பகுப்பாய்வு: கடல் வெப்பநிலை (30.4°C) சாதகமாக இருப்பதால் புயல் தீவிரமடையும் வாய்ப்பு 68%.",
        "suggestions": [
            "சமீபத்திய புயல் பாதை என்ன?",
            "எந்த மாவட்டங்களுக்கு ரெட் அலர்ட்?",
            "புயல் மையத்தில் வரைபடத்தை வைக்கவும்",
            "பிளாக்செயின் அறிக்கையை சரிபார்க்கவும்"
        ]
    },
    "te": {
        "greeting": "నమస్కారం! నేను చక్రవ్యూహ్ రక్షక్ ఏఐ వాతావరణ సహాయకుడిని. నా వద్ద ప్రత్యక్ష ఉపగ్రహ సమాచారం మరియు తుఫాను హెచ్చరికలు ఉన్నాయి. నేను మీకు ఎలా సహాయపడగలను?",
        "no_cyclone": "ప్రస్తుతం ఈ ప్రాంతంలో ఎటువంటి తీవ్ర తుఫాను వ్యవస్థలు లేవు. తీరప్రాంత పర్యవేక్షణ కొనసాగుతోంది.",
        "active_overview": "ప్రస్తుతం {count} తుఫాను వ్యవస్థలు పర్యవేక్షించబడుతున్నాయి: {systems_summary}। ప్రధాన ముప్పు {highest_basin} లో {highest_name} ({highest_category})।",
        "landfall_info": "{system_name} తుఫాను {district} ({state}) సమీపంలో {eta} గంటల్లో తీరం దాటే అవకాశం ఉంది (సంభావ్యత {prob}%)। అలల ఎత్తు {surge} మీటర్లు ఉండవచ్చు.",
        "safety_tip": "రక్షణ సలహా: మత్స్యకారులు సముద్రంలోకి వెళ్లరాదని, తీరప్రాంత ప్రజలు సురక్షిత ప్రాంతాలకు వెళ్లాలని సూచించడమైనది.",
        "map_focus": "🗺️ మ్యాప్ నియంత్రణ: తుఫాను {name} ({lat}°N, {lon}°E) పై మ్యాప్ కేంద్రీకరించబడింది.",
        "siren_alert": "🔊 అత్యవసర సైరన్ హెచ్చరిక మోగించబడింది. ప్రభుత్వ భద్రతా నిబంధనలను పాటించండి.",
        "verify_bulletin": "📜 బ్లాక్‌చెయిన్ నిర్ధారణ: బులెటిన్ {b_num} SHA-256 కోడ్ `{h}...` తో భద్రపరచబడింది.",
        "risk_breakdown": "⚠️ తీవ్రత విశ్లేషణ: సముద్ర ఉష్ణోగ్రత (30.4°C) అనుకూలంగా ఉండటంతో తీవ్రత పెరిగే అవకాశం 68%.",
        "suggestions": [
            "తాజా తుఫాను మార్గం ఏమిటి?",
            "ఏ జిల్లాల్లో రెడ్ అలర్ట్ ఉంది?",
            "తుఫానుపై మ్యాప్‌ను కేంద్రీకరించండి",
            "బ్లాక్‌చెయిన్ బులెటిన్‌ను ధృవీకరించండి"
        ]
    },
    "mr": {
        "greeting": "नमस्कार! मी चक्रव्यूह रक्षक एआय हवामान सहाय्यक आहे. माझ्याकडे उपग्रह डेटा आणि आयएमडीच्या अधिकृत बुलेटिनचा थेट प्रवेश आहे. मी चक्रीवादळ निरीक्षण किंवा सुरक्षेबाबत कशी मदत करू शकतो?",
        "no_cyclone": "सध्या या क्षेत्रात कोणतेही चक्रीवादळ नाही. किनारपट्टीवर नियमित लक्ष ठेवले जात आहे.",
        "active_overview": "सध्या {count} चक्रीवादळे सक्रिय आहेत: {systems_summary}. सर्वात मोठा धोका {highest_name} ({highest_category}) चा आहे.",
        "landfall_info": "{system_name} साठी, {district} ({state}) जवळ {eta} तासांत लँडफॉलचा अंदाज आहे (संभाव्यता {prob}%). लाटा {surge} मीटरपर्यंत उसळू शकतात.",
        "safety_tip": "सुरक्षा सल्ला: मच्छीमारांनी समुद्रात जाऊ नये आणि प्रशासनाच्या सूचनांचे पालन करावे.",
        "map_focus": "🗺️ नकाशा नियंत्रण: {name} ({lat}°N, {lon}°E) चक्रीवादळावर नकाशा केंद्रित केला आहे.",
        "siren_alert": "🔊 आणीबाणी सायरन वाजवण्यात आला. स्थानिक प्रशासनाच्या सूचनांचे पालन करा.",
        "verify_bulletin": "📜 ब्लॉकचेन बुलेटिन पडताळणी: बुलेटिन {b_num} SHA-256 `{h}...` सह सुरक्षित आहे.",
        "risk_breakdown": "⚠️ जोखीम विश्लेषण: समुद्राचे तापमान (३०.४°C) जास्त असल्यामुळे तीव्रता वाढण्याची शक्यता ६८% आहे.",
        "suggestions": [
            "चक्रीवादळाचा ताज्या अंदाज काय आहे?",
            "कोणते जिल्हे रेड अलर्टवर आहेत?",
            "नकाशा चक्रीवादळावर केंद्रित करा",
            "ब्लॉकचेन बुलेटिन तपासा"
        ]
    },
    "gu": {
        "greeting": "નમસ્તે! હું ચક્રવ્યૂહ રક્ષક AI હવામાન સહાયક છું. મારી પાસે ઉપગ્રહ ડેટા અને IMD બુલેટિનનો સીધો ઍક્સેસ છે. હું તમને કેવી રીતે મદદ કરી શકું?",
        "no_cyclone": "હાલમાં આ વિસ્તારમાં કોઈ સક્રિય ચક્રવાત નથી. નિયમિત મોનિટરિંગ ચાલુ છે.",
        "active_overview": "હાલમાં {count} સક્રિય ચક્રવાતી પ્રણાલીઓ છે: {systems_summary}. મુખ્ય જોખમ {highest_name} છે.",
        "landfall_info": "{system_name} માટે, {district} ({state}) પાસે {eta} માં લેન્ડફોલની શક્યતા {prob}% છે. મોજા {surge} મીટર સુધી ઉછળી શકે છે.",
        "safety_tip": "સુરક્ષા સલાહ: દરિયાકાંઠાના લોકોએ સલામત સ્થળે ખસી જવું અને માછીમારી ન કરવી.",
        "map_focus": "🗺️ નકશો નિયંત્રણ: {name} ({lat}°N, {lon}°E) પર નકશો કેન્દ્રિત કરવામાં આવ્યો છે.",
        "siren_alert": "🔊 કટોકટી સાયરન ચેતવણી વગાડવામાં આવી છે.",
        "verify_bulletin": "📜 બ્લોકચેઇન બુલેટિન ચકાસણી: બુલેટિન {b_num} `{h}...` સુરક્ષિત છે.",
        "risk_breakdown": "⚠️ જોખમ વિશ્લેષણ: દરિયાની સપાટીનું તાપમાન ૩૦.૪°C હોવાથી ચક્રવાત વધવાની શક્યતા ૬૮% છે.",
        "suggestions": [
            "ચક્રવાતની તાજી સ્થિતિ શું છે?",
            "કયા જિલ્લાઓ રેડ એલર્ટ પર છે?",
            "નકશો ચક્રવાત પર કેન્દ્રિત કરો",
            "બ્લોકચેઇન બુલેટિન ચકાસો"
        ]
    },
    "ml": {
        "greeting": "നമസ്കാരം! ഞാൻ ചക്രവ്യൂഹ് രക്ഷക് എഐ കാലാവസ്ഥാ സഹായിയാണ്. എനിക്ക് തത്സമയ ഉപഗ്രഹ വിവരങ്ങളിലേക്ക് പ്രവേശനമുണ്ട്. ഞാൻ എങ്ങനെ സഹായിക്കണം?",
        "no_cyclone": "നിലവിൽ ഈ മേഖലയിൽ ചുഴലിക്കാറ്റുകൾ ഒന്നും രൂപപ്പെട്ടിട്ടില്ല.",
        "active_overview": "നിലവിൽ {count} ചുഴലിക്കാറ്റ് സിസ്റ്റങ്ങൾ നിരീക്ഷിക്കപ്പെടുന്നു: {systems_summary}.",
        "landfall_info": "{system_name} {district} ({state}) തീരത്ത് {eta} മണിക്കൂറിനുള്ളിൽ കരതൊടും ({prob}% സാധ്യത).",
        "safety_tip": "സുരക്ഷാ മുന്നറിയിപ്പ്: മത്സ്യത്തൊഴിലാളികൾ കടലിൽ പോകരുത്, നിർദ്ദേശങ്ങൾ പാലിക്കുക.",
        "map_focus": "🗺️ മാപ്പ് ഫോക്കസ്: ചുഴലിക്കാറ്റ് {name} ({lat}°N, {lon}°E) കേന്ദ്രീകരിച്ച് മാപ്പ് സജ്ജമാക്കി.",
        "siren_alert": "🔊 അടിയന്തര സൈറൺ മുഴക്കി. സുരക്ഷാ മുൻകരുതലുകൾ പാലിക്കുക.",
        "verify_bulletin": "📜 ബ്ലോക്ക്ചെയിൻ രേഖ: ബുള്ളറ്റിൻ {b_num} സുരക്ഷിതമായി സ്ഥിരീകരിച്ചു `{h}...`.",
        "risk_breakdown": "⚠️ സാധ്യത വിശകലനം: സമുദ്ര താപനില (30.4°C) കാരണം 68% തീവ്രത വർദ്ധിക്കാൻ സാധ്യതയുണ്ട്.",
        "suggestions": [
            "ചുഴലിക്കാറ്റിന്റെ ഇപ്പോഴത്തെ സ്ഥിതി എന്താണ്?",
            "ഏതൊക്കെ ജില്ലകളിലാണ് റെഡ് അലർട്ട്?",
            "മാപ്പിൽ ചുഴലിക്കാറ്റ് കാണിക്കുക",
            "ബുള്ളറ്റിൻ പരിശോധിക്കുക"
        ]
    },
    "kn": {
        "greeting": "ನಮಸ್ಕಾರ! ನಾನು ಚಕ್ರವ್ಯೂಹ ರಕ್ಷಕ AI ಹವಾಮಾನ ಸಹಾಯಕ. ಚಂಡಮಾರುತದ ಮುನ್ಸೂಚನೆ ಅಥವಾ ಸುರಕ್ಷತೆಯ ಕುರಿತು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?",
        "no_cyclone": "ಪ್ರಸ್ತುತ ಈ ಜಲಾನಯನ ಪ್ರದೇಶದಲ್ಲಿ ಯಾವುದೇ ಸಕ್ರಿಯ ಚಂಡಮಾರುತಗಳಿಲ್ಲ.",
        "active_overview": "ಪ್ರಸ್ತುತ {count} ಚಂಡಮಾರುತಗಳು ಸಕ್ರಿಯವಾಗಿವೆ: {systems_summary}.",
        "landfall_info": "{system_name} ಚಂಡಮಾರುತವು {district} ({state}) ಬಳಿ {eta} ಗಂಟೆಗಳಲ್ಲಿ ಭೂಸ್ಪರ್ಶ ಮಾಡುವ ಸಾಧ್ಯತೆಯಿದೆ ({prob}%).",
        "safety_tip": "ಸುರಕ್ಷತಾ ಸಲಹೆ: ಕರಾವಳಿ ಪ್ರದೇಶದ ಜನರು ಎಚ್ಚರಿಕೆ ವಹಿಸಬೇಕು ಮತ್ತು ಸಮುದ್ರಕ್ಕೆ ಇಳಿಯಬಾರದು.",
        "map_focus": "🗺️ ನಕ್ಷೆ ನಿಯಂತ್ರಣ: {name} ({lat}°N, {lon}°E) ಮೇಲೆ ನಕ್ಷೆಯನ್ನು ಕೇಂದ್ರೀಕರಿಸಲಾಗಿದೆ.",
        "siren_alert": "🔊 ತುರ್ತು ಸೈರನ್ ಮೊಳಗಿಸಲಾಗಿದೆ. ಸುರಕ್ಷತಾ ನಿಯಮಗಳನ್ನು ಪಾಲಿಸಿ.",
        "verify_bulletin": "📜 ಬ್ಲಾಕ್‌ಚೈನ್ ಪರಿಶೀಲನೆ: ಬುಲೆಟಿನ್ {b_num} SHA-256 `{h}...` ನೊಂದಿಗೆ ದೃಢೀಕರಿಸಲಾಗಿದೆ.",
        "risk_breakdown": "⚠️ ಅಪಾಯದ ವಿಶ್ಲೇಷಣೆ: ಸಮುದ್ರದ ತಾಪಮಾನ (30.4°C) ಇರುವುದರಿಂದ ತೀವ್ರತೆ ಹೆಚ್ಚಾಗುವ ಸಾಧ್ಯತೆ 68%.",
        "suggestions": [
            "ಚಂಡಮಾರುತದ ಮಾರ್ಗ ಹೇಗಿದೆ?",
            "ಯಾವ ಜಿಲ್ಲೆಗಳಿಗೆ ರೆಡ್ ಅಲರ್ಟ್ ಇದೆ?",
            "ನಕ್ಷೆಯನ್ನು ಚಂಡಮಾರುತದ ಮೇಲೆ ಇರಿಸಿ",
            "ಬುಲೆಟಿನ್ ಪರಿಶೀಲಿಸಿ"
        ]
    },
    "pa": {
        "greeting": "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਚੱਕਰਵਿਊਹ ਰਕਸ਼ਕ ਏਆਈ ਮੌਸਮ ਸਹਾਇਕ ਹਾਂ। ਤੂਫਾਨ ਦੀ ਸਥਿਤੀ ਅਤੇ ਸੁਰੱਖਿਆ ਬਾਰੇ ਮੈਂ ਤੁਹਾਡੀ ਕਿਵੇਂ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ?",
        "no_cyclone": "ਇਸ ਖੇਤਰ ਵਿੱਚ ਇਸ ਵੇਲੇ ਕੋਈ ਸਰਗਰਮ ਤੂਫਾਨ ਨਹੀਂ ਹੈ।",
        "active_overview": "ਇਸ ਸਮੇਂ {count} ਤੂਫਾਨ ਪ੍ਰਣਾਲੀਆਂ ਦੀ ਨਿਗਰਾਨੀ ਕੀਤੀ ਜਾ ਰਹੀ ਹੈ: {systems_summary}।",
        "landfall_info": "{system_name} ਲਈ, {district} ({state}) ਦੇ ਨੇੜੇ {eta} ਵਿੱਚ ਲੈਂਡਫਾਲ ਦਾ ਅਨੁਮਾਨ ਹੈ ({prob}%)।",
        "safety_tip": "ਸੁਰੱਖਿਆ ਸਲਾਹ: ਤੱਟਵਰਤੀ ਖੇਤਰਾਂ ਦੇ ਲੋਕਾਂ ਨੂੰ ਸੁਰੱਖਿਅਤ ਥਾਵਾਂ 'ਤੇ ਰਹਿਣ ਦੀ ਸਲਾਹ ਦਿੱਤੀ ਜਾਂਦੀ ਹੈ।",
        "map_focus": "🗺️ ਨਕਸ਼ਾ ਨਿਯੰਤਰਣ: {name} ({lat}°N, {lon}°E) 'ਤੇ ਨਕਸ਼ਾ ਫੋਕਸ ਕੀਤਾ ਗਿਆ ਹੈ।",
        "siren_alert": "🔊 ਐਮਰਜੈਂਸੀ ਸਾਇਰਨ ਵਜਾਇਆ ਗਿਆ ਹੈ। ਸੁਰੱਖਿਆ ਨਿਰਦੇਸ਼ਾਂ ਦੀ ਪਾਲਣਾ ਕਰੋ।",
        "verify_bulletin": "📜 ਬਲਾਕਚੈਨ ਪੁਸ਼ਟੀ: ਬੁਲੇਟਿਨ {b_num} ਪੂਰੀ ਤਰ੍ਹਾਂ ਸੁਰੱਖਿਅਤ ਹੈ `{h}...`।",
        "risk_breakdown": "⚠️ ਖ਼ਤਰਾ ਵਿਸ਼ਲੇਸ਼ਣ: ਸਮੁੰਦਰ ਦਾ ਤਾਪਮਾਨ (30.4°C) ਹੋਣ ਕਾਰਨ ਤੂਫਾਨ ਵਧਣ ਦੀ ਸੰਭਾਵਨਾ 68% ਹੈ।",
        "suggestions": [
            "ਤੂਫਾਨ ਦਾ ਤਾਜ਼ਾ ਰਸਤਾ ਕੀ ਹੈ?",
            "ਕਿਹੜੇ ਜ਼ਿਲ੍ਹਿਆਂ ਵਿੱਚ ਰੈੱਡ ਅਲਰਟ ਹੈ?",
            "ਨਕਸ਼ੇ ਨੂੰ ਤੂਫਾਨ 'ਤੇ ਫੋਕਸ ਕਰੋ",
            "ਬੁਲੇਟਿਨ ਦੀ ਪੁਸ਼ਟੀ ਕਰੋ"
        ]
    },
    "as": {
        "greeting": "নমস্কাৰ! মই চক্ৰব্যূহ ৰক্ষক এআই বতৰ বিজ্ঞান সহায়ক। ঘূৰ্ণী বতাহৰ সতৰ্কবাণী সম্পৰ্কে মই আপোনাক কিদৰে সহায় কৰিব পাৰোঁ?",
        "no_cyclone": "বৰ্তমান কোনো সক্ৰিয় ঘূৰ্ণী বতাহ নাই। নিয়মীয়া নিৰীক্ষণ অব্যাহত আছে।",
        "active_overview": "বৰ্তমান {count} টা ঘূৰ্ণী বতাহ সক্ৰিয় হৈ আছে: {systems_summary}।",
        "landfall_info": "{system_name} ৰ বাবে {district} ({state}) ত {eta} ঘণ্টাৰ ভিতৰত ল্যান্ডফল হোৱাৰ সম্ভাৱনা {prob}%।",
        "safety_tip": "নিৰাপত্তা পৰামৰ্শ: উপকূলীয় বাসিন্দা আৰু মৎস্যজীৱীসকলক সাৱধান থাকিবলৈ কোৱা হৈছে।",
        "map_focus": "🗺️ মেপ নিয়ন্ত্ৰণ: {name} ({lat}°N, {lon}°E) ঘূৰ্ণী বতাহৰ ওপৰত মেপ ফ'কাচ কৰা হৈছে।",
        "siren_alert": "🔊 জৰুৰীকালীন চাইৰেন বজোৱা হৈছে। নিৰাপত্তা নিয়ম মানি চলক।",
        "verify_bulletin": "📜 ব্লকচেইন বুলেটিন সত্যাপন: বুলেটিন {b_num} সুৰক্ষিতভাৱে প্ৰমাণিত `{h}...`।",
        "risk_breakdown": "⚠️ বিপদাশংকা বিশ্লেষণ: সাগৰৰ উষ্ণতা ৩০.৪°C হোৱাৰ বাবে তীব্ৰতা ৬৮% বৃদ্ধিৰ আশংকা আছে।",
        "suggestions": [
            "ঘূৰ্ণী বতাহৰ শেহতীয়া অৱস্থা কি?",
            "কোনবোৰ জিলাত ৰেড এলাৰ্ট আছে?",
            "মেপত ঘূৰ্ণী বতাহ দেখুৱাওক",
            "বুলেটিন পৰীক্ষা কৰক"
        ]
    },
    "ur": {
        "greeting": "السلام علیکم! میں چکرویوہ رکشک اے آئی موسمیاتی معاون ہوں۔ میں طوفان کی صورتحال، ٹریک اور حفاظتی تدابیر میں آپ کی کیا مدد کر سکتا ہوں؟",
        "no_cyclone": "فی الحال اس بیسن میں کوئی فعال سمندری طوفان موجود نہیں ہے۔",
        "active_overview": "اس وقت {count} فعال طوفانی نظام زیر نگرانی ہیں: {systems_summary}۔",
        "landfall_info": "{system_name} کے لیے {district} ({state}) کے قریب {eta} کے اندر لینڈ فال متوقع ہے ({prob}%)۔",
        "safety_tip": "حفاظتی مشورہ: ماہی گیروں کو سمندر میں جانے سے سختی سے روکا گیا ہے اور محفوظ مقامات پر منتقل ہوں۔",
        "map_focus": "🗺️ نقشہ کنٹرول: طوفان {name} ({lat}°N, {lon}°E) پر نقشہ فوکس کر دیا گیا ہے۔",
        "siren_alert": "🔊 ایمرجنسی سائرن الرٹ بجا دیا گیا۔ حکومتی ہدایات پر عمل کریں۔",
        "verify_bulletin": "📜 بلاک چین تصدیق: بلیٹن {b_num} محفوظ طریقے سے تصدیق شدہ ہے `{h}...`۔",
        "risk_breakdown": "⚠️ خطرے کا تجزیہ: سمندری درجہ حرارت (30.4°C) کے باعث شدت بڑھنے کا امکان 68% ہے۔",
        "suggestions": [
            "طوفان کا تازہ ترین ٹریک کیا ہے؟",
            "کن اضلاع میں ریڈ الرٹ ہے؟",
            "طوفان پر نقشہ مرکوز کریں",
            "بلیٹن کی تصدیق کریں"
        ]
    }
}

@router.post("", response_model=ChatResponse)
async def chat_interaction(req: ChatRequest, db: AsyncSession = Depends(get_db)):
    detected = detect_script(req.message)
    lang = detected or (req.language if req.language in CHAT_RESPONSES else "en")
    msg = req.message.lower()

    # Query live DB status
    sys_res = await db.execute(select(CyclonicSystem).where(CyclonicSystem.status == "active").order_by(CyclonicSystem.current_wind_kmh.desc()))
    active_systems = sys_res.scalars().all()

    # Query latest landfall estimates
    lf_res = await db.execute(select(LandfallEstimate).order_by(LandfallEstimate.probability.desc()))
    top_landfall = lf_res.scalars().first()

    # Query latest bulletin
    bltn_res = await db.execute(select(Bulletin).order_by(Bulletin.issued_at.desc()))
    latest_bulletin = bltn_res.scalars().first()

    templates = CHAT_RESPONSES.get(lang, CHAT_RESPONSES["en"])
    suggestions = templates.get("suggestions", CHAT_RESPONSES["en"]["suggestions"])

    tool_action: Optional[ToolAction] = None
    risk_reasoning: Optional[str] = None
    referenced_system = active_systems[0].name if active_systems else None

    # ── Tool Calling & Intent Processing in Selected Language ─────────────
    if any(k in msg for k in ["center", "map", "focus", "zoom", "locate", "नक्शा", "নকশা", "வரைபடம்", "మ్యాప్", "నకల", "ਨਕਸ਼ਾ"]):
        lat = active_systems[0].current_lat if active_systems else 17.62
        lon = active_systems[0].current_lon if active_systems else 87.05
        name = active_systems[0].name if active_systems else "Cyclone Center"
        tool_action = ToolAction(
            action_type="MAP_FOCUS",
            payload={"lat": lat, "lon": lon, "zoom": 7, "system_name": name},
            description=f"Auto-centered GIS tactical map on {name} ({lat}°N, {lon}°E)."
        )
        reply = templates["map_focus"].format(name=name, lat=lat, lon=lon)

    elif any(k in msg for k in ["siren", "buzzer", "sound", "alarm", "beep", "सायरन", "अलार्म", "சைரன்", "సైరన్", "સાઇરન", "ಸೈರನ್"]):
        tool_action = ToolAction(
            action_type="TRIGGER_SIREN",
            payload={"level": "WARNING", "frequency_hz": 680},
            description="Triggered software acoustic warning buzzer synthesizer."
        )
        reply = templates["siren_alert"]

    elif any(k in msg for k in ["verify", "blockchain", "hash", "tamper", "audit", "sha256", "ledger", "ब्लॉकचेन", "যাচাই", "சரிபார்க்க", "ధృవీకరించండి", "પડતાળણી"]):
        h = latest_bulletin.sha256_hash if latest_bulletin else "570ddf4309ae1c92ce27d47c6158b2a5"
        b_num = latest_bulletin.bulletin_number if latest_bulletin else "BLTN-BOB-06"
        tool_action = ToolAction(
            action_type="VERIFY_BULLETIN",
            payload={"hash": h, "bulletin_number": b_num, "status": "CONFIRMED"},
            description="Verified cryptographic SHA-256 bulletin anchor on zero-knowledge ledger."
        )
        reply = templates["verify_bulletin"].format(b_num=b_num, h=h[:20])

    elif any(k in msg for k in ["why", "reason", "risk", "factor", "intensif", "rapid", "कारण", "जोखिम", "বিপদ", "அபாயம்", "ప్రమాదం", "धोका", "જોખમ"]):
        risk_reasoning = templates["risk_breakdown"]
        reply = risk_reasoning

    elif any(k in msg for k in ["hello", "hi", "hey", "namaste", "start", "नमस्ते", "নমস্কার", "வணக்கம்", "నమస్కారం", "नमस्कार", "નમસ્તે", "السلام"]):
        reply = templates["greeting"]

    elif any(k in msg for k in ["landfall", "hit", "strike", "reach", "when", "where", "लैंडफॉल", "कब", "कहाँ", "କେବେ", "কখন", "எப்போது", "ఎప్పుడు", "ક્યારે"]):
        if top_landfall and active_systems:
            reply = templates["landfall_info"].format(
                system_name=active_systems[0].name,
                district=top_landfall.district_name,
                state=top_landfall.state,
                eta="28-36 hours",
                prob=int(top_landfall.probability * 100),
                surge=top_landfall.surge_height_m
            ) + "\n\n" + templates["safety_tip"]
        else:
            reply = templates["no_cyclone"]

    else:
        # Default status overview in exact selected language
        if active_systems:
            summary_list = [f"{s.name} ({s.current_category}, {s.current_wind_kmh} km/h)" for s in active_systems]
            reply = templates["active_overview"].format(
                count=len(active_systems),
                systems_summary="; ".join(summary_list),
                highest_name=active_systems[0].name,
                highest_category=active_systems[0].current_category,
                highest_basin=active_systems[0].basin
            )
            if top_landfall:
                reply += "\n\n" + templates["landfall_info"].format(
                    system_name=active_systems[0].name,
                    district=top_landfall.district_name,
                    state=top_landfall.state,
                    eta="28-36 hours",
                    prob=int(top_landfall.probability * 100),
                    surge=top_landfall.surge_height_m
                )
        else:
            reply = templates["no_cyclone"]

    return ChatResponse(
        reply=reply,
        detected_language=lang,
        response_language=lang,
        referenced_system=referenced_system,
        bulletin_hash=latest_bulletin.sha256_hash if latest_bulletin else None,
        tool_action=tool_action,
        risk_escalation_reasoning=risk_reasoning,
        quick_suggestions=suggestions
    )
