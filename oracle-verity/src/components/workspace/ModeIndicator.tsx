// ============================================================
// ORACLE VERITY — MODE INDICATOR & SWITCHER
// ============================================================

import React, { useState } from 'react';
import { OracleMode, ORACLE_MODES, ModeConfig } from '../../core/persona';

interface Props {
  currentMode: OracleMode;
  lang: 'en' | 'fr';
  onModeChange: (mode: OracleMode) => void;
}

const MODE_ORDER: OracleMode[] = ['cofounder', 'executive', 'developer', 'sister', 'night', 'casual'];

export function ModeIndicator({ currentMode, lang, onModeChange }: Props) {
  const [open, setOpen] = useState(false);
  const config = ORACLE_MODES[currentMode];

  return (
    <div style={{ position: 'relative' }}>
      {/* Current mode badge */}
      <button
        id="oracle-mode-btn"
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 14px',
          background: `${config.accentColor}15`,
          border: `1px solid ${config.accentColor}40`,
          borderRadius: '9999px',
          cursor: 'pointer',
          transition: 'all 0.25s',
          color: config.accentColor,
          fontFamily: 'var(--font-primary)',
          fontSize: '12px',
          fontWeight: 700,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = `${config.accentColor}25`;
          (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 16px ${config.accentColor}30`;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = `${config.accentColor}15`;
          (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
        }}
      >
        <span style={{ fontSize: '14px' }}>{config.icon}</span>
        <span>{lang === 'fr' ? config.labelFr : config.label}</span>
        <span style={{ opacity: 0.5, fontSize: '10px', marginLeft: '2px' }}>▾</span>
      </button>

      {/* Dropdown */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 49 }}
            onClick={() => setOpen(false)}
          />
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 50,
              background: 'rgba(10,10,18,0.95)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '16px',
              padding: '8px',
              minWidth: '220px',
              boxShadow: '0 16px 64px rgba(0,0,0,0.8)',
              animation: 'slide-up 0.2s cubic-bezier(0.4,0,0.2,1) forwards',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.35)',
                padding: '6px 10px 8px',
              }}
            >
              {lang === 'fr' ? 'Changer de mode' : 'Switch Mode'}
            </div>
            {MODE_ORDER.map((modeId) => {
              const m = ORACLE_MODES[modeId];
              const isActive = modeId === currentMode;
              return (
                <button
                  key={modeId}
                  id={`oracle-mode-${modeId}`}
                  onClick={() => { onModeChange(modeId); setOpen(false); }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: isActive ? `${m.accentColor}20` : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    textAlign: 'left',
                    color: isActive ? m.accentColor : 'rgba(255,255,255,0.7)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  }}
                >
                  <span style={{ fontSize: '16px', flexShrink: 0 }}>{m.icon}</span>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-primary)' }}>
                      {lang === 'fr' ? m.labelFr : m.label}
                    </div>
                    <div style={{ fontSize: '11px', opacity: 0.5, marginTop: '1px', fontFamily: 'var(--font-primary)' }}>
                      {lang === 'fr' ? m.descriptionFr : m.description}
                    </div>
                  </div>
                  {isActive && (
                    <div style={{ marginLeft: 'auto', width: '6px', height: '6px', borderRadius: '50%', background: m.accentColor, flexShrink: 0 }} />
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
