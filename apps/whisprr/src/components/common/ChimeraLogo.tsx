export type LogoVariant = 'primary' | 'light' | 'dark' | 'icon-only';

export function ChimeraLogo({ 
  size = 32, 
  variant = 'primary', 
  className = '' 
}: { 
  size?: number; 
  variant?: LogoVariant; 
  className?: string;
}) {
  const isIconOnly = variant === 'icon-only';

  // Determine colors based on variant
  let bgFill = 'url(#logo-bg)';
  let bubbleFill = 'white';
  let bubbleOpacity = 0.2;
  let waveStroke = 'white';
  let waveOpacityBase = 0.9;
  let rx = '22';

  if (variant === 'light') {
    bgFill = 'transparent';
    bubbleFill = '#C96059';
    bubbleOpacity = 0.12;
    waveStroke = '#C96059';
    waveOpacityBase = 1.0;
  } else if (variant === 'dark') {
    bgFill = '#151412';
    bubbleFill = 'white';
    bubbleOpacity = 0.15;
    waveStroke = 'white';
    waveOpacityBase = 0.8;
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="logo-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D4736E" />
          <stop offset="100%" stopColor="#C88B84" />
        </linearGradient>
      </defs>

      {/* Outer Rounded Box Container */}
      {!isIconOnly && (
        <rect width="100" height="100" rx={rx} fill={bgFill} />
      )}

      {/* Speech Bubble Shape */}
      <path
        d="M20 40 C20 28, 30 20, 50 20 C70 20, 80 28, 80 40 C80 52, 70 58, 50 58 C44 58, 38 57.5, 34 57 L24 66 L27 55 C22 52, 20 47, 20 40Z"
        fill={bubbleFill}
        fillOpacity={bubbleOpacity}
      />

      {/* Top Wave */}
      <path
        d="M36 34 C39 30, 44 28, 49 30"
        stroke={waveStroke}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeOpacity={waveOpacityBase}
      />

      {/* Middle Wave */}
      <path
        d="M36 42 C41 37, 48 35, 55 37"
        stroke={waveStroke}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeOpacity={waveOpacityBase * 0.9}
      />

      {/* Bottom Wave */}
      <path
        d="M36 50 C43 45, 52 43, 62 45"
        stroke={waveStroke}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeOpacity={waveOpacityBase * 0.8}
      />

      {/* Dot Accent */}
      <circle 
        cx="32" 
        cy="34" 
        r="3.5" 
        fill={waveStroke} 
        fillOpacity={waveOpacityBase} 
      />
    </svg>
  );
}

export function ChimeraLogoText({ className = '' }: { className?: string }) {
  return (
    <span className={`font-serif font-bold text-warm-900 dark:text-warm-50 tracking-wide ${className}`}>
      CHIMERA
    </span>
  );
}

