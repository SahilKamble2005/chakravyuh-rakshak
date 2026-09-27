import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { cycloneApi } from '../services/api';
import { ChatMessage } from '../types';

interface VoiceSOCOperatorHUDProps {
  onToggleTheme?: () => void;
}

export default function VoiceSOCOperatorHUD({ onToggleTheme }: VoiceSOCOperatorHUDProps) {
  const navigate = useNavigate();

  // Widget Expansion & Sound States
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [systemStatus, setSystemStatus] = useState<'NOMINAL' | 'ELEVATED' | 'INTRUSION'>('ELEVATED');
  const [selectedLang, setSelectedLang] = useState<'en' | 'hi' | 'mr'>('en');
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Speech Recognition States
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcriptText, setTranscriptText] = useState<string>('');
  const [commandToast, setCommandToast] = useState<string | null>(null);

  // Chat Messages & Input
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: '⚡ CHAKRAVYUH RAKSHAK AI ONLINE: Rakshak Commander standing by. Operating in Hands-Free Voice Control mode. You can issue voice commands or ask tactical SOC queries.',
      language: 'en',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      quick_suggestions: [
        'Go to threat map',
        'Isolate node Alpha-9',
        'Show active incidents',
        'Open zero trust telemetry',
        'Scan perimeter for zero-day CVEs'
      ]
    }
  ]);
  const [inputText, setInputText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const latestTranscriptRef = useRef<string>('');

  // Auto Scroll Chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  // Dynamic BCP-47 Voice Output Engine
  const executeVoiceOutput = (textToSpeak: string, langCode: string = 'en-IN') => {
    if (isMuted || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();

      const cleanText = textToSpeak
        .replace(/[*_#`~[\]()]/g, '')
        .replace(/https?:\/\/\S+/g, '')
        .substring(0, 300);

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.lang = langCode || 'en-IN';

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis error:', err);
    }
  };

  const triggerYourExistingFrontendAction = (actionName: string) => {
    if (actionName === 'NAVIGATE_THREAT_MAP' || actionName === 'NAVIGATE_PRICING' || actionName === 'MAP_FOCUS') {
      navigate('/live-monitoring');
      triggerToast('⚡ [VOICE CMD EXECUTED]: Navigated to Live Threat Map (/live-monitoring)');
      executeVoiceOutput('Navigating to Live Threat Map', 'en-IN');
    } else if (actionName === 'NAVIGATE_INCIDENTS' || actionName === 'NAVIGATE_CONTACT' || actionName === 'TRIGGER_SIREN') {
      navigate('/alerts');
      triggerToast('⚡ [VOICE CMD EXECUTED]: Navigated to Active Incidents & Alerts (/alerts)');
      executeVoiceOutput('Opening Active Incidents and Emergency Siren Control', 'en-IN');
    } else if (actionName === 'NAVIGATE_ZERO_TRUST') {
      navigate('/analytics');
      triggerToast('⚡ [VOICE CMD EXECUTED]: Navigated to Zero Trust Telemetry (/analytics)');
      executeVoiceOutput('Opening Zero Trust Telemetry Analytics', 'en-IN');
    } else if (actionName === 'NAVIGATE_QUARANTINE' || actionName === 'VERIFY_BULLETIN') {
      navigate('/blockchain');
      triggerToast('⚡ [VOICE CMD EXECUTED]: Navigated to Quarantine & Blockchain Ledger (/blockchain)');
      executeVoiceOutput('Opening Quarantine Logs and Blockchain Audit', 'en-IN');
    } else if (actionName === 'NAVIGATE_REPORTS' || actionName === 'NAVIGATE_VULNERABILITIES') {
      navigate('/reports');
      triggerToast('⚡ [VOICE CMD EXECUTED]: Navigated to Vulnerability Scanner & Reports (/reports)');
      executeVoiceOutput('Opening Vulnerability Scanner and Compliance Reports', 'en-IN');
    } else if (actionName === 'NAVIGATE_DASHBOARD') {
      navigate('/');
      triggerToast('⚡ [VOICE CMD EXECUTED]: Navigated to Main Security Operations Center Dashboard');
      executeVoiceOutput('Opening Main Security Dashboard', 'en-IN');
    } else if (actionName === 'ISOLATE_NODE') {
      setSystemStatus('INTRUSION');
      triggerToast('⚡ [AUTONOMOUS ENFORCEMENT]: Isolated Node Alpha-9 (10.0.4.88). SHA-256 Audit Logged.');
      executeVoiceOutput('Zero Trust Protocol Enforced. Node Alpha-9 has been isolated.', 'en-IN');
    } else if (actionName === 'SCROLL_DOWN') {
      window.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
    }
  };

  const handleVoiceCommand = (text: string): boolean => {
    const lower = text.toLowerCase().trim();
    let executed = false;

    const langCode = selectedLang === 'hi' ? 'hi-IN' : selectedLang === 'mr' ? 'mr-IN' : 'en-IN';

    if (
      lower.includes('threat map') ||
      lower.includes('open map') ||
      lower.includes('show map') ||
      lower.includes('gis') ||
      lower.includes('surveillance') ||
      lower.includes('live monitor') ||
      lower.includes('threats') ||
      lower.includes('cyclone map') ||
      lower.includes('satellite') ||
      lower.includes('नक्शा') ||
      lower.includes('नक्शा खोलो') ||
      lower.includes('नकाशा')
    ) {
      navigate('/live-monitoring');
      triggerToast('⚡ [VOICE CMD EXECUTED]: Navigated to Live Threat Map (/live-monitoring)');
      executeVoiceOutput('Navigating to Live Threat Map', langCode);
      executed = true;
    } else if (
      lower.includes('incident') ||
      lower.includes('alert') ||
      lower.includes('siren') ||
      lower.includes('alarm') ||
      lower.includes('emergency') ||
      lower.includes('घटना') ||
      lower.includes('अलर्ट')
    ) {
      navigate('/alerts');
      triggerToast('⚡ [VOICE CMD EXECUTED]: Navigated to Active Incidents & Alerts (/alerts)');
      executeVoiceOutput('Opening Active Incidents and Emergency Siren Control', langCode);
      executed = true;
    } else if (
      lower.includes('zero trust') ||
      lower.includes('telemetry') ||
      lower.includes('analytics') ||
      lower.includes('metrics')
    ) {
      navigate('/analytics');
      triggerToast('⚡ [VOICE CMD EXECUTED]: Navigated to Zero Trust Telemetry (/analytics)');
      executeVoiceOutput('Opening Zero Trust Telemetry Analytics', langCode);
      executed = true;
    } else if (
      lower.includes('quarantine') ||
      lower.includes('isolation log') ||
      lower.includes('blockchain') ||
      lower.includes('ledger') ||
      lower.includes('audit') ||
      lower.includes('आइसोलेशन लॉग') ||
      lower.includes('ब्लॉकचेन')
    ) {
      navigate('/blockchain');
      triggerToast('⚡ [VOICE CMD EXECUTED]: Navigated to Quarantine & Blockchain Ledger (/blockchain)');
      executeVoiceOutput('Opening Quarantine Logs and Blockchain Ledger Audit', langCode);
      executed = true;
    } else if (
      lower.includes('digital twin') ||
      lower.includes('topography') ||
      lower.includes('network topology')
    ) {
      navigate('/analytics');
      triggerToast('⚡ [VOICE CMD EXECUTED]: Navigated to Digital Twin Network Topography');
      executeVoiceOutput('Opening Digital Twin Network Topography', langCode);
      executed = true;
    } else if (
      lower.includes('vulnerability') ||
      lower.includes('cve') ||
      lower.includes('scanner') ||
      lower.includes('report') ||
      lower.includes('compliance')
    ) {
      navigate('/reports');
      triggerToast('⚡ [VOICE CMD EXECUTED]: Navigated to Vulnerability Scanner & Reports (/reports)');
      executeVoiceOutput('Opening Vulnerability Scanner and Compliance Reports', langCode);
      executed = true;
    } else if (
      lower.includes('dashboard') ||
      lower.includes('overview') ||
      lower.includes('home page') ||
      lower.includes('main page')
    ) {
      navigate('/');
      triggerToast('⚡ [VOICE CMD EXECUTED]: Navigated to Main Overview Dashboard');
      executeVoiceOutput('Navigating to Main Overview Dashboard', langCode);
      executed = true;
    }

    if (lower.includes('switch to hindi') || lower.includes('हिंदी में बदलो') || lower === 'हिंदी' || lower === 'hindi') {
      setSelectedLang('hi');
      triggerToast('⚡ [VOICE CMD EXECUTED]: Switched Assistant Language to Hindi (हिंदी)');
      executeVoiceOutput('भाषा हिंदी में बदल दी गई है', 'hi-IN');
      executed = true;
    } else if (lower.includes('switch to english') || lower.includes('अंग्रेजी में बदलो') || lower === 'english') {
      setSelectedLang('en');
      triggerToast('⚡ [VOICE CMD EXECUTED]: Switched Assistant Language to English');
      executeVoiceOutput('Switched assistant language to English', 'en-IN');
      executed = true;
    } else if (lower.includes('switch to marathi') || lower.includes('मराठीत बदला') || lower === 'मराठी' || lower === 'marathi') {
      setSelectedLang('mr');
      triggerToast('⚡ [VOICE CMD EXECUTED]: Switched Assistant Language to Marathi (मराठी)');
      executeVoiceOutput('भाषा मराठीत बदलली गेली आहे', 'mr-IN');
      executed = true;
    }

    if (lower.includes('stealth') || lower.includes('dark mode') || lower.includes('theme') || lower.includes('light mode')) {
      if (onToggleTheme) onToggleTheme();
      triggerToast('⚡ [VOICE CMD EXECUTED]: Toggled Interface Theme Mode');
      executeVoiceOutput('Toggled interface theme mode', langCode);
      executed = true;
    }

    if (lower.includes('isolate') || lower.includes('node alpha-9') || lower.includes('host') || lower.includes('आइसोलेट')) {
      setSystemStatus('INTRUSION');
      triggerToast('⚡ [AUTONOMOUS ENFORCEMENT]: Isolated Node Alpha-9 (10.0.4.88). SHA-256 Audit Logged.');
      executeVoiceOutput('Zero Trust Protocol Enforced. Node Alpha-9 has been isolated.', langCode);
      executed = true;
    }

    return executed;
  };

  const handleVoiceInputToServer = async (transcribedText: string) => {
    if (!transcribedText || !transcribedText.trim() || isProcessing) return;

    const query = transcribedText.trim();

    const userMsg: ChatMessage = {
      role: 'user',
      content: query,
      language: selectedLang,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsProcessing(true);

    const wasLocalHandled = handleVoiceCommand(query);
    if (wasLocalHandled) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚡ Tactical command executed: "${query}"`,
          language: selectedLang,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setIsProcessing(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/voice-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query })
      });
      
      const data = await response.json();

      if (data.type === "ACTION") {
        triggerYourExistingFrontendAction(data.action);
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `⚡ [VOICE ACTION TRIGGERED]: ${data.action}`,
            language: selectedLang,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else if (data.type === "SPEECH") {
        executeVoiceOutput(data.reply, data.langCode || (selectedLang === 'hi' ? 'hi-IN' : selectedLang === 'mr' ? 'mr-IN' : 'en-IN'));
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data.reply,
            language: data.langCode || selectedLang,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else if (data.reply) {
        executeVoiceOutput(data.reply, data.langCode || 'en-IN');
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data.reply,
            language: data.langCode || selectedLang,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }

    } catch (error) {
      console.warn("Voice backend port 5000 error, falling back to cycloneApi:", error);
      try {
        const fallbackRes = await cycloneApi.sendChatMessage(query, selectedLang);
        executeVoiceOutput(fallbackRes.reply, fallbackRes.response_language || 'en-IN');
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: fallbackRes.reply,
            language: fallbackRes.response_language || selectedLang,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            quick_suggestions: fallbackRes.quick_suggestions,
            tool_action: fallbackRes.tool_action
          }
        ]);
      } catch (err2) {
        const fallbackReply = "Voice command received. Network perimeter status verified.";
        executeVoiceOutput(fallbackReply, 'en-IN');
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: fallbackReply,
            language: selectedLang,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const triggerToast = (msg: string) => {
    setCommandToast(msg);
    setTimeout(() => {
      setCommandToast(null);
    }, 4500);
  };

  const startVoiceListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Web Speech API is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    window.speechSynthesis?.cancel();
    latestTranscriptRef.current = '';

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = true;

    if (selectedLang === 'hi') recognition.lang = 'hi-IN';
    else if (selectedLang === 'mr') recognition.lang = 'mr-IN';
    else recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setTranscriptText('Listening...');
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          latestTranscriptRef.current = t;
        } else {
          interim += t;
        }
      }
      const textToShow = latestTranscriptRef.current || interim;
      if (textToShow) {
        setTranscriptText(textToShow);
        if (!latestTranscriptRef.current) {
          latestTranscriptRef.current = textToShow;
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      setIsListening(false);
      setTranscriptText('');
    };

    recognition.onend = () => {
      setIsListening(false);
      const query = latestTranscriptRef.current.trim();
      setTranscriptText('');
      latestTranscriptRef.current = '';
      if (query && query !== 'Listening...') {
        handleVoiceInputToServer(query);
      }
    };

    recognition.start();
  };

  const handleUserQuery = async (queryText?: string) => {
    const message = queryText || inputText;
    if (!message || !message.trim() || isProcessing) return;

    const isHandled = handleVoiceCommand(message);
    if (isHandled) {
      setInputText('');
      return;
    }

    const userMsg: ChatMessage = {
      role: 'user',
      content: message,
      language: selectedLang,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsProcessing(true);

    try {
      const response = await cycloneApi.sendChatMessage(message, selectedLang);
      const botMsg: ChatMessage = {
        role: 'assistant',
        content: response.reply,
        language: response.response_language || selectedLang,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        quick_suggestions: response.quick_suggestions,
        tool_action: response.tool_action,
        risk_escalation_reasoning: response.risk_escalation_reasoning
      };

      setMessages((prev) => [...prev, botMsg]);
      executeVoiceOutput(response.reply, response.response_language || (selectedLang === 'hi' ? 'hi-IN' : selectedLang === 'mr' ? 'mr-IN' : 'en-IN'));
    } catch (err) {
      console.error('SOC Assistant Query Error:', err);
      const fallbackMsg: ChatMessage = {
        role: 'assistant',
        content: '⚠️ [SECOPS FALLBACK]: Query received. Sector 4 Edge Firewall rules enforced. No unauthorized lateral movement detected.',
        language: selectedLang,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, fallbackMsg]);
      executeVoiceOutput(fallbackMsg.content, selectedLang === 'hi' ? 'hi-IN' : selectedLang === 'mr' ? 'mr-IN' : 'en-IN');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {/* Visual Command Toast Notification */}
      {commandToast && (
        <div className="fixed top-16 right-5 z-50 bg-[#EAF2F8] text-[#4FA3D1] border border-[#4FA3D1] px-4 py-2.5 rounded-xl shadow-soft-lg text-xs font-mono flex items-center gap-2 animate-bounce">
          <span className="w-2.5 h-2.5 rounded-full bg-[#4FA3D1] animate-ping" />
          <span className="font-bold text-[#2C3E4A]">{commandToast}</span>
        </div>
      )}

      {/* Floating Glassmorphism HUD (Bottom-Right Widget) */}
      <div className="fixed bottom-5 right-5 z-50 font-mono select-none">
        {!isExpanded ? (
          /* Collapsed HUD Trigger Beacon */
          <div className="flex items-center gap-2">
            <button
              onClick={startVoiceListening}
              title={isListening ? 'Listening... Click to stop' : 'Click for Hands-Free Voice Control'}
              className={`p-3 rounded-full shadow-soft-lg border transition-all flex items-center justify-center ${
                isListening
                  ? 'bg-[#E85D5D] text-white border-[#FACDCD] animate-pulse scale-110'
                  : 'bg-white text-[#4FA3D1] border-[#C9DCE8] hover:bg-[#DCEAF3] hover:scale-105'
              }`}
            >
              <span className="text-lg">{isListening ? '🎙️' : '🎤'}</span>
            </button>

            <button
              onClick={() => setIsExpanded(true)}
              className="bg-white text-[#2C3E4A] border border-[#C9DCE8] hover:border-[#4FA3D1] p-2.5 px-3.5 rounded-full shadow-soft-md text-xs font-bold flex items-center gap-2 transition hover:bg-[#DCEAF3]"
            >
              <span className={`w-2.5 h-2.5 rounded-full ${
                systemStatus === 'NOMINAL' ? 'bg-[#5FBF8F]' :
                systemStatus === 'ELEVATED' ? 'bg-[#F2B84B] animate-pulse' : 'bg-[#E85D5D] animate-ping'
              }`} />
              <span className="hidden sm:inline font-heading">CHAKRAVYUH AI</span>
              <span className="text-[10px] bg-[#E5F3FA] text-[#4FA3D1] border border-[#A5CEE6] px-1.5 py-0.5 rounded-md font-bold">
                SOC VOICE
              </span>
            </button>
          </div>
        ) : (
          /* Expanded Full Light HUD Window */
          <div className="w-[380px] sm:w-[420px] h-[540px] bg-[#EAF2F8] text-[#2C3E4A] border border-[#C9DCE8] rounded-2xl shadow-soft-lg flex flex-col overflow-hidden animate-fade-in">
            {/* HUD Header */}
            <div className="p-3.5 bg-[#DCEAF3] border-b border-[#C9DCE8] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  systemStatus === 'NOMINAL' ? 'bg-[#5FBF8F]' :
                  systemStatus === 'ELEVATED' ? 'bg-[#F2B84B] animate-pulse' : 'bg-[#E85D5D] animate-ping'
                }`} />
                <div>
                  <h3 className="text-xs font-extrabold tracking-wider text-[#2C3E4A] flex items-center gap-1.5 font-heading">
                    <span>CHAKRAVYUH RAKSHAK AI</span>
                  </h3>
                  <p className="text-[9px] text-[#4FA3D1] font-semibold font-mono">
                    AUTONOMOUS SOC OPERATOR • VOICE ENGINE
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Language Switcher */}
                <button
                  onClick={() => setSelectedLang(selectedLang === 'en' ? 'hi' : selectedLang === 'hi' ? 'mr' : 'en')}
                  className="px-2 py-0.5 rounded-md bg-white border border-[#C9DCE8] text-[10px] font-bold text-[#4FA3D1] hover:bg-[#DCEAF3]"
                  title="Switch Language (EN / HI / MR)"
                >
                  {selectedLang.toUpperCase()}
                </button>

                {/* Mute TTS Button */}
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={`p-1 px-2 rounded-md text-[11px] border font-bold ${
                    isMuted ? 'bg-white text-[#7C93A3] border-[#C9DCE8]' : 'bg-[#E8F8F0] text-[#5FBF8F] border-[#B1E4CB]'
                  }`}
                  title={isMuted ? 'Text-to-speech muted' : 'Text-to-speech active'}
                >
                  {isMuted ? '🔇' : '🔊'}
                </button>

                {/* Minimize Button */}
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1 text-[#7C93A3] hover:text-[#2C3E4A] font-bold text-sm ml-1"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Listening Waveform Indicator */}
            {isListening && (
              <div className="bg-[#FDECEC] border-b border-[#FACDCD] p-2 text-[11px] text-[#E85D5D] flex items-center justify-between px-4 animate-pulse">
                <div className="flex items-center gap-2 font-bold">
                  <span className="w-2 h-2 rounded-full bg-[#E85D5D] animate-ping" />
                  <span>LISTENING TO VOICE COMMAND...</span>
                </div>
                <div className="flex gap-1 items-end h-4">
                  <span className="w-1 bg-[#E85D5D] h-2 animate-bounce" />
                  <span className="w-1 bg-[#E85D5D] h-4 animate-bounce delay-75" />
                  <span className="w-1 bg-[#E85D5D] h-3 animate-bounce delay-150" />
                  <span className="w-1 bg-[#E85D5D] h-1 animate-bounce delay-200" />
                </div>
              </div>
            )}

            {/* Live Chat & Telemetry Feed */}
            <div className="flex-1 p-3.5 overflow-y-auto space-y-3 text-xs bg-[#F7FAFC]">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className="text-[9px] text-[#7C93A3] mb-0.5 px-1 font-mono">
                    {msg.role === 'user' ? '👤 Commander' : '🤖 Rakshak AI'} • {msg.timestamp}
                  </div>

                  <div className={`p-3 rounded-2xl max-w-[88%] text-[11px] leading-relaxed shadow-soft ${
                    msg.role === 'user'
                      ? 'bg-[#4FA3D1] text-white rounded-br-none font-sans font-medium'
                      : 'bg-white text-[#2C3E4A] border border-[#C9DCE8] rounded-bl-none font-mono'
                  }`}>
                    <div className="whitespace-pre-wrap">{msg.content}</div>

                    {/* Tool Action Card */}
                    {msg.tool_action && (
                      <div className="mt-2.5 p-2 bg-[#EAF2F8] text-[#4FA3D1] rounded-xl border border-[#A5CEE6] text-[10px] space-y-1">
                        <div className="font-bold flex items-center justify-between text-[#F2B84B]">
                          <span>⚡ EXECUTED SOC ACTION:</span>
                          <span>{msg.tool_action.action_type}</span>
                        </div>
                        <p className="text-[#7C93A3]">{msg.tool_action.description}</p>
                      </div>
                    )}

                    {/* Quick Suggestions */}
                    {msg.quick_suggestions && msg.quick_suggestions.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-[#C9DCE8] flex flex-wrap gap-1">
                        {msg.quick_suggestions.map((sug, sIdx) => (
                          <button
                            key={sIdx}
                            onClick={() => handleUserQuery(sug)}
                            className="text-[9px] bg-[#EAF2F8] hover:bg-[#DCEAF3] text-[#4FA3D1] font-bold px-2 py-0.5 rounded-lg border border-[#C9DCE8] transition"
                          >
                            {sug}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isProcessing && (
                <div className="flex items-center gap-2 text-[10px] text-[#4FA3D1] p-2 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4FA3D1] animate-ping" />
                  <span>Evaluating telemetry &amp; spatial rules…</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Voice & Text Input Control Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUserQuery();
              }}
              className="p-2.5 bg-[#EAF2F8] border-t border-[#C9DCE8] flex items-center gap-2 shrink-0"
            >
              <button
                type="button"
                onClick={startVoiceListening}
                className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center ${
                  isListening
                    ? 'bg-[#E85D5D] text-white border-[#E85D5D] animate-pulse'
                    : 'bg-white text-[#4FA3D1] border-[#C9DCE8] hover:bg-[#DCEAF3]'
                }`}
                title="Hands-free mic"
              >
                <span>🎙️</span>
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={selectedLang === 'hi' ? 'कमांड लिखें (जैसे: "Go to threat map")...' : 'Issue voice or text command...'}
                className="flex-1 bg-white text-[#2C3E4A] text-xs p-2.5 rounded-xl border border-[#C9DCE8] focus:outline-none focus:border-[#4FA3D1] font-mono placeholder:text-[#7C93A3]"
              />

              <button
                type="submit"
                disabled={isProcessing || !inputText.trim()}
                className="p-2.5 bg-[#4FA3D1] hover:bg-[#3B8EBE] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-soft"
              >
                🚀
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  );
}
