/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#282520',            // Soft charcoal
    background: '#FAFAF8',      // Off White / Cream
    backgroundElement: '#F5F4F0', // Light cream inset panels
    backgroundSelected: '#ECEAE3', // Active tab/element
    textSecondary: '#706B62',   // Muted charcoal gray
    primary: '#C96059',         // Muted coral
    accent: '#CC5A83',          // Dusty rose
    border: '#ECEAE3',
  },
  dark: {
    text: '#FAFAF8',            // Creamy off-white
    background: '#151412',      // Near-black charcoal
    backgroundElement: '#1E1B17', // Dark card background
    backgroundSelected: '#282520', // Mid-deep charcoal
    textSecondary: '#8F8A80',   // Warm gray
    primary: '#C96059',         // Muted coral
    accent: '#CC5A83',          // Dusty rose
    border: '#282520',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
