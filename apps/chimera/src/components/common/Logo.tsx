export type LogoVariant = 'primary' | 'light' | 'dark' | 'icon-only';

/**
 * ChimeraLogo — Official CHIMERA Single Source of Truth Brand Logo.
 * Renders the original purple mythical emblem brand asset image.
 */
export function Logo({ 
  size = 40, 
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
      className={`object-contain inline-block select-none rounded-xl transition-all duration-200 hover:opacity-95 ${className}`}
      style={{ height: `${size}px`, width: `${size}px` }}
    />
  );
}

export function LogoText({ className = '' }: { className?: string }) {
  return (
    <span className={`font-serif font-extrabold tracking-wide text-warm-900 dark:text-white ${className}`}>
      CHIMERA
    </span>
  );
}
