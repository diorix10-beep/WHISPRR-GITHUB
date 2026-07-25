import { Wrench } from 'lucide-react';

interface MaintenancePageProps {
  settings: {
    enabled: boolean;
    message: string;
    reopen_at: string | null;
    bypass_founder: boolean;
    bypass_admin: boolean;
  };
}

export default function MaintenancePage({ settings }: MaintenancePageProps) {
  const customMessage =
    settings?.message ||
    "We're currently improving WHISPRR to bring you a better experience. Thank you for your patience. ❤️";
  const reopenAt = settings?.reopen_at;
  const formattedReopen = reopenAt ? new Date(reopenAt).toLocaleString() : null;

  return (
    <div className="min-h-screen bg-warm-50 dark:bg-warm-950 text-warm-900 dark:text-warm-100 flex items-center justify-center px-4 sm:px-6 relative overflow-hidden transition-colors duration-300">
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      {/* Main Container Card — Theme Aware (Option A) */}
      <div className="relative text-center max-w-lg w-full bg-white/90 dark:bg-warm-900/80 backdrop-blur-2xl p-8 sm:p-10 rounded-3xl border border-warm-200/60 dark:border-warm-800/70 shadow-2xl">
        <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-primary-50 dark:bg-primary-950/40 border border-primary-200/50 dark:border-primary-800/40 mb-6 shadow-soft">
          <Wrench className="w-8 h-8 sm:w-9 sm:h-9 text-primary-600 dark:text-primary-400 animate-pulse" />
        </div>

        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-warm-900 dark:text-warm-50 mb-4 tracking-tight">
          We'll Be Right Back
        </h1>

        <p className="text-warm-700 dark:text-warm-300 text-sm sm:text-base leading-relaxed mb-6 font-medium">
          {customMessage}
        </p>

        {formattedReopen && (
          <p className="text-xs sm:text-sm font-semibold text-primary-600 dark:text-primary-300 mb-6 bg-primary-50 dark:bg-primary-950/40 border border-primary-200/60 dark:border-primary-800/50 py-2 px-4 rounded-full inline-block">
            Estimated Reopening: {formattedReopen}
          </p>
        )}

        <div className="flex items-center justify-center gap-2 bg-warm-100 dark:bg-warm-800 border border-warm-200/60 dark:border-warm-750/70 rounded-full px-4 py-2 mx-auto w-fit">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400" />
          </span>
          <span className="text-warm-700 dark:text-warm-300 text-xs font-semibold">
            Maintenance in progress
          </span>
        </div>

        <div className="text-warm-500 dark:text-warm-400 text-xs mt-8 space-y-1">
          <p>Need support? Contact us at help@whisprr.xyz</p>
          <p>© 2026 WHISPRR. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
