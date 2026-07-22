/**
 * CHIMERA — Centralized Brand Identity System
 *
 * This file serves as the single source of truth for the CHIMERA brand.
 * All pages, components, and templates should import properties from here
 * to guarantee 100% brand consistency across the entire platform.
 *
 * CHIMERA = AI Creation Platform
 * WHISPRR = Social Network (separate product)
 */

export const CHIMERA_BRAND = {
  name: 'CHIMERA',
  tagline: 'Your AI Creation Studio.',
  taglineSecondary: 'Create characters. Build worlds. Tell stories.',
  philosophy: 'AI is a tool — not a requirement. Creators always remain in control.',

  // Centralized Palette — Deep crimson / warm neutrals
  colors: {
    primary: {
      50: '#FFF1F0',
      100: '#FFE0DE',
      200: '#FFC2BD',
      300: '#FF9A93',
      400: '#FF6B61',
      500: '#E84C3D',    // Main CHIMERA red
      600: '#C93A2D',
      700: '#A82D22',
      800: '#8A241B',
      900: '#6E1D16',
      950: '#3D0F0B',
    },
    accent: {
      gold: '#D4A843',
      goldLight: '#F0D78C',
      goldDark: '#A88634',
      ember: '#FF8C42',
      violet: '#7C3AED',
    },
    neutral: {
      bgLight: '#FAFAF8',
      bgDark: '#0F0F0E',
      cardLight: '#FFFFFF',
      cardDark: '#1A1918',
      surfaceLight: '#F5F3F0',
      surfaceDark: '#242220',
      borderLight: '#E8E4DF',
      borderDark: '#2E2C29',
    },
    semantic: {
      success: '#22C55E',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
    },
  },

  // Typography Rules
  typography: {
    fontFamilySerif: 'Cormorant Garamond, Georgia, serif',
    fontFamilySans: 'DM Sans, Inter, system-ui, sans-serif',
    fontFamilyMono: 'JetBrains Mono, Fira Code, monospace',
    headings: 'font-serif font-bold tracking-tight',
    body: 'font-sans tracking-normal leading-relaxed',
    code: 'font-mono text-sm',
  },

  // Spacing System
  spacing: {
    page: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
    section: 'py-8 sm:py-12',
    card: 'p-4 sm:p-6',
  },

  // Border Radius
  radius: {
    sm: 'rounded-lg',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    xl: 'rounded-3xl',
    full: 'rounded-full',
  },

  // Shadows
  shadows: {
    sm: 'shadow-sm',
    md: 'shadow-md shadow-black/5 dark:shadow-black/20',
    lg: 'shadow-lg shadow-black/10 dark:shadow-black/30',
    glow: 'shadow-lg shadow-red-500/20',
  },

  // Module definitions for the platform
  modules: {
    dashboard: { label: 'Dashboard', color: '#E84C3D' },
    characters: { label: 'Characters', color: '#7C3AED' },
    worlds: { label: 'Worlds', color: '#22C55E' },
    stories: { label: 'Stories', color: '#3B82F6' },
    models: { label: 'AI Models', color: '#F59E0B' },
    voices: { label: 'Voices', color: '#EC4899' },
    studio: { label: 'Creator Studio', color: '#D4A843' },
    memory: { label: 'Memory', color: '#06B6D4' },
    media: { label: 'Media', color: '#F97316' },
  },

  // Logo Guidelines & Rules
  usage: {
    clearSpace: 'Keep a clear space around the logo equal to 25% of the logo height/width.',
    minimumSize: {
      web: '24px',
      mobile: '32px',
      print: '15mm',
    },
    donots: [
      'Do not rotate the logo.',
      'Do not stretch or compress proportions.',
      'Do not apply custom drop shadows outside the official design system.',
      'Do not place the primary logo on low-contrast backgrounds.',
    ],
  },
};
