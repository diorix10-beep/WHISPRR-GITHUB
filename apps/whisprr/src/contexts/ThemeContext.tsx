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
    const stored = localStorage.getItem('whisprr-theme-preference');
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
    
    // For backwards compatibility, check old key
    const oldStored = localStorage.getItem('whisprr-theme');
    if (oldStored === 'light' || oldStored === 'dark') return oldStored;

    return 'system';
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
      localStorage.setItem('whisprr-theme', active); // legacy checks compatibility
    };

    updateActiveTheme();

    // Listen to OS changes
    mediaQuery.addEventListener('change', updateActiveTheme);
    return () => mediaQuery.removeEventListener('change', updateActiveTheme);
  }, [preference]);

  const setPreference = (pref: ThemePreference) => {
    setPreferenceState(pref);
    localStorage.setItem('whisprr-theme-preference', pref);
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
