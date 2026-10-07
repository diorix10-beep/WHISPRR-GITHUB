import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

export type CreativeMode = 'roleplay' | 'storytelling';

const STORAGE_KEY = 'chimera-mode';

function readStoredMode(): CreativeMode {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'storytelling' ? 'storytelling' : 'roleplay';
  } catch {
    return 'roleplay';
  }
}

interface ModeContextType {
  mode: CreativeMode;
  setMode: (mode: CreativeMode) => void;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<CreativeMode>(readStoredMode);

  const setMode = useCallback((next: CreativeMode) => {
    setModeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage can be blocked; the mode still works for this visit */
    }
  }, []);

  const value = useMemo(() => ({ mode, setMode }), [mode, setMode]);
  return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useMode() {
  const context = useContext(ModeContext);
  if (!context) throw new Error('useMode must be used within a ModeProvider');
  return context;
}
