import { useState, useEffect } from 'react';
import {
  X, Gem, Plus, Sparkles, CheckCircle2, Play, ShieldCheck,
  Gift, Zap, Image as ImageIcon, Volume2, ArrowRight, Loader2, Crown, DollarSign
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

interface ShardsHubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShardsHubModal({ isOpen, onClose }: ShardsHubModalProps) {
  const { shardsBalance, earnShards, spendShards, adFreePassActive, activateAdFreePass } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'buy' | 'earn' | 'vip'>('buy');
  
  // Rewarded Video Ad Player State
  const [isPlayingAd, setIsPlayingAd] = useState(false);
  const [adSecondsLeft, setAdSecondsLeft] = useState(5);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isPlayingAd && adSecondsLeft > 0) {
      interval = setInterval(() => {
        setAdSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (isPlayingAd && adSecondsLeft === 0) {
      setIsPlayingAd(false);
      earnShards(5, 'Watched Rewarded Video Ad');
      showToast('🎁 Earned +5 Shards for watching rewarded ad!', 'success');
      setAdSecondsLeft(5);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlayingAd, adSecondsLeft, earnShards, showToast]);

  if (!isOpen) return null;

  const handleBuyPackage = (amount: number, price: string, name: string) => {
    earnShards(amount, `Purchased ${name}`);
    showToast(`🎉 Successfully acquired ${amount} Shards (${name} - ${price})!`, 'success');
  };

  const handleRedeemAdFreePass = () => {
    if (adFreePassActive) {
      showToast('VIP Ad-Free Pass is already active!', 'info');
      return;
    }
    const success = activateAdFreePass();
    if (success) {
      showToast('✨ VIP Ad-Free Pass activated for 30 days!', 'success');
    } else {
      showToast('Insufficient Shards balance! Need 20 Shards.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 font-sans animate-fade-in">
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
            <Gem size={32} className="text-amber-300 animate-pulse" />
          </div>

          <h2 className="font-serif text-2xl font-bold">CHIMERA Shards Hub &amp; VIP</h2>
          <p className="text-xs text-purple-100 mt-1">Unlock premium AI magic, character selfies, and VIP ad-free creation</p>

          {/* Balance Pill */}
          <div className="mt-4 inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/20 backdrop-blur-md ring-1 ring-white/30 text-sm font-bold shadow-inner">
            <Gem size={18} className="text-amber-300 fill-amber-300" />
            <span>Balance: {shardsBalance} 💎 Shards</span>
            {adFreePassActive && (
              <span className="ml-2 text-[10px] bg-amber-400 text-black px-2.5 py-0.5 rounded-full uppercase tracking-wider font-extrabold flex items-center gap-1">
                <Crown size={12} /> VIP Active
              </span>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-warm-200 dark:border-warm-800 bg-warm-50 dark:bg-warm-950 text-xs font-bold">
          <button
            onClick={() => setActiveTab('buy')}
            className={`flex-1 py-3 text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'buy'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400 bg-white dark:bg-warm-900'
                : 'border-transparent text-warm-500 hover:text-warm-900 dark:hover:text-warm-200'
            }`}
          >
            <DollarSign size={14} /> Buy Shards
          </button>
          <button
            onClick={() => setActiveTab('earn')}
            className={`flex-1 py-3 text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'earn'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400 bg-white dark:bg-warm-900'
                : 'border-transparent text-warm-500 hover:text-warm-900 dark:hover:text-warm-200'
            }`}
          >
            <Gift size={14} /> Free Rewards
          </button>
          <button
            onClick={() => setActiveTab('vip')}
            className={`flex-1 py-3 text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'vip'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400 bg-white dark:bg-warm-900'
                : 'border-transparent text-warm-500 hover:text-warm-900 dark:hover:text-warm-200'
            }`}
          >
            <Crown size={14} className="text-amber-500" /> VIP Subscription
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          
          {/* TAB 1: BUY SHARDS */}
          {activeTab === 'buy' && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <h3 className="font-serif font-bold text-lg text-warm-900 dark:text-white">Choose a Shards Package</h3>
                <p className="text-xs text-warm-500">Refill your balance instantly to generate selfies, voice lines, and tip creators.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { amount: 50, price: '$0.99', name: 'Starter Pouch 💎', tag: 'Great Value' },
                  { amount: 250, price: '$4.99', name: 'Popular Chest 💎', tag: 'Most Popular', highlight: true },
                  { amount: 700, price: '$9.99', name: 'Pro Creator Vault 💎', tag: 'Best Value' },
                  { amount: 1500, price: '$19.99', name: 'Ultimate Sovereign 💎', tag: 'Mega Bonus' },
                ].map((pack) => (
                  <div
                    key={pack.amount}
                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between gap-3 relative ${
                      pack.highlight
                        ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/30 shadow-md'
                        : 'border-warm-200 dark:border-warm-800 bg-warm-50/50 dark:bg-warm-850 hover:border-purple-400'
                    }`}
                  >
                    {pack.tag && (
                      <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-purple-600 text-white shadow-sm">
                        {pack.tag}
                      </span>
                    )}

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Gem size={20} className="text-amber-500 fill-amber-500" />
                        <span className="font-serif font-bold text-xl text-warm-900 dark:text-white">{pack.amount}</span>
                        <span className="text-xs text-warm-500">Shards</span>
                      </div>
                      <p className="text-xs font-bold text-warm-700 dark:text-warm-300">{pack.name}</p>
                    </div>

                    <button
                      onClick={() => handleBuyPackage(pack.amount, pack.price, pack.name)}
                      className="w-full py-2 bg-warm-900 dark:bg-warm-800 hover:bg-purple-600 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1"
                    >
                      <span>Buy for {pack.price}</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: EARN FREE SHARDS & REWARDED ADS */}
          {activeTab === 'earn' && (
            <div className="space-y-5">
              <div className="text-center space-y-1">
                <h3 className="font-serif font-bold text-lg text-warm-900 dark:text-white">Earn Free Shards</h3>
                <p className="text-xs text-warm-500">Watch short ads or complete daily challenges to earn free Shards.</p>
              </div>

              {/* Rewarded Video Ad Card */}
              <div className="p-5 rounded-2xl border-2 border-red-500/30 bg-gradient-to-r from-red-950/20 via-warm-900 to-warm-900 text-white space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-red-600/20 text-red-400 border border-red-500/30">
                      <Play size={24} className="fill-red-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">Watch 5-Sec Rewarded Video Ad</h4>
                      <p className="text-xs text-warm-400">Earn +5 Shards per video view</p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    +5 💎
                  </span>
                </div>

                {isPlayingAd ? (
                  <div className="p-4 rounded-xl bg-black/60 border border-red-500/40 text-center space-y-2 animate-pulse">
                    <div className="flex items-center justify-center gap-2 text-red-400 font-bold text-xs">
                      <Loader2 size={16} className="animate-spin" />
                      <span>Playing Rewarded Ad... ({adSecondsLeft}s left)</span>
                    </div>
                    <div className="w-full h-2 bg-warm-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-600 transition-all duration-1000"
                        style={{ width: `${((5 - adSecondsLeft) / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsPlayingAd(true)}
                    className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <Play size={16} className="fill-white" />
                    <span>Watch Rewarded Ad (+5 💎)</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: VIP SUBSCRIPTION */}
          {activeTab === 'vip' && (
            <div className="space-y-5">
              <div className="text-center space-y-1">
                <h3 className="font-serif font-bold text-lg text-warm-900 dark:text-white flex items-center justify-center gap-2">
                  <Crown size={22} className="text-amber-500" />
                  <span>CHIMERA VIP Pass</span>
                </h3>
                <p className="text-xs text-warm-500">100% Ad-free experience with unlimited roleplay &amp; writing energy.</p>
              </div>

              <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-purple-500/10 to-warm-900 border border-amber-500/30 space-y-4">
                <ul className="space-y-2 text-xs font-semibold text-warm-800 dark:text-warm-200">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    <span>100% Ad-Free across Web &amp; Mobile</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    <span>Unlimited Writer's Energy in Storytelling Mode</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    <span>Daily +20 Shards VIP allowance</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    <span>Priority GPU response speed for AI characters</span>
                  </li>
                </ul>

                <button
                  onClick={handleRedeemAdFreePass}
                  disabled={adFreePassActive}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Crown size={16} />
                  <span>{adFreePassActive ? 'VIP Pass Active ✨' : 'Activate 30-Day VIP Pass (20 💎 Shards or $9.99)'}</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
