/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // V3 Primary: Muted Coral / Dusty Rose — softer, better contrast, premium
        primary: {
          50:  '#FDF4F3',
          100: '#FAE7E5',
          200: '#F5CFCC',
          300: '#ECAAA5',
          400: '#DF817A',
          500: '#C96059',  // Main brand — muted coral, good contrast
          600: '#B04B44',
          700: '#933C37',
          800: '#7A3330',
          900: '#662E2B',
        },
        // V3 Warm: Soft Charcoal / Warm Gray / Off White / Cream
        warm: {
          50:  '#FAFAF8',  // Off White
          100: '#F5F4F0',  // Cream
          200: '#ECEAE3',  // Light cream
          300: '#D9D5CB',  // Warm gray light
          400: '#B8B3A7',  // Warm gray mid
          500: '#8F8A80',  // Warm gray
          600: '#706B62',  // Charcoal gray
          700: '#565148',  // Soft charcoal
          750: '#47433C',  // Mid-deep charcoal
          800: '#3D3933',  // Deep charcoal
          850: '#302D28',  // Darker charcoal
          900: '#282520',  // Near black charcoal
          925: '#1E1B17',  // Dark card background
          950: '#151412',  // Near-black card background
        },
        // Accent: Dusty Rose — more muted than primary, used for highlights
        accent: {
          50:  '#FDF2F5',
          100: '#FAE4EA',
          200: '#F4C9D6',
          300: '#ECA5BB',
          400: '#DE7A9C',
          500: '#CC5A83',
          600: '#B0436B',
          700: '#923558',
          800: '#782E4A',
          900: '#64283F',
        },
        success: {
          50:  '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
          800: '#166534',
          900: '#14532D',
        },
        warning: {
          50:  '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
        error: {
          50:  '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D',
        },
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans:  ['DM Sans', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl':  '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        'soft':  '0 2px 8px rgba(0, 0, 0, 0.06)',
        'warm':  '0 4px 16px rgba(201, 96, 89, 0.10)',
        'float': '0 8px 32px rgba(0, 0, 0, 0.08)',
        'card':  '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)',
      },
    },
  },
  plugins: [],
};
