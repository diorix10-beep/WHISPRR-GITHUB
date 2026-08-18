import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, BookOpen, CheckCircle2, Clock3, Download, Eye, Feather, Gem, Image as ImageIcon, RefreshCw, Sparkles, WalletCards } from 'lucide-react';
import { supabase } from '../lib/supabase';

type VellumWallet = {
  available_balance: number;
  lifetime_earned: number;
  lifetime_spent: number;
};

type VellumLedgerEntry = {
  id: string;
  amount: number;
  entry_type: 'welcome_credit' | 'creative_spend' | 'refund' | 'manual_adjustment';
  status: 'posted' | 'reversed';
  description: string;
  created_at: string;
};

type VellumArtifact = {
  id: string;
  storage_path: string;
  style: 'cinematic' | 'painterly' | 'graphic_novel';
  aspect_ratio: '16:9' | '4:5' | '1:1';
  vellum_cost: number;
  created_at: string;
  signed_url: string;
};

const ENTRY_LABELS: Record<VellumLedgerEntry['entry_type'], string> = {
  welcome_credit: 'Welcome credit',
  creative_spend: 'Creative support',
  refund: 'Refund',
  manual_adjustment: 'Balance adjustment',
};

function formatVellum(amount: number) {
  return Math.abs(amount).toLocaleString();
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export default function VellumPage() {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState<VellumWallet | null>(null);
  const [ledger, setLedger] = useState<VellumLedgerEntry[]>([]);
  const [artifacts, setArtifacts] = useState<VellumArtifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshNonce, setRefreshNonce] = useState(0);

  useEffect(() => {
    let active = true;

    const loadVellum = async (showRefreshState = false) => {
      if (showRefreshState) setRefreshing(true);
      setLoading(true);
      setError(null);

      const [walletResult, ledgerResult, artifactResult] = await Promise.all([
        supabase.rpc('get_my_vellum_wallet'),
        supabase.rpc('get_my_vellum_ledger', { p_limit: 50 }),
        supabase
          .from('story_scene_illustrations')
          .select('id, storage_path, style, aspect_ratio, vellum_cost, created_at')
          .eq('status', 'completed')
          .not('storage_path', 'is', null)
          .order('created_at', { ascending: false })
          .limit(24),
      ]);

      if (!active) return;

      if (walletResult.error || ledgerResult.error || artifactResult.error) {
        console.error('Could not load VELLUM reserve', { walletError: walletResult.error, ledgerError: ledgerResult.error, artifactError: artifactResult.error });
        setError('VELLUM could not be loaded right now. Please try again in a moment.');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      setWallet((walletResult.data?.[0] ?? null) as VellumWallet | null);
      setLedger((ledgerResult.data ?? []) as VellumLedgerEntry[]);
      const signedArtifacts = await Promise.all((artifactResult.data ?? []).map(async (artifact) => {
        if (!artifact.storage_path) return null;
        const { data: signed, error: signedError } = await supabase.storage
          .from('story-illustrations')
          .createSignedUrl(artifact.storage_path, 60 * 60);
        if (signedError || !signed?.signedUrl) return null;
        return { ...artifact, signed_url: signed.signedUrl } as VellumArtifact;
      }));
      setArtifacts(signedArtifacts.filter((artifact): artifact is VellumArtifact => Boolean(artifact)));
      setLoading(false);
      setRefreshing(false);
    };

    void loadVellum();
    const refreshAfterSpend = () => { void loadVellum(); };
    window.addEventListener('chimera-vellum-changed', refreshAfterSpend);
    return () => {
      active = false;
      window.removeEventListener('chimera-vellum-changed', refreshAfterSpend);
    };
  }, [refreshNonce]);

  const welcomeCredit = ledger.find((entry) => entry.entry_type === 'welcome_credit' && entry.status === 'posted');

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#100f1b] pb-24 text-warm-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(ellipse_at_top,_rgba(91,71,151,0.42),transparent_65%)]" />
      <div className="pointer-events-none absolute left-[-8rem] top-72 h-80 w-80 rounded-full bg-amber-300/10 blur-[120px]" />

      <main className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <button onClick={() => navigate('/workspace')} className="inline-flex items-center gap-2 text-xs font-bold text-warm-300 transition hover:text-amber-100">
          <ArrowLeft size={15} /> Back to workspace
        </button>

        <section className="mt-6 overflow-hidden rounded-[2rem] border border-amber-200/20 bg-[#0b1020]/95 shadow-2xl">
          <div className="relative px-6 py-9 sm:px-10 sm:py-12">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_12%,rgba(199,155,79,0.20),transparent_24%),radial-gradient(circle_at_58%_120%,rgba(120,88,188,0.28),transparent_44%)]" />
            <div className="relative grid items-center gap-8 md:grid-cols-[1fr_auto]">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/25 bg-amber-200/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-amber-100">
                  <Feather size={13} /> Storytelling reserve
                </div>
                <h1 className="mt-5 font-serif text-5xl font-medium tracking-tight text-[#f4e1c3] sm:text-6xl">VELLUM</h1>
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#c7bad2] sm:text-base">A quiet reserve for optional creative support. Your stories, worlds, and writing desk are free to use.</p>
              </div>

              <div className="min-w-[15rem] rounded-3xl border border-amber-200/25 bg-[#10182a]/85 p-6 text-center shadow-xl backdrop-blur">
                <img src="/images/vellum-sigil.svg" alt="VELLUM" className="mx-auto h-16 w-16 rounded-2xl" />
                <p className="mt-4 text-[10px] font-extrabold uppercase tracking-[0.2em] text-amber-200">Available VELLUM</p>
                {loading ? <div className="mx-auto mt-3 h-10 w-36 animate-pulse rounded bg-white/10" /> : <p className="mt-2 font-serif text-4xl font-bold text-white">{wallet ? wallet.available_balance.toLocaleString() : '—'}</p>}
                <p className="mt-1 text-xs text-warm-400">Storytelling only</p>
              </div>
            </div>
          </div>
        </section>

        {error ? (
          <section className="mt-6 rounded-2xl border border-rose-300/25 bg-rose-500/10 p-5 text-sm text-rose-100">
            <div className="flex items-start gap-3"><AlertCircle className="mt-0.5 shrink-0" size={18} /><div><p className="font-bold">We could not load your VELLUM reserve.</p><p className="mt-1 text-rose-100/80">{error}</p></div></div>
          </section>
        ) : (
          <>
            <section className="mt-6 grid gap-4 md:grid-cols-3">
              <article className="rounded-2xl border border-amber-200/15 bg-[#10182a]/90 p-5 shadow-xl">
                <BookOpen size={20} className="text-amber-200" />
                <h2 className="mt-4 font-serif text-xl text-white">Writing stays free</h2>
                <p className="mt-2 text-sm leading-relaxed text-warm-300">Draft chapters, build worlds, and shape stories without spending VELLUM.</p>
              </article>
              <article className="rounded-2xl border border-amber-200/15 bg-[#10182a]/90 p-5 shadow-xl">
                <Sparkles size={20} className="text-amber-200" />
                <h2 className="mt-4 font-serif text-xl text-white">Only by choice</h2>
                <p className="mt-2 text-sm leading-relaxed text-warm-300">VELLUM is reserved for optional creative tools when those tools are truly available.</p>
              </article>
              <article className="rounded-2xl border border-amber-200/15 bg-[#10182a]/90 p-5 shadow-xl">
                <WalletCards size={20} className="text-amber-200" />
                <h2 className="mt-4 font-serif text-xl text-white">A separate reserve</h2>
                <p className="mt-2 text-sm leading-relaxed text-warm-300">VELLUM is a closed Storytelling economy: it cannot be transferred, withdrawn, or converted into SHARDS.</p>
              </article>
            </section>

            <section className="mt-6 rounded-3xl border border-amber-200/15 bg-[#10182a]/90 p-6 shadow-xl sm:p-7">
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                <div><p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-amber-200">The VELLUM promise</p><h2 className="mt-2 font-serif text-2xl text-white">A credit for creating, never a toll for writing.</h2></div>
                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-100"><CheckCircle2 size={14} /> Welcome VELLUM never expires</span>
              </div>
              <div className="mt-6 grid gap-3 text-sm text-warm-300 md:grid-cols-2">
                <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><strong className="block text-warm-100">One welcome reserve</strong><span className="mt-1 block">10,000 VELLUM is granted once when a member enters Storytelling or chooses both creative spaces.</span></p>
                <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><strong className="block text-warm-100">No hidden debits</strong><span className="mt-1 block">Every future creative action will show its exact cost and ask for confirmation first.</span></p>
                <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><strong className="block text-warm-100">A result or a refund</strong><span className="mt-1 block">If a paid creative action cannot be completed, its VELLUM must be returned.</span></p>
                 <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><strong className="block text-warm-100">Closed and separate</strong><span className="mt-1 block">VELLUM cannot be transferred, withdrawn, or converted into SHARDS. It stays inside Storytelling.</span></p>
              </div>
            </section>

            <section className="mt-6 grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
              <article className="rounded-3xl border border-amber-200/15 bg-[#10182a]/90 p-6 shadow-xl sm:p-7">
                <div className="flex items-center gap-3"><Gem size={21} className="text-amber-200" /><h2 className="font-serif text-2xl text-white">Your welcome</h2></div>
                {loading ? <div className="mt-6 h-28 animate-pulse rounded-2xl bg-white/5" /> : welcomeCredit ? <>
                  <p className="mt-5 text-4xl font-bold text-amber-100">+{formatVellum(welcomeCredit.amount)} <span className="font-serif text-2xl">VELLUM</span></p>
                  <p className="mt-2 text-sm leading-relaxed text-warm-300">Your one-time welcome credit is already safely in your Storytelling reserve.</p>
                  <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-100"><CheckCircle2 size={14} /> Added {formatDate(welcomeCredit.created_at)}</div>
                </> : <>
                  <p className="mt-5 text-lg font-bold text-white">No welcome credit is shown yet.</p>
                  <p className="mt-2 text-sm leading-relaxed text-warm-300">Once your account is provisioned, its welcome credit will appear here as a real ledger entry.</p>
                </>}
              </article>

              <article className="rounded-3xl border border-amber-200/15 bg-[#10182a]/90 p-6 shadow-xl sm:p-7">
              <div className="flex items-center justify-between gap-4"><div><h2 className="font-serif text-2xl text-white">Reserve activity</h2><p className="mt-1 text-xs text-warm-400">Only real VELLUM changes appear here.</p></div><Clock3 size={20} className="text-amber-200" /></div>
                {loading ? <div className="mt-5 space-y-3">{[1, 2, 3].map((item) => <div key={item} className="h-16 animate-pulse rounded-xl bg-white/5" />)}</div> : ledger.length ? <div className="mt-5 divide-y divide-white/10">{ledger.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
                    <div className="min-w-0"><p className="truncate text-sm font-bold text-warm-100">{entry.description || ENTRY_LABELS[entry.entry_type]}</p><p className="mt-1 text-xs text-warm-400">{ENTRY_LABELS[entry.entry_type]} · {formatDate(entry.created_at)}{entry.status === 'reversed' ? ' · Reversed' : ''}</p></div>
                    <span className={`shrink-0 text-sm font-extrabold ${entry.amount >= 0 ? 'text-emerald-200' : 'text-rose-200'}`}>{entry.amount >= 0 ? '+' : '−'}{formatVellum(entry.amount)}</span>
                  </div>
                ))}</div> : <div className="mt-5 rounded-2xl border border-dashed border-white/15 px-5 py-8 text-center text-sm text-warm-400">No VELLUM activity yet. When something genuinely changes, it will be recorded here.</div>}
              </article>
            </section>

            <section className="mt-6 rounded-3xl border border-amber-200/20 bg-[#10182a]/90 p-6 shadow-xl sm:p-7">
               <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div className="flex items-start gap-3">
                  <ImageIcon size={21} className="mt-1 text-amber-200" />
                  <div>
                    <h2 className="font-serif text-2xl text-white">Your private artifacts</h2>
                    <p className="mt-1 max-w-2xl text-sm leading-relaxed text-warm-300">Completed Scene Illustrations belong to your Storytelling space. These are private previews from real VELLUM actions, not community posts.</p>
                 </div>
                 <button type="button" onClick={() => setRefreshNonce((value) => value + 1)} disabled={loading || refreshing} className="inline-flex w-fit items-center gap-2 rounded-xl border border-amber-200/20 px-3 py-2 text-xs font-bold text-amber-100 transition hover:bg-amber-200/10 disabled:cursor-wait disabled:opacity-50"><RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh gallery</button>
                </div>
                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-200/20 bg-amber-200/10 px-3 py-1.5 text-xs font-bold text-amber-100"><Eye size={14} /> {artifacts.length} saved</span>
              </div>
              {loading ? (
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="aspect-video animate-pulse rounded-2xl bg-white/5" />)}</div>
              ) : artifacts.length ? (
                <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {artifacts.map((artifact) => (
                    <article key={artifact.id} className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                      <a href={artifact.signed_url} target="_blank" rel="noreferrer" className="group block">
                        <img src={artifact.signed_url} alt="Private CHIMERA scene illustration" className={`w-full object-cover transition duration-300 group-hover:scale-[1.02] ${artifact.aspect_ratio === '4:5' ? 'aspect-[4/5]' : artifact.aspect_ratio === '1:1' ? 'aspect-square' : 'aspect-video'}`} />
                      </a>
                      <div className="flex items-center justify-between gap-3 p-4">
                        <div className="min-w-0"><p className="truncate text-sm font-bold text-warm-100">Scene Illustration</p><p className="mt-1 text-xs text-warm-400">{artifact.style.replace('_', ' ')} · {formatDate(artifact.created_at)}</p><p className="mt-1 text-xs text-amber-200">{formatVellum(artifact.vellum_cost)} VELLUM</p></div>
                        <a href={artifact.signed_url} download={`chimera-scene-${artifact.id}.png`} className="shrink-0 rounded-lg border border-amber-200/20 p-2 text-amber-100 transition hover:bg-amber-200/10" aria-label="Download scene illustration"><Download size={16} /></a>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-2xl border border-dashed border-amber-200/20 px-5 py-10 text-center"><ImageIcon className="mx-auto text-amber-200/60" size={24} /><p className="mt-3 text-sm font-semibold text-warm-200">Your first scene is waiting in the writing desk.</p><p className="mt-1 text-xs leading-relaxed text-warm-400">When a real illustration is completed, it will appear here privately.</p><button onClick={() => navigate('/write')} className="mt-4 rounded-lg bg-[#e6c48b] px-4 py-2 text-xs font-extrabold text-[#2a1c12] transition hover:bg-[#f4dbac]">Open the writing desk</button></div>
              )}
            </section>

             <section className="mt-6 rounded-3xl border border-amber-200/25 bg-[#10182a]/75 p-6 shadow-xl sm:p-7">
               <div className="flex items-center gap-3"><Sparkles size={21} className="text-amber-200" /><div><h2 className="font-serif text-2xl text-white">Bring one scene to life</h2><p className="mt-1 text-sm text-warm-300">Scene Illustration is the first live VELLUM artifact. The rest stays proposed until its real creation and ledger flow exists.</p></div></div>
               <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                 <div className="rounded-2xl border border-amber-200/30 bg-amber-200/[0.08] p-4"><p className="font-serif text-lg text-warm-100">Scene illustration</p><p className="mt-2 text-xs leading-relaxed text-warm-300">A private visual companion for a chapter scene, based on your direction.</p><p className="mt-3 text-xs font-bold text-amber-100">400 VELLUM · Live</p><button onClick={() => navigate('/write')} className="mt-4 rounded-lg bg-[#e6c48b] px-3 py-2 text-xs font-extrabold text-[#2a1c12] transition hover:bg-[#f4dbac]">Open the writing desk</button></div>
                  {['Chapter covers', 'World maps', 'Continuity checks'].map((tool) => <div key={tool} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><p className="font-serif text-lg text-warm-100">{tool}</p><p className="mt-2 text-xs leading-relaxed text-warm-400">A future creative artifact. It will appear here only after CHIMERA can genuinely create and record it.</p><span className="mt-3 inline-block text-[10px] font-bold uppercase tracking-wider text-amber-200/80">Not connected yet</span></div>)}
               </div>
             </section>
          </>
        )}

        <section className="mt-6 flex flex-col items-center justify-between gap-4 rounded-3xl border border-amber-200/15 bg-[#10182a]/90 px-6 py-6 text-center shadow-xl sm:flex-row sm:text-left">
          <div><h2 className="font-serif text-2xl text-white">Return to the page.</h2><p className="mt-1 text-sm text-warm-300">Your next chapter does not need VELLUM to begin.</p></div>
          <button onClick={() => navigate('/stories/new')} className="inline-flex items-center gap-2 rounded-xl bg-[#e6c48b] px-5 py-3 text-sm font-extrabold text-[#2a1c12] shadow-lg transition hover:bg-[#f4dbac]"><Feather size={16} /> Start a story</button>
        </section>
      </main>
    </div>
  );
}
