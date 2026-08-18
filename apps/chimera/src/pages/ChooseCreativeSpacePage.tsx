import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, MessageCircle } from 'lucide-react';
import { useAuth, type CreativeMode } from '../contexts/AuthContext';

export default function ChooseCreativeSpacePage() {
  const navigate = useNavigate();
  const { updateChimeraPreferences } = useAuth();
  const [saving, setSaving] = useState<CreativeMode | null>(null);

  const enter = async (mode: CreativeMode) => {
    setSaving(mode);
    try {
      await updateChimeraPreferences({ default_creative_mode: mode, last_creative_mode: mode, both_mode_welcome_seen: true });
      navigate(mode === 'roleplay' ? '/discover' : '/workspace', { replace: true });
    } catch {
      setSaving(null);
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#090b18] px-4 py-10 text-white sm:px-6 lg:py-16">
      <div aria-hidden className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(239,68,68,.16),transparent_34%),radial-gradient(circle_at_85%_15%,rgba(139,92,246,.22),transparent_38%)]" />
      <section className="relative mx-auto max-w-5xl text-center">
        <img src="/chimera_logo.png" alt="CHIMERA" className="mx-auto mb-5 h-14 w-14 object-contain" />
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-300">CHIMERA</p>
        <h1 className="mt-3 font-serif text-4xl font-extrabold sm:text-5xl">Where would you like to begin today?</h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">Two ways to create. One world that is yours. You can move between your spaces whenever you wish.</p>
        <div className="mx-auto mt-10 grid max-w-4xl gap-5 md:grid-cols-2">
          <button type="button" onClick={() => enter('roleplay')} disabled={saving !== null} className="group rounded-[2rem] border border-rose-400/35 bg-gradient-to-br from-rose-500/20 to-[#160c1d] p-8 text-left transition hover:border-rose-300 hover:shadow-[0_20px_60px_rgba(239,68,68,.18)] disabled:opacity-60">
            <MessageCircle className="h-8 w-8 text-rose-200" /><p className="mt-12 text-xs font-bold uppercase tracking-[.18em] text-rose-200">Characters with a pulse</p><h2 className="mt-2 font-serif text-4xl font-extrabold">Roleplay</h2><p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-200">Discover characters, make a persona, and enter a conversation that feels alive.</p><span className="mt-8 inline-block text-sm font-extrabold text-rose-100">{saving === 'roleplay' ? 'Opening…' : 'Enter Roleplay →'}</span>
          </button>
          <button type="button" onClick={() => enter('storytelling')} disabled={saving !== null} className="group rounded-[2rem] border border-violet-400/35 bg-gradient-to-br from-violet-500/20 to-[#071729] p-8 text-left transition hover:border-violet-300 hover:shadow-[0_20px_60px_rgba(139,92,246,.18)] disabled:opacity-60">
            <BookOpen className="h-8 w-8 text-violet-200" /><p className="mt-12 text-xs font-bold uppercase tracking-[.18em] text-violet-200">Worlds with a soul</p><h2 className="mt-2 font-serif text-4xl font-extrabold">Storytelling</h2><p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-200">Open VELLUM, begin a story, and build a world in a quieter creative space.</p><span className="mt-8 inline-block text-sm font-extrabold text-violet-100">{saving === 'storytelling' ? 'Opening…' : 'Enter Storytelling →'}</span>
          </button>
        </div>
      </section>
    </main>
  );
}
