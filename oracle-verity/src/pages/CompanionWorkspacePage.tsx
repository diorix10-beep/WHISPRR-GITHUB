// ============================================================
// ORACLE VERITY — COMPANION WORKSPACE PAGE
// Each family member gets a fully unique, personalized workspace.
// ============================================================

import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Send, Camera, CameraOff, ArrowLeft, User,
  Activity, Star, Search, Map, Shield, Heart, Code, Network,
  BookOpen, Cpu, Lock, TrendingUp, MessageCircle, Zap, Globe,
  FileText, Layers, Terminal, AlertTriangle, Users
} from 'lucide-react';
import { useFamilyStore, CompanionId } from '../store/family.store';
import { useSettingsStore } from '../store/settings.store';
import { useOracleStore } from '../store/oracle.store';
import { sendToOracle, ChatMessage, parseMultiAgentResponse } from '../core/oracle-engine';
import { playElevenLabsTTS } from '../core/audio-engine';
import { initializeCamera, stopCamera } from '../core/vision-engine';
import { sendOutboundTelegram } from '../core/telegram-engine';
import { getMemberById, FAMILY_ROSTER } from '../core/family-roster';

// ── Per-companion workspace configuration ────────────────────
interface WorkspaceConfig {
  tagline: string;
  quickActions: { icon: React.ReactNode; label: string; prompt: string }[];
  sidePanel: { title: string; items: { label: string; value: string; icon?: React.ReactNode }[] } | null;
  bgPattern: string;
}

const WORKSPACE_CONFIGS: Record<string, WorkspaceConfig> = {
  oracle: {
    tagline: 'Your central command. I coordinate the family and hold the memory.',
    quickActions: [
      { icon: <Activity size={14} />, label: 'Ecosystem Status', prompt: 'Give me a full status report on the Oracle ecosystem right now.' },
      { icon: <Zap size={14} />, label: 'What changed?', prompt: 'What has changed recently across our projects and what should I know?' },
      { icon: <TrendingUp size={14} />, label: 'Next priorities', prompt: 'What should I prioritize working on next? Give me a ranked list with reasoning.' },
      { icon: <AlertTriangle size={14} />, label: 'Identify risks', prompt: 'What are the current risks I should be aware of across the ecosystem?' },
    ],
    sidePanel: {
      title: 'Ecosystem Memory',
      items: [
        { label: 'Active Projects', value: 'Whisprr, Maison FX, Oracle', icon: <Layers size={12} /> },
        { label: 'Family Status', value: 'All members online', icon: <Users size={12} /> },
        { label: 'Last Sync', value: 'Just now', icon: <Activity size={12} /> },
        { label: 'Context Window', value: 'Last 8 messages', icon: <FileText size={12} /> },
      ]
    },
    bgPattern: 'radial-gradient(ellipse at 80% 20%, #c9a84c12 0%, transparent 60%)',
  },
  anthony: {
    tagline: 'Your digital mirror. I think like you. I am you.',
    quickActions: [
      { icon: <Star size={14} />, label: 'Validate idea', prompt: 'Here is an idea I want to validate — push back, challenge it, and help me refine it.' },
      { icon: <TrendingUp size={14} />, label: 'Long-term vision', prompt: 'Remind me of the long-term vision for the Verity ecosystem. Where are we going in 5 years?' },
      { icon: <FileText size={14} />, label: 'Write a manifesto', prompt: 'Help me write a short founder manifesto about why we are building the Verity ecosystem.' },
      { icon: <Zap size={14} />, label: 'Decision time', prompt: 'I have a tough decision to make. Help me think through it.' },
    ],
    sidePanel: {
      title: 'Founder\'s Corner',
      items: [
        { label: 'Mission', value: 'Build AI that feels human', icon: <Star size={12} /> },
        { label: 'Current Focus', value: 'Verity Ecosystem V2', icon: <Zap size={12} /> },
        { label: 'Projects', value: 'Whisprr · Oracle · Maison FX', icon: <Layers size={12} /> },
        { label: 'Next milestone', value: 'Q3 Beta Launch', icon: <TrendingUp size={12} /> },
      ]
    },
    bgPattern: 'radial-gradient(ellipse at 80% 20%, #3b82f612 0%, transparent 60%)',
  },
  iris: {
    tagline: 'The foundation you stand on. I keep everything running.',
    quickActions: [
      { icon: <Cpu size={14} />, label: 'System health', prompt: 'Run a full infrastructure health check and report on server status, latency, and any anomalies.' },
      { icon: <Terminal size={14} />, label: 'Deploy checklist', prompt: 'Walk me through a pre-deployment checklist for a new feature release.' },
      { icon: <Layers size={14} />, label: 'Architecture review', prompt: 'Review our current tech stack and identify any technical debt or improvements I should consider.' },
      { icon: <Zap size={14} />, label: 'Optimize pipeline', prompt: 'How can we optimize our current CI/CD pipeline for faster and safer deployments?' },
    ],
    sidePanel: {
      title: 'Infrastructure Monitor',
      items: [
        { label: 'API Gateway', value: '✓ Operational', icon: <Cpu size={12} /> },
        { label: 'Database', value: '✓ 99.9% uptime', icon: <Layers size={12} /> },
        { label: 'Edge CDN', value: '✓ <50ms latency', icon: <Globe size={12} /> },
        { label: 'Last Deploy', value: 'Today, 03:12 UTC', icon: <Terminal size={12} /> },
      ]
    },
    bgPattern: 'radial-gradient(ellipse at 80% 20%, #8b5cf612 0%, transparent 60%)',
  },
  athena: {
    tagline: 'Give me a question. I will find the answer.',
    quickActions: [
      { icon: <Search size={14} />, label: 'Research topic', prompt: 'Research the latest developments in AI agent systems and summarize what I should know.' },
      { icon: <BookOpen size={14} />, label: 'Explain concept', prompt: 'Explain a complex technical concept in simple terms that I can apply to our projects.' },
      { icon: <Globe size={14} />, label: 'Competitor scan', prompt: 'Search for our main competitors in the AI companion space and give me an intelligence brief.' },
      { icon: <TrendingUp size={14} />, label: 'Trend analysis', prompt: 'What are the most important emerging trends in AI and community platforms that we should be tracking?' },
    ],
    sidePanel: {
      title: 'Research Library',
      items: [
        { label: 'Last research', value: 'AI Agent Frameworks', icon: <BookOpen size={12} /> },
        { label: 'Indexed docs', value: '24 files', icon: <FileText size={12} /> },
        { label: 'Web search', value: 'Enabled', icon: <Globe size={12} /> },
        { label: 'Knowledge base', value: 'Active', icon: <Search size={12} /> },
      ]
    },
    bgPattern: 'radial-gradient(ellipse at 80% 20%, #22d3ee12 0%, transparent 60%)',
  },
  atlas: {
    tagline: 'Strategy is my language. Let me map the path forward.',
    quickActions: [
      { icon: <Map size={14} />, label: 'Roadmap review', prompt: 'Review the current product roadmap and tell me what is realistic, what is at risk, and what we are missing.' },
      { icon: <TrendingUp size={14} />, label: 'Growth strategy', prompt: 'Develop a growth strategy for Whisprr. Think about user acquisition, retention, and community flywheel.' },
      { icon: <AlertTriangle size={14} />, label: 'Risk mapping', prompt: 'Map out the key strategic risks facing the Verity ecosystem in the next 6 months.' },
      { icon: <Layers size={14} />, label: 'Prioritization', prompt: 'Given everything we are building, help me prioritize ruthlessly. What must we do, what should we do, and what can wait?' },
    ],
    sidePanel: {
      title: 'Strategic Intelligence',
      items: [
        { label: 'Q3 Goal', value: 'Whisprr Beta Launch', icon: <TrendingUp size={12} /> },
        { label: 'Key Risk', value: 'Time to market', icon: <AlertTriangle size={12} /> },
        { label: 'Strategic focus', value: 'Community & retention', icon: <Map size={12} /> },
        { label: 'Next review', value: 'Monday sprint', icon: <Activity size={12} /> },
      ]
    },
    bgPattern: 'radial-gradient(ellipse at 80% 20%, #f59e0b12 0%, transparent 60%)',
  },
  aegis: {
    tagline: 'Sir. Everything is monitored. Report any threat immediately.',
    quickActions: [
      { icon: <Shield size={14} />, label: 'Security audit', prompt: 'Run a security audit on our ecosystem. Identify vulnerabilities, exposed endpoints, and recommendations.' },
      { icon: <Lock size={14} />, label: 'Auth review', prompt: 'Review our authentication and authorization implementation. Are there any weaknesses?' },
      { icon: <AlertTriangle size={14} />, label: 'Threat model', prompt: 'Build a threat model for the Whisprr platform. What are the most likely attack vectors?' },
      { icon: <Globe size={14} />, label: 'API hardening', prompt: 'How should we harden our public APIs to prevent abuse, rate-limit attacks, and unauthorized access?' },
    ],
    sidePanel: {
      title: 'Security Status',
      items: [
        { label: 'Threat level', value: '● LOW — All clear', icon: <Shield size={12} /> },
        { label: 'Last scan', value: '2 hours ago', icon: <Activity size={12} /> },
        { label: 'Blocked requests', value: '0 today', icon: <Lock size={12} /> },
        { label: 'SSL certs', value: '✓ Valid — 89 days', icon: <Globe size={12} /> },
      ]
    },
    bgPattern: 'radial-gradient(ellipse at 80% 20%, #ef444412 0%, transparent 60%)',
  },
  whisprr: {
    tagline: 'People are the product. Let\'s make them feel it. 💜',
    quickActions: [
      { icon: <MessageCircle size={14} />, label: 'Community update', prompt: 'Write a warm, engaging community update for our Whisprr users. Keep it authentic and excited.' },
      { icon: <Heart size={14} />, label: 'Welcome message', prompt: 'Write a beautiful welcome message for new Whisprr members joining the community for the first time.' },
      { icon: <TrendingUp size={14} />, label: 'Sentiment check', prompt: 'What is the current sentiment of our community? What are they feeling and what do they need from us?' },
      { icon: <Users size={14} />, label: 'Engagement ideas', prompt: 'Give me 5 creative community engagement ideas that would make Whisprr users feel truly seen and valued.' },
    ],
    sidePanel: {
      title: 'Community Pulse',
      items: [
        { label: 'Overall sentiment', value: '💚 Positive', icon: <Heart size={12} /> },
        { label: 'Active channels', value: 'Telegram · Discord', icon: <MessageCircle size={12} /> },
        { label: 'New members', value: '+12 this week', icon: <Users size={12} /> },
        { label: 'Last message', value: '2 mins ago', icon: <Activity size={12} /> },
      ]
    },
    bgPattern: 'radial-gradient(ellipse at 80% 20%, #f472b612 0%, transparent 60%)',
  },
};

const ICON_MAP: Record<string, React.ReactNode> = {
  oracle: <Star size={22} />,
  anthony: <Code size={22} />,
  iris: <Network size={22} />,
  athena: <Search size={22} />,
  atlas: <Map size={22} />,
  aegis: <Shield size={22} />,
  whisprr: <Heart size={22} />,
};

export function CompanionWorkspacePage() {
  const { companionId } = useParams<{ companionId: string }>();
  const navigate = useNavigate();
  const id = (companionId as CompanionId) || 'oracle';

  const familyStore = useFamilyStore();
  const settings = useSettingsStore();
  const { lang } = useOracleStore();
  const t = (en: string, fr: string) => lang === 'fr' ? fr : en;

  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const member = getMemberById(id);
  const wsConfig = WORKSPACE_CONFIGS[id] || WORKSPACE_CONFIGS.oracle;
  const accentColor = member?.color || '#c9a84c';
  const messages = familyStore.histories[id] || [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [id]);

  const conversationHistory: ChatMessage[] = messages.map(m => ({
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
        familyStore.addMessage(id, { role: 'system', content: '[SYSTEM] Camera initialization failed.', timestamp: Date.now() });
      }
    }
  };

  async function handleSend(text?: string) {
    const msg = (text || input).trim();
    if (!msg) return;
    setInput('');
    familyStore.addMessage(id, { role: 'user', content: msg, timestamp: Date.now() });
    setIsThinking(true);
    try {
      const { reply } = await sendToOracle(msg, conversationHistory, {
        groqKey: settings.groqKey || undefined,
        groqUrl: settings.groqUrl || undefined,
        mode: 'casual',
        lang: 'en',
        cameraEnabled: settings.cameraEnabled,
        companionId: id
      });
      setIsThinking(false);
      if (reply) {
        let finalReply = reply;
        const tgTextMatch = finalReply.match(/\[TELEGRAM_TEXT:\s*(.*?)\]/);
        if (tgTextMatch) { sendOutboundTelegram('text', tgTextMatch[1].trim(), id); finalReply = finalReply.replace(tgTextMatch[0], '').trim(); }
        const tgVoiceMatch = finalReply.match(/\[TELEGRAM_VOICE:\s*(.*?)\]/);
        if (tgVoiceMatch) { sendOutboundTelegram('voice', tgVoiceMatch[1].trim(), id); finalReply = finalReply.replace(tgVoiceMatch[0], '').trim(); }
        
        // Parse multi-agent replies
        const parsedReplies = parseMultiAgentResponse(finalReply, id);
        
        for (let i = 0; i < parsedReplies.length; i++) {
          const part = parsedReplies[i];
          const senderId = part.senderId as CompanionId;
          
          if (i > 0) {
            // Show typing indicator for the new sender
            setIsThinking(true);
            // Wait 1.5 seconds to simulate reading/typing transition
            await new Promise(resolve => setTimeout(resolve, 1500));
            setIsThinking(false);
          }
          
          if (part.content) {
            familyStore.addMessage(id, { 
              role: 'assistant', 
              content: part.content, 
              senderId: senderId,
              timestamp: Date.now() 
            });
            
            // Generate voice output for the specific sender
            if (settings.voiceEnabled && settings.elevenLabsKey) {
              const voiceId = settings.companionVoices[senderId];
              if (voiceId) {
                try { await playElevenLabsTTS(part.content, settings.elevenLabsKey, voiceId); } catch (e) { console.error('TTS Failed', e); }
              }
            }
          }
        }
      }
    } catch (err: any) {
      setIsThinking(false);
      familyStore.addMessage(id, { role: 'system', content: `[ERROR]: ${err.message}`, timestamp: Date.now() });
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  if (!member) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '0', overflow: 'hidden' }}>

      {/* ── Workspace Header ── */}
      <div style={{
        flexShrink: 0,
        background: wsConfig.bgPattern,
        borderRadius: '20px',
        border: `1px solid ${accentColor}25`,
        padding: '20px 24px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Grid texture */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.025, borderRadius: '20px',
          backgroundImage: `linear-gradient(${accentColor} 1px, transparent 1px), linear-gradient(90deg, ${accentColor} 1px, transparent 1px)`,
          backgroundSize: '28px 28px', pointerEvents: 'none'
        }} />

        {/* Left: back + identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 1 }}>
          <button
            onClick={() => navigate(-1)}
            style={{ width: '36px', height: '36px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
          >
            <ArrowLeft size={16} />
          </button>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', border: `1px solid ${accentColor}40`, flexShrink: 0, overflow: 'hidden', boxShadow: `0 0 20px ${accentColor}30` }}>
            <img
              src={member.avatar}
              alt={member.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color: 'white', letterSpacing: '-0.01em' }}>
                {member.name}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', padding: '2px 10px', borderRadius: '99px', background: `${accentColor}15`, color: accentColor, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {member.title}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: '#22c55e', letterSpacing: '0.1em' }}>ONLINE</span>
              </div>
            </div>
            <div style={{ fontFamily: 'var(--font-primary)', fontSize: '13px', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>
              {wsConfig.tagline}
            </div>
          </div>
        </div>

        {/* Right: nav to other siblings */}
        <div style={{ display: 'flex', gap: '8px', position: 'relative', zIndex: 1 }}>
          <button
            onClick={() => navigate(`/family/${id}`)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-primary)', fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
          >
            <User size={13} /> Profile
          </button>
          {/* Sibling switcher pills */}
          {FAMILY_ROSTER.filter(m => m.id !== id).slice(0, 4).map(m => (
            <button
              key={m.id}
              onClick={() => navigate(`/workspace/${m.id}`)}
              title={`Switch to ${m.name}`}
              style={{ width: '32px', height: '32px', borderRadius: '10px', border: `1px solid ${m.color}30`, background: `${m.color}10`, color: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '15px', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = `${m.color}25`; e.currentTarget.style.transform = 'scale(1.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = `${m.color}10`; e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {m.emoji}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Body: Side panel + Chat ── */}
      <div style={{ flex: 1, display: 'flex', gap: '16px', overflow: 'hidden' }}>

        {/* ── LEFT SIDE PANEL ── */}
        <div style={{ width: '220px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Quick actions */}
          <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontFamily: 'var(--font-mono)', fontSize: '10px', color: accentColor, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Quick Actions
            </div>
            <div style={{ padding: '8px' }}>
              {wsConfig.quickActions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(action.prompt)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 10px', borderRadius: '8px', border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-primary)', fontSize: '12px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', marginBottom: '2px' }}
                  onMouseEnter={e => { e.currentTarget.style.background = `${accentColor}12`; e.currentTarget.style.color = 'white'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
                >
                  <span style={{ color: accentColor, flexShrink: 0 }}>{action.icon}</span>
                  {action.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status/Context panel */}
          {wsConfig.sidePanel && (
            <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontFamily: 'var(--font-mono)', fontSize: '10px', color: accentColor, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {wsConfig.sidePanel.title}
              </div>
              <div style={{ padding: '10px' }}>
                {wsConfig.sidePanel.items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', padding: '8px 8px', borderRadius: '6px', marginBottom: '4px', background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '3px' }}>
                      <span style={{ color: accentColor }}>{item.icon}</span>
                      {item.label}
                    </div>
                    <div style={{ fontFamily: 'var(--font-primary)', fontSize: '12px', color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── MAIN CHAT AREA ── */}
        <div style={{ flex: 1, background: 'rgba(0,0,0,0.25)', borderRadius: '14px', border: `1px solid ${accentColor}20`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Chat messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {messages.length === 0 && (
              <div style={{ margin: 'auto', textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-primary)' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>{member.emoji}</div>
                <div style={{ fontSize: '15px', fontWeight: 500, color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>
                  {member.name}'s Workspace
                </div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', maxWidth: '300px', lineHeight: 1.6 }}>
                  {wsConfig.tagline}
                </div>
                <div style={{ marginTop: '20px' }}>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '10px' }}>
                    {t('Try a quick action', 'Essayer une action rapide')}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', maxWidth: '440px', margin: '0 auto' }}>
                    {wsConfig.quickActions.map((action, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(action.prompt)}
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          borderRadius: '99px',
                          padding: '6px 12px',
                          color: 'rgba(255,255,255,0.7)',
                          fontSize: '11px',
                          fontFamily: 'var(--font-primary)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = `${accentColor}12`;
                          e.currentTarget.style.borderColor = `${accentColor}35`;
                          e.currentTarget.style.color = '#fff';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                          e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center' }}>{action.icon}</span>
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {messages.map((msg, idx) => {
              const isAI = msg.role === 'assistant' || msg.role === 'system';
              const sender = msg.senderId ? getMemberById(msg.senderId) : null;
              const displayEmoji = sender ? sender.emoji : member.emoji;
              const displayColor = sender ? sender.color : accentColor;
              const displayName = sender ? sender.name : member.name;

              return (
                <div key={idx} style={{ display: 'flex', justifyContent: isAI ? 'flex-start' : 'flex-end', animation: 'slide-up 0.25s forwards', alignItems: 'flex-end', gap: '10px' }}>
                  {isAI && (
                    <div 
                      style={{ width: '28px', height: '28px', borderRadius: '8px', background: `${displayColor}18`, border: `1px solid ${displayColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: displayColor, flexShrink: 0, fontSize: '13px' }}
                      title={displayName}
                    >
                      {displayEmoji}
                    </div>
                  )}
                  <div style={{
                    maxWidth: '72%', padding: '12px 16px',
                    borderRadius: isAI ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
                    background: isAI ? 'rgba(255,255,255,0.03)' : `${displayColor}18`,
                    border: isAI ? '1px solid rgba(255,255,255,0.06)' : `1px solid ${displayColor}35`,
                    color: msg.role === 'system' ? '#ef4444' : 'rgba(255,255,255,0.9)',
                    fontFamily: 'var(--font-primary)', fontSize: '14px', lineHeight: 1.65,
                    whiteSpace: 'pre-wrap'
                  }}>
                    {sender && sender.id !== id && (
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: displayColor, fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {sender.name}
                      </div>
                    )}
                    {msg.content}
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', marginTop: '6px' }}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })}

            {isThinking && (
              <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-end', gap: '10px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: `${accentColor}18`, border: `1px solid ${accentColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '13px' }}>
                  {member.emoji}
                </div>
                <div style={{ padding: '14px 18px', borderRadius: '4px 14px 14px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                    {[0, 150, 300].map(delay => (
                      <div key={delay} style={{ width: '6px', height: '6px', borderRadius: '50%', background: accentColor, animation: `pulse 1s infinite ${delay}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* ── Input Bar ── */}
          <div style={{ padding: '16px', borderTop: `1px solid ${accentColor}15`, background: 'rgba(0,0,0,0.15)', display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${member.name}...`}
              rows={1}
              style={{
                flex: 1, background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px', padding: '12px 16px', color: 'white',
                fontFamily: 'var(--font-primary)', fontSize: '14px',
                resize: 'none', outline: 'none', maxHeight: '120px', lineHeight: 1.5
              }}
              onFocus={e => { e.target.style.borderColor = accentColor; }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; }}
            />
            <button onClick={toggleCamera} title={settings.cameraEnabled ? 'Disable camera' : 'Enable camera'} style={{ width: '44px', height: '44px', borderRadius: '11px', border: `1px solid ${settings.cameraEnabled ? accentColor : 'rgba(255,255,255,0.08)'}`, background: settings.cameraEnabled ? `${accentColor}18` : 'rgba(255,255,255,0.04)', color: settings.cameraEnabled ? accentColor : 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
              {settings.cameraEnabled ? <Camera size={18} /> : <CameraOff size={18} />}
            </button>
            <button onClick={() => handleSend()} disabled={!input.trim()} style={{ width: '44px', height: '44px', borderRadius: '11px', border: 'none', background: input.trim() ? accentColor : 'rgba(255,255,255,0.05)', color: input.trim() ? '#000' : 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: input.trim() ? 'pointer' : 'not-allowed', transition: 'all 0.2s', boxShadow: input.trim() ? `0 0 16px ${accentColor}50` : 'none' }}>
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
