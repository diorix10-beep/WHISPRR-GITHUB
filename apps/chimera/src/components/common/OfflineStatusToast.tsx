import { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export function OfflineStatusToast() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 3500);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showReconnected) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
      {!isOnline ? (
        <div className="bg-amber-950/90 border border-amber-500/40 text-amber-200 px-4 py-2 rounded-full shadow-lg text-xs font-semibold flex items-center gap-2 backdrop-blur-md">
          <WifiOff size={14} className="text-amber-400 animate-pulse" />
          <span>Offline mode active. Your drafts are saved locally.</span>
        </div>
      ) : (
        <div className="bg-emerald-950/90 border border-emerald-500/40 text-emerald-200 px-4 py-2 rounded-full shadow-lg text-xs font-semibold flex items-center gap-2 backdrop-blur-md">
          <Wifi size={14} className="text-emerald-400" />
          <span>Back online! Syncing your data...</span>
        </div>
      )}
    </div>
  );
}
