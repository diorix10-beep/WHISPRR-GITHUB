import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Edit3, Users, MessageCircle, Bookmark,
  ArrowUpRight, Zap
} from 'lucide-react';
import { ChimeraLogo } from '../common/ChimeraLogo';
import { Logo } from '../common/Logo';

interface AppLauncherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const isLocalhost =
  typeof window !== 'undefined' && window.location.hostname === 'localhost';
const chimeraUrl = isLocalhost
  ? 'http://localhost:5175'
  : 'https://chimera.whisprr.xyz';

const quickActions = [
  { label: 'New Whisper',    icon: Edit3,         path: null,          action: 'compose',       color: 'text-primary-500' },
  { label: 'Communities',   icon: Users,         path: '/communities', action: null,            color: 'text-indigo-500' },
  { label: 'Messages',      icon: MessageCircle, path: '/messages',    action: null,            color: 'text-emerald-500' },
  { label: 'Bookmarks',     icon: Bookmark,      path: '/bookmarks',   action: null,            color: 'text-amber-500' },
] as const;

export function AppLauncherModal({ isOpen, onClose }: AppLauncherModalProps) {
  const navigate = useNavigate();
  const [activeApp, setActiveApp] = useState<'whisprr' | 'chimera' | null>(null);

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleQuickAction = (action: (typeof quickActions)[number]) => {
    if (action.action === 'compose') {
      onClose();
      // small delay so modal animates out before compose opens
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('open-compose'));
      }, 120);
      return;
    }
    if (action.path) {
      handleNavigate(action.path);
    }
  };

  const handleSwitchToApp = (app: 'whisprr' | 'chimera') => {
    setActiveApp(app);
    setTimeout(() => {
      if (app === 'chimera') {
        window.location.href = chimeraUrl;
      } else {
        handleNavigate('/feed');
      }
    }, 300);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[9998] bg-warm-950/60 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Hub Panel */}
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed z-[9999] inset-x-4 bottom-24 sm:bottom-auto sm:inset-x-auto sm:left-[calc(var(--sidebar-w)+1rem)] sm:top-1/2 sm:-translate-y-1/2 sm:w-[420px]"
          >
            <div className="bg-white/98 dark:bg-warm-925/98 backdrop-blur-2xl rounded-3xl border border-warm-200/60 dark:border-warm-800/70 shadow-2xl shadow-warm-950/20 dark:shadow-warm-950/60 overflow-hidden">

              {/* ── Header ───────────────────────────────── */}
              <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-warm-100/80 dark:border-warm-800/60">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary-500 to-indigo-500 flex-shrink-0" />
                  <span className="text-sm font-bold text-warm-900 dark:text-warm-50 tracking-tight">
                    WHISPRR Ecosystem
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-warm-400 hover:text-warm-700 dark:hover:text-warm-200 hover:bg-warm-100 dark:hover:bg-warm-800 transition-all"
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>

              {/* ── Apps ─────────────────────────────────── */}
              <div className="px-4 pt-4 pb-3 grid grid-cols-2 gap-3">
                {/* WHISPRR */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSwitchToApp('whisprr')}
                  className={`relative group flex flex-col gap-3 p-4 rounded-2xl border text-left transition-all duration-200 overflow-hidden ${
                    activeApp === 'whisprr'
                      ? 'bg-primary-500 border-primary-500 text-white'
                      : 'bg-primary-50/60 dark:bg-primary-950/30 border-primary-200/60 dark:border-primary-900/50 hover:bg-primary-100/60 dark:hover:bg-primary-950/50 hover:border-primary-300/60'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center shadow-md shadow-primary-500/30">
                    <Logo variant="icon-only" size={24} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-warm-900 dark:text-warm-50 group-hover:text-primary-700 dark:group-hover:text-primary-300 transition-colors leading-none">
                      WHISPRR
                    </div>
                    <div className="text-[11px] text-warm-500 dark:text-warm-400 mt-1 leading-tight">
                      Social Home
                    </div>
                  </div>
                  <ArrowUpRight
                    size={13}
                    className="absolute top-3.5 right-3.5 text-warm-300 dark:text-warm-600 group-hover:text-primary-500 transition-colors"
                  />
                </motion.button>

                {/* CHIMERA */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSwitchToApp('chimera')}
                  className={`relative group flex flex-col gap-3 p-4 rounded-2xl border text-left transition-all duration-200 overflow-hidden ${
                    activeApp === 'chimera'
                      ? 'bg-rose-500 border-rose-500 text-white'
                      : 'bg-gradient-to-br from-rose-50/60 to-orange-50/40 dark:from-rose-950/25 dark:to-orange-950/20 border-rose-200/50 dark:border-rose-900/40 hover:from-rose-100/60 hover:to-orange-100/40 dark:hover:from-rose-950/40 dark:hover:to-orange-950/30 hover:border-rose-300/50'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center shadow-md shadow-rose-500/25">
                    <ChimeraLogo size={18} className="text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-warm-900 dark:text-warm-50 group-hover:text-rose-600 dark:group-hover:text-rose-300 transition-colors leading-none">
                      CHIMERA
                    </div>
                    <div className="text-[11px] text-warm-500 dark:text-warm-400 mt-1 leading-tight">
                      Creative Platform
                    </div>
                  </div>
                  <ArrowUpRight
                    size={13}
                    className="absolute top-3.5 right-3.5 text-warm-300 dark:text-warm-600 group-hover:text-rose-500 transition-colors"
                  />
                </motion.button>
              </div>

              {/* ── Ecosystem note ───────────────────────── */}
              <p className="text-[11px] text-warm-400 dark:text-warm-500 text-center px-4 pb-3 leading-relaxed">
                One account · Two platforms · One ecosystem
              </p>

              {/* ── Divider ──────────────────────────────── */}
              <div className="mx-4 border-t border-warm-100/80 dark:border-warm-800/60" />

              {/* ── Quick Actions ─────────────────────────── */}
              <div className="px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-warm-400 dark:text-warm-500 mb-2.5 px-1">
                  Quick Actions
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {quickActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <motion.button
                        key={action.label}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleQuickAction(action)}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left hover:bg-warm-100/80 dark:hover:bg-warm-800/60 transition-all group"
                      >
                        <Icon
                          size={15}
                          className={`${action.color} flex-shrink-0`}
                        />
                        <span className="text-[13px] font-medium text-warm-700 dark:text-warm-300 group-hover:text-warm-900 dark:group-hover:text-warm-100 transition-colors">
                          {action.label}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* ── Bottom padding ──────────────────────── */}
              <div className="h-1" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
