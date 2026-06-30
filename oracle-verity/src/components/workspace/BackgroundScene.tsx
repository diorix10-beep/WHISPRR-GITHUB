// ============================================================
// ORACLE VERITY — BACKGROUND SCENE
// Mode-driven ambient environment
// ============================================================

import React, { useEffect, useRef } from 'react';
import { OracleMode } from '../../core/persona';

interface Props {
  mode: OracleMode;
  isTransitioning: boolean;
}

// Floating particle for night/developer modes
function Particle({ style }: { style: React.CSSProperties }) {
  return (
    <div
      style={{
        position: 'absolute',
        width: '2px',
        height: '2px',
        borderRadius: '50%',
        background: 'currentColor',
        animation: `particle-float ${8 + Math.random() * 8}s linear infinite`,
        ...style,
      }}
    />
  );
}

export function BackgroundScene({ mode, isTransitioning }: Props) {
  const particles = Array.from({ length: 18 }, (_, i) => i);

  const configs: Record<OracleMode, React.CSSProperties> = {
    executive: {
      background: `
        radial-gradient(ellipse 80% 60% at 20% 100%, rgba(201,168,76,0.12) 0%, transparent 60%),
        radial-gradient(ellipse 60% 80% at 80% 0%, rgba(201,168,76,0.06) 0%, transparent 50%),
        linear-gradient(160deg, #0e0c0a 0%, #12100c 50%, #0a0907 100%)
      `,
    },
    cofounder: {
      background: `
        radial-gradient(ellipse 80% 60% at 20% 100%, rgba(201,168,76,0.14) 0%, transparent 60%),
        radial-gradient(ellipse 40% 60% at 90% 10%, rgba(201,168,76,0.07) 0%, transparent 50%),
        linear-gradient(160deg, #0e0c0a 0%, #141109 50%, #0a0907 100%)
      `,
    },
    developer: {
      background: `
        radial-gradient(ellipse 60% 60% at 70% 50%, rgba(34,211,238,0.06) 0%, transparent 60%),
        radial-gradient(ellipse 40% 40% at 10% 80%, rgba(99,102,241,0.08) 0%, transparent 50%),
        linear-gradient(160deg, #060810 0%, #0a0d18 50%, #060810 100%)
      `,
    },
    sister: {
      background: `
        radial-gradient(ellipse 70% 60% at 30% 100%, rgba(244,114,182,0.12) 0%, transparent 60%),
        radial-gradient(ellipse 50% 50% at 80% 20%, rgba(251,146,60,0.08) 0%, transparent 50%),
        linear-gradient(160deg, #180f14 0%, #1f1018 50%, #14080f 100%)
      `,
    },
    night: {
      background: `
        radial-gradient(ellipse 70% 50% at 50% 0%, rgba(99,102,241,0.15) 0%, transparent 60%),
        radial-gradient(ellipse 40% 60% at 10% 80%, rgba(139,92,246,0.08) 0%, transparent 50%),
        linear-gradient(160deg, #060810 0%, #090c18 50%, #060810 100%)
      `,
    },
    casual: {
      background: `
        radial-gradient(ellipse 70% 60% at 30% 100%, rgba(244,114,182,0.1) 0%, transparent 60%),
        radial-gradient(ellipse 50% 50% at 80% 20%, rgba(251,191,36,0.06) 0%, transparent 50%),
        linear-gradient(160deg, #1a0f14 0%, #201219 50%, #150c10 100%)
      `,
    },
  };

  const particleColors: Record<OracleMode, string> = {
    executive: '#c9a84c',
    cofounder: '#c9a84c',
    developer: '#22d3ee',
    sister: '#f472b6',
    night: '#6366f1',
    casual: '#f472b6',
  };

  const showParticles = ['night', 'developer', 'sister', 'casual'].includes(mode);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        transition: 'all 0.8s cubic-bezier(0.4,0,0.2,1)',
        opacity: isTransitioning ? 0 : 1,
        ...configs[mode],
      }}
    >
      {/* Grid overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black, transparent)',
        }}
      />

      {/* Noise texture */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.025,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Floating particles */}
      {showParticles && particles.map((i) => (
        <Particle
          key={i}
          style={{
            left: `${5 + (i * 5.2) % 90}%`,
            bottom: '-10px',
            color: particleColors[mode],
            opacity: 0.4 + Math.random() * 0.4,
            animationDelay: `${i * 0.7}s`,
            animationDuration: `${10 + (i % 5) * 2}s`,
          }}
        />
      ))}

      {/* Corner glow accents */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '40vw',
          height: '40vh',
          background: `radial-gradient(ellipse at bottom left, ${particleColors[mode]}18, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '30vw',
          height: '30vh',
          background: `radial-gradient(ellipse at top right, ${particleColors[mode]}08, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
