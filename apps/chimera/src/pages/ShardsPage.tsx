import { useState, useEffect } from 'react';
import {
  Sparkles, Crown, Play, CheckCircle2, Plus, ArrowRight,
  Loader2, ShieldCheck, Flame, Image as ImageIcon, Volume2, Zap,
  Gift, TrendingUp, Wallet, DollarSign, Award, Check, ExternalLink,
  ChevronRight, Heart, Star, Lock
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { ShardsHubModal } from '../components/common/ShardsHubModal';
import { ShardCrystalImage } from '../components/common/ShardCrystalImage';

export default function ShardsPage() {
  const { shardsBalance, earnShards, spendShards, adFreePassActive, activateAdFreePass } = useAuth();
  const { showToast } = useToast();

  const [showBuyModal, setShowBuyModal] = useState(false);
  const [isPlayingAd, setIsPlayingAd] = useState(false);
  const [adSecondsLeft, setAdSecondsLeft] = useState(5);
  const [adCount, setAdCount] = useState(0);
  const [dailyClaimed, setDailyClaimed] = useState(false);

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
      showToast('🎉 Earned +5 SHARDS for watching video ad!', 'success');
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
      showToast('✨ Activated VIP No-Ads Pass for 30 Days!', 'success');
    } else {
      showToast('Insufficient SHARDS balance! You need 20 SHARDS.', 'error');
    }
  };

  const handleClaimDaily = () => {
    if (dailyClaimed) {
      showToast('Daily login reward already claimed for today!', 'info');
      return;
    }
    earnShards(5, 'Daily Login Reward');
    setDailyClaimed(true);
    showToast('🎁 Daily Reward Claimed: +5 SHARDS!', 'success');
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-warm-950 text-white font-sans selection:bg-cyan-500 selection:text-black pb-24 relative overflow-hidden">
      
      {/* Ambient Lighting & Glow Orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-blue-600/15 via-cyan-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[800px] left-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20 relative z-10 pt-6">

        {/* ── 1. HERO SECTION (Focal Point) ── */}
        <section className="flex flex-col items-center text-center pt-8 sm:pt-12 space-y-6">
          
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-wider animate-fade-in shadow-inner">
            <Sparkles size={14} className="animate-spin" />
            <span>CHIMERA Ecosystem Currency</span>
          </div>

          {/* Floating Option C SHARD Crystal */}
          <div className="relative group cursor-pointer" onClick={() => setShowBuyModal(true)}>
            <div className="absolute inset-0 bg-blue-500/30 rounded-full blur-3xl group-hover:blur-4xl transition-all animate-pulse" />
            
            <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-3xl bg-gradient-to-tr from-blue-600/30 via-cyan-500/20 to-indigo-600/30 p-1 backdrop-blur-xl border border-white/20 shadow-[0_0_50px_rgba(37,99,235,0.3)] transform transition-transform group-hover:scale-105">
              <div className="w-full h-full bg-warm-950/80 rounded-[22px] flex items-center justify-center relative overflow-hidden">
                <ShardCrystalImage size={120} />
                <div className="absolute top-4 right-4 w-3.5 h-3.5 bg-cyan-400 rounded-full animate-ping" />
              </div>
            </div>
          </div>

          {/* Balance & Title Display */}
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-3">
              <ShardCrystalImage size={40} showGlow={false} />
              <span className="font-serif text-5xl sm:text-6xl font-extrabold tracking-tight text-white drop-shadow-md">
                {shardsBalance}
              </span>
              <span className="text-xl sm:text-2xl font-serif text-cyan-400 font-bold self-end mb-1">
                SHARDS
              </span>
            </div>

            <p className="text-sm sm:text-base text-warm-300 max-w-lg mx-auto leading-relaxed">
              The premium energy powering AI roleplay, novel writing, voice line auditions, and direct creator tips across CHIMERA &amp; WHISPRR.
            </p>
          </div>

          {/* Hero CTAs */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => setShowBuyModal(true)}
              className="px-7 py-3 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-extrabold text-xs shadow-lg shadow-blue-600/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
              <Plus size={16} strokeWidth={3} />
              <span>Acquire SHARDS</span>
            </button>

            <button
              onClick={() => scrollToSection('store')}
              className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 backdrop-blur-md transition-all flex items-center gap-1.5"
            >
              <span>Explore Store</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </section>


        {/* ── 2. QUICK ACTIONS BAR ── */}
        <section className="p-3 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl flex items-center justify-around flex-wrap gap-2">
          <button
            onClick={() => setShowBuyModal(true)}
            className="flex-1 min-w-[130px] py-3 px-4 rounded-2xl bg-white/5 hover:bg-blue-600/20 text-warm-100 hover:text-cyan-300 border border-white/5 hover:border-cyan-500/30 transition-all flex items-center justify-center gap-2 text-xs font-bold group"
          >
            <Wallet size={16} className="text-cyan-400 group-hover:scale-110 transition-transform" />
            <span>Buy SHARDS</span>
          </button>

          <button
            onClick={() => scrollToSection('ways-to-earn')}
            className="flex-1 min-w-[130px] py-3 px-4 rounded-2xl bg-white/5 hover:bg-purple-600/20 text-warm-100 hover:text-purple-300 border border-white/5 hover:border-purple-500/30 transition-all flex items-center justify-center gap-2 text-xs font-bold group"
          >
            <Gift size={16} className="text-purple-400 group-hover:scale-110 transition-transform" />
            <span>Earn Free</span>
          </button>

          <button
            onClick={() => showToast('🎁 Gifting SHARDS to community members is available on character & author profiles!', 'info')}
            className="flex-1 min-w-[130px] py-3 px-4 rounded-2xl bg-white/5 hover:bg-pink-600/20 text-warm-100 hover:text-pink-300 border border-white/5 hover:border-pink-500/30 transition-all flex items-center justify-center gap-2 text-xs font-bold group"
          >
            <Heart size={16} className="text-pink-400 group-hover:scale-110 transition-transform" />
            <span>Gift SHARDS</span>
          </button>

          <button
            onClick={() => scrollToSection('creator-economy')}
            className="flex-1 min-w-[130px] py-3 px-4 rounded-2xl bg-white/5 hover:bg-emerald-600/20 text-warm-100 hover:text-emerald-300 border border-white/5 hover:border-emerald-500/30 transition-all flex items-center justify-center gap-2 text-xs font-bold group"
          >
            <TrendingUp size={16} className="text-emerald-400 group-hover:scale-110 transition-transform" />
            <span>Creator Revenue</span>
          </button>

          <button
            onClick={handleRedeemNoAdsPass}
            className="flex-1 min-w-[130px] py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500/20 to-purple-500/20 hover:from-amber-500/30 hover:to-purple-500/30 text-amber-300 border border-amber-500/30 transition-all flex items-center justify-center gap-2 text-xs font-bold group"
          >
            <Crown size={16} className="text-amber-400 group-hover:scale-110 transition-transform" />
            <span>{adFreePassActive ? 'VIP Active' : 'VIP Pass'}</span>
          </button>
        </section>


        {/* ── 3. WAYS TO USE SHARDS (Spacious Feature Showcases) ── */}
        <section className="space-y-8" id="ways-to-use">
          <div className="text-center space-y-2">
            <h2 className="font-serif text-3xl font-bold text-white">Ways to Use SHARDS</h2>
            <p className="text-xs text-warm-400 max-w-md mx-auto">
              Unlock premium creation magic, uninterrupted immersion, and support creators across CHIMERA.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Feature 1: VIP Ad-Free Pass */}
            <div className="p-7 rounded-3xl bg-warm-900/60 backdrop-blur-xl border border-white/10 hover:border-purple-500/40 transition-all flex flex-col justify-between space-y-6 relative overflow-hidden group">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Crown size={24} />
                </div>
                <h3 className="font-serif text-xl font-bold text-white flex items-center gap-2">
                  <span>30-Day VIP No-Ads Pass</span>
                </h3>
                <p className="text-xs text-warm-300 leading-relaxed">
                  Enjoy completely ad-free creation. Roleplay with AI characters and write novels uninterrupted for 30 full days.
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleRedeemNoAdsPass}
                  disabled={adFreePassActive}
                  className="w-full py-3 rounded-2xl bg-white hover:bg-warm-100 text-black font-extrabold text-xs shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {adFreePassActive ? (
                    <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
                      <CheckCircle2 size={16} /> VIP Pass Active (No Ads)
                    </span>
                  ) : (
                    <span>Redeem 30-Day Pass (20 SHARDS)</span>
                  )}
                </button>
              </div>
            </div>

            {/* Feature 2: Faster AI Responses */}
            <div className="p-7 rounded-3xl bg-warm-900/60 backdrop-blur-xl border border-white/10 hover:border-blue-500/40 transition-all flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-cyan-400">
                  <Zap size={24} />
                </div>
                <h3 className="font-serif text-xl font-bold text-white">Accelerated AI Neural Responses</h3>
                <p className="text-xs text-warm-300 leading-relaxed">
                  Bypass slowmode queues during peak traffic hours. Get instant high-throughput LLM responses for complex roleplays.
                </p>
              </div>
              <div className="text-xs font-bold text-cyan-400 flex items-center gap-1">
                <span>Included with SHARDS Holder tier</span>
                <Check size={16} />
              </div>
            </div>

            {/* Feature 3: AI Selfies & Visual Memory */}
            <div className="p-7 rounded-3xl bg-warm-900/60 backdrop-blur-xl border border-white/10 hover:border-pink-500/40 transition-all flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
                  <ImageIcon size={24} />
                </div>
                <h3 className="font-serif text-xl font-bold text-white">Character Selfies &amp; Visual Memory</h3>
                <p className="text-xs text-warm-300 leading-relaxed">
                  Ask AI characters to send realistic in-character selfies, photos, and visual scene memory portraits during chats.
                </p>
              </div>
              <div className="text-xs font-bold text-pink-400 flex items-center gap-1">
                <span>Available directly in roleplay chat drawer</span>
              </div>
            </div>

            {/* Feature 4: HD Voice Line Auditions */}
            <div className="p-7 rounded-3xl bg-warm-900/60 backdrop-blur-xl border border-white/10 hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Volume2 size={24} />
                </div>
                <h3 className="font-serif text-xl font-bold text-white">HD Voice Line Synthesis</h3>
                <p className="text-xs text-warm-300 leading-relaxed">
                  Unlock high-fidelity speech synthesis, custom voice modulation, and full spoken audiobook narration for your stories.
                </p>
              </div>
              <div className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <span>Integrated in Voice Library</span>
              </div>
            </div>

          </div>
        </section>


        {/* ── 4. WAYS TO EARN SHARDS ── */}
        <section className="space-y-8" id="ways-to-earn">
          <div className="text-center space-y-2">
            <h2 className="font-serif text-3xl font-bold text-white">Ways to Earn Free SHARDS</h2>
            <p className="text-xs text-warm-400 max-w-md mx-auto">
              Never locked behind mandatory paywalls. Earn SHARDS daily by creating, engaging, or watching short ads.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Earn 1: Daily Login Streak */}
            <div className="p-6 rounded-3xl bg-warm-900/60 backdrop-blur-xl border border-white/10 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Flame size={18} className="text-amber-400" />
                  <h4 className="font-bold text-sm text-white">Daily Login Streak</h4>
                </div>
                <p className="text-xs text-warm-400">Claim +5 SHARDS every 24 hours</p>
              </div>

              <button
                onClick={handleClaimDaily}
                disabled={dailyClaimed}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs shadow-md transition-all disabled:opacity-50 shrink-0"
              >
                {dailyClaimed ? 'Claimed ✓' : 'Claim +5 💎'}
              </button>
            </div>

            {/* Earn 2: Rewarded Video Ads */}
            <div className="p-6 rounded-3xl bg-warm-900/60 backdrop-blur-xl border border-white/10 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Play size={18} className="text-blue-400 fill-blue-400" />
                  <h4 className="font-bold text-sm text-white">Watch Rewarded Video Ads</h4>
                </div>
                <p className="text-xs text-warm-400">+5 SHARDS per 5s view ({adCount}/5 today)</p>
              </div>

              {isPlayingAd ? (
                <div className="px-4 py-2 rounded-2xl bg-blue-600/20 text-cyan-300 font-bold text-xs flex items-center gap-1.5 animate-pulse shrink-0">
                  <Loader2 size={14} className="animate-spin" /> {adSecondsLeft}s
                </div>
              ) : (
                <button
                  onClick={() => setIsPlayingAd(true)}
                  className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all shrink-0"
                >
                  Watch Ad (+5 💎)
                </button>
              )}
            </div>

          </div>
        </section>


        {/* ── 5. CREATOR ECONOMY ── */}
        <section className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-emerald-950/60 via-warm-900/80 to-warm-950 border border-emerald-500/30 shadow-2xl space-y-6 relative overflow-hidden" id="creator-economy">
          
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold uppercase tracking-wider">
              <TrendingUp size={14} />
              <span>Creator Revenue Split</span>
            </div>

            <h2 className="font-serif text-3xl font-bold text-white">Convert Your Creativity into Real Value</h2>
            <p className="text-xs sm:text-sm text-warm-300 max-w-2xl leading-relaxed">
              When community members chat with your AI characters, read your published stories, or tip your creator profile, you accumulate SHARDS that can be redeemed for real-world cash payouts.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1">
              <div className="text-xs text-warm-400 font-medium">Character Engagements</div>
              <div className="text-lg font-bold text-emerald-400">+1 SHARD / 50 chats</div>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1">
              <div className="text-xs text-warm-400 font-medium">Fan Tipping</div>
              <div className="text-lg font-bold text-emerald-400">100% Direct Tips</div>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1">
              <div className="text-xs text-warm-400 font-medium">Payout Threshold</div>
              <div className="text-lg font-bold text-emerald-400">100 SHARDS = $10.00</div>
            </div>
          </div>
        </section>


        {/* ── 6. SHARD STORE (Pricing Tier Matrix) ── */}
        <section className="space-y-8" id="store">
          <div className="text-center space-y-2">
            <h2 className="font-serif text-3xl font-bold text-white">SHARD Store</h2>
            <p className="text-xs text-warm-400 max-w-md mx-auto">
              Acquire SHARD packages to supercharge your creation engine and support independent authors.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Pack 1: Starter */}
            <div className="p-6 rounded-3xl bg-warm-900/60 backdrop-blur-xl border border-white/10 hover:border-blue-500/40 transition-all flex flex-col justify-between space-y-6">
              <div className="space-y-3 text-center">
                <div className="text-xs font-bold text-warm-400 uppercase tracking-wider">Starter Pack</div>
                <div className="flex items-center justify-center gap-2">
                  <ShardCrystalImage size={32} showGlow={false} />
                  <span className="font-serif text-3xl font-extrabold text-white">20</span>
                </div>
                <p className="text-xs text-warm-400">Perfect for trying out 30-Day VIP Pass</p>
              </div>

              <button
                onClick={() => {
                  earnShards(20, 'Purchased Starter Pack');
                  showToast('🎉 Purchased Starter Pack (+20 SHARDS)!', 'success');
                }}
                className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 transition-all"
              >
                $1.99 USD
              </button>
            </div>

            {/* Pack 2: Creator Pack (RECOMMENDED) */}
            <div className="p-6 rounded-3xl bg-gradient-to-b from-blue-900/40 via-warm-900/80 to-warm-950 border-2 border-cyan-500/60 shadow-[0_0_30px_rgba(6,182,212,0.2)] transition-all flex flex-col justify-between space-y-6 relative overflow-hidden">
              <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-cyan-400 text-black text-[10px] font-extrabold uppercase tracking-wider">
                Popular
              </div>

              <div className="space-y-3 text-center pt-2">
                <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Creator Pack</div>
                <div className="flex items-center justify-center gap-2">
                  <ShardCrystalImage size={36} />
                  <span className="font-serif text-4xl font-extrabold text-white">55</span>
                </div>
                <p className="text-xs text-cyan-100">+5 Bonus SHARDS Included</p>
              </div>

              <button
                onClick={() => {
                  earnShards(55, 'Purchased Creator Pack');
                  showToast('🎉 Purchased Creator Pack (+55 SHARDS)!', 'success');
                }}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-extrabold text-xs shadow-lg transition-all"
              >
                $4.99 USD
              </button>
            </div>

            {/* Pack 3: Visionary Pack */}
            <div className="p-6 rounded-3xl bg-warm-900/60 backdrop-blur-xl border border-white/10 hover:border-purple-500/40 transition-all flex flex-col justify-between space-y-6">
              <div className="space-y-3 text-center">
                <div className="text-xs font-bold text-purple-400 uppercase tracking-wider">Visionary Pack</div>
                <div className="flex items-center justify-center gap-2">
                  <ShardCrystalImage size={32} showGlow={false} />
                  <span className="font-serif text-3xl font-extrabold text-white">140</span>
                </div>
                <p className="text-xs text-warm-400">+20 Bonus SHARDS Included</p>
              </div>

              <button
                onClick={() => {
                  earnShards(140, 'Purchased Visionary Pack');
                  showToast('🎉 Purchased Visionary Pack (+140 SHARDS)!', 'success');
                }}
                className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 transition-all"
              >
                $9.99 USD
              </button>
            </div>

            {/* Pack 4: Vault Pack */}
            <div className="p-6 rounded-3xl bg-warm-900/60 backdrop-blur-xl border border-white/10 hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-6">
              <div className="space-y-3 text-center">
                <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">Vault Pack</div>
                <div className="flex items-center justify-center gap-2">
                  <ShardCrystalImage size={32} showGlow={false} />
                  <span className="font-serif text-3xl font-extrabold text-white">360</span>
                </div>
                <p className="text-xs text-warm-400">+60 Bonus SHARDS Included</p>
              </div>

              <button
                onClick={() => {
                  earnShards(360, 'Purchased Vault Pack');
                  showToast('🎉 Purchased Vault Pack (+360 SHARDS)!', 'success');
                }}
                className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 transition-all"
              >
                $19.99 USD
              </button>
            </div>

          </div>
        </section>


        {/* ── 7. ACCOUNT STATISTICS & LEDGER ── */}
        <section className="p-8 rounded-3xl bg-warm-900/60 backdrop-blur-xl border border-white/10 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-xl font-bold text-white flex items-center gap-2">
              <ShieldCheck size={20} className="text-cyan-400" />
              <span>Account Economy Ledger</span>
            </h3>
            <span className="text-xs text-warm-400 font-mono">ID: {shardsBalance > 0 ? 'SHARD-ACTIVE' : 'SHARD-NEW'}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-1">
              <div className="text-xs text-warm-400">Current Balance</div>
              <div className="text-xl font-bold text-white font-serif">{shardsBalance} SHARDS</div>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-1">
              <div className="text-xs text-warm-400">Lifetime Earned</div>
              <div className="text-xl font-bold text-cyan-400 font-serif">{shardsBalance + 20} SHARDS</div>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-1">
              <div className="text-xs text-warm-400">VIP Status</div>
              <div className="text-xl font-bold text-purple-400 font-serif">{adFreePassActive ? 'VIP Active' : 'Standard'}</div>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-1">
              <div className="text-xs text-warm-400">Creator Earnings</div>
              <div className="text-xl font-bold text-emerald-400 font-serif">$0.00 USD</div>
            </div>
          </div>
        </section>

      </div>

      {/* Buy Shards Modal */}
      <ShardsHubModal isOpen={showBuyModal} onClose={() => setShowBuyModal(false)} />
    </div>
  );
}
