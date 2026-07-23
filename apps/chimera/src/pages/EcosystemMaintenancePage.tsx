import { useState } from 'react';
import { ShieldAlert, Sparkles, Lock, ArrowRight, RefreshCw, CheckCircle2, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface EcosystemMaintenancePageProps {
  message?: string;
  target?: 'all' | 'chimera' | 'whisprr';
  estimatedDuration?: string;
  onBypass?: () => void;
}

export function EcosystemMaintenancePage({
  message = 'We are improving WHISPRR & CHIMERA, thank you for your patience.',
  target = 'all',
  estimatedDuration = 'Underway',
  onBypass
}: EcosystemMaintenancePageProps) {
  const navigate = useNavigate();
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [bypassCode, setBypassCode] = useState('');
  const [error, setError] = useState(false);

  const handleBypassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (bypassCode === 'chimera2026' || bypassCode === 'admin') {
      localStorage.setItem('chimera_maintenance_bypass', 'true');
      if (onBypass) onBypass();
      navigate('/discover');
    } else {
      setError(true);
    }
  };

  const isDualMode = target === 'all';
  const isWhisprrOnly = target === 'whisprr';

  return (
    <div className="min-h-screen bg-warm-950 text-white flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden font-sans select-none">
      
      {/* Background Ambient Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 sm:w-[600px] h-96 sm:h-[600px] bg-gradient-to-tr from-red-600/20 via-purple-600/10 to-amber-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-purple-600/10 rounded-full blur-2xl pointer-events-none" />

      {/* Main Glassmorphic Container */}
      <div className="w-full max-w-2xl bg-white/5 dark:bg-warm-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-12 shadow-2xl relative z-10 text-center space-y-8 animate-fade-in">
        
        {/* Ecosystem Dual Branding Header */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          
          {/* WHISPRR Brand Icon */}
          {(isDualMode || isWhisprrOnly) && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 shadow-inner">
              <span className="font-serif text-lg sm:text-xl font-bold tracking-wider text-amber-400">
                WHISPRR
              </span>
            </div>
          )}

          {isDualMode && (
            <span className="text-xl font-light text-warm-500 font-serif">&amp;</span>
          )}

          {/* CHIMERA Brand Icon */}
          {(isDualMode || target === 'chimera') && (
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-red-600/10 border border-red-500/20 shadow-inner">
              <img
                src="/chimera_logo.png"
                alt="CHIMERA"
                className="w-7 h-7 object-contain drop-shadow-md"
              />
              <span className="font-serif text-lg sm:text-xl font-bold tracking-wider text-red-500">
                CHIMERA
              </span>
            </div>
          )}
        </div>

        {/* Live Status Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider shadow-sm">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>Scheduled Engine & Server Upgrade</span>
        </div>

        {/* Maintenance Message */}
        <div className="space-y-3 max-w-lg mx-auto">
          <h1 className="font-serif text-2xl sm:text-4xl font-bold text-white leading-tight">
            We Are Upgrading The Creative Ecosystem
          </h1>
          <p className="text-sm sm:text-base text-warm-300 font-medium leading-relaxed bg-black/30 p-4 rounded-2xl border border-white/5">
            "{message}"
          </p>
        </div>

        {/* Status Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs text-warm-400 font-medium">
          <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center gap-2">
            <CheckCircle2 size={15} className="text-emerald-400" />
            <span>User Data Safe</span>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center gap-2">
            <Sparkles size={15} className="text-purple-400" />
            <span>AI Models Tuning</span>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center gap-2">
            <Heart size={15} className="text-red-400" />
            <span>Back Soon</span>
          </div>
        </div>

        {/* Creator / Admin Bypass Link */}
        <div className="pt-6 border-t border-white/10 flex flex-col items-center gap-3">
          <button
            onClick={() => setShowAdminLogin(!showAdminLogin)}
            className="text-xs text-warm-400 hover:text-white transition-colors flex items-center gap-1.5 font-medium"
          >
            <Lock size={14} />
            <span>Creator &amp; Admin Access</span>
          </button>

          {showAdminLogin && (
            <form onSubmit={handleBypassSubmit} className="flex gap-2 max-w-xs w-full animate-fade-in">
              <input
                type="password"
                placeholder="Enter admin passcode..."
                value={bypassCode}
                onChange={(e) => {
                  setBypassCode(e.target.value);
                  setError(false);
                }}
                className="flex-1 bg-black/50 border border-white/20 rounded-xl px-3.5 py-2 text-xs text-white placeholder-warm-500 focus:outline-none focus:border-red-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition-colors"
              >
                Enter
              </button>
            </form>
          )}

          {error && (
            <p className="text-[11px] text-red-400">Invalid admin passcode</p>
          )}
        </div>

      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-xs text-warm-500 font-medium">
        &copy; {new Date().getFullYear()} WHISPRR &amp; CHIMERA Ecosystem. All rights reserved.
      </div>
    </div>
  );
}
