import { useState } from 'react';
import { X, Gem, Gift, Sparkles, CheckCircle2, Flame } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

interface DailyBonusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DailyBonusModal({ isOpen, onClose }: DailyBonusModalProps) {
  const { earnShards } = useAuth();
  const { showToast } = useToast();

  const [claimedDays, setClaimedDays] = useState<number[]>([1, 2]);
  const [currentDay, setCurrentDay] = useState<number>(3);
  const [isClaiming, setIsClaiming] = useState(false);

  if (!isOpen) return null;

  const streakRewards = [
    { day: 1, amount: 5 },
    { day: 2, amount: 10 },
    { day: 3, amount: 15, current: true },
    { day: 4, amount: 20 },
    { day: 5, amount: 25 },
    { day: 6, amount: 35 },
    { day: 7, amount: 50, mega: true },
  ];

  const handleClaimReward = () => {
    if (claimedDays.includes(currentDay)) {
      showToast('Daily bonus already claimed for today!', 'info');
      return;
    }

    setIsClaiming(true);
    setTimeout(() => {
      const reward = streakRewards.find(r => r.day === currentDay);
      if (reward) {
        earnShards(reward.amount, `Daily Login Bonus (Day ${currentDay})`);
        setClaimedDays([...claimedDays, currentDay]);
        showToast(`🎁 Claimed Day ${currentDay} Daily Bonus (+${reward.amount} 💎 Shards)!`, 'success');
      }
      setIsClaiming(false);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-md flex items-center justify-center p-4 font-sans animate-fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-warm-900 rounded-3xl shadow-2xl border border-warm-200 dark:border-warm-800 overflow-hidden relative animate-scale-in">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 p-6 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
          >
            <X size={18} />
          </button>

          <div className="inline-flex p-3 rounded-2xl bg-white/20 backdrop-blur-md mb-2">
            <Flame size={32} className="text-yellow-300 animate-bounce" />
          </div>

          <h3 className="font-serif text-2xl font-bold">Daily Shards Reward Streak</h3>
          <p className="text-xs text-amber-100 mt-1">Log in daily to claim free Shards and unlock the Day 7 Mega Vault!</p>
        </div>

        {/* 7-Day Grid */}
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-7">
            {streakRewards.map((r) => {
              const isClaimed = claimedDays.includes(r.day);
              const isCurrent = r.day === currentDay && !isClaimed;

              return (
                <div
                  key={r.day}
                  className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-between gap-1.5 ${
                    isClaimed
                      ? 'bg-warm-100 dark:bg-warm-800 border-warm-200 dark:border-warm-750 opacity-60'
                      : isCurrent
                        ? 'bg-amber-500/15 border-amber-500 ring-2 ring-amber-500/50 scale-105 shadow-md'
                        : 'bg-warm-50 dark:bg-warm-850 border-warm-200 dark:border-warm-800'
                  }`}
                >
                  <span className="text-[10px] font-extrabold uppercase text-warm-500">Day {r.day}</span>
                  
                  {isClaimed ? (
                    <CheckCircle2 size={20} className="text-emerald-500" />
                  ) : (
                    <Gem size={20} className={r.mega ? 'text-amber-400 fill-amber-400 animate-pulse' : 'text-amber-500'} />
                  )}

                  <span className="text-xs font-bold text-warm-900 dark:text-white">+{r.amount} 💎</span>
                </div>
              );
            })}
          </div>

          {/* Action Button */}
          <button
            onClick={handleClaimReward}
            disabled={isClaiming || claimedDays.includes(currentDay)}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-extrabold text-xs shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Sparkles size={16} />
            <span>
              {claimedDays.includes(currentDay)
                ? 'Today\'s Reward Claimed ✨ (Come back tomorrow!)'
                : `Claim Day ${currentDay} Reward (+15 💎 Shards)`}
            </span>
          </button>

        </div>
      </div>
    </div>
  );
}
