import { useState } from 'react';
import {
  X, Gem, Sparkles, ShieldCheck,
  Gift, Zap, Image as ImageIcon, Volume2, Clock, CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

interface ShardsHubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShardsHubModal({ isOpen, onClose }: ShardsHubModalProps) {
  const { shardsBalance } = useAuth();
  const { showToast } = useToast();

  if (!isOpen) return null;

  const handleComingSoonClick = (featureName: string) => {
    showToast(`💎 ${featureName} is Coming Soon! All Roleplay and Story features are currently 100% FREE.`, 'info');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-md flex items-center justify-center p-4 transition-opacity animate-fade-in font-sans">
      <div className="w-full max-w-xl bg-white dark:bg-warm-900 rounded-3xl shadow-2xl border border-warm-200 dark:border-warm-800 overflow-hidden relative animate-scale-in">
        
        {/* Top Decorative Banner */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 p-6 text-white text-center relative overflow-hidden">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
          >
            <X size={20} />
          </button>

          <div className="inline-flex p-3 rounded-2xl bg-white/10 backdrop-blur-md mb-2 ring-1 ring-white/20">
            <Gem size={32} className="text-purple-200 animate-pulse" />
          </div>

          <div className="inline-block px-3 py-1 bg-amber-400 text-black font-extrabold text-[10px] rounded-full uppercase tracking-wider mb-2 shadow-sm">
            ✨ COMING SOON
          </div>

          <h2 className="font-serif text-2xl font-bold">CHIMERA Shards & Ads Economy</h2>
          <p className="text-xs text-purple-100 mt-1 max-w-md mx-auto">
            The CHIMERA Shards currency and Rewarded Ads system are currently in development.
          </p>

          {/* Balance Pill */}
          <div className="mt-4 inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/20 backdrop-blur-md ring-1 ring-white/30 text-sm font-bold shadow-inner">
            <Gem size={18} className="text-amber-300" />
            <span>Balance: {shardsBalance} Shards (Unlimited Free Access)</span>
          </div>
        </div>

        {/* Coming Soon Notice Card */}
        <div className="p-6 space-y-6">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center mx-auto shadow-inner">
              <Clock size={24} />
            </div>
            <h3 className="font-serif text-lg font-bold text-warm-900 dark:text-white">
              Shards & Rewarded Ads — Coming Soon!
            </h3>
            <p className="text-xs text-warm-600 dark:text-warm-300 max-w-md mx-auto leading-relaxed">
              We are preparing an exciting economy system with rewarded video ads, daily shard bonuses, and ad-free passes.
              <strong className="block text-purple-600 dark:text-purple-400 mt-1">
                In the meantime, all Roleplay, Storytelling, and Character Creation features remain 100% FREE with unlimited access!
              </strong>
            </p>
          </div>

          {/* Feature Roadmap Teaser Grid */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-bold text-warm-400 tracking-wider">
              Upcoming Economy Features
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div
                onClick={() => handleComingSoonClick('Shards Bundles')}
                className="p-4 rounded-2xl border border-warm-200 dark:border-warm-800 bg-warm-50/50 dark:bg-warm-850 hover:border-purple-500/50 transition-all cursor-pointer text-center space-y-2 group"
              >
                <Gem size={22} className="text-purple-500 mx-auto group-hover:scale-110 transition-transform" />
                <h5 className="font-bold text-xs text-warm-900 dark:text-white">Shards Bundles</h5>
                <span className="text-[10px] text-amber-500 font-extrabold block">Coming Soon</span>
              </div>

              <div
                onClick={() => handleComingSoonClick('Rewarded Video Ads')}
                className="p-4 rounded-2xl border border-warm-200 dark:border-warm-800 bg-warm-50/50 dark:bg-warm-850 hover:border-purple-500/50 transition-all cursor-pointer text-center space-y-2 group"
              >
                <Gift size={22} className="text-red-500 mx-auto group-hover:scale-110 transition-transform" />
                <h5 className="font-bold text-xs text-warm-900 dark:text-white">Rewarded Ads</h5>
                <span className="text-[10px] text-amber-500 font-extrabold block">Coming Soon</span>
              </div>

              <div
                onClick={() => handleComingSoonClick('30-Day Ad-Free Pass')}
                className="p-4 rounded-2xl border border-warm-200 dark:border-warm-800 bg-warm-50/50 dark:bg-warm-850 hover:border-purple-500/50 transition-all cursor-pointer text-center space-y-2 group"
              >
                <ShieldCheck size={22} className="text-emerald-500 mx-auto group-hover:scale-110 transition-transform" />
                <h5 className="font-bold text-xs text-warm-900 dark:text-white">Ad-Free Pass</h5>
                <span className="text-[10px] text-amber-500 font-extrabold block">Coming Soon</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all"
          >
            Continue Enjoying Free Creation ✨
          </button>
        </div>
      </div>
    </div>
  );
}
