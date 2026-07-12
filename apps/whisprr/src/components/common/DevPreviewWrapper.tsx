import { useState, useEffect, type ReactNode } from 'react';
import { Smartphone, Laptop, Tablet, RefreshCw, Check } from 'lucide-react';

interface DevPreviewWrapperProps {
  children: ReactNode;
}

type PreviewMode = 'desktop' | 'mobile' | 'tablet';

export function DevPreviewWrapper({ children }: DevPreviewWrapperProps) {
  // Only enable in local development
  const isDev = import.meta.env.DEV;
  
  // Read initial mode from localStorage or URL parameter
  const getInitialMode = (): PreviewMode => {
    const params = new URLSearchParams(window.location.search);
    const urlMode = params.get('preview') as PreviewMode;
    if (urlMode && ['desktop', 'mobile', 'tablet'].includes(urlMode)) {
      return urlMode;
    }
    const savedMode = localStorage.getItem('dev_preview_mode') as PreviewMode;
    return (savedMode && ['desktop', 'mobile', 'tablet'].includes(savedMode)) ? savedMode : 'desktop';
  };

  const [mode, setMode] = useState<PreviewMode>(getInitialMode);
  const [hmrActive, setHmrActive] = useState(true);

  // Sync mode changes to localStorage
  const handleModeChange = (newMode: PreviewMode) => {
    setMode(newMode);
    localStorage.setItem('dev_preview_mode', newMode);
    
    // Update URL parameter without reloading page
    const params = new URLSearchParams(window.location.search);
    if (newMode === 'desktop') {
      params.delete('preview');
    } else {
      params.set('preview', newMode);
    }
    const newRelativePathQuery = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
    window.history.pushState(null, '', newRelativePathQuery);
  };

  // Listen to standard Vite HMR event signals if possible, or simulate HMR success feedback on hot reload
  useEffect(() => {
    if (!isDev) return;
    
    // Flicker Vite status to show HMR active state on changes
    setHmrActive(false);
    const timer = setTimeout(() => setHmrActive(true), 600);

    return () => clearTimeout(timer);
  }, []);

  if (!isDev) {
    return <>{children}</>;
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${mode !== 'desktop' ? 'bg-[#0f0e0d] flex items-center justify-center p-6 relative overflow-auto' : ''}`}>
      {/* Dev Control Toolbar Pill */}
      <div className="fixed top-4 right-4 z-[9999] bg-[#1a1918]/90 backdrop-blur border border-white/5 px-4 py-2 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex items-center gap-4 text-xs font-sans text-neutral-300 select-none">
        <div className="flex items-center gap-1.5 border-r border-white/10 pr-3">
          <div className={`w-2 h-2 rounded-full ${hmrActive ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
          <span className="font-mono text-[10px] text-neutral-400">VITE HMR</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => handleModeChange('desktop')}
            className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 ${mode === 'desktop' ? 'bg-primary-500 text-white font-bold' : 'hover:bg-white/5'}`}
            title="Desktop Mode"
          >
            <Laptop size={14} />
          </button>
          
          <button
            onClick={() => handleModeChange('mobile')}
            className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 ${mode === 'mobile' ? 'bg-primary-500 text-white font-bold' : 'hover:bg-white/5'}`}
            title="Simulated iPhone Mobile Mode"
          >
            <Smartphone size={14} />
            {mode === 'mobile' && <span className="text-[9px] font-mono">iPhone</span>}
          </button>

          <button
            onClick={() => handleModeChange('tablet')}
            className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 ${mode === 'tablet' ? 'bg-primary-500 text-white font-bold' : 'hover:bg-white/5'}`}
            title="Simulated iPad Tablet Mode"
          >
            <Tablet size={14} />
            {mode === 'tablet' && <span className="text-[9px] font-mono">iPad</span>}
          </button>
        </div>
      </div>

      {/* Simulator Device Enclosures */}
      {mode === 'mobile' && (
        <div className="w-[375px] h-[812px] bg-[#121110] border-[12px] border-neutral-800 rounded-[3rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] relative flex flex-col overflow-hidden select-none animate-scale-up border-box">
          {/* Top Notch / Dynamic Island */}
          <div className="w-32 h-6 bg-black rounded-full absolute top-2 left-1/2 transform -translate-x-1/2 z-50 flex items-center justify-between px-3">
            <div className="w-1.5 h-1.5 bg-neutral-900 rounded-full" />
            <div className="w-12 h-1 bg-neutral-950 rounded-full" />
          </div>

          {/* Status Bar */}
          <div className="h-8 bg-transparent flex items-center justify-between px-6 text-[9px] font-bold text-neutral-400 z-40 select-none pointer-events-none">
            <span>9:41</span>
            <div className="flex items-center gap-1">
              <span>5G</span>
              <div className="w-4 h-2 border border-neutral-400 rounded-sm p-0.5 flex items-center">
                <div className="h-full w-full bg-neutral-400 rounded-2xs" />
              </div>
            </div>
          </div>

          {/* Web App Screen Frame */}
          <div className="flex-1 min-h-0 relative bg-warm-50 dark:bg-warm-900 overflow-hidden rounded-b-[2rem]">
            {children}
          </div>

          {/* Bottom Home Indicator Bar */}
          <div className="h-4 bg-transparent flex items-center justify-center z-40 pointer-events-none pb-1">
            <div className="w-24 h-1 bg-neutral-500/50 rounded-full" />
          </div>
        </div>
      )}

      {mode === 'tablet' && (
        <div className="w-[768px] h-[1024px] bg-[#121110] border-[14px] border-neutral-800 rounded-[2.5rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] relative flex flex-col overflow-hidden select-none animate-scale-up border-box">
          {/* Top Camera bezel dot */}
          <div className="w-2.5 h-2.5 bg-neutral-950 rounded-full absolute top-2.5 left-1/2 transform -translate-x-1/2 z-50" />

          {/* Screen area */}
          <div className="flex-1 min-h-0 relative bg-warm-50 dark:bg-warm-900 overflow-hidden rounded-[1.5rem]">
            {children}
          </div>
        </div>
      )}

      {mode === 'desktop' && children}
    </div>
  );
}
