import React from 'react';

interface GuardianSigilProps {
  size?: number;
  className?: string;
}

export function GuardianSigil({ size = 80, className = '' }: GuardianSigilProps) {
  return (
    <div 
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Outer Radiant Glow */}
      <div 
        className="absolute inset-0 rounded-full bg-purple-600/30 blur-xl animate-pulse"
        style={{ transform: 'scale(1.3)' }}
      />
      
      {/* SVG Guardian Sigil */}
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 120 120" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 drop-shadow-[0_0_20px_rgba(168,85,247,0.7)]"
      >
        <defs>
          <linearGradient id="sigilBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c084fc" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>

          <linearGradient id="sigilInnerGrad" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#f3e8ff" />
            <stop offset="60%" stopColor="#d8b4fe" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>

          <filter id="sigilGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Circular Sacred Geometry Rings */}
        <circle cx="60" cy="60" r="54" stroke="url(#sigilBorderGrad)" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />
        <circle cx="60" cy="60" r="48" stroke="url(#sigilBorderGrad)" strokeWidth="1.5" opacity="0.8" />
        
        {/* Hexagonal Guardian Crystalline Shield */}
        <polygon 
          points="60,16 98,38 98,82 60,104 22,82 22,38" 
          stroke="url(#sigilBorderGrad)" 
          strokeWidth="2.5" 
          fill="rgba(24, 9, 43, 0.65)"
          filter="url(#sigilGlow)"
        />
        <polygon 
          points="60,22 92,41 92,79 60,98 28,79 28,41" 
          stroke="#c084fc" 
          strokeWidth="1" 
          opacity="0.4"
        />

        {/* Floating Sapphire Facet Accents */}
        <polygon points="60,10 63,16 60,22 57,16" fill="#e9d5ff" />
        <polygon points="60,98 63,104 60,110 57,104" fill="#e9d5ff" />
        <polygon points="16,60 22,57 28,60 22,63" fill="#c084fc" />
        <polygon points="92,60 98,57 104,60 98,63" fill="#c084fc" />

        {/* Central Guardian Phoenix/Lion Wings Sigil Emblem */}
        <path 
          d="M60,34 C64,44 76,46 84,40 C80,54 72,62 60,66 C48,62 40,54 36,40 C44,46 56,44 60,34 Z" 
          fill="url(#sigilInnerGrad)" 
        />
        <path 
          d="M60,42 C67,52 78,56 86,52 C81,66 71,76 60,86 C49,76 39,66 34,52 C42,56 53,52 60,42 Z" 
          fill="url(#sigilInnerGrad)" 
          opacity="0.85"
        />

        {/* Core Radiant Starpoint ✦ */}
        <path 
          d="M60,48 L62,58 L72,60 L62,62 L60,72 L58,62 L48,60 L58,58 Z" 
          fill="#ffffff" 
          filter="url(#sigilGlow)"
        />
      </svg>
    </div>
  );
}
