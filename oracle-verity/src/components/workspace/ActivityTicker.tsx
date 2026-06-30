// ============================================================
// ORACLE VERITY — ACTIVITY TICKER
// Live "what Oracle is doing right now"
// ============================================================

import React, { useEffect, useState, useRef } from 'react';
import { subscribeToActivity, startActivityEngine, setActivityMode } from '../../core/activity-engine';
import { OracleMode, ORACLE_MODES } from '../../core/persona';

interface Props {
  mode: OracleMode;
  lang: 'en' | 'fr';
}

export function ActivityTicker({ mode, lang }: Props) {
  const [current, setCurrent] = useState('');
  const [prev, setPrev] = useState('');
  const [key, setKey] = useState(0);

  useEffect(() => {
    startActivityEngine();
    const unsub = subscribeToActivity((activity) => {
      setPrev(current);
      setCurrent(activity);
      setKey((k) => k + 1);
    });
    return unsub;
  }, []);

  useEffect(() => {
    setActivityMode(mode, lang);
  }, [mode, lang]);

  const config = ORACLE_MODES[mode];
  const accentColor = config.accentColor;

  return (
    <div
      style={{
        background: 'rgba(0,0,0,0.3)',
        border: `1px solid ${accentColor}25`,
        borderRadius: '12px',
        padding: '12px 16px',
        backdropFilter: 'blur(12px)',
        width: '100%',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '8px',
        }}
      >
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                background: accentColor,
                opacity: 0.7,
                animation: `activity-dot 1.4s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
        <span
          style={{
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: accentColor,
            opacity: 0.8,
          }}
        >
          {lang === 'fr' ? 'Activité en cours' : 'Currently'}
        </span>
      </div>

      {/* Activity text */}
      <div style={{ height: '20px', overflow: 'hidden', position: 'relative' }}>
        <div
          key={key}
          style={{
            fontSize: '13px',
            fontWeight: 500,
            color: 'rgba(255,255,255,0.85)',
            lineHeight: '20px',
            animation: 'slide-up 0.4s cubic-bezier(0.4,0,0.2,1) forwards',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {current}
        </div>
      </div>
    </div>
  );
}
