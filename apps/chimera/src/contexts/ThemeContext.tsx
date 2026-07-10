import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ActiveTheme = 'light' | 'dark';

interface ThemeContextType {
  preference: ThemePreference;
  theme: ActiveTheme;
  setPreference: (pref: ThemePreference) => void;
  toggleTheme: () => void; // Keep for legacy/fallback support
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(() => {
    try {
      const stored = localStorage.getItem('chimera-theme-preference');
      if (stored === 'light' || stored === 'dark' || stored === 'system') return stored as ThemePreference;
      
      // For backwards compatibility, check old key
      const oldStored = localStorage.getItem('chimera-theme');
      if (oldStored === 'light' || oldStored === 'dark') return oldStored as ThemePreference;
    } catch (e) {
      console.warn('localStorage is not available:', e);
    }

    return 'dark'; // CHIMERA defaults to dark
  });

  const [activeTheme, setActiveTheme] = useState<ActiveTheme>('light');

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const updateActiveTheme = () => {
      let active: ActiveTheme = 'light';
      if (preference === 'system') {
        active = mediaQuery.matches ? 'dark' : 'light';
      } else {
        active = preference;
      }
      setActiveTheme(active);
      document.documentElement.classList.toggle('dark', active === 'dark');
      try {
        localStorage.setItem('chimera-theme', active); // legacy checks compatibility
      } catch (e) {
        console.warn('Could not save theme preference:', e);
      }
    };

    updateActiveTheme();

    // Listen to OS changes
    mediaQuery.addEventListener('change', updateActiveTheme);
    return () => mediaQuery.removeEventListener('change', updateActiveTheme);
  }, [preference]);

  const setPreference = (pref: ThemePreference) => {
    setPreferenceState(pref);
    try {
      localStorage.setItem('chimera-theme-preference', pref);
    } catch (e) {
      console.warn('Could not save theme preference:', e);
    }
  };

  const toggleTheme = () => {
    // Cycle: light -> dark -> system -> light
    setPreference(
      preference === 'light'
        ? 'dark'
        : preference === 'dark'
        ? 'system'
        : 'light'
    );
  };

  return (
    <ThemeContext.Provider value={{ preference, theme: activeTheme, setPreference, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
