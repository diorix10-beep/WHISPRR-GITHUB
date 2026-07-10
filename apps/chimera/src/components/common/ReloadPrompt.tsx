import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';

export function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      // eslint-disable-next-line prefer-template
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (!offlineReady && !needRefresh) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 md:bottom-8 md:right-8 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="bg-white dark:bg-warm-800 rounded-2xl shadow-xl shadow-warm-900/10 border border-warm-200 dark:border-warm-700 p-4 max-w-sm w-full">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-semibold text-warm-900 dark:text-warm-50">
              {offlineReady ? 'Ready to work offline' : 'New version available!'}
            </h3>
            <p className="text-sm text-warm-500 dark:text-warm-400 mt-1">
              {offlineReady 
                ? 'App is ready to work offline.' 
                : 'A new update is available. Refresh to apply the latest changes.'}
            </p>
          </div>
          <button
            onClick={close}
            className="p-1 text-warm-400 hover:text-warm-600 dark:hover:text-warm-200 rounded-full hover:bg-warm-100 dark:hover:bg-warm-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        
        {needRefresh && (
          <button
            onClick={() => updateServiceWorker(true)}
            className="mt-4 w-full flex items-center justify-center gap-2 btn-primary py-2"
          >
            <RefreshCw size={16} />
            Refresh App
          </button>
        )}
      </div>
    </div>
  );
}
