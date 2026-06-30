import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, FolderOpen, Github, Send, 
  LifeBuoy, User, Settings, Bell, MessageSquare, Terminal, Users
} from 'lucide-react';
import { useOracleStore } from '../../store/oracle.store';
import { useSettingsStore } from '../../store/settings.store';
import { useSupportStore } from '../../store/support.store';
import { ORACLE_MODES } from '../../core/persona';
import { startTelegramPolling, stopTelegramPolling } from '../../core/telegram-engine';
import { BackgroundScene } from '../workspace/BackgroundScene';
import { OracleChatPane } from '../communication/OracleChatPane';
import { NotificationFeed } from '../communication/NotificationFeed';
import { SettingsPanel } from '../settings/SettingsPanel';
import { ModeIndicator } from '../workspace/ModeIndicator';

export function WebLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const store = useOracleStore();
  const settings = useSettingsStore();
  const supportStore = useSupportStore();

  const { mode, lang, isTransitioning,
          showChat, showSettings, showNotifications,
          notifications, unreadCount,
          setMode, toggleChat, toggleSettings, toggleNotifications, markAllRead } = store;

  const config = ORACLE_MODES[mode];
  const accentColor = config.accentColor;

  useEffect(() => {
    if (settings.hasAnyTelegramToken()) {
      stopTelegramPolling();
      startTelegramPolling();
    } else {
      stopTelegramPolling();
    }
    return () => stopTelegramPolling();
  }, [settings.memberTelegramTokens]);

  // Synchronise with Supabase Database if configured
  useEffect(() => {
    if (settings.hasSupabase()) {
      import('../../store/family.store').then(m => m.useFamilyStore.getState().syncWithSupabase());
      import('../../store/memory.store').then(m => m.useMemoryStore.getState().syncWithSupabase());
    }
  }, [settings.supabaseUrl, settings.supabaseAnonKey]);

  const projectsUnread = notifications.filter(n => !n.read && ['WHISPRR', 'Maison FX', 'Oracle Systems'].includes(n.project || '')).length;
  const githubUnread = notifications.filter(n => !n.read && n.project === 'GitHub').length;
  const terminalUnread = notifications.filter(n => !n.read && n.project === 'Terminal OS').length;
  const familyUnread = notifications.filter(n => !n.read && ['Aegis', 'Atlas', 'Athena', 'Iris', 'Oracle'].includes(n.project || '')).length;
  const supportOpen = supportStore.getOpenCount();

  const navItems = [
    { path: '/', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { path: '/projects', icon: <FolderOpen size={18} />, label: 'Projects', badge: projectsUnread > 0 ? projectsUnread : undefined },
    { path: '/github', icon: <Github size={18} />, label: 'GitHub Intel', badge: githubUnread > 0 ? githubUnread : undefined },
    { path: '/terminal', icon: <Terminal size={18} />, label: 'Terminal OS', badge: terminalUnread > 0 ? terminalUnread : undefined },
    { path: '/family/oracle', icon: <Users size={18} />, label: 'The Family', badge: familyUnread > 0 ? familyUnread : undefined },
    { path: '/telegram', icon: <Send size={18} />, label: 'Telegram' },
    { path: '/support', icon: <LifeBuoy size={18} />, label: 'Support', badge: supportOpen > 0 ? supportOpen : undefined },
    { path: '/profile', icon: <User size={18} />, label: 'Profile' },
  ];

  return (
    <div className={config.cssClass} style={{
      position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden',
      display: 'flex', flexDirection: 'column', transition: 'all 0.8s cubic-bezier(0.4,0,0.2,1)',
    }}>
      <BackgroundScene mode={mode} isTransitioning={isTransitioning} />

      {/* TOP BAR */}
      <div style={{
        position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', height: '56px', borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(20px)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img 
            src="/oracle-logo.png" 
            alt="Oracle Logo" 
            style={{
              width: '32px', height: '32px', borderRadius: '8px',
              border: `1px solid ${accentColor}40`,
              objectFit: 'cover'
            }} 
          />
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 700, color: 'white', lineHeight: 1 }}>Oracle Verity</div>
            <div style={{ fontFamily: 'var(--font-primary)', fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>Central Intelligence</div>
          </div>
        </div>

        <ModeIndicator currentMode={mode} lang={lang} onModeChange={setMode} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={toggleNotifications} style={iconBtnStyle(showNotifications, accentColor)}>
            <Bell size={18} />
            {unreadCount > 0 && <span style={badgeStyle(accentColor)}>{unreadCount}</span>}
          </button>
          <button onClick={toggleChat} style={iconBtnStyle(showChat, accentColor)}>
            <MessageSquare size={18} />
          </button>
          <button onClick={toggleSettings} style={iconBtnStyle(showSettings, accentColor)}>
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div style={{ position: 'relative', zIndex: 5, flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* SIDEBAR */}
        <div style={{
          width: '240px', background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(10px)',
          borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column',
          padding: '20px 12px'
        }}>
          {navItems.map(item => {
          const isActive = item.path === '/'
            ? location.pathname === '/'
            : item.path === '/family/oracle'
            ? location.pathname.startsWith('/family')
            : location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                  borderRadius: '12px', background: isActive ? `${accentColor}15` : 'transparent',
                  border: isActive ? `1px solid ${accentColor}30` : '1px solid transparent',
                  color: isActive ? 'white' : 'rgba(255,255,255,0.5)', cursor: 'pointer',
                  fontFamily: 'var(--font-primary)', fontSize: '13px', fontWeight: 600,
                  transition: 'all 0.2s', marginBottom: '4px'
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'white'; } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; } }}
              >
                <div style={{ color: isActive ? accentColor : 'inherit' }}>{item.icon}</div>
                <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
                {item.badge ? (
                  <span style={{ background: '#ef4444', color: '#000', fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '99px' }}>
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* OUTLET (Page Content) */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
          <Outlet />
        </div>
      </div>

      {/* OVERLAYS */}
      {showChat && <OracleChatPane mode={mode} lang={lang} onClose={toggleChat} />}
      {showNotifications && <NotificationFeed notifications={notifications} lang={lang} onClose={toggleNotifications} onMarkAllRead={markAllRead} accentColor={accentColor} />}
      {showSettings && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 99, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }} onClick={toggleSettings} />
          <SettingsPanel lang={lang} accentColor={accentColor} onClose={toggleSettings} />
        </>
      )}
    </div>
  );
}

function iconBtnStyle(active: boolean, accent: string) {
  return {
    position: 'relative' as const, width: '38px', height: '38px', borderRadius: '10px',
    border: active ? `1px solid ${accent}50` : '1px solid transparent',
    background: active ? `${accent}18` : 'rgba(255,255,255,0.05)',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: active ? accent : 'rgba(255,255,255,0.7)', transition: 'all 0.2s',
  };
}

function badgeStyle(accent: string) {
  return {
    position: 'absolute' as const, top: '-4px', right: '-4px', width: '16px', height: '16px',
    borderRadius: '50%', background: accent, border: '2px solid #050508',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '9px', fontWeight: 800, color: '#000', fontFamily: 'var(--font-primary)'
  };
}
