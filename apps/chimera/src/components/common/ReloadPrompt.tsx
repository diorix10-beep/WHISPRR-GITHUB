import { useState, useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Sparkles, RefreshCw, X } from 'lucide-react';

export function ReloadPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const {
    offlineReady: [_offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (!r) return;

      // Active polling every 15 seconds for instant Vercel deployment detection
      const interval = setInterval(() => {
        r.update().catch(() => {});
      }, 15000);

      // Check immediately when user switches back to this tab
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          r.update().catch(() => {});
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('online', () => r.update().catch(() => {}));
    },
    onRegisterError(error) {
      console.error('SW registration error', error);
    },
  });

  // Display prompt immediately when a new deployment/version is available
  useEffect(() => {
    if (needRefresh && !dismissed) {
      setShowPrompt(true);
    }
  }, [needRefresh, dismissed]);

  const close = () => {
    setShowPrompt(false);
    setDismissed(true);
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (!showPrompt || dismissed) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[9999] md:bottom-8 md:right-8 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="bg-white/95 dark:bg-warm-900/95 backdrop-blur-md rounded-2xl shadow-2xl shadow-warm-950/20 border border-warm-200/80 dark:border-warm-800 p-5 max-w-sm w-full transition-all">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="font-serif font-bold text-warm-900 dark:text-warm-50 text-base flex items-center gap-1.5">
                ✨ CHIMERA has been updated
              </h3>
              <p className="text-xs text-warm-600 dark:text-warm-400 mt-1 leading-relaxed">
                Refresh whenever you're ready to enjoy the latest improvements.
              </p>
            </div>
          </div>

          <button
            onClick={close}
            className="p-1 text-warm-400 hover:text-warm-600 dark:hover:text-warm-200 rounded-full hover:bg-warm-100 dark:hover:bg-warm-800 transition-colors shrink-0"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => updateServiceWorker(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-xs shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5"
          >
            <RefreshCw size={14} />
            Refresh CHIMERA
          </button>
        </div>
      </div>
    </div>
  );
}
