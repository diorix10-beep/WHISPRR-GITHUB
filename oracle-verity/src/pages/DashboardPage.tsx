import React, { useEffect } from 'react';
import { useOracleStore } from '../store/oracle.store';
import { useSettingsStore } from '../store/settings.store';
import { useEcosystemStore } from '../store/ecosystem.store';
import { ORACLE_MODES } from '../core/persona';
import { OracleAvatar } from '../components/workspace/OracleAvatar';
import { ActivityTicker } from '../components/workspace/ActivityTicker';
import { Terminal, Github, LifeBuoy, Zap, ChevronRight, BrainCircuit } from 'lucide-react';
import { ProjectPanel } from '../components/projects/ProjectPanel';
import { useNavigate } from 'react-router-dom';

import { OracleStatusCenter } from '../components/workspace/OracleStatusCenter';
import { OracleMemoryPanel } from '../components/workspace/OracleMemoryPanel';
import { ProjectAnalytics } from '../components/workspace/ProjectAnalytics';
import { TelegramMonitor } from '../components/workspace/TelegramMonitor';
import { OracleFamilyTree } from '../components/workspace/OracleFamilyTree';

export function DashboardPage() {
  const store = useOracleStore();
  const settings = useSettingsStore();
  const ecosystem = useEcosystemStore();
  const navigate = useNavigate();
  const { mode, lang, isTransitioning, isThinking, isSpeaking, toggleChat, toggleSettings } = store;

  const config = ORACLE_MODES[mode];
  const accentColor = config.accentColor;

  useEffect(() => {
    // Initial fetch
    ecosystem.fetchEcosystemData();

    // Poll every 15 seconds for real-time updates
    const interval = setInterval(() => {
      ecosystem.fetchEcosystemData();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', height: '100%', overflowY: 'auto', paddingRight: '12px', paddingBottom: '40px' }}>
      
      {/* MASSIVE CENTERED HERO */}
      <div style={{ 
        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', 
        padding: '60px 20px', background: `radial-gradient(circle at top, ${accentColor}15 0%, transparent 60%)`,
        borderRadius: '24px', border: `1px solid ${accentColor}20`, position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.05, backgroundImage: `linear-gradient(${accentColor} 1px, transparent 1px), linear-gradient(90deg, ${accentColor} 1px, transparent 1px)`, backgroundSize: '40px 40px', pointerEvents: 'none' }} />

        <div style={{ 
          transform: 'scale(1.4)', transformOrigin: 'center', marginBottom: '40px', 
          position: 'relative', zIndex: 10 
        }}>
          <div style={{ position: 'absolute', inset: -15, borderRadius: '50%', border: `1px dashed ${accentColor}50`, animation: 'spin 20s linear infinite' }} />
          <OracleAvatar mode={mode} isThinking={isThinking} isSpeaking={isSpeaking} isTransitioning={isTransitioning} onClick={toggleChat} />
        </div>
        
        <div style={{ zIndex: 10, maxWidth: '600px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ 
            fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.2em', 
            color: accentColor, marginBottom: '12px', padding: '4px 12px', background: 'rgba(0,0,0,0.4)',
            border: `1px solid ${accentColor}40`, borderRadius: '99px',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <BrainCircuit size={14} /> [ PERSISTENT AI OS | STATUS: ONLINE ]
          </div>
          
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '48px', fontWeight: 700, color: 'white', lineHeight: 1.1, textShadow: `0 0 20px ${accentColor}40` }}>
            CENTRAL INTELLIGENCE
          </div>
          
          <div style={{ fontFamily: 'var(--font-primary)', fontSize: '16px', color: 'rgba(255,255,255,0.6)', marginTop: '16px' }}>
            {lang === 'fr' ? config.descriptionFr : config.description}
          </div>

          <div style={{ marginTop: '24px', width: '100%', maxWidth: '400px' }}>
             <ActivityTicker mode={mode} lang={lang} />
          </div>

          {!settings.hasLLM() && (
            <div onClick={toggleSettings} style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '10px', background: `${accentColor}10`, border: `1px solid ${accentColor}30`, cursor: 'pointer' }}>
              <Zap size={13} color={accentColor} />
              <span style={{ fontFamily: 'var(--font-primary)', fontSize: '12px', color: accentColor, fontWeight: 600 }}>Connect Oracle → Add API key in Settings</span>
              <ChevronRight size={12} color={accentColor} style={{ marginLeft: 'auto' }} />
            </div>
          )}
        </div>

        {/* Quick Action Bar */}
        <div style={{ display: 'flex', gap: '16px', marginTop: '40px', zIndex: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button onClick={() => navigate('/terminal')} style={{ 
            display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 24px', 
            background: 'rgba(0,0,0,0.6)', border: `1px solid ${accentColor}40`, borderRadius: '12px',
            color: 'white', fontFamily: 'var(--font-mono)', fontSize: '13px', cursor: 'pointer',
            transition: 'all 0.2s', boxShadow: `0 4px 15px rgba(0,0,0,0.3)`
          }}>
            <Terminal size={16} color={accentColor} /> [ Launch Terminal OS ]
          </button>
          <button onClick={() => navigate('/github')} style={{ 
            display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 24px', 
            background: 'rgba(0,0,0,0.6)', border: `1px solid rgba(255,255,255,0.1)`, borderRadius: '12px',
            color: 'white', fontFamily: 'var(--font-mono)', fontSize: '13px', cursor: 'pointer',
            transition: 'all 0.2s'
          }}>
            <Github size={16} /> [ GitHub Intel ]
          </button>
          <button onClick={() => navigate('/support')} style={{ 
            display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 24px', 
            background: 'rgba(0,0,0,0.6)', border: `1px solid rgba(255,255,255,0.1)`, borderRadius: '12px',
            color: 'white', fontFamily: 'var(--font-mono)', fontSize: '13px', cursor: 'pointer',
            transition: 'all 0.2s'
          }}>
            <LifeBuoy size={16} /> [ Support Tickets ]
          </button>
        </div>
      </div>

      {/* MIDDLE SECTION: Ecosystem & Intelligence */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <OracleStatusCenter accentColor={accentColor} lang={lang} />
        <ProjectAnalytics accentColor={accentColor} />
      </div>

      {/* LOWER SECTION: Memory & Projects */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 400px) 1fr', gap: '24px' }}>
        
        {/* Left Side: Memory & Monitors */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <OracleMemoryPanel accentColor={accentColor} />
          <TelegramMonitor accentColor={accentColor} />
        </div>

        {/* Right Side: Active Projects */}
        <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
          <ProjectPanel lang={lang} accentColor={accentColor} />
        </div>
        
      </div>

      {/* FAMILY LORE SECTION */}
      <div>
        <OracleFamilyTree accentColor={accentColor} />
      </div>
    </div>
  );
}
