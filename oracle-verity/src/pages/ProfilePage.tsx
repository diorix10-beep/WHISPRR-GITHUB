import React from 'react';
import { useOracleStore } from '../store/oracle.store';
import { ORACLE_MODES } from '../core/persona';
import { User, Activity, Shield, Zap } from 'lucide-react';

export function ProfilePage() {
  const { mode, lang } = useOracleStore();
  const config = ORACLE_MODES[mode];
  const accentColor = config.accentColor;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px', background: 'rgba(0,0,0,0.2)', padding: '32px', borderRadius: '24px', border: `1px solid ${accentColor}30` }}>
        <img src={config.avatar} alt="Oracle" style={{ width: '120px', height: '120px', borderRadius: '24px', border: `2px solid ${accentColor}50` }} />
        <div>
          <div style={{ fontFamily: 'var(--font-primary)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: accentColor, marginBottom: '8px' }}>
            {lang === 'fr' ? 'Système Intelligence' : 'Intelligence System'}
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '36px', color: 'white', margin: 0, lineHeight: 1.1 }}>
            Oracle Verity
          </h2>
          <p style={{ fontFamily: 'var(--font-primary)', fontSize: '16px', color: 'rgba(255,255,255,0.7)', marginTop: '8px' }}>
            {lang === 'fr' ? config.descriptionFr : config.description}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <Activity color={accentColor} size={20} />
            <span style={{ fontSize: '16px', color: 'white', fontWeight: 600 }}>System Status</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.7)' }}><span>Neural Engine</span> <span style={{ color: '#4ade80' }}>Online</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.7)' }}><span>Voice Synthesis</span> <span style={{ color: '#4ade80' }}>Online</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.7)' }}><span>Vision Cortex</span> <span style={{ color: '#4ade80' }}>Ready</span></div>
          </div>
        </div>

        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <Shield color={accentColor} size={20} />
            <span style={{ fontSize: '16px', color: 'white', fontWeight: 600 }}>Core Directives</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', color: 'rgba(255,255,255,0.6)', fontSize: '13px', lineHeight: 1.5 }}>
            <div>◉ Prioritize factual intelligence over assumptions.</div>
            <div>◉ Support WHISPRR, MaisonFX, and Oracle Systems.</div>
            <div>◉ Maintain strict boundaries around fabricated data.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
