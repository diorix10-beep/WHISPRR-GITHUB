import { Link, useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Compass, Sparkles } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-warm-50 dark:bg-warm-950 flex flex-col items-center justify-center p-6 relative overflow-hidden select-none">
      
      {/* Ambient background blobs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-red-600/10 via-purple-600/8 to-amber-500/5 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-600/8 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 text-center max-w-lg mx-auto space-y-8 animate-fade-in">

        {/* Logo */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-red-500/15 to-purple-500/10 border border-red-200 dark:border-red-500/20 flex items-center justify-center shadow-lg">
            <img
              src="/chimera_logo.png"
              alt="CHIMERA"
              className="w-9 h-9 object-contain drop-shadow opacity-70"
            />
          </div>
        </div>

        {/* 404 Number */}
        <div className="space-y-1">
          <p className="text-[9rem] sm:text-[11rem] font-serif font-black leading-none bg-gradient-to-br from-red-500 via-rose-400 to-amber-400 bg-clip-text text-transparent drop-shadow-sm select-none">
            404
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-red-500 via-purple-400 to-transparent rounded-full mx-auto" />
        </div>

        {/* Message */}
        <div className="space-y-3">
          <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-warm-900 dark:text-white">
            Page Not Found
          </h1>
          <p className="text-sm sm:text-base text-warm-500 dark:text-warm-400 leading-relaxed max-w-sm mx-auto font-medium">
            The story you're looking for doesn't exist — or it may have been moved to another world.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to="/discover"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-rose-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-red-500/20 hover:shadow-red-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            <Compass size={17} />
            Explore CHIMERA
          </Link>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-warm-100 dark:bg-warm-800 text-warm-700 dark:text-warm-200 font-bold text-sm rounded-2xl border border-warm-200 dark:border-warm-700 hover:bg-warm-200 dark:hover:bg-warm-700 hover:scale-[1.02] active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm-400"
          >
            <ArrowLeft size={17} />
            Go Back
          </button>
        </div>

        {/* Suggestion pills */}
        <div className="pt-4 space-y-3">
          <div className="flex items-center justify-center gap-1.5 text-xs font-black uppercase tracking-widest text-warm-400 dark:text-warm-500">
            <Sparkles size={12} className="text-purple-400" />
            <span>Or explore these</span>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { label: 'Characters', to: '/characters' },
              { label: 'Worlds', to: '/worlds' },
              { label: 'Stories', to: '/stories' },
              { label: 'My Chats', to: '/chats' },
              { label: 'SHARDS', to: '/shards' },
            ].map(({ label, to }) => (
              <Link
                key={label}
                to={to}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-warm-100 dark:bg-warm-800 text-warm-600 dark:text-warm-300 border border-warm-200 dark:border-warm-750 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-500/30 transition-all"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-[11px] text-warm-400 dark:text-warm-600 font-medium pt-2">
          <Link to="/" className="hover:text-red-500 transition-colors inline-flex items-center gap-1">
            <Home size={11} />
            Return to Home
          </Link>
        </p>
      </div>
    </div>
  );
}
