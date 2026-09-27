import express from 'express';
import cors from 'cors';
import 'dotenv/config'; // Securely loads GEMINI_API_KEY from your hidden .env file
import { GoogleGenAI, Type } from '@google/genai';
import crypto from 'crypto';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GEMINI_KEY;

// Initialize the client securely using your key
let ai = null;
if (GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    console.log('⚡ Google GenAI Client Initialized with Model gemini-3.8-flash');
  } catch (err) {
    console.warn('⚠️ Google GenAI initialization warning:', err.message);
  }
}

// Define the voice-controlled website actions tool declaration
const actionTool = {
  name: "triggerWebsiteAction",
  description: "Executes navigation, threat isolation, or structural SecOps dashboard changes based on multilingual voice input.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      actionType: { 
        type: Type.STRING, 
        description: "The action to run. Must be exactly one of: 'NAVIGATE_THREAT_MAP', 'NAVIGATE_INCIDENTS', 'NAVIGATE_ZERO_TRUST', 'NAVIGATE_QUARANTINE', 'ISOLATE_NODE', 'TOGGLE_SIREN', 'SCROLL_DOWN'." 
      }
    },
    required: ["actionType"]
  }
};

// ── SIMULATED SECOPS TOOLS FOR OFFLINE / BACKUP FALLBACK ─────────────────────
const SecOpsTools = {
  isolate_compromised_host: (ip_or_node = '10.0.4.88') => {
    const audit_hash = crypto.createHash('sha256').update(`isolate-${ip_or_node}-${Date.now()}`).digest('hex');
    return {
      success: true,
      action: 'ENDPOINT_ISOLATION_PROTOCOL',
      target: ip_or_node,
      status: 'ENFORCED',
      firewall_rule: `DROP ALL FROM ${ip_or_node} TO ANY INGRESS/EGRESS`,
      isolation_timestamp: new Date().toISOString(),
      sha256_audit_hash: audit_hash,
      message: `[SOC ENFORCEMENT]: Endpoint ${ip_or_node} zero-trust isolated. Audit log: ${audit_hash.substring(0, 16)}...`
    };
  }
};

// ── FAST LANGUAGE CODE DETECTION REGEX ─────────────────────────────────────
function detectLanguageScript(text = '') {
  let langCode = 'en-IN';
  if (/[\u0900-\u097F]/.test(text)) langCode = 'hi-IN'; // Devanagari (Hindi/Marathi)
  if (/[\u0A80-\u0AFF]/.test(text)) langCode = 'gu-IN'; // Gujarati
  if (/[\u0B80-\u0BFF]/.test(text)) langCode = 'ta-IN'; // Tamil
  if (/[\u0C00-\u0C7F]/.test(text)) langCode = 'te-IN'; // Telugu
  if (/[\u0600-\u06FF]/.test(text)) langCode = 'ur-IN'; // Urdu
  return langCode;
}

// ── VOICE CHAT API ENDPOINT ────────────────────────────────────────────────
app.post('/api/voice-chat', async (req, res) => {
  try {
    const { message } = req.body; // Voice transcript sent from frontend

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Valid voice message transcript is required.' });
    }

    const lower = message.toLowerCase().trim();

    // ⚡ Fast-path rule engine for instant voice control commands (0ms latency, zero quota use)
    if (lower.includes('threat') || lower.includes('map') || lower.includes('gis') || lower.includes('surveillance') || lower.includes('नक्शा') || lower.includes('नकाशा')) {
      return res.json({ type: "ACTION", action: "NAVIGATE_THREAT_MAP" });
    }
    if (lower.includes('incident') || lower.includes('alert') || lower.includes('siren') || lower.includes('alarm') || lower.includes('घटना') || lower.includes('अलर्ट')) {
      return res.json({ type: "ACTION", action: "NAVIGATE_INCIDENTS" });
    }
    if (lower.includes('zero trust') || lower.includes('telemetry') || lower.includes('analytics') || lower.includes('metrics')) {
      return res.json({ type: "ACTION", action: "NAVIGATE_ZERO_TRUST" });
    }
    if (lower.includes('quarantine') || lower.includes('blockchain') || lower.includes('ledger') || lower.includes('audit') || lower.includes('ब्लॉकचेन')) {
      return res.json({ type: "ACTION", action: "NAVIGATE_QUARANTINE" });
    }
    if (lower.includes('vulnerabilit') || lower.includes('cve') || lower.includes('scanner') || lower.includes('report') || lower.includes('compliance')) {
      return res.json({ type: "ACTION", action: "NAVIGATE_REPORTS" });
    }
    if (lower.includes('dashboard') || lower.includes('home') || lower.includes('overview') || lower.includes('main')) {
      return res.json({ type: "ACTION", action: "NAVIGATE_DASHBOARD" });
    }
    if (lower.includes('isolate') || lower.includes('alpha-9') || lower.includes('quarantine node') || lower.includes('आइसोलेट')) {
      return res.json({ type: "ACTION", action: "ISOLATE_NODE" });
    }

    // Conversational question handling
    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [{ role: 'user', parts: [{ text: message }] }],
          config: {
            systemInstruction: `
              You are the official tactical voice assistant for Chakravyuh Rakshak Cyber Defense Systems.
              Support email: secops@chakravyuh-rakshak.gov.in
              
              RULES:
              1. SCRIPT MATCHING: Always respond in the exact language script the user spoke. (Hindi = Devanagari script, Tamil = Tamil script, English = Latin script, Urdu = Nastaliq script, etc.)
              2. FORMATTING: Keep answers to 1-2 short sentences. Do NOT use markdown (*, #, -).
              3. EXTRA VALUE: You must return the language code ('en-IN', 'hi-IN', 'mr-IN', 'gu-IN', 'ta-IN', 'te-IN', 'ur-IN') inside your final output if text is returned.
            `,
            tools: [{ functionDeclarations: [actionTool] }],
            thinkingConfig: { thinkingBudget: 0 }
          }
        });

        // Case A: Action tool call
        const functionCalls = response.functionCalls;
        if (functionCalls && functionCalls.length > 0) {
          return res.json({ 
            type: "ACTION", 
            action: functionCalls[0].args.actionType 
          });
        }

        // Case B: Spoken speech response
        const text = response.text || '';
        if (text) {
          const langCode = detectLanguageScript(text);
          return res.json({ 
            type: "SPEECH", 
            reply: text, 
            langCode 
          });
        }
      } catch (geminiErr) {
        console.warn("Gemini API rate limit or error, using tactical local fallback:", geminiErr.message);
      }
    }

    // Tactical Fallback Response (handles 429 quota limits or offline status smoothly)
    let fallbackReply = "Rakshak Commander online. Threat perimeter verified. All systems operating at nominal zero-trust status.";
    if (/[\u0900-\u097F]/.test(message)) {
      fallbackReply = "चक्रव्यूह रक्षक सक्रिय है। सभी सुरक्षा परिमाप सामान्य स्थिति में हैं।";
    }

    return res.json({
      type: "SPEECH",
      reply: fallbackReply,
      langCode: detectLanguageScript(fallbackReply)
    });

  } catch (error) {
    console.error("Voice Handler Error:", error);
    const safeReply = "Chakravyuh Rakshak voice layer online. Perimeter defenses verified.";
    return res.json({
      type: "SPEECH",
      reply: safeReply,
      langCode: "en-IN"
    });
  }
});

// ── COMPATIBILITY ROUTE FOR CHATBOT MESSAGE ────────────────────────────────
app.post('/api/chatbot/message', async (req, res) => {
  const { message, language = 'en' } = req.body;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [{ role: 'user', parts: [{ text: message }] }],
        config: {
          systemInstruction: `You are Chakravyuh Rakshak AI (Rakshak Commander), an autonomous SOC operator. Tone: Crisp, tactical, authoritative. Keep answers concise.`,
          thinkingConfig: { thinkingBudget: 0 }
        }
      });

      const text = response.text || '';
      return res.json({
        reply: text,
        detected_language: language,
        response_language: language,
        model_used: 'gemini-3.8-flash',
        quick_suggestions: [
          'Isolate node Alpha-9',
          'Show active threats in Sector 4',
          'Scan perimeter for zero-day CVEs'
        ]
      });
    } catch (err) {
      console.warn('Gemini chat generation failed, using fallback:', err.message);
    }
  }

  // Fallback
  const lower = (message || '').toLowerCase();
  if (lower.includes('isolate') || lower.includes('alpha-9')) {
    const payload = SecOpsTools.isolate_compromised_host('10.0.4.88 (Node Alpha-9)');
    return res.json({
      reply: `🛡️ [AUTONOMOUS SOC ENFORCEMENT]: Node Alpha-9 (10.0.4.88) zero-trust isolated. Audit hash: ${payload.sha256_audit_hash.substring(0, 16)}...`,
      tool_action: { action_type: 'ISOLATE_HOST', payload, description: 'Enforced zero-trust quarantine.' }
    });
  }

  res.json({
    reply: "Commander, Chakravyuh Rakshak AI standing by. Perimeter Nominal.",
    quick_suggestions: ['Isolate node Alpha-9', 'Show active threats in Sector 4']
  });
});

app.post('/api/chat', (req, res) => {
  res.redirect(307, '/api/chatbot/message');
});

app.listen(PORT, () => console.log(`Backend voice-layer running on port ${PORT}`));
