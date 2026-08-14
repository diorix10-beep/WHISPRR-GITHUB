import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle2, Clock3, Compass, Gem, MessageSquareHeart, ShieldCheck, Sparkles, WalletCards } from 'lucide-react';
import { supabase } from '../lib/supabase';

type ShardsWallet = {
  available_balance: number;
  lifetime_earned: number;
  lifetime_spent: number;
};

type ShardsLedgerEntry = {
  id: string;
  amount: number;
  entry_type: 'welcome_credit' | 'roleplay_reward' | 'creative_spend' | 'refund' | 'manual_adjustment';
  status: 'posted' | 'reversed';
  description: string;
  created_at: string;
};

const ENTRY_LABELS: Record<ShardsLedgerEntry['entry_type'], string> = {
  welcome_credit: 'Welcome credit',
  roleplay_reward: 'Guided Story Path',
  creative_spend: 'Roleplay moment',
  refund: 'Refund',
  manual_adjustment: 'Balance adjustment',
};

function formatShards(amount: number) {
  return Math.abs(amount).toLocaleString();
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export default function ShardsPage() {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState<ShardsWallet | null>(null);
  const [ledger, setLedger] = useState<ShardsLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadShards = async () => {
      setLoading(true);
      setError(null);
      const [walletResult, ledgerResult] = await Promise.all([
        supabase.rpc('get_my_shards_wallet'),
        supabase.rpc('get_my_shards_ledger', { p_limit: 50 }),
      ]);

      if (!active) return;
      if (walletResult.error || ledgerResult.error) {
        console.error('Could not load SHARDS reserve', { walletError: walletResult.error, ledgerError: ledgerResult.error });
        setError('SHARDS could not be loaded right now. Please try again in a moment.');
      } else {
        setWallet((walletResult.data?.[0] ?? null) as ShardsWallet | null);
        setLedger((ledgerResult.data ?? []) as ShardsLedgerEntry[]);
      }
      setLoading(false);
    };

    void loadShards();
    const refresh = () => void loadShards();
    window.addEventListener('chimera-shards-changed', refresh);
    return () => {
      active = false;
      window.removeEventListener('chimera-shards-changed', refresh);
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#100f1b] pb-24 text-warm-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(ellipse_at_top,_rgba(100,62,150,0.48),transparent_65%)]" />
      <div className="pointer-events-none absolute right-[-8rem] top-72 h-80 w-80 rounded-full bg-amber-300/10 blur-[120px]" />

      <main className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <button onClick={() => navigate('/workspace')} className="inline-flex items-center gap-2 text-xs font-bold text-warm-300 transition hover:text-amber-100">
          <ArrowLeft size={15} /> Back to workspace
        </button>

        <section className="mt-6 overflow-hidden rounded-[2rem] border border-purple-200/20 bg-[#0b1020]/95 shadow-2xl">
          <div className="relative px-6 py-9 sm:px-10 sm:py-12">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_12%,rgba(211,157,72,0.18),transparent_24%),radial-gradient(circle_at_58%_120%,rgba(111,70,174,0.30),transparent_44%)]" />
            <div className="relative grid items-center gap-8 md:grid-cols-[1fr_auto]">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-purple-200/25 bg-purple-200/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-purple-100">
                  <MessageSquareHeart size={13} /> Roleplay reserve
                </div>
                <h1 className="mt-5 font-serif text-5xl font-medium tracking-tight text-[#f4e1c3] sm:text-6xl">SHARDS</h1>
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#c7bad2] sm:text-base">A small, honest reserve for optional roleplay moments. Normal roleplay stays free.</p>
              </div>
              <div className="min-w-[15rem] rounded-3xl border border-purple-200/25 bg-[#10182a]/85 p-6 text-center shadow-xl backdrop-blur">
                <img src="/images/shards_amethyst_logo.png" alt="SHARDS" className="mx-auto h-16 w-16 rounded-2xl object-contain" />
                <p className="mt-4 text-[10px] font-extrabold uppercase tracking-[0.2em] text-amber-200">Available SHARDS</p>
                {loading ? <div className="mx-auto mt-3 h-10 w-36 animate-pulse rounded bg-white/10" /> : <p className="mt-2 font-serif text-4xl font-bold text-white">{wallet ? wallet.available_balance.toLocaleString() : '—'}</p>}
                <p className="mt-1 text-xs text-warm-400">Roleplay only</p>
              </div>
            </div>
          </div>
        </section>

        {error ? <section className="mt-6 rounded-2xl border border-rose-300/25 bg-rose-500/10 p-5 text-sm text-rose-100"><div className="flex items-start gap-3"><AlertCircle className="mt-0.5 shrink-0" size={18} /><div><p className="font-bold">We could not load your SHARDS reserve.</p><p className="mt-1 text-rose-100/80">{error}</p></div></div></section> : <>
          <section className="mt-6 grid gap-4 md:grid-cols-3">
            <article className="rounded-2xl border border-purple-200/15 bg-[#10182a]/90 p-5 shadow-xl"><Compass size={20} className="text-purple-200" /><h2 className="mt-4 font-serif text-xl text-white">Roleplay stays free</h2><p className="mt-2 text-sm leading-relaxed text-warm-300">Chat, explore characters, and keep a story moving without spending SHARDS.</p></article>
            <article className="rounded-2xl border border-purple-200/15 bg-[#10182a]/90 p-5 shadow-xl"><Sparkles size={20} className="text-amber-200" /><h2 className="mt-4 font-serif text-xl text-white">Earn through choices</h2><p className="mt-2 text-sm leading-relaxed text-warm-300">A meaningful Guided Story Path decision earns +10 SHARDS — never every ordinary message.</p></article>
            <article className="rounded-2xl border border-purple-200/15 bg-[#10182a]/90 p-5 shadow-xl"><ShieldCheck size={20} className="text-emerald-200" /><h2 className="mt-4 font-serif text-xl text-white">A separate reserve</h2><p className="mt-2 text-sm leading-relaxed text-warm-300">SHARDS cannot be transferred, withdrawn, or converted into VELLUM.</p></article>
          </section>

          <section className="mt-6 rounded-3xl border border-purple-200/15 bg-[#10182a]/90 p-6 shadow-xl sm:p-7">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-amber-200">How SHARDS work today</p><h2 className="mt-2 font-serif text-2xl text-white">A reward for a real turn in the story.</h2></div><span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-100"><CheckCircle2 size={14} /> Secure wallet and ledger</span></div>
            <div className="mt-6 grid gap-3 text-sm text-warm-300 md:grid-cols-2"><p className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><strong className="block text-warm-100">Guided Story Paths</strong><span className="mt-1 block">After a roleplay has enough genuine conversation, CHIMERA can offer a new turning point with two or three paths.</span></p><p className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><strong className="block text-warm-100">One choice, one reward</strong><span className="mt-1 block">Choose a path and receive +10 SHARDS once. Each account can resolve up to three turning points per day.</span></p><p className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><strong className="block text-warm-100">No fake daily claim</strong><span className="mt-1 block">There is no daily check-in, ad watch, store, VIP, or patron purchase pretending to be live here.</span></p><p className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><strong className="block text-warm-100">Every real change is visible</strong><span className="mt-1 block">A reward, future spend, or refund must be written to your personal ledger before the balance changes.</span></p></div>
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
            <article className="rounded-3xl border border-purple-200/15 bg-[#10182a]/90 p-6 shadow-xl sm:p-7"><div className="flex items-center gap-3"><Gem size={21} className="text-amber-200" /><h2 className="font-serif text-2xl text-white">Your reserve</h2></div>{loading ? <div className="mt-6 h-28 animate-pulse rounded-2xl bg-white/5" /> : <><p className="mt-5 text-4xl font-bold text-amber-100">{wallet ? wallet.available_balance.toLocaleString() : '0'} <span className="font-serif text-2xl">SHARDS</span></p><p className="mt-2 text-sm leading-relaxed text-warm-300">This number comes from your secure wallet, not a browser counter.</p><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-warm-400">Earned</p><p className="mt-1 text-lg font-bold text-emerald-100">{wallet?.lifetime_earned.toLocaleString() ?? '0'}</p></div><div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-warm-400">Used</p><p className="mt-1 text-lg font-bold text-warm-100">{wallet?.lifetime_spent.toLocaleString() ?? '0'}</p></div></div></>}</article>
            <article className="rounded-3xl border border-purple-200/15 bg-[#10182a]/90 p-6 shadow-xl sm:p-7"><div className="flex items-center justify-between gap-4"><div><h2 className="font-serif text-2xl text-white">Reserve activity</h2><p className="mt-1 text-xs text-warm-400">Only real SHARDS changes appear here.</p></div><Clock3 size={20} className="text-amber-200" /></div>{loading ? <div className="mt-5 space-y-3">{[1, 2, 3].map((item) => <div key={item} className="h-16 animate-pulse rounded-xl bg-white/5" />)}</div> : ledger.length ? <div className="mt-5 divide-y divide-white/10">{ledger.map((entry) => <div key={entry.id} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"><div className="min-w-0"><p className="truncate text-sm font-bold text-warm-100">{entry.description || ENTRY_LABELS[entry.entry_type]}</p><p className="mt-1 text-xs text-warm-400">{ENTRY_LABELS[entry.entry_type]} · {formatDate(entry.created_at)}{entry.status === 'reversed' ? ' · Reversed' : ''}</p></div><span className={`shrink-0 text-sm font-extrabold ${entry.amount >= 0 ? 'text-emerald-200' : 'text-rose-200'}`}>{entry.amount >= 0 ? '+' : '−'}{formatShards(entry.amount)}</span></div>)}</div> : <div className="mt-5 rounded-2xl border border-dashed border-white/15 px-5 py-8 text-center text-sm text-warm-400">No SHARDS activity yet. When something genuinely changes, it will be recorded here.</div>}</article>
          </section>

          <section className="mt-6 rounded-3xl border border-dashed border-purple-200/25 bg-[#10182a]/60 p-6 sm:p-7"><div className="flex items-center gap-3"><WalletCards size={21} className="text-purple-200" /><div><h2 className="font-serif text-2xl text-white">Future roleplay moments</h2><p className="mt-1 text-sm text-warm-300">These are directions, not working purchase buttons yet.</p></div></div><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{['Character selfies', 'Scene snapshots', 'Memory capsules', 'Voice moments'].map((tool) => <div key={tool} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><p className="font-serif text-lg text-warm-100">{tool}</p><p className="mt-2 text-xs leading-relaxed text-warm-400">Available only when CHIMERA can create the result and record the charge or refund safely.</p><span className="mt-3 inline-block text-[10px] font-bold uppercase tracking-wider text-amber-200/80">Not connected yet</span></div>)}</div></section>
        </>}

        <section className="mt-6 flex flex-col items-center justify-between gap-4 rounded-3xl border border-purple-200/15 bg-[#10182a]/90 px-6 py-6 text-center shadow-xl sm:flex-row sm:text-left"><div><h2 className="font-serif text-2xl text-white">Follow the next path.</h2><p className="mt-1 text-sm text-warm-300">The next meaningful choice may be waiting inside a roleplay.</p></div><button onClick={() => navigate('/chats')} className="inline-flex items-center gap-2 rounded-xl bg-[#d9b66c] px-5 py-3 text-sm font-extrabold text-[#2a1c12] shadow-lg transition hover:bg-[#ecd189]"><Compass size={16} /> Open roleplay</button></section>
      </main>
    </div>
  );
}
