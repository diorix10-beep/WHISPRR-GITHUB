export type LogoVariant = 'primary' | 'light' | 'dark' | 'icon-only';

/**
 * ChimeraLogo — Official CHIMERA Brand Emblem for ecosystem cards & switchers.
 * Renders the original purple mythical emblem brand asset image.
 */
export function ChimeraLogo({ 
  size = 32, 
  variant = 'primary', 
  className = '' 
}: { 
  size?: number; 
  variant?: LogoVariant; 
  className?: string;
}) {
  return (
    <img
      src="/chimera_logo.png"
      alt="CHIMERA Logo"
      width={size}
      height={size}
      className={`object-contain inline-block select-none rounded-xl transition-all duration-200 ${className}`}
      style={{ height: `${size}px`, width: `${size}px` }}
    />
  );
}

export function ChimeraLogoText({ className = '' }: { className?: string }) {
  return (
    <span className={`font-serif font-extrabold tracking-wide text-warm-900 dark:text-warm-50 ${className}`}>
      CHIMERA
    </span>
  );
}
