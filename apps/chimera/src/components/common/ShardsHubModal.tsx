import { useState, useEffect } from 'react';
import {
  X, Gem, Plus, Sparkles, CheckCircle2, Play, ShieldCheck,
  Gift, Zap, Image as ImageIcon, Volume2, ArrowRight, Loader2
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

  const [activeTab, setActiveTab] = useState<'buy' | 'earn' | 'spend'>('buy');
  
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
      showToast('🎁 Earned +5 Shards for watching ad!', 'success');
      setAdSecondsLeft(5);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlayingAd, adSecondsLeft, earnShards, showToast]);

  if (!isOpen) return null;

  const handleBuyPackage = (amount: number, price: string, name: string) => {
    earnShards(amount, `Purchased ${name}`);
    showToast(`🎉 Successfully acquired ${amount} Shards (${name})!`, 'success');
  };

  const handleRedeemAdFreePass = () => {
    if (adFreePassActive) {
      showToast('Ad-Free Pass is already active!', 'info');
      return;
    }
    const success = activateAdFreePass();
    if (success) {
      showToast('✨ Ad-Free Pass activated for 30 days!', 'success');
    } else {
      showToast('Insufficient Shards balance! Need 20 Shards.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-md flex items-center justify-center p-4 transition-opacity animate-fade-in">
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
          <h2 className="font-serif text-2xl font-bold">CHIMERA Shards Hub</h2>
          <p className="text-xs text-purple-100 mt-1">Unlock premium AI magic, selfies, and ad-free energy</p>

          {/* Balance Pill */}
          <div className="mt-4 inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/20 backdrop-blur-md ring-1 ring-white/30 text-sm font-bold shadow-inner">
            <Gem size={18} className="text-amber-300" />
            <span>Balance: {shardsBalance} Shards</span>
            {adFreePassActive && (
              <span className="ml-2 text-[10px] bg-amber-400 text-black px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold">
                Ad-Free Pass
              </span>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-warm-200 dark:border-warm-800 bg-warm-50 dark:bg-warm-950 text-xs font-bold">
          <button
            onClick={() => setActiveTab('buy')}
            className={`flex-1 py-3 text-center border-b-2 transition-colors ${
              activeTab === 'buy'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400 bg-white dark:bg-warm-900'
                : 'border-transparent text-warm-500 hover:text-warm-900 dark:hover:text-warm-200'
            }`}
          >
            🛒 Buy Shards
          </button>
          <button
            onClick={() => setActiveTab('earn')}
            className={`flex-1 py-3 text-center border-b-2 transition-colors ${
              activeTab === 'earn'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400 bg-white dark:bg-warm-900'
                : 'border-transparent text-warm-500 hover:text-warm-900 dark:hover:text-warm-200'
            }`}
          >
            📺 Watch Ads & Earn
          </button>
          <button
            onClick={() => setActiveTab('spend')}
            className={`flex-1 py-3 text-center border-b-2 transition-colors ${
              activeTab === 'spend'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400 bg-white dark:bg-warm-900'
                : 'border-transparent text-warm-500 hover:text-warm-900 dark:hover:text-warm-200'
            }`}
          >
            📜 How to Spend
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
          
          {/* TAB 1: BUY PACKAGES */}
          {activeTab === 'buy' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                
                {/* Package 1 */}
                <div className="p-4 rounded-2xl border border-warm-200 dark:border-warm-800 bg-warm-50 dark:bg-warm-950 text-center space-y-2 flex flex-col justify-between hover:border-purple-500 transition-all">
                  <div>
                    <div className="text-amber-500 font-bold text-xs uppercase tracking-wider mb-1">Starter Pouch</div>
                    <div className="font-serif font-extrabold text-2xl text-warm-900 dark:text-warm-50 flex items-center justify-center gap-1">
                      <Gem size={20} className="text-purple-500" />
                      50 💎
                    </div>
                  </div>
                  <button
                    onClick={() => handleBuyPackage(50, '$0.99', 'Starter Pouch')}
                    className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors"
                  >
                    $0.99
                  </button>
                </div>

                {/* Package 2 */}
                <div className="p-4 rounded-2xl border-2 border-purple-500 bg-purple-500/5 text-center space-y-2 flex flex-col justify-between relative overflow-hidden shadow-sm">
                  <span className="absolute top-0 right-0 bg-purple-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-bl-lg uppercase">
                    Popular
                  </span>
                  <div>
                    <div className="text-purple-600 dark:text-purple-400 font-bold text-xs uppercase tracking-wider mb-1">Adventurer Vault</div>
                    <div className="font-serif font-extrabold text-2xl text-warm-900 dark:text-warm-50 flex items-center justify-center gap-1">
                      <Gem size={20} className="text-purple-500" />
                      250 💎
                    </div>
                  </div>
                  <button
                    onClick={() => handleBuyPackage(250, '$4.99', 'Adventurer Vault')}
                    className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors"
                  >
                    $4.99
                  </button>
                </div>

                {/* Package 3 */}
                <div className="p-4 rounded-2xl border border-warm-200 dark:border-warm-800 bg-warm-50 dark:bg-warm-950 text-center space-y-2 flex flex-col justify-between hover:border-purple-500 transition-all">
                  <div>
                    <div className="text-amber-500 font-bold text-xs uppercase tracking-wider mb-1">Mastermind Chest</div>
                    <div className="font-serif font-extrabold text-2xl text-warm-900 dark:text-warm-50 flex items-center justify-center gap-1">
                      <Gem size={20} className="text-purple-500" />
                      700 💎
                    </div>
                    <span className="text-[10px] text-green-600 font-bold">+100 Bonus</span>
                  </div>
                  <button
                    onClick={() => handleBuyPackage(700, '$9.99', 'Mastermind Chest')}
                    className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors"
                  >
                    $9.99
                  </button>
                </div>

              </div>

              {/* Ad Free Pass Redeem Card */}
              <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-red-500/10 border border-amber-500/20 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-warm-900 dark:text-warm-100 flex items-center gap-1.5">
                    <ShieldCheck size={16} className="text-amber-500" />
                    30-Day Ad-Free Pass
                  </h4>
                  <p className="text-xs text-warm-500">Skip all writing energy ad prompts in Writer's Desk & Stories!</p>
                </div>
                <button
                  onClick={handleRedeemAdFreePass}
                  disabled={adFreePassActive}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    adFreePassActive
                      ? 'bg-warm-300 dark:bg-warm-800 text-warm-500'
                      : 'bg-amber-500 hover:bg-amber-600 text-white shadow-md'
                  }`}
                >
                  {adFreePassActive ? 'Active' : 'Redeem (20 💎)'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: WATCH ADS & EARN */}
          {activeTab === 'earn' && (
            <div className="space-y-4">
              
              {/* Rewarded Video Ad Trigger Card */}
              <div className="p-5 rounded-2xl bg-purple-600 text-white flex items-center justify-between shadow-lg relative overflow-hidden">
                <div className="space-y-1 max-w-[70%]">
                  <span className="text-[10px] uppercase font-extrabold tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                    Sponsored Reward
                  </span>
                  <h3 className="font-serif font-bold text-base">Watch Short Video Ad</h3>
                  <p className="text-xs text-purple-100">Watch a 5-second sponsor video to earn +5 free Shards 💎 instantly!</p>
                </div>
                <button
                  onClick={() => {
                    setIsPlayingAd(true);
                    setAdSecondsLeft(5);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-white text-purple-700 hover:bg-purple-50 font-bold text-xs flex items-center gap-1.5 shadow-md transition-transform active:scale-95"
                >
                  <Play size={16} className="fill-purple-700" />
                  <span>Watch (+5 💎)</span>
                </button>
              </div>

              {/* Other Ways to Earn */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-warm-400">Other Ways to Earn</h4>
                <div className="p-3 rounded-xl border border-warm-200 dark:border-warm-800 bg-warm-50 dark:bg-warm-950 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 font-medium text-warm-800 dark:text-warm-200">
                    <Gift size={16} className="text-amber-500" />
                    Daily Login Streak
                  </span>
                  <span className="font-bold text-amber-500">+5 💎 / day</span>
                </div>

                <div className="p-3 rounded-xl border border-warm-200 dark:border-warm-800 bg-warm-50 dark:bg-warm-950 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 font-medium text-warm-800 dark:text-warm-200">
                    <Sparkles size={16} className="text-purple-500" />
                    Publish Popular AI Character
                  </span>
                  <span className="font-bold text-purple-500">+1 💎 per 50 chats</span>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: HOW TO SPEND */}
          {activeTab === 'spend' && (
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl border border-warm-200 dark:border-warm-800 bg-warm-50 dark:bg-warm-950 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <ImageIcon size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-warm-900 dark:text-warm-100">Character Selfies & AI Images</h4>
                    <p className="text-warm-500 text-[11px]">Request real-time photos in chat</p>
                  </div>
                </div>
                <span className="font-extrabold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full">
                  2 💎
                </span>
              </div>

              <div className="p-3.5 rounded-2xl border border-warm-200 dark:border-warm-800 bg-warm-50 dark:bg-warm-950 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <Zap size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-warm-900 dark:text-warm-100">AI Priority Speed Boost</h4>
                    <p className="text-warm-500 text-[11px]">Bypass slowmode for instant replies</p>
                  </div>
                </div>
                <span className="font-extrabold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full">
                  1 💎
                </span>
              </div>

              <div className="p-3.5 rounded-2xl border border-warm-200 dark:border-warm-800 bg-warm-50 dark:bg-warm-950 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    <Volume2 size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-warm-900 dark:text-warm-100">HD Voice & Emotional TTS</h4>
                    <p className="text-warm-500 text-[11px]">Synthesize expressive voice lines</p>
                  </div>
                </div>
                <span className="font-extrabold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full">
                  1 💎
                </span>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* REWARDED VIDEO AD OVERLAY */}
      {isPlayingAd && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-6 text-white animate-fade-in">
          <div className="w-full max-w-md bg-warm-900 rounded-3xl p-6 border border-purple-500/40 text-center space-y-4 shadow-2xl relative">
            <div className="text-xs uppercase tracking-widest font-extrabold text-purple-400 flex items-center justify-center gap-1.5">
              <Play size={14} className="fill-purple-400" />
              <span>CHIMERA Sponsored Ad</span>
            </div>

            <div className="w-20 h-20 rounded-full bg-purple-600/20 border-4 border-purple-500 flex items-center justify-center mx-auto animate-pulse">
              <span className="font-serif font-extrabold text-3xl text-purple-300">{adSecondsLeft}s</span>
            </div>

            <p className="text-sm text-warm-200 font-serif italic">
              "Experience limitless stories and living AI characters on CHIMERA Nexus..."
            </p>

            <div className="w-full bg-warm-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-purple-500 h-full transition-all duration-1000"
                style={{ width: `${((5 - adSecondsLeft) / 5) * 100}%` }}
              />
            </div>
            
            <p className="text-[11px] text-warm-400">
              Reward (+5 Shards 💎) will be credited automatically when video ends.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
