// ============================================================
// ORACLE VERITY — CHAT PANE
// Not a chatbot — Oracle's context communication panel
// ============================================================

import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, X, Camera, CameraOff } from 'lucide-react';
import { Message, useOracleStore } from '../../store/oracle.store';
import { useSettingsStore } from '../../store/settings.store';
import { sendToOracle, ChatMessage, parseMultiAgentResponse } from '../../core/oracle-engine';
import { OracleMode, ORACLE_MODES } from '../../core/persona';
import { playElevenLabsTTS } from '../../core/audio-engine';
import { initializeCamera, stopCamera } from '../../core/vision-engine';
import { sendOutboundTelegram } from '../../core/telegram-engine';
import { useFamilyStore, CompanionId } from '../../store/family.store';
import { getMemberById } from '../../core/family-roster';
import { useLlmStore } from '../../store/llm.store';

// Define companion UI metadata
const COMPANION_UI: Record<string, { name: string, color: string }> = {
  oracle: { name: 'Oracle Verity', color: '#c9a84c' },
  anthony: { name: 'Anthony (Founder Clone)', color: '#3b82f6' },
  iris: { name: 'Iris', color: '#8b5cf6' },
  athena: { name: 'Athena', color: '#22d3ee' },
  atlas: { name: 'Atlas', color: '#f59e0b' },
  aegis: { name: 'Aegis', color: '#ef4444' },
  whisprr: { name: 'Whisprr', color: '#f472b6' }
};

interface Props {
  mode: OracleMode;
  lang: 'en' | 'fr';
  onClose: () => void;
}

export function OracleChatPane({ mode, lang, onClose }: Props) {
  const { activeCompanionId, setThinking, setSpeaking, setLang } = useOracleStore();
  const familyStore = useFamilyStore();
  const settings = useSettingsStore();
  const llmStore = useLlmStore();
  
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const companionUi = COMPANION_UI[activeCompanionId] || COMPANION_UI.oracle;
  const accentColor = companionUi.color;

  const messages = familyStore.histories[activeCompanionId] || [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [activeCompanionId]);

  const conversationHistory: ChatMessage[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const toggleCamera = async () => {
    if (settings.cameraEnabled) {
      stopCamera();
      settings.setCameraEnabled(false);
    } else {
      const initialized = await initializeCamera();
      if (initialized) {
        settings.setCameraEnabled(true);
      } else {
        familyStore.addMessage(activeCompanionId, { role: 'system', content: '[SYSTEM] Camera initialization failed. Please check browser permissions.', timestamp: Date.now() });
      }
    }
  };

  async function handleSend() {
    const text = input.trim();
    if (!text) return;
    setInput('');

    familyStore.addMessage(activeCompanionId, { role: 'user', content: text, timestamp: Date.now() });
    setThinking(true);

    try {
      const { reply, detectedLang } = await sendToOracle(text, conversationHistory, {
        groqKey: settings.groqKey || undefined,
        groqUrl: settings.groqUrl || undefined,
        mode,
        lang,
        cameraEnabled: settings.cameraEnabled,
        companionId: activeCompanionId
      });

      setLang(detectedLang);
      setThinking(false);

      if (reply) {
        let finalReply = reply;
        
        // Intercept Telegram Text
        const tgTextMatch = finalReply.match(/\[TELEGRAM_TEXT:\s*(.*?)\]/);
        if (tgTextMatch) {
          sendOutboundTelegram('text', tgTextMatch[1].trim(), activeCompanionId);
          finalReply = finalReply.replace(tgTextMatch[0], '').trim();
        }

        // Intercept Telegram Voice
        const tgVoiceMatch = finalReply.match(/\[TELEGRAM_VOICE:\s*(.*?)\]/);
        if (tgVoiceMatch) {
          sendOutboundTelegram('voice', tgVoiceMatch[1].trim(), activeCompanionId);
          finalReply = finalReply.replace(tgVoiceMatch[0], '').trim();
        }

        // Parse multi-agent replies
        const parsedReplies = parseMultiAgentResponse(finalReply, activeCompanionId);

        for (let i = 0; i < parsedReplies.length; i++) {
          const part = parsedReplies[i];
          const senderId = part.senderId as CompanionId;

          if (i > 0) {
            // Show typing indicator for the new sender
            setThinking(true);
            // Wait 1.5 seconds to simulate reading/typing transition
            await new Promise(resolve => setTimeout(resolve, 1500));
            setThinking(false);
          }

          if (part.content) {
            familyStore.addMessage(activeCompanionId, {
              role: 'assistant',
              content: part.content,
              senderId: senderId,
              timestamp: Date.now()
            });

            // Generate voice output for the specific sender
            if (settings.voiceEnabled && settings.elevenLabsKey) {
              const voiceId = settings.companionVoices?.[senderId] ?? settings.companionVoices?.oracle;
              if (voiceId) {
                setSpeaking(true);
                try {
                  await playElevenLabsTTS(part.content, settings.elevenLabsKey, voiceId);
                } catch (e) {
                  console.error('TTS Failed', e);
                }
                setSpeaking(false);
              }
            }
          }
        }
      }
    } catch (err: any) {
      setThinking(false);
      setSpeaking(false);
      familyStore.addMessage(activeCompanionId, {
        role: 'system',
        content: `[SYSTEM DIAGNOSTIC FAILURE]: I encountered a critical error while processing that request. \n\nDetails: ${err.message}`,
        timestamp: Date.now()
      });
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const placeholder =
    lang === 'fr'
      ? `Parle à ${companionUi.name}... (Entrée pour envoyer)`
      : `Talk to ${companionUi.name}... (Enter to send)`;

  const chatMessages = messages.slice(-20); // Show last 20

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '0',
        left: '0',
        right: '0',
        height: '420px',
        zIndex: 90,
        background: 'rgba(5,5,12,0.97)',
        backdropFilter: 'blur(32px)',
        borderTop: `1px solid ${accentColor}20`,
        display: 'flex',
        flexDirection: 'column',
        animation: 'slide-up 0.3s cubic-bezier(0.4,0,0.2,1) forwards',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          borderBottom: `1px solid rgba(255,255,255,0.05)`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', maxWidth: '85%', overflow: 'hidden' }}>
          <div className="status-dot" style={{ background: accentColor, boxShadow: `0 0 8px ${accentColor}60`, flexShrink: 0 }} />
          <span style={{ fontFamily: 'var(--font-primary)', fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.9)', flexShrink: 0 }}>
            {companionUi.name}
          </span>
          <span style={{
            fontSize: '10px', padding: '2px 8px', borderRadius: '99px',
            background: `${accentColor}15`, color: accentColor,
            fontFamily: 'var(--font-primary)', fontWeight: 600, letterSpacing: '0.04em',
            textTransform: 'uppercase', flexShrink: 0
          }}>
            {activeCompanionId === 'oracle' ? (lang === 'fr' ? 'Présidente Exécutive' : 'Executive Chairwoman') : activeCompanionId}
          </span>
          <span style={{
            fontSize: '10px', color: 'rgba(255,255,255,0.35)',
            fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            marginLeft: '4px'
          }} title={`Active Engine: ${llmStore.companionModels[activeCompanionId] || llmStore.activeTextModel}`}>
            ({llmStore.companionModels[activeCompanionId] || llmStore.activeTextModel || 'No Model Set'})
          </span>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', display: 'flex', padding: '4px' }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {chatMessages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-primary)', fontSize: '13px', fontStyle: 'italic' }}>
            {lang === 'fr' ? `Commencez une conversation avec ${companionUi.name}...` : `Start a conversation with ${companionUi.name}...`}
          </div>
        )}
        {chatMessages.map((msg, idx) => (
          <MessageBubble key={idx} message={msg} accentColor={accentColor} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          gap: '8px',
          alignItems: 'flex-end',
        }}
      >
        <textarea
          ref={inputRef}
          id="oracle-chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${input ? accentColor + '40' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: '12px',
            padding: '10px 14px',
            color: 'rgba(255,255,255,0.9)',
            fontFamily: 'var(--font-primary)',
            fontSize: '13px',
            resize: 'none',
            outline: 'none',
            lineHeight: '1.5',
            maxHeight: '100px',
            transition: 'border-color 0.2s',
          }}
        />
        <button
          onClick={toggleCamera}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            border: `1px solid ${settings.cameraEnabled ? accentColor : 'transparent'}`,
            background: settings.cameraEnabled ? `${accentColor}20` : 'rgba(255,255,255,0.06)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            flexShrink: 0,
            color: settings.cameraEnabled ? accentColor : 'rgba(255,255,255,0.4)',
          }}
          title={settings.cameraEnabled ? "Disable Vision" : "Enable Vision"}
        >
          {settings.cameraEnabled ? <Camera size={16} /> : <CameraOff size={16} />}
        </button>
        <button
          id="oracle-send-btn"
          onClick={handleSend}
          disabled={!input.trim()}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            border: 'none',
            background: input.trim() ? accentColor : 'rgba(255,255,255,0.06)',
            cursor: input.trim() ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            flexShrink: 0,
            color: input.trim() ? '#000' : 'rgba(255,255,255,0.3)',
          }}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

function MessageBubble({ message, accentColor }: { message: any; accentColor: string }) {
  const isAssistant = message.role === 'assistant' || message.role === 'system';
  const sender = message.senderId ? getMemberById(message.senderId) : null;
  const displayEmoji = sender ? sender.emoji : '';
  const displayName = sender ? sender.name : '';
  const displayColor = sender ? sender.color : accentColor;

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isAssistant ? 'flex-start' : 'flex-end',
        animation: 'slide-up 0.25s cubic-bezier(0.4,0,0.2,1) forwards',
        alignItems: 'flex-end',
        gap: '8px',
      }}
    >
      {isAssistant && sender && (
        <div 
          style={{
            width: '24px', height: '24px', borderRadius: '6px',
            background: `${displayColor}18`, border: `1px solid ${displayColor}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '11px', flexShrink: 0, color: displayColor
          }}
          title={displayName}
        >
          {displayEmoji}
        </div>
      )}
      <div
        style={{
          maxWidth: '70%',
          padding: '10px 14px',
          borderRadius: isAssistant ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
          background: isAssistant
            ? `rgba(255,255,255,0.05)`
            : `${displayColor}20`,
          border: isAssistant
            ? '1px solid rgba(255,255,255,0.06)'
            : `1px solid ${displayColor}35`,
          fontSize: '13px',
          lineHeight: '1.6',
          color: isAssistant ? (message.role === 'system' ? '#ef4444' : 'rgba(255,255,255,0.85)') : 'rgba(255,255,255,0.92)',
          fontFamily: 'var(--font-primary)',
        }}
      >
        {sender && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: displayColor, fontWeight: 700, marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {displayName}
          </div>
        )}
        {message.content}
        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', marginTop: '4px' }}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}
