import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, User, Settings, 
  Sparkles, Users, Globe, Volume2, Shield, ArrowUpRight, Monitor, Download
} from 'lucide-react';
import { WhisprrLogo } from '../common/WhisprrLogo';
import { ShardCrystalImage } from '../common/ShardCrystalImage';
import { ChimeraDesktopDownloadModal } from '../common/ChimeraDesktopDownloadModal';

const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
const whisprrUrl = isLocalhost ? 'http://localhost:5174' : 'https://whisprr.xyz';

interface AppLauncherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AppLauncherModal({ isOpen, onClose }: AppLauncherModalProps) {
  const navigate = useNavigate();
  const [showDesktopModal, setShowDesktopModal] = useState(false);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleNavigate = (path: string, external?: boolean) => {
    if (external) {
      window.location.href = path;
    } else {
      navigate(path);
    }
    onClose();
  };

  const tools = [
    { label: 'CHIMERA Studio', desc: 'Creative roleplay & novel workspace', path: '/workspace', icon: Sparkles, accent: 'text-amber-400 group-hover:text-amber-300' },
    { label: 'WHISPRR Ecosystem', desc: 'Main platform & identity', path: whisprrUrl, external: true, icon: Globe, accent: 'text-purple-400 group-hover:text-purple-300' },
    { label: 'Account Settings', desc: 'Profile & preferences', path: '/settings', icon: Settings, accent: 'text-warm-400 group-hover:text-warm-300' },
    { label: "Guardian's Library", desc: 'Content controls & support', path: '/trust', icon: Shield, accent: 'text-indigo-400 group-hover:text-indigo-300' },
  ];

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Ecosystem Hub"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-warm-950/85 backdrop-blur-2xl" />

      {/* Modal Panel */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto no-scrollbar flex flex-col gap-0 rounded-3xl shadow-2xl border border-white/10 dark:border-warm-750/60 bg-white/95 dark:bg-warm-900/95 backdrop-blur-xl animate-scale-in">

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="relative px-6 pt-6 pb-5 border-b border-warm-100 dark:border-warm-800 overflow-hidden">
          {/* Ambient gradient blobs */}
          <div className="absolute -top-8 -left-8 w-48 h-48 bg-gradient-to-br from-red-600/20 via-purple-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -top-8 -right-8 w-48 h-48 bg-gradient-to-bl from-cyan-600/20 via-indigo-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/25 text-purple-400 text-[10px] font-black uppercase tracking-widest">
                <Sparkles size={10} />
                <span>Ecosystem Hub</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-red-500 via-purple-500 to-cyan-400 bg-clip-text text-transparent leading-tight mt-1">
                Your Creative Universe
              </h2>
              <p className="text-xs text-warm-400 dark:text-warm-500 font-medium">
                One account. Two creative worlds. Infinite possibilities.
              </p>
            </div>
            <button
              onClick={onClose}
              className="ml-4 shrink-0 p-2 rounded-2xl bg-warm-100 dark:bg-warm-800 text-warm-500 dark:text-warm-400 hover:bg-warm-200 dark:hover:bg-warm-700 hover:text-warm-900 dark:hover:text-white transition-all hover:scale-105 active:scale-95"
              aria-label="Close Ecosystem Hub"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── App Cards ──────────────────────────────────────────── */}
        <div className="px-6 pt-5 pb-2 space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-warm-400 dark:text-warm-500 px-0.5">
            Ecosystem Applications
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* ── WHISPRR ── */}
            <button
              onClick={() => handleNavigate(`${whisprrUrl}/feed`, true)}
              className="group relative p-4 rounded-2xl border border-primary-200 dark:border-primary-500/30 bg-gradient-to-br from-primary-50 to-white dark:from-primary-900/20 dark:to-warm-850 text-left overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg hover:shadow-primary-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-primary-400/10 rounded-full -translate-y-4 translate-x-4 group-hover:scale-125 transition-transform duration-500 pointer-events-none" />
              <div className="relative flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center">
                    <WhisprrLogo size={22} />
                  </div>
                  <ArrowUpRight size={14} className="text-primary-400 opacity-50 group-hover:opacity-100 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" />
                </div>
                <div>
                  <h4 className="font-serif font-black text-sm text-primary-700 dark:text-primary-300 leading-none">WHISPRR</h4>
                  <p className="text-[10px] text-primary-500 dark:text-primary-400/80 mt-0.5 font-medium">Social Creator Network</p>
                </div>
              </div>
            </button>

            {/* ── CHIMERA ── */}
            <button
              onClick={() => handleNavigate('/discover')}
              className="group relative p-4 rounded-2xl border border-red-200 dark:border-red-500/30 bg-gradient-to-br from-red-50 to-white dark:from-red-900/20 dark:to-warm-850 text-left overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg hover:shadow-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-red-400/10 rounded-full -translate-y-4 translate-x-4 group-hover:scale-125 transition-transform duration-500 pointer-events-none" />
              <div className="relative flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                    <img src="/chimera_logo.png" alt="CHIMERA" className="w-6 h-6 object-contain drop-shadow" />
                  </div>
                  <ArrowUpRight size={14} className="text-red-400 opacity-50 group-hover:opacity-100 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" />
                </div>
                <div>
                  <h4 className="font-serif font-black text-sm text-red-700 dark:text-red-400 leading-none">CHIMERA</h4>
                  <p className="text-[10px] text-red-500 dark:text-red-400/80 mt-0.5 font-medium">Roleplay & Storytelling</p>
                </div>
              </div>
            </button>

            {/* ── SHARDS ── */}
            <button
              onClick={() => handleNavigate('/shards')}
              className="group relative p-4 rounded-2xl border border-cyan-200 dark:border-cyan-500/30 bg-gradient-to-br from-cyan-50 to-white dark:from-cyan-900/15 dark:to-warm-850 text-left overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg hover:shadow-cyan-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-400/10 rounded-full -translate-y-4 translate-x-4 group-hover:scale-125 transition-transform duration-500 pointer-events-none" />
              <div className="relative flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-cyan-100 dark:bg-cyan-500/20 flex items-center justify-center">
                    <ShardCrystalImage size={22} showGlow={false} />
                  </div>
                  <ArrowUpRight size={14} className="text-cyan-400 opacity-50 group-hover:opacity-100 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" />
                </div>
                <div>
                  <h4 className="font-serif font-black text-sm text-cyan-700 dark:text-cyan-400 leading-none">SHARDS</h4>
                  <p className="text-[10px] text-cyan-600 dark:text-cyan-400/80 mt-0.5 font-medium">Roleplay rewards & moments</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* ── Divider ────────────────────────────────────────────── */}
        <div className="px-6 py-1">
          <div className="w-full h-px bg-gradient-to-r from-transparent via-warm-200 dark:via-warm-750 to-transparent" />
        </div>

        {/* ── Tools Grid ─────────────────────────────────────────── */}
        <div className="px-6 pt-1 pb-6 space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-warm-400 dark:text-warm-500 px-0.5">
            Creation Tools & Workspaces
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {tools.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => handleNavigate(item.path)}
                  className="group flex items-center gap-3 px-3.5 py-3 rounded-2xl text-left transition-all hover:bg-warm-50 dark:hover:bg-warm-800/70 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                >
                  <div className={`shrink-0 transition-transform group-hover:scale-110 ${item.accent}`}>
                    <Icon size={17} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-warm-800 dark:text-warm-200 leading-none">{item.label}</p>
                    <p className="text-[10px] text-warm-400 dark:text-warm-500 mt-0.5 truncate">{item.desc}</p>
                  </div>
                  <ArrowUpRight size={12} className="shrink-0 opacity-0 group-hover:opacity-60 transition-opacity text-warm-400" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Desktop Application Banner */}
        <div className="mx-6 mb-5 p-4 rounded-2xl bg-gradient-to-r from-red-950/80 via-warm-950/90 to-amber-950/80 border border-amber-500/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Monitor size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-white">CHIMERA Desktop Application</p>
              <p className="text-[10px] text-warm-300">Native installer for macOS (.dmg) &amp; Windows (.exe)</p>
            </div>
          </div>

          <button
            onClick={() => setShowDesktopModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs shadow-md transition-all shrink-0 flex items-center gap-1.5"
          >
            <Download size={13} />
            <span>Download App</span>
          </button>
        </div>

        {/* ── Footer ─────────────────────────────────────────────── */}
        <div className="px-6 py-3 border-t border-warm-100 dark:border-warm-800 bg-warm-50/80 dark:bg-warm-900/50 rounded-b-3xl">
          <p className="text-center text-[10px] text-warm-400 dark:text-warm-500 font-medium">
            © {new Date().getFullYear()} WHISPRR & CHIMERA Ecosystem · All rights reserved
          </p>
        </div>

        <ChimeraDesktopDownloadModal
          isOpen={showDesktopModal}
          onClose={() => setShowDesktopModal(false)}
        />
      </div>
    </div>
  );
}
