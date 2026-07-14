export type LogoVariant = 'primary' | 'light' | 'dark' | 'icon-only';

/**
 * WhisprLogo — Official WHISPRR brand mark v2.
 * Gradient purple W lettermark with sparkles + optional wordmark.
 * Production-ready SVG, faithfully recreating the provided brand mockup.
 */
export function WhisprLogo({
  size = 40,
  wordmark = true,
  className = '',
}: {
  size?: number;
  wordmark?: boolean;
  className?: string;
}) {
  const width = wordmark ? size * 2.5 : size * 0.75;
  const viewBox = wordmark ? '0 0 180 72' : '0 0 60 72';
  const gradId = `wg-${size}-${wordmark ? 'lk' : 'ic'}`;

  return (
    <svg
      width={width}
      height={size}
      viewBox={viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="WHISPRR"
      role="img"
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>

      {/* W lettermark — bold rounded strokes */}
      <path
        d="M4 10 L16 52 L28 24 L40 52 L52 10"
        stroke={`url(#${gradId})`}
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Sparkle — large (4-pointed star) */}
      <path
        d="M62 8 L63.8 13.5 L69.5 15.3 L63.8 17.1 L62 22.5 L60.2 17.1 L54.5 15.3 L60.2 13.5 Z"
        fill="#a855f7"
        fillOpacity="0.95"
      />
      {/* Sparkle — small */}
      <path
        d="M74 16 L74.9 18.6 L77.5 19.5 L74.9 20.4 L74 23 L73.1 20.4 L70.5 19.5 L73.1 18.6 Z"
        fill="#c084fc"
        fillOpacity="0.75"
      />

      {/* Wordmark */}
      {wordmark && (
        <text
          x="88"
          y="48"
          fontFamily="'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif"
          fontWeight="800"
          fontSize="28"
          letterSpacing="1.5"
          fill="white"
        >
          WHISPRR
        </text>
      )}
    </svg>
  );
}

/** Logo — backward-compatible alias pointing to the new brand mark. */
export function Logo({
  size = 32,
  variant = 'primary',
  className = '',
}: {
  size?: number;
  variant?: LogoVariant;
  className?: string;
}) {
  const wordmark = variant !== 'icon-only';
  return <WhisprLogo size={size} wordmark={wordmark} className={className} />;
}

export function LogoText({ className = '' }: { className?: string }) {
  return (
    <span className={`font-sans font-extrabold text-white tracking-widest ${className}`}>
      WHISPRR
    </span>
  );
}
