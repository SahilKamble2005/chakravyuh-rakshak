import React, { useState, useEffect, useRef, useCallback } from 'react';
import { cycloneApi } from '../services/api';
import { ChatMessage } from '../types';
import { useNavigate } from 'react-router-dom';

const LANGUAGES = [
  { code: 'en', label: 'English',   native: 'English',    bcp47: 'en-IN' },
  { code: 'hi', label: 'Hindi',     native: 'हिन्दी',      bcp47: 'hi-IN' },
  { code: 'or', label: 'Odia',      native: 'ଓଡ଼ିଆ',       bcp47: 'or-IN' },
  { code: 'bn', label: 'Bengali',   native: 'বাংলা',       bcp47: 'bn-IN' },
  { code: 'ta', label: 'Tamil',     native: 'தமிழ்',       bcp47: 'ta-IN' },
  { code: 'te', label: 'Telugu',    native: 'తెలుగు',      bcp47: 'te-IN' },
  { code: 'mr', label: 'Marathi',   native: 'मराठी',       bcp47: 'mr-IN' },
  { code: 'gu', label: 'Gujarati',  native: 'ગુજરાતી',     bcp47: 'gu-IN' },
  { code: 'ml', label: 'Malayalam', native: 'മലയാളം',      bcp47: 'ml-IN' },
  { code: 'kn', label: 'Kannada',   native: 'ಕನ್ನಡ',       bcp47: 'kn-IN' },
  { code: 'pa', label: 'Punjabi',   native: 'ਪੰਜਾਬੀ',      bcp47: 'pa-IN' },
  { code: 'as', label: 'Assamese',  native: 'অসমীয়া',     bcp47: 'as-IN' },
  { code: 'ur', label: 'Urdu',      native: 'اردو',        bcp47: 'ur-IN' },
];

function speakReply(text: string, bcp47: string) {
  if (!('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const cleanText = text
      .replace(/[*_#`~[\]()]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .substring(0, 300);

    const utt = new SpeechSynthesisUtterance(cleanText);
    utt.lang = bcp47 || 'en-IN';

    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      const shortCode = (bcp47 || 'en').split('-')[0].toLowerCase();
      const matched = voices.find(v => 
        v.lang.toLowerCase().replace('_', '-').startsWith(shortCode) ||
        v.lang.toLowerCase().includes(shortCode)
      );
      if (matched) {
        utt.voice = matched;
      }
    }

    utt.rate = 1.0;
    utt.pitch = 1.0;
    window.speechSynthesis.speak(utt);
  } catch (e) {
    console.warn('TTS error:', e);
  }
}

const GREETINGS: Record<string, { greeting: string; suggestions: string[] }> = {
  en: {
    greeting: "Namaste! I am the Chakravyuh Rakshak AI Meteorological Intelligence Assistant. I have live access to INSAT-3DR satellite telemetry, PostGIS spatial queries, and official IMD advisories. Ask me anything about active cyclones, landfall timeframes, or safety protocols.\n\n🎙️ You can also speak to me — tap the mic button!",
    suggestions: [
      "Is there any cyclone near Odisha right now?",
      "What is the landfall ETA for Cyclone DANA?",
      "Center map on Cyclone DANA",
      "Explain the Rapid Intensification (RI) risk",
      "Verify latest bulletin on blockchain"
    ]
  },
  hi: {
    greeting: "नमस्ते! मैं चक्रव्यूह रक्षक एआई मौसम विज्ञान सहायक हूँ। मेरे पास इनसैट-3डीआर उपग्रह डेटा, पोस्टजीआईएस स्थानिक डेटा और आधिकारिक आईएमडी बुलेटिन का सीधा एक्सेस है। आप मुझसे चक्रवात, लैंडफॉल और सुरक्षा सलाह के बारे में पूछ सकते हैं।\n\n🎙️ आप मुझसे बोलकर भी बात कर सकते हैं — माइक बटन दबाएं!",
    suggestions: [
      "नवीनतम ट्रैक पूर्वानुमान क्या है?",
      "कौन से तटीय जिले रेड अलर्ट पर हैं?",
      "तूफान दाना पर नक्शा केंद्रित करें",
      "ब्लॉकचेन पर बुलेटिन सत्यापित करें",
      "आपातकालीन सायरन बजाएं"
    ]
  },
  or: {
    greeting: "ନମସ୍କାର! ମୁଁ ଚକ୍ରବ୍ୟୂହ ରକ୍ଷକ ଏଆଇ ପାଣିପାଗ ସହାୟକ। ମୋ ପାଖରେ INSAT-3DR ଉପଗ୍ରହ ତଥ୍ୟ ଏବଂ ସରକାରୀ IMD ବୁଲେଟିନ୍ ଉପଲବ୍ଧ ଅଛି।\n\n🎙️ ଆପଣ ମାଇକ୍ ବଟନ୍ ଦବାଇ ମୋ ସହ କଥା ହୋଇପାରିବେ!",
    suggestions: [
      "ବାତ୍ୟାର ସର୍ବଶେଷ ପୂର୍ବାନୁମାନ କ'ଣ?",
      "କେଉଁ ଜିଲ୍ଲାଗୁଡ଼ିକ ରେଡ୍ ଆଲର୍ଟରେ ଅଛି?",
      "ବାତ୍ୟା ଉପରେ ମ୍ୟାପ୍ ଫୋକସ୍ କରନ୍ତୁ",
      "ବ୍ଲକଚେନ୍ ବୁଲେଟିନ୍ ଯାଞ୍ଚ କରନ୍ତୁ"
    ]
  },
  bn: {
    greeting: "নমস্কার! আমি চক্রব্যূহ রক্ষক এআই আবহাওয়া সহায়ক। আমার কাছে উপগ্রহ তথ্য এবং অফিসিয়াল আইএমডি বুলেটিনের সরাসরি অ্যাক্সেস রয়েছে।\n\n🎙️ আপনি মাইক বোতাম টিপে কথাও বলতে পারেন!",
    suggestions: [
      "ঘূর্ণিঝড়ের সর্বশেষ পূর্বাভাস কী?",
      "কোন জেলাগুলি রেড অ্যালার্টে আছে?",
      "মানচিত্র ঘূর্ণিঝড়ে ফোকাস করুন",
      "ব্লকচেইনে বুলেটিন যাচাই করুন"
    ]
  },
  ta: {
    greeting: "வணக்கம்! நான் சக்ரவியூஹ் ரக்ஷக் ஏஐ வானிலை உதவியாளர். நேரடி செயற்கைக்கோள் தரவு மற்றும் புயல் எச்சரிக்கைகள் என்னிடம் உள்ளன.\n\n🎙️ நீங்கள் மைக் பொத்தானை அழுத்தி பேசலாம்!",
    suggestions: [
      "சமீபத்திய புயல் பாதை என்ன?",
      "எந்த மாவட்டங்களுக்கு ரெட் அலர்ட்?",
      "புயல் மையத்தில் வரைபடத்தை வைக்கவும்",
      "பிளாக்செயின் அறிக்கையை சரிபார்க்கவும்"
    ]
  },
  te: {
    greeting: "నమస్కారం! నేను చక్రవ్యూహ్ రక్షక్ ఏఐ వాతావరణ సహాయకుడిని. ప్రత్యక్ష ఉపగ్రహ సమాచారం మరియు తుఫాను హెచ్చరికలు నా వద్ద ఉన్నాయి.\n\n🎙️ మీరు మైక్ బటన్ నొక్కి మాట్లాడవచ్చు!",
    suggestions: [
      "తాజా తుఫాను మార్గం ఏమిటి?",
      "ఏ జిల్లాల్లో రెడ్ అలర్ట్ ఉంది?",
      "తుఫానుపై మ్యాప్‌ను కేంద్రీకరించండి",
      "బ్లాక్‌చెయిన్ బులెటిన్‌ను ధృవీకరించండి"
    ]
  },
  mr: {
    greeting: "नमस्कार! मी चक्रव्यूह रक्षक एआय हवामान सहाय्यक आहे. माझ्याकडे उपग्रह डेटा आणि आयएमडीच्या अधिकृत बुलेटिनचा थेट प्रवेश आहे.\n\n🎙️ तुम्ही माइक बटण दाबून बोलू शकता!",
    suggestions: [
      "चक्रीवादळाचा ताज्या अंदाज काय आहे?",
      "कोणते जिल्हे रेड अलर्टवर आहेत?",
      "नकाशा चक्रीवादळावर केंद्रित करा",
      "ब्लॉकचेन बुलेटिन तपासा"
    ]
  },
  gu: {
    greeting: "નમસ્તે! હું ચક્રવ્યૂહ રક્ષક AI હવામાન સહાયક છું. મારી પાસે ઉપગ્રહ ડેટા અને IMD બુલેટિનનો સીધો ઍક્સેસ છે.\n\n🎙️ તમે માઇક બટન દબાવીને બોલી શકો છો!",
    suggestions: [
      "ચક્રવાતની તાજી સ્થિતિ શું છે?",
      "કયા જિલ્લાઓ રેડ એલર્ટ પર છે?",
      "નકશો ચક્રવાત પર કેન્દ્રિત કરો",
      "બ્લોકચેઇન બુલેટિન ચકાસો"
    ]
  },
  ml: {
    greeting: "നമസ്കാരം! ഞാൻ ചക്രവ്യൂഹ് രക്ഷക് എഐ കാലാവസ്ഥാ സഹായിയാണ്. തത്സമയ ഉപഗ്രഹ വിവരങ്ങൾ ലഭ്യമാണ്.\n\n🎙️ മൈക്ക് ബട്ടൺ അമർത്തി സംസാരിക്കാം!",
    suggestions: [
      "ചുഴലിക്കാറ്റിന്റെ ഇപ്പോഴത്തെ സ്ഥിതി എന്താണ്?",
      "ഏതൊക്കെ ജില്ലകളിലാണ് റെഡ് അലർട്ട്?",
      "മാപ്പിൽ ചുഴലിക്കാറ്റ് കാണിക്കുക"
    ]
  },
  kn: {
    greeting: "ನಮಸ್ಕಾರ! ನಾನು ಚಕ್ರವ್ಯೂಹ ರಕ್ಷಕ AI ಹವಾಮಾನ ಸಹಾಯಕ. ಚಂಡಮಾರುತದ ಮುನ್ಸೂಚನೆ ಲಭ್ಯವಿದೆ.\n\n🎙️ ಮೈಕ್ ಬಟನ್ ಒತ್ತಿ ಮಾತನಾಡಬಹುದು!",
    suggestions: [
      "ಚಂಡಮಾರುತದ ಮಾರ್ಗ ಹೇಗಿದೆ?",
      "ಯಾವ ಜಿಲ್ಲೆಗಳಿಗೆ ರೆಡ್ ಅಲರ್ಟ್ ಇದೆ?",
      "ಬುಲೆಟಿನ್ ಪರಿಶೀಲಿಸಿ"
    ]
  },
  pa: {
    greeting: "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਚੱਕਰਵਿਊਹ ਰਕਸ਼ਕ ਏਆਈ ਮੌਸਮ ਸਹਾਇਕ ਹਾਂ।\n\n🎙️ ਮਾਈਕ ਬਟਨ ਦਬਾ ਕੇ ਬੋਲ ਸਕਦੇ ਹੋ!",
    suggestions: [
      "ਤੂਫਾਨ ਦਾ ਤਾਜ਼ਾ ਰਸਤਾ ਕੀ ਹੈ?",
      "ਕਿਹੜੇ ਜ਼ਿਲ੍ਹਿਆਂ ਵਿੱਚ ਰੈੱਡ ਅਲਰਟ ਹੈ?",
      "ਬੁਲੇਟਿਨ ਦੀ ਪੁਸ਼ਟੀ ਕਰੋ"
    ]
  },
  as: {
    greeting: "নমস্কাৰ! মই চক্ৰব্যূহ ৰক্ষক এআই বতৰ বিজ্ঞান সহায়ক।\n\n🎙️ মাইক বুটাম টিপি কথা কওক!",
    suggestions: [
      "ঘূৰ্ণী বতাহৰ শেহতীয়া অৱস্থা কি?",
      "কোনবোৰ জিলাত ৰেড এলাৰ্ট আছে?",
      "বুলেটিন পৰীক্ষা কৰক"
    ]
  },
  ur: {
    greeting: "السلام علیکم! میں چکرویوہ رکشک اے آئی موسمیاتی معاون ہوں۔\n\n🎙️ آپ مائیک بٹن دبا کر بات کر سکتے ہیں!",
    suggestions: [
      "طوفان کا تازہ ترین ٹریک کیا ہے؟",
      "کن اضلاع میں ریڈ الرٹ ہے؟",
      "بلیٹن کی تصدیق کریں"
    ]
  }
};

export default function AIChatbot() {
  const navigate = useNavigate();

  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: GREETINGS['en'].greeting,
      language: 'en',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      quick_suggestions: GREETINGS['en'].suggestions,
    },
  ]);

  const [inputMessage, setInputMessage]     = useState<string>('');
  const [isTyping, setIsTyping]             = useState<boolean>(false);
  const [isListening, setIsListening]       = useState<boolean>(false);
  const [voiceStatus, setVoiceStatus]       = useState<string>('');

  const messagesEndRef  = useRef<HTMLDivElement>(null);
  const recognitionRef  = useRef<any>(null);
  const inputRef        = useRef<HTMLInputElement>(null);
  const latestSpeechRef = useRef<string>('');

  const handleSelectLanguage = (langCode: string) => {
    setSelectedLanguage(langCode);
    const greetingData = GREETINGS[langCode] || GREETINGS['en'];
    setMessages([
      {
        role: 'assistant',
        content: greetingData.greeting,
        language: langCode,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        quick_suggestions: greetingData.suggestions,
      }
    ]);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = useCallback(async (textToSend?: string) => {
    const message = textToSend || inputMessage;
    if (!message || !message.trim() || isTyping) return;

    const query = message.trim();
    const langObj = LANGUAGES.find(l => l.code === selectedLanguage) || LANGUAGES[0];

    const userMsg: ChatMessage = {
      role: 'user',
      content: query,
      language: selectedLanguage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const response = await cycloneApi.sendChatMessage(query, selectedLanguage);
      const botMsg: ChatMessage = {
        role: 'assistant',
        content: response.reply,
        language: response.response_language || selectedLanguage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        quick_suggestions: response.quick_suggestions,
        tool_action: response.tool_action,
        risk_escalation_reasoning: response.risk_escalation_reasoning,
      };
      setMessages(prev => [...prev, botMsg]);
      speakReply(response.reply, langObj.bcp47);
    } catch (e) {
      console.error('Chat error:', e);
      const errMsg = 'Unable to query live telemetry right now. Please try again or check the Live Monitoring dashboard.';
      const errorMsg: ChatMessage = {
        role: 'assistant',
        content: errMsg,
        language: selectedLanguage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMsg]);
      speakReply(errMsg, langObj.bcp47);
    } finally {
      setIsTyping(false);
    }
  }, [inputMessage, isTyping, selectedLanguage]);

  const toggleVoice = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Voice input is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setVoiceStatus('');
      return;
    }

    try {
      window.speechSynthesis?.cancel();
    } catch (_) {}

    latestSpeechRef.current = '';

    const langObj = LANGUAGES.find(l => l.code === selectedLanguage) || LANGUAGES[0];
    const rec = new SpeechRecognition();
    recognitionRef.current = rec;

    rec.lang             = langObj.bcp47;
    rec.continuous       = false;
    rec.interimResults   = true;
    rec.maxAlternatives  = 1;

    rec.onstart = () => {
      setIsListening(true);
      setVoiceStatus(`🎙️ Listening in ${langObj.label}…`);
    };

    rec.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          latestSpeechRef.current = transcript;
        } else {
          interim += transcript;
        }
      }
      const currentText = latestSpeechRef.current || interim;
      if (currentText) {
        setInputMessage(currentText);
        if (!latestSpeechRef.current) {
          latestSpeechRef.current = currentText;
        }
      }
      if (event.results[event.results.length - 1]?.isFinal) {
        setVoiceStatus('✅ Got it — sending…');
      }
    };

    rec.onerror = (event: any) => {
      console.warn('Voice error:', event.error);
      setIsListening(false);
      setVoiceStatus(event.error === 'no-speech' ? '⚠️ No speech detected. Tap mic to retry.' : `⚠️ Error: ${event.error}`);
      setTimeout(() => setVoiceStatus(''), 3000);
    };

    rec.onend = () => {
      setIsListening(false);
      setVoiceStatus('');
      const spokenQuery = latestSpeechRef.current.trim();
      latestSpeechRef.current = '';
      if (spokenQuery) {
        setInputMessage('');
        handleSendMessage(spokenQuery);
      }
    };

    rec.start();
  }, [isListening, selectedLanguage, handleSendMessage]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      window.speechSynthesis?.cancel();
    };
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-5.5rem)] font-sans text-[#2C3E4A] space-y-4">
      {/* Header + Language Tabs */}
      <div className="flex flex-col gap-3 pb-3 border-b border-[#C9DCE8] shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#2C3E4A] font-heading flex items-center gap-2">
              <span>🤖 MULTILINGUAL AI CYCLONE ADVISORY ASSISTANT</span>
              <span className="text-[10px] bg-[#E8F8F0] text-[#5FBF8F] px-2.5 py-0.5 rounded-full border border-[#B1E4CB] font-mono font-bold">
                13+ LANGUAGES • VOICE • TOOL CALLING
              </span>
            </h1>
            <p className="text-xs text-[#7C93A3]">
              Live spatial PostGIS intelligence • Map control • Siren test • Cryptographic audit explanations • 🎙️ Voice input + TTS read-back
            </p>
          </div>
        </div>

        {/* Language Tabs */}
        <div className="flex items-center gap-1.5 bg-[#EAF2F8] p-1.5 rounded-xl border border-[#C9DCE8] overflow-x-auto font-mono shadow-soft">
          <span className="text-[10px] font-bold text-[#7C93A3] px-2 shrink-0">LANG:</span>
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              onClick={() => handleSelectLanguage(lang.code)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0 ${
                selectedLanguage === lang.code
                  ? 'bg-[#4FA3D1] text-white shadow-soft'
                  : 'bg-white text-[#2C3E4A] hover:bg-[#DCEAF3] border border-[#C9DCE8]'
              }`}
            >
              <span>{lang.native}</span>
              <span className="text-[10px] opacity-75">({lang.code.toUpperCase()})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 bg-[#EAF2F8] border border-[#C9DCE8] rounded-xl p-4 overflow-y-auto space-y-4 shadow-soft font-mono">
        {messages.map((msg, index) => (
          <div key={index} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className="flex items-center gap-1.5 text-[10px] text-[#7C93A3] mb-1 px-1">
              <span>{msg.role === 'user' ? '👤 Operator' : '🤖 Chakravyuh AI'}</span>
              <span>•</span>
              <span>{msg.timestamp}</span>
              {msg.language && <span className="uppercase text-[9px] bg-white text-[#2C3E4A] px-1.5 py-0.5 rounded-md border border-[#C9DCE8] font-bold">{msg.language}</span>}
            </div>

            <div
              className={`p-4 rounded-2xl max-w-2xl text-xs leading-relaxed shadow-soft ${
                msg.role === 'user'
                  ? 'bg-[#4FA3D1] text-white rounded-br-none font-sans font-medium'
                  : 'bg-white text-[#2C3E4A] border border-[#C9DCE8] rounded-bl-none font-mono'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>

              {/* Tool Action Card */}
              {msg.tool_action && (
                <div className="mt-3 p-3 bg-[#EAF2F8] text-[#2C3E4A] rounded-xl border border-[#C9DCE8] space-y-2 shadow-soft font-mono">
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#4FA3D1]">
                    <span className="flex items-center gap-1">
                      <span>⚡ EXECUTED AI TOOL ACTION:</span>
                      <span className="text-[#F2B84B]">{msg.tool_action.action_type}</span>
                    </span>
                  </div>
                  <p className="text-[10px] text-[#7C93A3] leading-normal">{msg.tool_action.description}</p>
                  <div className="pt-1 flex gap-2">
                    {msg.tool_action.action_type === 'MAP_FOCUS' && (
                      <button onClick={() => navigate('/live-monitoring')}
                        className="px-3 py-1.5 bg-[#4FA3D1] hover:bg-[#3B8EBE] text-white rounded-xl text-[10px] font-bold transition flex items-center gap-1 shadow-soft">
                        <span>🛰️</span><span>Open GIS Map at Target Coordinates</span>
                      </button>
                    )}
                    {msg.tool_action.action_type === 'TRIGGER_SIREN' && (
                      <button onClick={() => navigate('/alerts')}
                        className="px-3 py-1.5 bg-[#E85D5D] hover:bg-[#D13E3E] text-white rounded-xl text-[10px] font-bold transition flex items-center gap-1 shadow-soft">
                        <span>🔊</span><span>View Audio Siren Control Deck</span>
                      </button>
                    )}
                    {msg.tool_action.action_type === 'VERIFY_BULLETIN' && (
                      <button onClick={() => navigate('/blockchain')}
                        className="px-3 py-1.5 bg-[#4FA3D1] hover:bg-[#3B8EBE] text-white rounded-xl text-[10px] font-bold transition flex items-center gap-1 shadow-soft">
                        <span>📜</span><span>Open Blockchain Ledger Audit</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Quick Suggestions */}
              {msg.quick_suggestions && msg.quick_suggestions.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-[#C9DCE8] space-y-1">
                  <div className="text-[10px] font-bold text-[#7C93A3] uppercase tracking-wider">
                    Recommended Follow-ups:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.quick_suggestions.map((sug, sIdx) => (
                      <button key={sIdx} onClick={() => handleSendMessage(sug)}
                        className="text-[10px] bg-[#EAF2F8] hover:bg-[#DCEAF3] text-[#4FA3D1] font-bold px-2.5 py-1 rounded-xl border border-[#C9DCE8] transition">
                        {sug}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-2 text-xs text-[#7C93A3] p-2 font-mono">
            <span className="w-2 h-2 rounded-full bg-[#4FA3D1] animate-bounce" />
            <span className="w-2 h-2 rounded-full bg-[#4FA3D1] animate-bounce delay-100" />
            <span className="w-2 h-2 rounded-full bg-[#4FA3D1] animate-bounce delay-200" />
            <span className="text-[11px] text-[#7C93A3]">Querying satellite telemetry &amp; PostGIS spatial database…</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Voice Status Banner */}
      {voiceStatus && (
        <div className={`shrink-0 text-center text-[11px] font-bold py-2 px-3 rounded-xl border transition-all font-mono ${
          isListening
            ? 'bg-[#FDECEC] text-[#E85D5D] border-[#FACDCD] animate-pulse'
            : 'bg-white text-[#7C93A3] border-[#C9DCE8]'
        }`}>
          {voiceStatus}
        </div>
      )}

      {/* Input Bar with Voice Button */}
      <form
        onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
        className="flex gap-2 shrink-0 font-mono"
      >
        <input
          ref={inputRef}
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder={
            isListening
              ? `🎙️ Listening in ${LANGUAGES.find(l => l.code === selectedLanguage)?.label}…`
              : `Type or speak a question in ${LANGUAGES.find(l => l.code === selectedLanguage)?.label || 'English'}…`
          }
          className={`flex-1 p-3 text-xs bg-white border rounded-xl shadow-soft focus:outline-none font-mono text-[#2C3E4A] placeholder:text-[#7C93A3] transition ${
            isListening ? 'border-[#E85D5D] bg-[#FDECEC] focus:border-[#E85D5D]' : 'border-[#C9DCE8] focus:border-[#4FA3D1]'
          }`}
        />

        {/* 🎙️ Mic Button */}
        <button
          type="button"
          onClick={toggleVoice}
          title={isListening ? 'Stop listening' : `Speak in ${LANGUAGES.find(l => l.code === selectedLanguage)?.label}`}
          className={`px-4 py-3 rounded-xl font-bold text-sm shadow-soft transition flex items-center gap-1.5 ${
            isListening
              ? 'bg-[#E85D5D] hover:bg-[#D13E3E] text-white animate-pulse ring-2 ring-red-200'
              : 'bg-white hover:bg-[#DCEAF3] text-[#2C3E4A] border border-[#C9DCE8]'
          }`}
        >
          <span className="text-base">{isListening ? '🔴' : '🎙️'}</span>
          <span className="text-[10px] font-bold hidden sm:inline">{isListening ? 'STOP' : 'SPEAK'}</span>
        </button>

        {/* Send Button */}
        <button
          type="submit"
          disabled={isTyping || !inputMessage.trim()}
          className="px-5 py-3 bg-[#4FA3D1] hover:bg-[#3B8EBE] disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-soft transition flex items-center gap-2"
        >
          <span>Send</span>
          <span>🚀</span>
        </button>
      </form>
    </div>
  );
}
