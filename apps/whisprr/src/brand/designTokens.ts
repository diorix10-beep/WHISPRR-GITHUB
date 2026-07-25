/**
 * WHISPRR × CHIMERA Ecosystem — Design Token System
 * Single Source of Truth for Visual Values, Semantic Colors, Typography, Spacing, and Motion
 */

export const DESIGN_TOKENS = {
  // ── Color Tokens ──────────────────────────────────────────
  color: {
    primary: {
      light: 'hsl(262, 83%, 58%)',
      dark: 'hsl(263, 85%, 66%)',
      foregroundLight: 'hsl(0, 0%, 100%)',
      foregroundDark: 'hsl(260, 25%, 8%)',
    },
    secondary: {
      light: 'hsl(255, 30%, 94%)',
      dark: 'hsl(260, 20%, 18%)',
      foregroundLight: 'hsl(262, 40%, 25%)',
      foregroundDark: 'hsl(255, 35%, 88%)',
    },
    accent: {
      light: 'hsl(342, 89%, 54%)',
      dark: 'hsl(343, 90%, 62%)',
      foregroundLight: 'hsl(0, 0%, 100%)',
      foregroundDark: 'hsl(345, 30%, 8%)',
    },
    background: {
      light: 'hsl(30, 20%, 98%)',
      dark: 'hsl(260, 25%, 7%)',
    },
    surface: {
      light: 'hsl(0, 0%, 100%)',
      dark: 'hsl(260, 22%, 11%)',
    },
    muted: {
      light: 'hsl(30, 15%, 93%)',
      dark: 'hsl(260, 18%, 15%)',
      foregroundLight: 'hsl(260, 10%, 45%)',
      foregroundDark: 'hsl(260, 12%, 60%)',
    },
    status: {
      success: 'hsl(145, 65%, 42%)',
      warning: 'hsl(38, 92%, 50%)',
      destructive: 'hsl(0, 72%, 51%)',
      info: 'hsl(210, 88%, 56%)',
    },
    border: {
      light: 'hsl(260, 12%, 88%)',
      dark: 'hsl(260, 15%, 18%)',
    },
    ring: {
      light: 'hsla(262, 83%, 58%, 0.4)',
      dark: 'hsla(263, 85%, 66%, 0.4)',
    },
  },

  // ── Typography Tokens ─────────────────────────────────────
  typography: {
    family: {
      sans: "'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      serif: "'Newsreader', 'Georgia', serif",
      mono: "'JetBrains Mono', 'Fira Code', monospace",
    },
    scale: {
      displayXl: { size: '2.5rem', lineHeight: '1.15', weight: '800', tracking: '-0.025em' },
      displayLg: { size: '2.0rem', lineHeight: '1.20', weight: '700', tracking: '-0.020em' },
      headingMd: { size: '1.5rem', lineHeight: '1.25', weight: '700', tracking: '-0.015em' },
      headingSm: { size: '1.25rem', lineHeight: '1.30', weight: '600', tracking: '-0.010em' },
      bodyLg: { size: '1.0rem', lineHeight: '1.50', weight: '400', tracking: '0em' },
      bodyMd: { size: '0.875rem', lineHeight: '1.45', weight: '400', tracking: '0em' },
      captionSm: { size: '0.75rem', lineHeight: '1.40', weight: '500', tracking: '0.010em' },
      microXs: { size: '0.6875rem', lineHeight: '1.35', weight: '600', tracking: '0.025em' },
    },
  },

  // ── Spacing Tokens ────────────────────────────────────────
  spacing: {
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    6: '24px',
    8: '32px',
    12: '48px',
    16: '64px',
  },

  // ── Radius Tokens ─────────────────────────────────────────
  radius: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    full: '9999px',
  },

  // ── Elevation & Shadow Tokens ─────────────────────────────
  shadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 10px 10px -5px rgba(0, 0, 0, 0.10)',
  },

  // ── Motion Tokens ─────────────────────────────────────────
  motion: {
    duration: {
      fast: '150ms',
      base: '250ms',
      slow: '400ms',
    },
    ease: {
      standard: 'cubic-bezier(0.2, 0.0, 0.0, 1.0)',
      bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    },
  },

  // ── Accessibility Targets ─────────────────────────────────
  accessibility: {
    minTouchTarget: '44px',
    focusRingWidth: '2px',
  },
} as const;

export type DesignTokens = typeof DESIGN_TOKENS;
