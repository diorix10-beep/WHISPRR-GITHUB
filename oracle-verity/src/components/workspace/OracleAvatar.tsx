// ============================================================
// ORACLE VERITY — ORACLE AVATAR
// Mode-aware avatar with presence animations
// ============================================================

import React, { useState } from 'react';
import { OracleMode, ORACLE_MODES } from '../../core/persona';

interface Props {
  mode: OracleMode;
  isThinking: boolean;
  isSpeaking: boolean;
  isTransitioning: boolean;
  onClick?: () => void;
}

export function OracleAvatar({ mode, isThinking, isSpeaking, isTransitioning, onClick }: Props) {
  const config = ORACLE_MODES[mode];
  const [imgError, setImgError] = useState(false);

  const accentColor = config.accentColor;
  const isActive = isThinking || isSpeaking;

  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
      }}
    >
      {/* Outer glow ring */}
      <div
        style={{
          position: 'absolute',
          inset: '-16px',
          borderRadius: '50%',
          background: `radial-gradient(ellipse at center, ${accentColor}20 0%, transparent 70%)`,
          animation: isActive ? 'glow-pulse 1.5s ease-in-out infinite' : 'glow-pulse 3s ease-in-out infinite',
          transition: 'all 0.8s',
        }}
      />

      {/* Avatar container */}
      <div
        style={{
          position: 'relative',
          width: 'clamp(200px, 22vw, 320px)',
          height: 'clamp(200px, 22vw, 320px)',
          borderRadius: '50%',
          overflow: 'hidden',
          border: `2px solid ${accentColor}40`,
          boxShadow: `0 0 0 1px ${accentColor}20, 0 8px 40px rgba(0,0,0,0.6), 0 0 60px ${accentColor}15`,
          animation: isTransitioning ? 'none' : 'breathe 4s ease-in-out infinite',
          opacity: isTransitioning ? 0 : 1,
          transform: isTransitioning ? 'scale(0.96)' : 'scale(1)',
          transition: 'opacity 0.4s, transform 0.4s, border-color 0.8s, box-shadow 0.8s',
          flexShrink: 0,
        }}
      >
        {!imgError ? (
          <img
            src={config.avatar}
            alt={`Oracle Verity — ${config.label}`}
            onError={() => setImgError(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center top',
              display: 'block',
            }}
          />
        ) : (
          // Fallback: initials
          <div
            style={{
              width: '100%',
              height: '100%',
              background: `linear-gradient(135deg, ${accentColor}30, ${accentColor}10)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '80px',
            }}
          >
            🔮
          </div>
        )}

        {/* Thinking overlay */}
        {isThinking && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              paddingBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', gap: '6px' }}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="typing-dot"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Status row */}
      <div
        style={{
          marginTop: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <div
          className={isActive ? 'status-dot busy' : 'status-dot'}
          style={{ background: isActive ? accentColor : undefined }}
        />
        <span
          style={{
            fontFamily: 'var(--font-primary)',
            fontSize: '12px',
            fontWeight: 600,
            color: accentColor,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          {isThinking ? 'Thinking...' : isSpeaking ? 'Speaking...' : 'Present'}
        </span>
      </div>

      {/* Speaking wave */}
      {isSpeaking && (
        <div style={{ display: 'flex', gap: '3px', marginTop: '6px', alignItems: 'center', height: '16px' }}>
          {[1, 2, 3, 4, 3, 2, 1].map((h, i) => (
            <div
              key={i}
              style={{
                width: '3px',
                background: accentColor,
                borderRadius: '2px',
                animation: `activity-dot ${0.5 + i * 0.1}s ease-in-out infinite alternate`,
                height: `${h * 4}px`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
