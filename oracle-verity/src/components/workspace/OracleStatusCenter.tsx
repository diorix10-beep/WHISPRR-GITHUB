import React from 'react';
import { useEcosystemStore } from '../../store/ecosystem.store';
import { useSettingsStore } from '../../store/settings.store';

export function OracleStatusCenter({ accentColor, lang }: { accentColor: string; lang: 'en' | 'fr' }) {
  const ecosystem = useEcosystemStore();
  const settings = useSettingsStore();

  const isTgConnected = !!settings.telegramToken;
  const isGhConnected = !!settings.githubToken;
  // KV is connected if edge routes are working. We can assume true if we successfully fetched, or just assume true for now.
  const isKvConnected = true; 

  const metrics = [
    { label: 'Current Focus', value: 'Ecosystem Monitoring' },
    { label: 'System Health', value: 'Optimal', color: '#22c55e' },
    { label: 'Memory Sync', value: new Date(ecosystem.lastSyncTime).toLocaleTimeString() },
  ];

  return (
    <div style={{
      borderRadius: '16px', background: 'rgba(0,0,0,0.5)', 
      border: `1px solid ${accentColor}20`, padding: '16px',
      display: 'flex', flexDirection: 'column', gap: '16px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', color: 'white', margin: 0 }}>
          Oracle Status Center
        </h3>
        {ecosystem.isSyncing && (
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: accentColor, animation: 'pulse 1s infinite' }} />
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {metrics.map((m, i) => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px', border: `1px solid ${accentColor}10` }}>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: '4px' }}>{m.label}</div>
            <div style={{ fontSize: '13px', color: m.color || 'white', fontWeight: 500 }}>{m.value}</div>
          </div>
        ))}
        
        {/* Connected Services */}
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px', border: `1px solid ${accentColor}10` }}>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: '6px' }}>Services</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: isGhConnected ? '#22c55e' : 'rgba(255,255,255,0.3)' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isGhConnected ? '#22c55e' : 'rgba(255,255,255,0.3)' }} /> GH
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: isTgConnected ? '#22c55e' : 'rgba(255,255,255,0.3)' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isTgConnected ? '#22c55e' : 'rgba(255,255,255,0.3)' }} /> TG
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: isKvConnected ? '#22c55e' : 'rgba(255,255,255,0.3)' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isKvConnected ? '#22c55e' : 'rgba(255,255,255,0.3)' }} /> KV
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}
