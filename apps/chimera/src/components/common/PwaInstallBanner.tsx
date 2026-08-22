import { useState, useEffect } from 'react';
import { Download, X, Sparkles, Monitor } from 'lucide-react';
import { ChimeraDesktopDownloadModal } from './ChimeraDesktopDownloadModal';

export function PwaInstallBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showDesktopModal, setShowDesktopModal] = useState(false);

  useEffect(() => {
    // Check if dismissed recently
    const dismissed = localStorage.getItem('chimera_desktop_banner_dismissed');
    if (dismissed && Date.now() - parseInt(dismissed, 10) < 7 * 24 * 60 * 60 * 1000) {
      return;
    }

    // Show desktop app prompt after 3 seconds
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('chimera_desktop_banner_dismissed', Date.now().toString());
  };

  if (!isVisible) return null;

  return (
    <>
      <div className="fixed bottom-20 sm:bottom-6 left-4 right-4 max-w-md mx-auto z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
        <div className="bg-gradient-to-r from-red-950/95 via-warm-900/95 to-amber-950/95 border border-amber-500/30 backdrop-blur-xl p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 flex-shrink-0">
              <Monitor size={20} />
            </div>
            <div>
              <h4 className="font-serif font-bold text-sm text-white">CHIMERA Desktop App</h4>
              <p className="text-xs text-warm-300">Native installer for macOS (.dmg) &amp; Windows (.exe).</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setShowDesktopModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-1.5"
            >
              <Download size={14} />
              <span>Download</span>
            </button>
            <button
              onClick={handleDismiss}
              className="p-1.5 rounded-lg text-warm-400 hover:text-white hover:bg-warm-800/50 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>

      <ChimeraDesktopDownloadModal
        isOpen={showDesktopModal}
        onClose={() => setShowDesktopModal(false)}
      />
    </>
  );
}
