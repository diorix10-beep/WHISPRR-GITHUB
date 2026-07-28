export type LogoVariant = 'primary' | 'light' | 'dark' | 'icon-only';

/**
 * WhisprLogo — Official WHISPRR Single Source of Truth Brand Logo.
 * Renders high-DPI crisp brand asset image with strong visual presence.
 */
export function WhisprLogo({
  size = 56,
  wordmark = true,
  className = '',
}: {
  size?: number;
  wordmark?: boolean;
  className?: string;
}) {
  const imgSrc = wordmark ? '/whisprr_logo_full.png' : '/whisprr_icon.png';
  const width = wordmark ? size * 2.8 : size;

  return (
    <img
      src={imgSrc}
      alt="WHISPRR Logo"
      width={width}
      height={size}
      className={`object-contain inline-block select-none transition-all duration-200 hover:opacity-95 ${className}`}
      style={{
        height: `${size}px`,
        width: wordmark ? 'auto' : `${size}px`,
        maxWidth: '100%',
      }}
    />
  );
}

/** Logo — backward-compatible alias pointing to official brand mark asset. */
export function Logo({
  size = 52,
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
    <span className={`font-sans font-extrabold tracking-widest text-warm-900 dark:text-white ${className}`}>
      WHISPRR
    </span>
  );
}
