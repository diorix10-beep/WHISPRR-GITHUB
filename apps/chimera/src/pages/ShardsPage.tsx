import { useState, useEffect } from 'react';
import {
  Sparkles, Crown, Play, CheckCircle2, Plus, ArrowRight,
  Loader2, ShieldCheck, Flame, Image as ImageIcon, Volume2, Zap,
  Gift, TrendingUp, Wallet, DollarSign, Award, Check, ExternalLink,
  ChevronRight, Heart, Star, Lock, Share2, Search, Copy, UserPlus,
  Compass, RefreshCw, BarChart2, Coins, ArrowUpRight, CheckCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { ShardsHubModal } from '../components/common/ShardsHubModal';
import { ShareModal } from '../components/common/ShareModal';
import { ShardCrystalImage } from '../components/common/ShardCrystalImage';
import { GiftShardsModal } from '../components/common/GiftShardsModal';

interface ReferralRecord {
  id: string;
  username: string;
  date: string;
  reward: number;
}

interface CreatorMilestone {
  id: string;
  title: string;
  desc: string;
  reward: number;
  icon: any;
  completed: boolean;
}

export default function ShardsPage() {
  const { profile, shardsBalance, earnShards, spendShards, adFreePassActive, activateAdFreePass } = useAuth();
  const { showToast } = useToast();

  const [showBuyModal, setShowBuyModal] = useState(false);
  const [isPlayingAd, setIsPlayingAd] = useState(false);
  const [adSecondsLeft, setAdSecondsLeft] = useState(5);
  const [adCount, setAdCount] = useState(0);
  const [dailyClaimed, setDailyClaimed] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Referral State
  const [referralCodeInput, setReferralCodeInput] = useState('');
  const [referralsCount, setReferralsCount] = useState(3);
  const [referralHistory, setReferralHistory] = useState<ReferralRecord[]>([
    { id: '1', username: 'Asha_Roleplayer', date: '2026-08-01', reward: 50 },
    { id: '2', username: 'Kael_Worldbuilder', date: '2026-08-03', reward: 50 },
    { id: '3', username: 'Elena_Author', date: '2026-08-05', reward: 50 },
  ]);

  // Creator Milestones
  const [milestones, setMilestones] = useState<CreatorMilestone[]>([
    { id: 'char', title: 'First Character Published', desc: 'Craft & publish an AI identity in the Multiverse.', reward: 50, icon: Flame, completed: true },
    { id: 'story', title: 'First Story Created', desc: 'Write your first chapter on the Writer\'s Desk.', reward: 100, icon: Sparkles, completed: true },
    { id: 'world', title: 'First World Built', desc: 'Establish an explorable lore universe & magic system.', reward: 150, icon: Compass, completed: false },
    { id: 'lore', title: 'First Lorebook Completed', desc: 'Link deep faction & location entries to a world.', reward: 100, icon: Award, completed: false },
    { id: 'community', title: 'Community Milestone (1k Interactions)', desc: 'Reach 1,000 roleplay chats on your characters.', reward: 500, icon: TrendingUp, completed: false },
  ]);

  // Creator Yield / Revenue State
  const [creatorYieldBalance, setCreatorYieldBalance] = useState(750);

  const personalReferralCode = profile ? `CHIMERA-${profile.username?.toUpperCase() || 'PIONEER'}-2026` : 'CHIMERA-PIONEER-2026';

  // Rewarded Video Ad Timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isPlayingAd && adSecondsLeft > 0) {
      interval = setInterval(() => {
        setAdSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (isPlayingAd && adSecondsLeft === 0) {
      setIsPlayingAd(false);
      earnShards(15, 'Watched Rewarded Video Ad');
      setAdCount((prev) => Math.min(prev + 1, 5));
      showToast('🎉 Earned +15 SHARDS for watching video ad!', 'success');
      setAdSecondsLeft(5);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlayingAd, adSecondsLeft, earnShards, showToast]);

  const handleClaimDaily = () => {
    if (dailyClaimed) {
      showToast('Daily reserve spark already claimed for today!', 'info');
      return;
    }
    earnShards(75, 'Daily Vault Reserve');
    setDailyClaimed(true);
    showToast('✨ Daily Reserve Claimed: +75 SHARDS added to your Vault!', 'success');
  };

  const handleCopyReferralCode = () => {
    navigator.clipboard.writeText(personalReferralCode);
    showToast('📋 Referral code copied to clipboard!', 'success');
  };

  const handleClaimReferralCode = () => {
    if (!referralCodeInput.trim()) {
      showToast('Please enter a referral code!', 'error');
      return;
    }
    if (referralCodeInput.trim().toUpperCase() === personalReferralCode) {
      showToast('You cannot use your own referral code!', 'error');
      return;
    }
    earnShards(50, 'Referral Code Claimed');
    setReferralCodeInput('');
    showToast('🎉 Referral code redeemed! +50 SHARDS added!', 'success');
  };

  const handleClaimMilestone = (mId: string) => {
    setMilestones(prev => prev.map(m => {
      if (m.id === mId && !m.completed) {
        earnShards(m.reward, `Creator Milestone: ${m.title}`);
        showToast(`🏆 Milestone Unlocked! +${m.reward} SHARDS!`, 'success');
        return { ...m, completed: true };
      }
      return m;
    }));
  };

  return (
    <div className="min-h-screen bg-[#080C14] text-white font-sans selection:bg-cyan-500 selection:text-black pb-28 relative overflow-hidden">
      
      {/* Ambient Sapphire Lighting & Floating Crystal Orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-blue-600/15 via-cyan-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[700px] right-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[1400px] left-0 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 relative z-10 pt-6">

        {/* ── 1. HEADER & SHARD RESERVE ── */}
        <section className="p-6 sm:p-10 rounded-3xl bg-warm-900/80 backdrop-blur-xl border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.15)] relative overflow-hidden space-y-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            
            {/* Title & Status */}
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 text-xs font-bold uppercase tracking-wider shadow-inner">
                <Sparkles size={14} className="animate-spin" />
                <span>CHIMERA Creative Vault</span>
              </div>

              <h1 className="font-serif text-3xl sm:text-5xl font-bold text-white tracking-tight flex items-center gap-3">
                <span>💎 SHARDS RESERVE</span>
              </h1>
              <p className="text-xs sm:text-sm text-warm-300 max-w-xl leading-relaxed">
                SHARDS represent the raw magical spark powering roleplay, novel writing, worldbuilding, and AI generation across the CHIMERA ecosystem.
              </p>
            </div>

            {/* Current Balance Display */}
            <div className="flex items-center gap-5 p-4 rounded-2xl bg-black/40 border border-cyan-500/30 shadow-inner shrink-0">
              <ShardCrystalImage size={56} />
              <div>
                <div className="text-xs uppercase font-extrabold text-cyan-400 tracking-wider">Available Spark</div>
                <div className="text-3xl sm:text-4xl font-serif font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-blue-300 drop-shadow-[0_0_12px_rgba(6,182,212,0.6)]">
                  {shardsBalance.toLocaleString()}
                </div>
                <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
                  <TrendingUp size={12} />
                  <span>+75 earned today</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── 2. CREATIVE ENERGY SECTION (Gauge Bar) ── */}
          <div className="p-5 rounded-2xl bg-black/50 border border-warm-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold">
              <div className="flex items-center gap-2 text-cyan-300">
                <Zap size={16} className="text-cyan-400 fill-cyan-400/20" />
                <span className="uppercase tracking-wider">Creative Energy Field</span>
              </div>
              <span className="text-warm-300 font-mono">82% Charged</span>
            </div>

            {/* Animated Energy Progress Bar */}
            <div className="w-full h-3 rounded-full bg-warm-950 p-0.5 border border-cyan-500/20 overflow-hidden relative">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-600 via-cyan-400 to-indigo-500 transition-all duration-1000 shadow-[0_0_15px_rgba(6,182,212,0.8)] relative"
                style={{ width: '82%' }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </div>
            </div>

            <p className="text-[11px] text-warm-400 flex items-center justify-between">
              <span>Fuels real-time roleplay responses, voice synthesis, and story generation.</span>
              <span className="text-cyan-400 font-bold hidden sm:inline">Next Auto-Boost in 4h 12m</span>
            </p>
          </div>
        </section>

        {/* ── 3. FREE SHARDS & EARNING HUB ── */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="font-serif text-2xl font-bold text-white flex items-center gap-2">
                <Gift size={22} className="text-cyan-400" />
                <span>Free SHARDS & Daily Sparks</span>
              </h2>
              <p className="text-xs text-warm-400">Earn SHARDS through multiple legitimate creative methods & daily claims.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Daily Claim Card */}
            <div className="p-6 rounded-3xl bg-warm-900/60 border border-warm-800 hover:border-cyan-500/40 transition-all shadow-lg space-y-4 relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/30 shrink-0">
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Daily Reserve Claim</h3>
                    <p className="text-xs text-warm-400">Claim +75 SHARDS every 24 hours.</p>
                  </div>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-300 font-bold border border-cyan-500/20">
                  +75 💎
                </span>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleClaimDaily}
                  disabled={dailyClaimed}
                  className={`w-full py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                    dailyClaimed
                      ? 'bg-warm-800 text-warm-500 cursor-not-allowed border border-warm-700'
                      : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-600/30'
                  }`}
                >
                  {dailyClaimed ? (
                    <>
                      <CheckCircle2 size={16} className="text-emerald-400" />
                      <span>Claimed Today (Cooldown: 18h 42m)</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>Claim Daily 75 SHARDS</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Rewarded Ad Spark */}
            <div className="p-6 rounded-3xl bg-warm-900/60 border border-warm-800 hover:border-purple-500/40 transition-all shadow-lg space-y-4 relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/30 shrink-0">
                    <Play size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Sponsor Video Spark</h3>
                    <p className="text-xs text-warm-400">Watch a 5-second video for instant SHARDS.</p>
                  </div>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-300 font-bold border border-purple-500/20">
                  +15 💎
                </span>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    setIsPlayingAd(true);
                    setAdSecondsLeft(5);
                  }}
                  disabled={isPlayingAd}
                  className="w-full py-3 px-4 rounded-2xl font-bold text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {isPlayingAd ? (
                    <>
                      <Loader2 size={16} className="animate-spin text-purple-300" />
                      <span>Watching Ad... ({adSecondsLeft}s)</span>
                    </>
                  ) : (
                    <>
                      <Play size={16} />
                      <span>Watch Sponsor Ad (+15 SHARDS)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </section>

        {/* ── 4. REFERRAL SYSTEM ── */}
        <section className="p-6 sm:p-8 rounded-3xl bg-warm-900/70 border border-warm-800 space-y-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-serif text-2xl font-bold text-white flex items-center gap-2">
                <UserPlus size={22} className="text-blue-400" />
                <span>Referral Program & Code Sharing</span>
              </h2>
              <p className="text-xs text-warm-400">Invite creators and roleplayers to CHIMERA to earn +50 SHARDS per referral.</p>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-bold flex items-center gap-2">
              <Award size={14} />
              <span>{referralsCount} Successful Referrals</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Share Your Code */}
            <div className="p-5 rounded-2xl bg-black/40 border border-warm-800 space-y-3">
              <label className="block text-xs font-bold text-warm-300 uppercase tracking-wider">Your Personal Referral Code</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={personalReferralCode}
                  className="w-full bg-warm-950 border border-warm-750 rounded-xl py-2.5 px-3.5 text-xs font-mono font-bold text-cyan-300 focus:outline-none"
                />
                <button
                  onClick={handleCopyReferralCode}
                  className="px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 transition-all shadow-md"
                >
                  <Copy size={14} />
                  <span>Copy</span>
                </button>
              </div>
            </div>

            {/* Enter Referral Code */}
            <div className="p-5 rounded-2xl bg-black/40 border border-warm-800 space-y-3">
              <label className="block text-xs font-bold text-warm-300 uppercase tracking-wider">Enter Friend's Referral Code</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. CHIMERA-FRIEND-2026"
                  value={referralCodeInput}
                  onChange={(e) => setReferralCodeInput(e.target.value)}
                  className="w-full bg-warm-950 border border-warm-750 rounded-xl py-2.5 px-3.5 text-xs font-mono text-white focus:outline-none focus:border-cyan-500 transition-all placeholder-warm-500"
                />
                <button
                  onClick={handleClaimReferralCode}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shrink-0 transition-all shadow-md"
                >
                  Redeem
                </button>
              </div>
            </div>

          </div>

          {/* Referral History Log */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-warm-400">Referral History</h4>
            <div className="divide-y divide-warm-800/60 rounded-2xl border border-warm-800 bg-black/30 overflow-hidden">
              {referralHistory.map(rec => (
                <div key={rec.id} className="p-3 sm:p-4 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold text-xs">
                      {rec.username[0]}
                    </div>
                    <div>
                      <span className="font-bold text-white">{rec.username}</span>
                      <span className="text-[10px] text-warm-500 block">{rec.date}</span>
                    </div>
                  </div>
                  <span className="font-bold text-emerald-400">+50 SHARDS 💎</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 5. CREATOR REWARDS & MILESTONES ── */}
        <section className="space-y-6">
          <div className="space-y-1">
            <h2 className="font-serif text-2xl font-bold text-white flex items-center gap-2">
              <Award size={22} className="text-amber-400" />
              <span>Creator Rewards & Milestones</span>
            </h2>
            <p className="text-xs text-warm-400">SHARDS are earned through active creative authorship in the CHIMERA ecosystem.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {milestones.map(m => {
              const Icon = m.icon;
              return (
                <div
                  key={m.id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                    m.completed
                      ? 'bg-warm-900/40 border-warm-800 opacity-90'
                      : 'bg-warm-900/80 border-cyan-500/30 hover:border-cyan-400 shadow-lg'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                        <Icon size={20} />
                      </div>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        +{m.reward} 💎
                      </span>
                    </div>

                    <h3 className="font-bold text-white text-sm">{m.title}</h3>
                    <p className="text-xs text-warm-400 leading-relaxed">{m.desc}</p>
                  </div>

                  <button
                    onClick={() => handleClaimMilestone(m.id)}
                    disabled={m.completed}
                    className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                      m.completed
                        ? 'bg-warm-800 text-warm-500 cursor-default border border-warm-750'
                        : 'bg-amber-500 hover:bg-amber-400 text-black font-extrabold shadow-md shadow-amber-500/20'
                    }`}
                  >
                    {m.completed ? (
                      <>
                        <CheckCircle size={14} className="text-emerald-400" />
                        <span>Completed & Claimed</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        <span>Claim Reward (+{m.reward} SHARDS)</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── 6. GIFT SHARDS & CREATOR REVENUE VAULT ── */}
        <section className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-950/60 via-warm-900/80 to-purple-950/60 border border-purple-500/30 shadow-2xl space-y-6 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider mb-2">
                <Coins size={12} />
                <span>Creator Monetization & Tipping</span>
              </div>
              <h2 className="font-serif text-2xl font-bold text-white flex items-center gap-2">
                <span>Gift SHARDS & Creator Yield Vault</span>
              </h2>
              <p className="text-xs text-warm-300 max-w-lg leading-relaxed">
                Send Tipping Sparks to your favorite authors or accumulate reader appreciation SHARDS convertible to real payouts.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsGiftModalOpen(true)}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all"
              >
                <Gift size={16} />
                <span>Send Gift Spark</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-5 rounded-2xl bg-black/40 border border-purple-500/20 space-y-2">
              <span className="text-xs uppercase font-bold text-warm-400">Total Gifted Sparks Received</span>
              <div className="text-2xl sm:text-3xl font-serif font-bold text-purple-300 flex items-center gap-2">
                <span>750 SHARDS</span>
                <span className="text-xs font-sans text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md">~$7.50 USD</span>
              </div>
              <p className="text-[11px] text-warm-400">Earned from community tips on published Characters & Stories.</p>
            </div>

            <div className="p-5 rounded-2xl bg-black/40 border border-purple-500/20 space-y-2 flex flex-col justify-between">
              <div>
                <span className="text-xs uppercase font-bold text-warm-400">Stripe Connect Payout Status</span>
                <div className="text-xs font-bold text-emerald-400 flex items-center gap-1 mt-1">
                  <ShieldCheck size={14} />
                  <span>Stripe Payout Vault Verified</span>
                </div>
              </div>
              <button
                onClick={() => showToast('Creator Payout process initiated via Stripe Connect!', 'success')}
                className="w-full py-2 px-3 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/30 font-bold text-xs transition-all flex items-center justify-center gap-1.5"
              >
                <ArrowUpRight size={14} />
                <span>Convert to Revenue Payout</span>
              </button>
            </div>
          </div>
        </section>

        {/* ── 7. PREMIUM SHARD PACKS ── */}
        <section id="buy-shards-section" className="space-y-6">
          <div className="space-y-1">
            <h2 className="font-serif text-2xl font-bold text-white flex items-center gap-2">
              <Coins size={22} className="text-cyan-400" />
              <span>Purchase SHARD Bundles</span>
            </h2>
            <p className="text-xs text-warm-400">Boost your creative reserves instantly with crystal bundles.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Pack 1: Apprentice */}
            <div className="p-6 rounded-3xl bg-warm-900/80 border border-warm-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-6 relative overflow-hidden group shadow-lg">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
                  <ShardCrystalImage size={32} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">Apprentice Spark</h3>
                  <div className="text-2xl font-serif font-black text-cyan-300">500 SHARDS</div>
                  <p className="text-xs text-warm-400 mt-1">Ideal for roleplay chats & quick story drafts.</p>
                </div>
              </div>
              <button
                onClick={() => {
                  earnShards(500, 'Apprentice Pack Purchase');
                  showToast('🎉 Purchased 500 SHARDS!', 'success');
                }}
                className="w-full py-3 px-4 rounded-2xl bg-warm-800 hover:bg-cyan-600 hover:text-white text-cyan-300 border border-cyan-500/30 font-bold text-xs transition-all shadow-md"
              >
                $4.99 USD
              </button>
            </div>

            {/* Pack 2: Adept (Most Popular) */}
            <div className="p-6 rounded-3xl bg-gradient-to-b from-cyan-950/80 to-warm-900/80 border-2 border-cyan-400/60 hover:border-cyan-300 transition-all flex flex-col justify-between space-y-6 relative overflow-hidden group shadow-[0_0_30px_rgba(6,182,212,0.2)]">
              <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-cyan-400 text-black font-extrabold text-[10px] uppercase tracking-wider shadow-md">
                Most Popular
              </div>

              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center border border-cyan-400/40">
                  <ShardCrystalImage size={36} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">Adept Crystal</h3>
                  <div className="text-2xl font-serif font-black text-cyan-300">1,200 SHARDS</div>
                  <div className="text-xs font-bold text-emerald-400 mt-0.5">+200 Bonus SHARDS</div>
                  <p className="text-xs text-warm-400 mt-1">Generous reserve for active creators.</p>
                </div>
              </div>

              <button
                onClick={() => {
                  earnShards(1200, 'Adept Pack Purchase');
                  showToast('🎉 Purchased 1,200 SHARDS!', 'success');
                }}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-xs transition-all shadow-lg shadow-cyan-500/30"
              >
                $9.99 USD
              </button>
            </div>

            {/* Pack 3: Archmage (Best Value) */}
            <div className="p-6 rounded-3xl bg-gradient-to-b from-purple-950/80 to-warm-900/80 border-2 border-purple-400/60 hover:border-purple-300 transition-all flex flex-col justify-between space-y-6 relative overflow-hidden group shadow-[0_0_30px_rgba(168,85,247,0.2)]">
              <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-purple-400 text-black font-extrabold text-[10px] uppercase tracking-wider shadow-md">
                Best Value
              </div>

              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-300 flex items-center justify-center border border-purple-400/40">
                  <ShardCrystalImage size={36} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">Archmage Vault</h3>
                  <div className="text-2xl font-serif font-black text-purple-300">3,000 SHARDS</div>
                  <div className="text-xs font-bold text-emerald-400 mt-0.5">+600 Bonus SHARDS</div>
                  <p className="text-xs text-warm-400 mt-1">Unlimited roleplay & worldbuilding freedom.</p>
                </div>
              </div>

              <button
                onClick={() => {
                  earnShards(3000, 'Archmage Pack Purchase');
                  showToast('🎉 Purchased 3,000 SHARDS!', 'success');
                }}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs transition-all shadow-lg shadow-purple-600/30"
              >
                $19.99 USD
              </button>
            </div>

            {/* Pack 4: Sovereign */}
            <div className="p-6 rounded-3xl bg-warm-900/80 border border-warm-800 hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-6 relative overflow-hidden group shadow-lg">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                  <Crown size={28} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">Sovereign Reserve</h3>
                  <div className="text-2xl font-serif font-black text-amber-300">8,500 SHARDS</div>
                  <div className="text-xs font-bold text-emerald-400 mt-0.5">+2,000 Bonus SHARDS</div>
                  <p className="text-xs text-warm-400 mt-1">For studio power users & worldbuilders.</p>
                </div>
              </div>

              <button
                onClick={() => {
                  earnShards(8500, 'Sovereign Pack Purchase');
                  showToast('🎉 Purchased 8,500 SHARDS!', 'success');
                }}
                className="w-full py-3 px-4 rounded-2xl bg-warm-800 hover:bg-amber-500 hover:text-black text-amber-300 border border-amber-500/30 font-bold text-xs transition-all shadow-md"
              >
                $49.99 USD
              </button>
            </div>

          </div>
        </section>

        {/* ── 8. CHIMERA PREMIUM GUILD SUBSCRIPTION ── */}
        <section className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-warm-900 via-warm-900 to-warm-950 border border-amber-500/30 shadow-2xl space-y-8 relative overflow-hidden">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="space-y-3 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <Crown size={14} />
                <span>CHIMERA Guild Membership</span>
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white leading-tight">
                Unlock Premium AI Models & 10x Memory
              </h2>
              <p className="text-xs sm:text-sm text-warm-300 leading-relaxed">
                Elevate your creative workflow with monthly SHARDS, zero rate limits, priority generation, and access to premium models like Gemini 1.5 Pro & Claude 3.5 Sonnet.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-black/50 border border-amber-500/30 text-center space-y-4 shrink-0 w-full lg:w-72">
              <div>
                <span className="text-3xl font-serif font-black text-amber-300">$12.99</span>
                <span className="text-xs text-warm-400"> / month</span>
              </div>

              <button
                onClick={() => showToast('👑 Subscribed to CHIMERA Guild Pass!', 'success')}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-extrabold text-xs shadow-lg shadow-amber-500/20 transition-all"
              >
                Join CHIMERA Guild
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-warm-800">
            {[
              { title: '2,000 Monthly SHARDS', desc: 'Refreshed automatically every billing cycle.' },
              { title: '10x Expanded Character Memory', desc: 'Long-term persistent recall across thousands of turns.' },
              { title: 'Faster Response Speed', desc: 'Dedicated high-throughput inference priority.' },
              { title: 'Premium AI Models', desc: 'Access Gemini 1.5 Pro, Claude 3.5 Sonnet & GPT-4o.' },
              { title: 'Priority Image Generation', desc: 'Instant character avatars & world cover rendering.' },
              { title: 'Creator Revenue Yield (+20%)', desc: 'Earn 20% extra yield on community gift tips.' },
            ].map((b, i) => (
              <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl bg-black/30 border border-warm-800">
                <CheckCircle2 size={18} className="text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-xs text-white">{b.title}</h4>
                  <p className="text-[11px] text-warm-400 mt-0.5">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>

      {/* Modals */}
      {showBuyModal && <ShardsHubModal isOpen={showBuyModal} onClose={() => setShowBuyModal(false)} />}
      {isShareModalOpen && <ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} title="Share CHIMERA Vault" url={window.location.href} />}
      {isGiftModalOpen && <GiftShardsModal isOpen={isGiftModalOpen} onClose={() => setIsGiftModalOpen(false)} />}
    </div>
  );
}
