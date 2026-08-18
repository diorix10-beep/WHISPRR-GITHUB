import { useState } from 'react';
import {
  Sparkles, ChevronRight, Heart, Award, Users, Check, Gift, ArrowRight,
  TrendingUp, Compass, MessageSquare, PenTool, ShieldCheck, Flame, Zap
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { ShardsHubModal } from '../components/common/ShardsHubModal';
import { GiftShardsModal } from '../components/common/GiftShardsModal';
import { ShareModal } from '../components/common/ShareModal';
import { useTranslation } from '../hooks/useTranslation';

interface RecentActivityItem {
  id: string;
  type: 'daily' | 'quest' | 'milestone' | 'tip';
  title: string;
  subtitle: string;
  amount: number;
  time: string;
}

export default function ShardsPage() {
  const { shardsBalance, earnShards } = useAuth();
  const { showToast } = useToast();
  const { formatNumber } = useTranslation();

  const [showBuyModal, setShowBuyModal] = useState(false);
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [dailyClaimed, setDailyClaimed] = useState(false);

  const [activityHistory, setActivityHistory] = useState<RecentActivityItem[]>([
    { id: '1', type: 'daily', title: 'Daily spark', subtitle: 'You claimed your daily spark.', amount: 10, time: '2h ago' },
    { id: '2', type: 'quest', title: 'Community quest', subtitle: '"Worldbuilding Weekend" completed.', amount: 40, time: '1d ago' },
    { id: '3', type: 'milestone', title: 'Creator milestone', subtitle: 'Reached "Ideas in Motion" milestone.', amount: 150, time: '2d ago' },
    { id: '4', type: 'tip', title: 'Tip sent', subtitle: 'You tipped Astra Ember.', amount: -25, time: '2d ago' },
  ]);

  const handleClaimDailySpark = () => {
    if (dailyClaimed) {
      showToast('✨ Daily spark already claimed today! Check back tomorrow.', 'info');
      return;
    }
    earnShards(10, 'Daily Spark');
    setDailyClaimed(true);
    setActivityHistory((prev) => [
      { id: Date.now().toString(), type: 'daily', title: 'Daily spark', subtitle: 'You claimed your daily spark.', amount: 10, time: 'Just now' },
      ...prev,
    ]);
    showToast('✨ Daily Spark Claimed! +10 SHARDS added to your balance.', 'success');
  };

  return (
    <div className="min-h-screen text-warm-100 font-sans selection:bg-purple-600 selection:text-white pb-28 relative overflow-hidden">
      
      {/* Soft Amethyst & Parchment Gold Ambient Lights */}
      <div className="absolute top-10 left-1/4 w-[700px] h-[500px] bg-purple-900/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[400px] right-10 w-[500px] h-[500px] bg-amber-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 relative z-10 pt-6">

        {/* ── 1. PAGE HEADER & HERO SHOWCASE ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-4 pb-4">
          
          {/* Left Column: Official Amethyst SHARDS Logo Badge */}
          <div className="lg:col-span-5 flex flex-col items-center lg:items-start text-center lg:text-left space-y-3">
            <div className="relative group cursor-pointer" onClick={() => setShowBuyModal(true)}>
              <div className="absolute -inset-4 bg-gradient-to-r from-purple-600/20 via-amber-500/20 to-purple-600/20 rounded-full blur-2xl opacity-75 group-hover:opacity-100 transition-opacity" />
              <img
                src="/images/shards_amethyst_logo.png"
                alt="SHARDS"
                className="w-48 sm:w-60 h-auto object-contain drop-shadow-[0_0_35px_rgba(168,85,247,0.4)] transition-transform duration-500 hover:scale-105"
              />
            </div>
          </div>

          {/* Right Column: Hero Headline & Prominent Balance Card */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="space-y-2">
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight drop-shadow-md">
                Your creative spark.
              </h1>
              <p className="font-serif italic text-amber-200/90 text-lg sm:text-xl font-medium tracking-wide">
                Create. Earn. Continue.
              </p>
            </div>

            {/* Prominent Parchment Gold Balance Box */}
            <div className="inline-flex items-center gap-4 px-6 py-3.5 rounded-2xl bg-purple-950/50 backdrop-blur-xl border border-amber-500/40 shadow-[0_0_30px_rgba(168,85,247,0.2)]">
              <img
                src="/images/shards_amethyst_logo.png"
                alt="SHARDS"
                className="w-8 h-8 object-contain drop-shadow-[0_0_12px_rgba(168,85,247,0.8)] shrink-0"
              />
              <div className="flex items-baseline gap-2">
                <span className="font-serif font-extrabold text-3xl sm:text-4xl text-amber-200 tracking-tight drop-shadow">
                  {formatNumber(shardsBalance)}
                </span>
                <span className="font-serif uppercase tracking-widest text-xs font-bold text-amber-300/80">
                  SHARDS
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── 2. THREE CORE PATHS (Earn | Spend | Support Creators) ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* ── PATH 1: EARN ── */}
          <div className="p-6 rounded-3xl bg-warm-900/60 backdrop-blur-2xl border border-amber-500/30 shadow-2xl flex flex-col justify-between space-y-6 hover:border-amber-500/50 transition-all">
            <div className="space-y-5">
              <div className="text-center pb-2 border-b border-amber-500/20">
                <h2 className="font-serif text-2xl font-bold text-amber-200 tracking-wide">Earn</h2>
              </div>

              <div className="space-y-3">
                
                {/* Daily Spark */}
                <button
                  onClick={handleClaimDailySpark}
                  className="w-full p-3.5 rounded-2xl bg-purple-950/40 border border-purple-500/20 hover:border-amber-500/40 flex items-center justify-between text-left transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white group-hover:text-amber-300 transition-colors flex items-center gap-1.5">
                        <span>Daily spark</span>
                        {dailyClaimed && <span className="text-[10px] text-emerald-400 font-extrabold uppercase">(Claimed)</span>}
                      </div>
                      <p className="text-xs text-warm-400 leading-snug">Check in each day to keep your creativity glowing.</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-warm-500 group-hover:text-amber-300 shrink-0 transition-transform group-hover:translate-x-0.5" />
                </button>

                {/* Creator Milestones */}
                <button
                  onClick={() => setIsShareModalOpen(true)}
                  className="w-full p-3.5 rounded-2xl bg-purple-950/40 border border-purple-500/20 hover:border-amber-500/40 flex items-center justify-between text-left transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                      <Award size={18} />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white group-hover:text-amber-300 transition-colors">Creator milestones</div>
                      <p className="text-xs text-warm-400 leading-snug">Reach milestones and unlock exclusive rewards.</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-warm-500 group-hover:text-amber-300 shrink-0 transition-transform group-hover:translate-x-0.5" />
                </button>

                {/* Community Quests */}
                <button
                  onClick={() => setIsShareModalOpen(true)}
                  className="w-full p-3.5 rounded-2xl bg-purple-950/40 border border-purple-500/20 hover:border-amber-500/40 flex items-center justify-between text-left transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                      <Users size={18} />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white group-hover:text-amber-300 transition-colors">Community quests</div>
                      <p className="text-xs text-warm-400 leading-snug">Collaborate, create, and earn together.</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-warm-500 group-hover:text-amber-300 shrink-0 transition-transform group-hover:translate-x-0.5" />
                </button>

              </div>
            </div>
          </div>

          {/* ── PATH 2: SPEND ── */}
          <div className="p-6 rounded-3xl bg-warm-900/60 backdrop-blur-2xl border border-amber-500/30 shadow-2xl flex flex-col justify-between space-y-6 hover:border-amber-500/50 transition-all">
            <div className="space-y-5">
              <div className="text-center pb-2 border-b border-amber-500/20">
                <h2 className="font-serif text-2xl font-bold text-amber-200 tracking-wide">Spend</h2>
              </div>

              <div className="space-y-3">
                
                {/* Premium Tools Card */}
                <div 
                  onClick={() => setShowBuyModal(true)}
                  className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-500/20 hover:border-amber-500/40 flex items-center justify-between cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-14 rounded-xl overflow-hidden border border-purple-500/30 shrink-0 bg-purple-900/50 relative">
                      <img 
                        src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=200&q=80" 
                        alt="Premium tools" 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                      />
                      <div className="absolute inset-0 bg-purple-950/30" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white group-hover:text-amber-300 transition-colors">Premium tools</div>
                      <p className="text-xs text-warm-400 leading-snug">Elevate your workflow with premium tools.</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-warm-500 group-hover:text-amber-300 shrink-0 transition-transform group-hover:translate-x-0.5" />
                </div>

                {/* Story Packs Card */}
                <div 
                  onClick={() => setShowBuyModal(true)}
                  className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-500/20 hover:border-amber-500/40 flex items-center justify-between cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-14 rounded-xl overflow-hidden border border-purple-500/30 shrink-0 bg-purple-900/50 relative">
                      <img 
                        src="https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=200&q=80" 
                        alt="Story packs" 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                      />
                      <div className="absolute inset-0 bg-purple-950/30" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white group-hover:text-amber-300 transition-colors">Story packs</div>
                      <p className="text-xs text-warm-400 leading-snug">Unlock rich story packs and creative assets.</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-warm-500 group-hover:text-amber-300 shrink-0 transition-transform group-hover:translate-x-0.5" />
                </div>

              </div>
            </div>
          </div>

          {/* ── PATH 3: SUPPORT CREATORS ── */}
          <div className="p-6 rounded-3xl bg-warm-900/60 backdrop-blur-2xl border border-amber-500/30 shadow-2xl flex flex-col justify-between space-y-6 hover:border-amber-500/50 transition-all">
            <div className="space-y-5">
              <div className="text-center pb-2 border-b border-amber-500/20">
                <h2 className="font-serif text-2xl font-bold text-amber-200 tracking-wide">Support creators</h2>
              </div>

              <div className="space-y-4">
                
                {/* Tip Your Favorites Button */}
                <button
                  onClick={() => setIsGiftModalOpen(true)}
                  className="w-full p-3.5 rounded-2xl bg-purple-950/40 border border-purple-500/20 hover:border-amber-500/40 flex items-center justify-between text-left transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-300 flex items-center justify-center shrink-0">
                      <Heart size={20} className="fill-purple-400/30" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white group-hover:text-amber-300 transition-colors">Tip your favorites</div>
                      <p className="text-xs text-warm-400 leading-snug">Show appreciation and fuel their next chapter.</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-warm-500 group-hover:text-amber-300 shrink-0 transition-transform group-hover:translate-x-0.5" />
                </button>

                {/* Payout Progress Section */}
                <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/20 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-amber-200 font-serif">Payout progress</span>
                    <span className="text-purple-300 font-mono text-sm">82%</span>
                  </div>

                  {/* Amethyst Purple Progress Bar */}
                  <div className="w-full h-2.5 rounded-full bg-warm-950 p-0.5 border border-purple-500/30 overflow-hidden relative">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-purple-600 via-purple-500 to-amber-400 shadow-[0_0_12px_rgba(168,85,247,0.7)] transition-all duration-1000"
                      style={{ width: '82%' }}
                    />
                  </div>

                  <p className="text-[11px] text-warm-400">
                    You're on your way to your next payout.
                  </p>
                </div>

              </div>
            </div>
          </div>

        </div>

        {/* ── 3. BOTTOM ROW: RECENT ACTIVITY & OPTIONAL MEMBERSHIP ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Recent Activity Timeline (Left - 7 Cols) */}
          <div className="lg:col-span-7 p-6 sm:p-8 rounded-3xl bg-warm-900/60 backdrop-blur-2xl border border-amber-500/30 shadow-2xl space-y-6">
            <h3 className="font-serif text-xl font-bold text-amber-200 tracking-wide pb-2 border-b border-amber-500/20">
              Recent activity
            </h3>

            <div className="space-y-4 relative pl-2">
              {/* Connected Line */}
              <div className="absolute left-[22px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-purple-500/40 via-amber-500/30 to-purple-500/10 pointer-events-none" />

              {activityHistory.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-4 relative z-10 p-2 rounded-xl hover:bg-purple-950/30 transition-colors">
                  <div className="flex items-center gap-3.5">
                    <div className="w-8 h-8 rounded-full bg-purple-950 border border-amber-500/40 text-amber-300 flex items-center justify-center shrink-0 shadow-md">
                      {item.type === 'daily' && <Sparkles size={14} />}
                      {item.type === 'quest' && <Users size={14} />}
                      {item.type === 'milestone' && <Award size={14} />}
                      {item.type === 'tip' && <Heart size={14} className="fill-purple-400/30" />}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white">{item.title}</div>
                      <div className="text-xs text-warm-400">{item.subtitle}</div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className={`font-serif font-extrabold text-sm ${item.amount > 0 ? 'text-purple-300' : 'text-amber-400'}`}>
                      {item.amount > 0 ? `+${item.amount}` : item.amount} SHARDS
                    </div>
                    <div className="text-[11px] text-warm-500">{item.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Optional Membership Card — Chimera Patron (Right - 5 Cols) */}
          <div className="lg:col-span-5 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-purple-950/80 via-warm-900/90 to-purple-950/80 backdrop-blur-2xl border border-amber-500/40 shadow-2xl relative overflow-hidden flex flex-col justify-between space-y-6">
            
            <div className="space-y-4 relative z-10">
              <div className="text-[10px] font-extrabold tracking-widest text-amber-400 uppercase">
                OPTIONAL MEMBERSHIP
              </div>

              <h3 className="font-serif text-3xl font-extrabold text-white tracking-tight">
                Chimera Patron
              </h3>

              <p className="text-xs sm:text-sm text-warm-300 italic">
                Go further in your creative journey.
              </p>

              {/* Bullet Features */}
              <ul className="space-y-2.5 text-xs text-warm-200 pt-2">
                <li className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 flex items-center justify-center shrink-0 text-[10px]">✦</div>
                  <span>Monthly SHARDS bonus</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 flex items-center justify-center shrink-0 text-[10px]">✦</div>
                  <span>Early access to new tools & packs</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 flex items-center justify-center shrink-0 text-[10px]">✦</div>
                  <span>Exclusive creator features</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 flex items-center justify-center shrink-0 text-[10px]">✦</div>
                  <span>Support the stories you love</span>
                </li>
              </ul>
            </div>

            {/* Floating 3D Amethyst Artwork on Right */}
            <div className="absolute right-[-10px] bottom-0 w-44 h-44 opacity-80 pointer-events-none">
              <img 
                src="/images/shards_amethyst_logo.png" 
                alt="Amethyst Crystal" 
                className="w-full h-full object-contain drop-shadow-[0_0_30px_rgba(168,85,247,0.5)]" 
              />
            </div>

            {/* Learn More Button */}
            <div className="pt-4 relative z-10">
              <button
                onClick={() => setShowBuyModal(true)}
                className="w-full py-3 px-6 rounded-full bg-purple-900/80 hover:bg-purple-800 text-amber-200 font-serif font-bold text-sm border border-amber-500/40 hover:border-amber-300 shadow-xl transition-all hover:scale-105 active:scale-95"
              >
                Learn more
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* Buy & Manage SHARDS Reserve Modal */}
      <ShardsHubModal
        isOpen={showBuyModal}
        onClose={() => setShowBuyModal(false)}
      />

      {/* Tipping & Support Modal */}
      <GiftShardsModal
        isOpen={isGiftModalOpen}
        onClose={() => setIsGiftModalOpen(false)}
        recipientName="Featured Creators"
      />

      {/* Share / Referrals Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title="Share & Earn SHARDS"
        url={window.location.origin}
      />

    </div>
  );
}
