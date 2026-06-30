// ============================================================
// ORACLE VERITY — ORACLE OFFICE
// The persistent workspace — Oracle's domain
// ============================================================

import React, { useEffect, useRef } from 'react';
import {
  MessageSquare, Settings, Bell, FolderOpen, Zap,
  Moon, Sun, Coffee, Code, Crown, Heart, LayoutGrid,
  ChevronRight, Clock, Wifi
} from 'lucide-react';

import { useOracleStore } from '../../store/oracle.store';
import { useProjectsStore } from '../../store/projects.store';
import { useSettingsStore } from '../../store/settings.store';
import { useSupportStore } from '../../store/support.store';
import { ORACLE_MODES, OracleMode } from '../../core/persona';
import { getTimeGreeting, getTimeOfDayMode } from '../../core/language-detector';

import { BackgroundScene } from './BackgroundScene';
import { OracleAvatar } from './OracleAvatar';
import { ActivityTicker } from './ActivityTicker';
import { ModeIndicator } from './ModeIndicator';
import { ProjectPanel } from '../projects/ProjectPanel';
import { OracleChatPane } from '../communication/OracleChatPane';
import { NotificationFeed } from '../communication/NotificationFeed';
import { SettingsPanel } from '../settings/SettingsPanel';
import { SupportDashboard } from './SupportDashboard';
import { TelegramPane } from '../communication/TelegramPane';
import { startTelegramPolling, stopTelegramPolling } from '../../core/telegram-engine';

// ── Clock ─────────────────────────────────────────────────
function LiveClock({ lang }: { lang: 'en' | 'fr' }) {
  const [time, setTime] = React.useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.05em' }}>
      {time.toLocaleTimeString(lang === 'fr' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  );
}

// ── Device Card: Oracle's Laptop ──────────────────────────
function DeviceLaptop({ mode, accentColor, lang }: { mode: OracleMode; accentColor: string; lang: 'en' | 'fr' }) {
  const lines = ORACLE_MODES[mode].id === 'developer' || ORACLE_MODES[mode].id === 'night'
    ? [
        { c: '#6366f1', t: 'const oracle = new OracleEngine({' },
        { c: '#22d3ee', t: '  mode: "developer",' },
        { c: '#22d3ee', t: '  projects: ["WHISPRR"],' },
        { c: '#a3e635', t: '  lang: detectLanguage(input)' },
        { c: '#6366f1', t: '});' },
        { c: '#64748b', t: '' },
        { c: '#f472b6', t: 'await oracle.review({' },
        { c: '#22d3ee', t: '  path: "./src/auth",' },
        { c: '#a3e635', t: '  depth: "deep"' },
        { c: '#f472b6', t: '});' },
      ]
    : [
        { c: 'rgba(255,255,255,0.7)', t: '◉ WHISPRR — Q2 Beta' },
        { c: 'rgba(255,255,255,0.4)', t: '  ✓ MVP shipped' },
        { c: accentColor, t: '  → Beta in progress' },
        { c: 'rgba(255,255,255,0.25)', t: '  ○ Public launch' },
        { c: 'rgba(255,255,255,0.1)', t: '' },
        { c: 'rgba(255,255,255,0.7)', t: '◉ Maison FX' },
        { c: accentColor, t: '  → Brand dev' },
        { c: 'rgba(255,255,255,0.7)', t: '◉ Oracle Systems' },
        { c: '#22c55e', t: '  ✓ Active build' },
      ];

  const isDev = ['developer', 'night'].includes(mode);

  return (
    <div style={{
      borderRadius: '12px',
      background: 'rgba(0,0,0,0.5)',
      border: `1px solid ${accentColor}20`,
      overflow: 'hidden',
      flex: 1,
    }}>
      {/* Screen bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '5px',
        padding: '7px 10px',
        background: isDev ? 'rgba(15,15,25,0.9)' : 'rgba(20,18,14,0.9)',
        borderBottom: `1px solid ${accentColor}15`,
      }}>
        {['#ef4444', '#f59e0b', '#22c55e'].map((c, i) => (
          <div key={i} style={{ width: '7px', height: '7px', borderRadius: '50%', background: c, opacity: 0.7 }} />
        ))}
        <span style={{ marginLeft: '6px', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>
          {isDev ? 'oracle-systems — terminal' : 'oracle-verity — projects'}
        </span>
      </div>
      {/* Content */}
      <div style={{ padding: '10px 12px' }}>
        {lines.map((l, i) => (
          <div key={i} style={{
            fontFamily: 'var(--font-mono)', fontSize: '11px',
            color: l.c, lineHeight: '1.7',
            opacity: 0,
            animation: `fade-in 0.3s ${i * 0.06}s forwards`,
          }}>
            {l.t || '\u00A0'}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Device Card: Oracle's Phone ───────────────────────────
function DevicePhone({ accentColor, lang }: { accentColor: string; lang: 'en' | 'fr' }) {
  const msgs = lang === 'fr'
    ? ['WHISPRR Beta live 🚀', 'Revue API demain?', 'Milestone Q2 ✓']
    : ['WHISPRR Beta is live 🚀', 'API review tomorrow?', 'Q2 milestone ✓'];
  return (
    <div style={{
      borderRadius: '12px',
      background: 'rgba(0,0,0,0.5)',
      border: `1px solid ${accentColor}20`,
      overflow: 'hidden',
      width: '120px',
      flexShrink: 0,
    }}>
      {/* Status bar */}
      <div style={{
        padding: '6px 10px 4px',
        background: 'rgba(10,10,20,0.9)',
        borderBottom: `1px solid ${accentColor}15`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'rgba(255,255,255,0.4)' }}>Telegram</span>
        <Wifi size={9} color={accentColor} opacity={0.6} />
      </div>
      {/* Messages */}
      <div style={{ padding: '8px 8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {msgs.map((m, i) => (
          <div key={i} style={{
            padding: '5px 7px',
            borderRadius: '6px',
            background: i % 2 === 0 ? `${accentColor}15` : 'rgba(255,255,255,0.05)',
            fontFamily: 'var(--font-primary)', fontSize: '10px',
            color: 'rgba(255,255,255,0.7)', lineHeight: 1.4,
            opacity: 0,
            animation: `slide-up 0.3s ${i * 0.12}s forwards`,
          }}>
            {m}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Oracle Office Component ──────────────────────────
export function OracleOffice() {
  const store = useOracleStore();
  const projectsStore = useProjectsStore();
  const settings = useSettingsStore();
  const supportStore = useSupportStore();
  const { mode, lang, isTransitioning, isThinking, isSpeaking, currentActivity,
          showChat, showSettings, showNotifications, showSupport, showTelegram,
          notifications, unreadCount,
          setMode, toggleChat, toggleSettings, toggleNotifications, toggleSupport, toggleTelegram, markAllRead,
          setInitialized } = store;

  const config = ORACLE_MODES[mode];
  const accentColor = config.accentColor;
  const t = (en: string, fr: string) => lang === 'fr' ? fr : en;

  // Auto mode based on time of day
  useEffect(() => {
    if (settings.autoModeEnabled) {
      const tod = getTimeOfDayMode();
      if (tod === 'night' && mode !== 'night') setMode('night');
    }
    setInitialized();

    // Fetch dynamic LLM models
    import('../../store/llm.store').then(({ useLlmStore }) => {
      if (settings.groqKey) {
        useLlmStore.getState().fetchModels(settings.groqKey, settings.groqUrl);
      }
    });
  }, []);

  // Telegram polling lifecycle
  useEffect(() => {
    if (settings.hasAnyTelegramToken()) {
      stopTelegramPolling();
      startTelegramPolling();
    } else {
      stopTelegramPolling();
    }
    return () => stopTelegramPolling();
  }, [settings.memberTelegramTokens]);

  // Keyboard shortcut: Cmd+K to open chat
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleChat();
      }
      if (e.key === 'Escape') {
        if (showChat) toggleChat();
        if (showSettings) toggleSettings();
        if (showNotifications) toggleNotifications();
        if (showSupport) toggleSupport();
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showChat, showSettings, showNotifications, showSupport]);

  const greeting = getTimeGreeting(lang);

  return (
    <div
      className={config.cssClass}
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.8s cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      {/* ── Ambient background ── */}
      <BackgroundScene mode={mode} isTransitioning={isTransitioning} />

      {/* ── TOP BAR ── */}
      <div style={{
        position: 'relative', zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px',
        height: '52px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(0,0,0,0.25)',
        backdropFilter: 'blur(20px)',
        flexShrink: 0,
      }}>
        {/* Left: Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '8px',
            background: `linear-gradient(135deg, ${accentColor}40, ${accentColor}15)`,
            border: `1px solid ${accentColor}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', transition: 'all 0.8s',
          }}>
            🔮
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, color: 'rgba(255,255,255,0.95)', lineHeight: 1 }}>
              Oracle Verity
            </div>
            <div style={{ fontFamily: 'var(--font-primary)', fontSize: '10px', color: 'rgba(255,255,255,0.35)', marginTop: '1px' }}>
              {t('Your Persistent AI Presence', 'Votre Présence IA Persistante')}
            </div>
          </div>
        </div>

        {/* Center: Mode indicator */}
        <ModeIndicator currentMode={mode} lang={lang} onModeChange={setMode} />

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <LiveClock lang={lang} />
          <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.08)', margin: '0 4px' }} />

          {/* Notifications */}
          <TopBarButton id="btn-notifications" onClick={toggleNotifications} active={showNotifications} accentColor={accentColor}>
            <Bell size={16} />
            {unreadCount > 0 && (
              <div style={{
                position: 'absolute', top: '-2px', right: '-2px',
                width: '15px', height: '15px', borderRadius: '50%',
                background: accentColor, border: '2px solid #050508',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '8px', fontWeight: 800, color: '#000',
                fontFamily: 'var(--font-primary)',
              }}>
                {unreadCount}
              </div>
            )}
          </TopBarButton>

          {/* Chat */}
          <TopBarButton id="btn-chat" onClick={toggleChat} active={showChat} accentColor={accentColor}>
            <MessageSquare size={16} />
          </TopBarButton>

          {/* Settings */}
          <TopBarButton id="btn-settings" onClick={toggleSettings} active={showSettings} accentColor={accentColor}>
            <Settings size={16} />
          </TopBarButton>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{
        position: 'relative', zIndex: 5,
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '1fr 340px',
        gap: '0',
        overflow: 'hidden',
        paddingBottom: showChat ? '420px' : '0',
        transition: 'padding-bottom 0.3s cubic-bezier(0.4,0,0.2,1)',
      }}>

        {/* ── LEFT: Oracle's presence ── */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          padding: '28px 24px 24px',
          gap: '20px',
          overflowY: 'auto',
        }}>
          {/* Oracle identity */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '28px' }}>
            {/* Avatar */}
            <OracleAvatar
              mode={mode}
              isThinking={isThinking}
              isSpeaking={isSpeaking}
              isTransitioning={isTransitioning}
              onClick={toggleChat}
            />

            {/* Identity info */}
            <div style={{ flex: 1, paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Name & greeting */}
              <div style={{ animation: 'slide-right 0.5s cubic-bezier(0.4,0,0.2,1) forwards' }}>
                <div style={{
                  fontFamily: 'var(--font-primary)',
                  fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em',
                  textTransform: 'uppercase', color: accentColor, marginBottom: '4px', opacity: 0.8,
                }}>
                  {greeting}
                </div>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(24px, 3vw, 38px)',
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.97)',
                  lineHeight: 1.1,
                  letterSpacing: '-0.02em',
                }}>
                  Oracle Verity
                </div>
                <div style={{
                  fontFamily: 'var(--font-primary)',
                  fontSize: '13px',
                  color: 'rgba(255,255,255,0.45)',
                  marginTop: '4px',
                  fontStyle: 'italic',
                }}>
                  {lang === 'fr' ? config.descriptionFr : config.description}
                </div>
              </div>

              {/* Role badges */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[
                  t('Co-Founder', 'Co-Fondatrice'),
                  t('Executive', 'Présidente'),
                  t('Developer', 'Développeuse'),
                  t('Big Sister', 'Grande Sœur'),
                ].map((role, i) => (
                  <span key={i} style={{
                    fontFamily: 'var(--font-primary)',
                    fontSize: '10px', fontWeight: 600, letterSpacing: '0.04em',
                    padding: '3px 10px', borderRadius: '99px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.5)',
                    opacity: 0,
                    animation: `fade-in 0.4s ${0.1 + i * 0.08}s forwards`,
                  }}>
                    {role}
                  </span>
                ))}
              </div>

              {/* Activity ticker */}
              <ActivityTicker mode={mode} lang={lang} />

              {/* Quick action row */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <QuickAction
                  id="qa-talk"
                  label={t('Talk to Oracle', 'Parler à Oracle')}
                  icon={<MessageSquare size={12} />}
                  onClick={toggleChat}
                  accentColor={accentColor}
                  primary
                />
                <QuickAction
                  id="qa-projects"
                  label={t('Projects', 'Projets')}
                  icon={<FolderOpen size={12} />}
                  onClick={() => {}}
                  accentColor={accentColor}
                />
                <QuickAction
                  id="qa-settings"
                  label={t('Settings', 'Paramètres')}
                  icon={<Settings size={12} />}
                  onClick={toggleSettings}
                  accentColor={accentColor}
                />
              </div>

              {/* LLM status hint */}
              {!settings.hasLLM() && (
                <div
                  onClick={toggleSettings}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '10px 14px', borderRadius: '10px',
                    background: `${accentColor}08`,
                    border: `1px solid ${accentColor}20`,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = `${accentColor}14`}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = `${accentColor}08`}
                >
                  <Zap size={13} color={accentColor} />
                  <span style={{ fontFamily: 'var(--font-primary)', fontSize: '12px', color: accentColor, fontWeight: 600 }}>
                    {t('Connect Oracle → Add API key in Settings', 'Connecter Oracle → Ajouter une clé API dans les Paramètres')}
                  </span>
                  <ChevronRight size={12} color={accentColor} style={{ marginLeft: 'auto' }} />
                </div>
              )}
            </div>
          </div>

          {/* ── Devices row ── */}
          <div style={{
            display: 'flex',
            gap: '12px',
            animation: 'slide-up 0.6s 0.2s cubic-bezier(0.4,0,0.2,1) both',
          }}>
            <DeviceLaptop mode={mode} accentColor={accentColor} lang={lang} />
            <DevicePhone accentColor={accentColor} lang={lang} />
          </div>

          {/* ── Whisprr support panel ── */}
          <div 
            onClick={toggleSupport}
            style={{
              borderRadius: '14px',
              background: 'rgba(255,255,255,0.02)',
              border: `1px solid rgba(255,255,255,0.06)`,
              padding: '16px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              animation: 'slide-up 0.6s 0.35s cubic-bezier(0.4,0,0.2,1) both',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.05)';
              (e.currentTarget as HTMLDivElement).style.borderColor = accentColor;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.02)';
              (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.06)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px' }}>🔒</span>
                <span style={{ fontFamily: 'var(--font-primary)', fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>
                  WHISPRR Support
                </span>
              </div>
              <span style={{
                fontFamily: 'var(--font-primary)', fontSize: '10px', fontWeight: 600, letterSpacing: '0.04em',
                padding: '3px 9px', borderRadius: '99px',
                background: supportStore.getOpenCount() > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)', 
                color: supportStore.getOpenCount() > 0 ? '#ef4444' : '#22c55e',
                border: supportStore.getOpenCount() > 0 ? '1px solid rgba(239,68,68,0.25)' : '1px solid rgba(34,197,94,0.25)',
              }}>
                {supportStore.getOpenCount() > 0 ? `${supportStore.getOpenCount()} Open` : t('Online', 'En ligne')}
              </span>
            </div>
            <p style={{ fontFamily: 'var(--font-primary)', fontSize: '12px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, marginBottom: '10px' }}>
              {t(
                'Oracle Verity is the support presence for WHISPRR. Users speak with Oracle, not a generic support system.',
                'Oracle Verity est la présence support de WHISPRR. Les utilisateurs parlent avec Oracle, pas un système générique.'
              )}
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span onClick={toggleTelegram} style={{
                fontFamily: 'var(--font-primary)', fontSize: '11px', fontWeight: 600,
                padding: '4px 10px', borderRadius: '99px',
                background: 'rgba(99,102,241,0.1)', color: '#818cf8',
                border: '1px solid rgba(99,102,241,0.2)',
                cursor: 'pointer'
              }}>
                Telegram
              </span>
              <span style={{
                fontFamily: 'var(--font-primary)', fontSize: '11px', fontWeight: 600,
                padding: '4px 10px', borderRadius: '99px',
                background: 'rgba(99,102,241,0.1)', color: '#818cf8',
                border: '1px solid rgba(99,102,241,0.2)',
              }}>
                help@whisprr.xyz
              </span>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Project ecosystem ── */}
        <div style={{
          borderLeft: '1px solid rgba(255,255,255,0.05)',
          background: 'rgba(0,0,0,0.15)',
          backdropFilter: 'blur(12px)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <ProjectPanel lang={lang} accentColor={accentColor} />
        </div>
      </div>

      {/* ── OVERLAYS ── */}
      {showChat && (
        <OracleChatPane mode={mode} lang={lang} onClose={toggleChat} />
      )}

      {showNotifications && (
        <NotificationFeed
          notifications={notifications}
          lang={lang}
          onClose={toggleNotifications}
          onMarkAllRead={markAllRead}
          accentColor={accentColor}
        />
      )}

      {showSettings && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 99, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
            onClick={toggleSettings}
          />
          <SettingsPanel lang={lang} accentColor={accentColor} onClose={toggleSettings} />
        </>
      )}

      {showSupport && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 99, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
            onClick={toggleSupport}
          />
          <SupportDashboard lang={lang} accentColor={accentColor} onClose={toggleSupport} />
        </>
      )}

      {showTelegram && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 99, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
            onClick={toggleTelegram}
          />
          <TelegramPane lang={lang} accentColor={accentColor} onClose={toggleTelegram} />
        </>
      )}
    </div>
  );
}

// ── Shared sub-components ────────────────────────────────

function TopBarButton({
  children, onClick, active, accentColor, id,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active: boolean;
  accentColor: string;
  id?: string;
}) {
  return (
    <button
      id={id}
      onClick={onClick}
      style={{
        position: 'relative',
        width: '34px', height: '34px', borderRadius: '10px',
        border: active ? `1px solid ${accentColor}50` : '1px solid transparent',
        background: active ? `${accentColor}18` : 'transparent',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: active ? accentColor : 'rgba(255,255,255,0.5)',
        transition: 'all 0.2s',
      }}
      onMouseEnter={e => {
        if (!active) {
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)';
          (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.85)';
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.5)';
        }
      }}
    >
      {children}
    </button>
  );
}

function QuickAction({
  label, icon, onClick, accentColor, primary, id,
}: {
  label: string; icon: React.ReactNode; onClick: () => void;
  accentColor: string; primary?: boolean; id?: string;
}) {
  return (
    <button
      id={id}
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '7px 14px', borderRadius: '99px',
        border: primary ? 'none' : `1px solid rgba(255,255,255,0.1)`,
        background: primary ? accentColor : 'rgba(255,255,255,0.04)',
        cursor: 'pointer',
        color: primary ? '#000' : 'rgba(255,255,255,0.65)',
        fontFamily: 'var(--font-primary)', fontSize: '12px', fontWeight: 600,
        transition: 'all 0.2s',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLButtonElement;
        if (primary) { el.style.filter = 'brightness(1.12)'; el.style.transform = 'translateY(-1px)'; }
        else { el.style.background = 'rgba(255,255,255,0.08)'; el.style.color = 'rgba(255,255,255,0.9)'; }
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLButtonElement;
        if (primary) { el.style.filter = ''; el.style.transform = ''; }
        else { el.style.background = 'rgba(255,255,255,0.04)'; el.style.color = 'rgba(255,255,255,0.65)'; }
      }}
    >
      {icon}
      {label}
    </button>
  );
}
