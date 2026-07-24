import { useState, useEffect } from 'react';
import {
  Gem, Play, Crown, CheckCircle2, Sparkles, Plus, ArrowRight,
  Loader2, ShieldCheck, Flame, Image as ImageIcon, Volume2, Settings, Smartphone
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { ShardsHubModal } from '../components/common/ShardsHubModal';

export default function ShardsPage() {
  const { shardsBalance, earnShards, spendShards, adFreePassActive, activateAdFreePass } = useAuth();
  const { showToast } = useToast();

  const [showBuyModal, setShowBuyModal] = useState(false);
  const [isPlayingAd, setIsPlayingAd] = useState(false);
  const [adSecondsLeft, setAdSecondsLeft] = useState(5);
  const [adCount, setAdCount] = useState(0);

  // Rewarded Video Ad Timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isPlayingAd && adSecondsLeft > 0) {
      interval = setInterval(() => {
        setAdSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (isPlayingAd && adSecondsLeft === 0) {
      setIsPlayingAd(false);
      earnShards(5, 'Watched Rewarded Video Ad');
      setAdCount((prev) => Math.min(prev + 1, 5));
      showToast('🎉 Earned +5 Shards for watching rewarded ad!', 'success');
      setAdSecondsLeft(5);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlayingAd, adSecondsLeft, earnShards, showToast]);

  const handleRedeemNoAdsPass = () => {
    if (adFreePassActive) {
      showToast('VIP No-Ads Pass is already active!', 'info');
      return;
    }
    const success = activateAdFreePass();
    if (success) {
      showToast('✨ Activated No-Ads Pass for 30 Days!', 'success');
    } else {
      showToast('Insufficient Shards! You need 20 💎 Shards.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-warm-950 text-white font-sans py-8 px-4 sm:px-8 max-w-4xl mx-auto space-y-8 animate-fade-in relative overflow-hidden select-none">
      
      {/* Background Glow Spheres */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-purple-600/20 via-pink-600/10 to-amber-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />

      {/* ── COMING SOON BANNER NOTICE ── */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-amber-500/20 border border-amber-500/40 text-center space-y-1 relative z-10 shadow-lg animate-fade-in">
        <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-amber-400">
          <Sparkles size={16} className="animate-spin" />
          <span>✨ COMING SOON — SHARDS &amp; REWARDED ADS ECONOMY</span>
        </div>
        <p className="text-xs text-warm-300">
          All AI Character Chatting, Voice Line auditions, and Story Writing are currently 100% FREE for all creators &amp; roleplayers!
        </p>
      </div>

      {/* ── 1. Character.AI Top Hero Display (Floating 3D Crystal Cube) ── */}
      <div className="flex flex-col items-center justify-center text-center space-y-4 pt-4 relative z-10">
        
        {/* Animated 3D Shard Cube */}
        <div className="relative group cursor-pointer" onClick={() => setShowBuyModal(true)}>
          <div className="absolute inset-0 bg-purple-500/30 rounded-3xl blur-xl group-hover:blur-2xl transition-all animate-pulse" />
          
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-purple-700 via-pink-600 to-amber-400 p-0.5 shadow-2xl transform transition-transform group-hover:scale-105 animate-bounce-subtle">
            <div className="w-full h-full bg-warm-900/90 backdrop-blur-md rounded-[22px] flex items-center justify-center relative overflow-hidden">
              <Gem size={52} className="text-amber-300 fill-amber-400 drop-shadow-[0_0_15px_rgba(245,158,11,0.6)] animate-pulse" />
              <div className="absolute top-2 right-2 w-3 h-3 bg-amber-400 rounded-full animate-ping" />
            </div>
          </div>
        </div>

        {/* Large Balance Display */}
        <div className="flex items-center gap-2 font-serif text-4xl sm:text-5xl font-extrabold tracking-tight">
          <Gem size={38} className="text-amber-400 fill-amber-400" />
          <span>{shardsBalance}</span>
        </div>

        {/* Buy Shards Button */}
        <button
          onClick={() => setShowBuyModal(true)}
          className="px-6 py-2.5 rounded-full bg-white hover:bg-warm-100 text-warm-950 font-extrabold text-xs shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
        >
          <Plus size={14} strokeWidth={3} />
          <span>Buy Shards</span>
        </button>
      </div>

      {/* ── 2. Pass Card: "1 Hour / 30-Day No Ads" ── */}
      <div className="p-6 sm:p-8 rounded-3xl bg-warm-900/80 backdrop-blur-xl border border-white/10 shadow-2xl relative overflow-hidden space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          
          <div className="space-y-1">
            <div className="text-xl sm:text-2xl font-bold font-serif text-white flex items-center gap-2">
              <span>30-Day Pass</span>
              <span className="text-xs font-extrabold text-purple-400 bg-purple-500/20 border border-purple-500/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                No Ads
              </span>
            </div>
            <p className="text-xs text-warm-400 max-w-md leading-relaxed">
              Get an ad-free pass. Immerse yourself in uninterrupted conversations with your favorite AI characters.
            </p>
          </div>

          {/* Graphic Artwork Right */}
          <div className="hidden sm:flex items-center gap-1 p-3 bg-white/5 rounded-2xl border border-white/10 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center">
              <Gem size={18} className="text-amber-300 fill-amber-300" />
            </div>
            <div className="w-8 h-8 rounded-xl bg-pink-600 flex items-center justify-center">
              <Sparkles size={18} className="text-white" />
            </div>
            <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center">
              <Crown size={18} className="text-black" />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleRedeemNoAdsPass}
          disabled={adFreePassActive}
          className="w-full py-3.5 rounded-2xl bg-white hover:bg-warm-100 text-black font-extrabold text-xs shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {adFreePassActive ? (
            <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
              <CheckCircle2 size={16} /> VIP Pass Active (No Ads)
            </span>
          ) : (
            <span>Get pass for 💎 20</span>
          )}
        </button>
      </div>

      {/* ── 3. Other Ways to Use Shards ── */}
      <div className="p-6 sm:p-8 rounded-3xl bg-warm-900/80 backdrop-blur-xl border border-white/10 shadow-2xl relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        
        <div className="space-y-3">
          <h3 className="font-serif font-bold text-lg text-white">Other ways to use Shards</h3>
          <ul className="space-y-2 text-xs text-warm-300 font-medium">
            <li className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-purple-400" />
              <span>Boost through slowmode &amp; get fast GPU responses</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-purple-400" />
              <span>Generate custom AI Character Selfies &amp; Avatars</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-purple-400" />
              <span>Unlock premium voice lines &amp; modulation</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-purple-400" />
              <span>More coming soon...</span>
            </li>
          </ul>
        </div>

        {/* 3D Dice Artwork */}
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-purple-600 to-pink-600 p-0.5 shadow-xl shrink-0 self-center sm:self-auto">
          <div className="w-full h-full bg-warm-950/90 rounded-[22px] flex items-center justify-center">
            <Gem size={44} className="text-purple-300 fill-purple-400" />
          </div>
        </div>
      </div>

      {/* ── 4. Rewarded Video Ad Card ── */}
      <div className="p-6 sm:p-8 rounded-3xl bg-warm-900/80 backdrop-blur-xl border border-white/10 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Gem size={24} className="fill-blue-400" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">Watch your first ad, get 5 Shards</h4>
              <p className="text-xs text-warm-400">Earn +5 Shards per video view</p>
            </div>
          </div>

          <span className="text-xs font-extrabold text-warm-400">{adCount} of 5</span>
        </div>

        {/* Progress Tracker */}
        <div className="w-full h-2 bg-warm-800 rounded-full overflow-hidden flex gap-1 p-0.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`flex-1 h-full rounded-full transition-colors ${
                i <= adCount ? 'bg-blue-500' : 'bg-warm-800'
              }`}
            />
          ))}
        </div>

        {/* Ad Action Button */}
        {isPlayingAd ? (
          <div className="p-3.5 rounded-2xl bg-black/60 border border-blue-500/40 text-center space-y-1 animate-pulse">
            <span className="text-xs font-bold text-blue-400 flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin" /> Playing Ad... ({adSecondsLeft}s left)
            </span>
          </div>
        ) : (
          <button
            onClick={() => setIsPlayingAd(true)}
            className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/10 transition-all flex items-center justify-center gap-2"
          >
            <Play size={15} className="fill-white" />
            <span>Watch Video Ad (+5 💎)</span>
          </button>
        )}
      </div>

      {/* ── 5. Starter Quests Banner ── */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-purple-900 via-pink-900 to-warm-900 border border-purple-500/30 shadow-2xl space-y-4">
        <div className="space-y-1">
          <div className="text-xs font-extrabold uppercase tracking-widest text-pink-400">Starter Pack</div>
          <h3 className="font-serif text-2xl font-bold text-white">CHIMERA Quests</h3>
          <p className="text-xs text-purple-200">These quests are for your first time on CHIMERA. Complete them all to stock up on Shards!</p>
        </div>

        <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300 font-bold">
              x5
            </div>
            <div>
              <h4 className="font-bold text-xs text-white">Create your first AI Character</h4>
              <p className="text-[11px] text-warm-400">Publish a character to the community</p>
            </div>
          </div>

          <button
            onClick={() => showToast('🎉 Quest Completed! Claimed +5 Shards!', 'success')}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all whitespace-nowrap"
          >
            Claim +5 💎
          </button>
        </div>
      </div>

      {/* Buy Shards Modal */}
      <ShardsHubModal isOpen={showBuyModal} onClose={() => setShowBuyModal(false)} />
    </div>
  );
}
