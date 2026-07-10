/**
 * WHISPRR Centralized Brand Identity System
 *
 * This file serves as the single source of truth for the WHISPRR brand.
 * All pages, components, and templates should import properties from here
 * to guarantee 100% brand consistency across the entire ecosystem.
 */

export const BRAND_SYSTEM = {
  name: 'WHISPRR',
  tagline: 'Where connections feel real.',
  taglineSecondary: 'Building a healthier social web.',
  philosophy: 'Full development transparency, open roadmaps, and community agency.',

  // Centralized Palette
  colors: {
    primary: {
      light: '#D4736E', // Primary Salmon/Coral Light
      DEFAULT: '#C96059', // Primary Coral
      dark: '#B04B45', // Darker Accent Salmon
    },
    accent: {
      light: '#E29B96',
      DEFAULT: '#C88B84',
      dark: '#B5756F',
    },
    neutral: {
      bgLight: '#FBF8F5', // Warm light theme background
      bgDark: '#151412', // Warm dark theme background (#151412 / warm-950)
      cardDark: '#1E1B17', // Warm dark card background (#1E1B17 / warm-925)
      cardLight: '#F5ECE5', // Warm light card background
    }
  },

  // Typography Rules
  typography: {
    fontFamilySerif: 'Cormorant Garamond, Georgia, serif',
    fontFamilySans: 'DM Sans, Inter, system-ui, sans-serif',
    headings: 'font-serif font-bold tracking-tight',
    body: 'font-sans tracking-normal leading-relaxed',
  },

  // Logo Guidelines & Rules
  usage: {
    clearSpace: 'Keep a clear space around the logo equal to 25% of the logo height/width.',
    minimumSize: {
      web: '24px',
      mobile: '32px',
      print: '15mm'
    },
    donots: [
      'Do not rotate the logo.',
      'Do not stretch or compress proportions.',
      'Do not apply custom drop shadows outside the official design system.',
      'Do not place the primary logo on low-contrast backgrounds.'
    ]
  }
};
