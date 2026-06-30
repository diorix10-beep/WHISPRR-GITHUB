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
  const customMessage = settings?.message || "We're currently improving WHISPRR to bring you a better experience. Thank you for your patience. ❤️";
  const reopenAt = settings?.reopen_at;
  const formattedReopen = reopenAt ? new Date(reopenAt).toLocaleString() : null;

  return (
    <div className="min-h-screen bg-warm-900 flex items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-rose-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative text-center max-w-lg">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-warm-800 border border-warm-700 mb-8 shadow-float">
          <Wrench className="w-9 h-9 text-primary-400 animate-pulse" />
        </div>

        <h1 className="text-4xl sm:text-5xl font-serif font-bold text-warm-100 mb-6 tracking-tight">
          We'll Be Right Back
        </h1>

        <p className="text-warm-300 text-lg leading-relaxed mb-6 font-medium">
          {customMessage}
        </p>

        {formattedReopen && (
          <p className="text-primary-400 text-sm font-semibold mb-6 bg-primary-950/20 border border-primary-900/30 py-2 px-4 rounded-full inline-block">
             Estimated Reopening: {formattedReopen}
          </p>
        )}

        <div className="flex items-center justify-center gap-2 bg-warm-850 border border-warm-750 rounded-full px-5 py-2.5 mx-auto w-fit">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400" />
          </span>
          <span className="text-warm-300 text-sm font-medium">Maintenance in progress</span>
        </div>

        <div className="text-warm-500 text-xs mt-12 space-y-1">
          <p>Need support? Contact us at help@whisprr.xyz</p>
          <p>© 2026 WHISPRR. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
