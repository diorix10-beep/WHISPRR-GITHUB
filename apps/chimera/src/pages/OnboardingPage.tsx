import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, MessageCircle, Sparkles } from 'lucide-react';
import { useAuth, type CreativePreference } from '../contexts/AuthContext';

const choices: Array<{
  value: CreativePreference;
  title: string;
  eyebrow: string;
  description: string;
  icon: typeof MessageCircle;
  className: string;
}> = [
  {
    value: 'roleplay',
    title: 'Roleplay',
    eyebrow: 'Characters with a pulse',
    description: 'Create characters, discover conversations, and make a persona of your own.',
    icon: MessageCircle,
    className: 'border-rose-400/35 bg-rose-500/10 hover:border-rose-300 hover:bg-rose-500/15',
  },
  {
    value: 'storytelling',
    title: 'Storytelling',
    eyebrow: 'Worlds with a soul',
    description: 'Write in VELLUM, shape worlds, and let your stories grow in their own space.',
    icon: BookOpen,
    className: 'border-violet-400/35 bg-violet-500/10 hover:border-violet-300 hover:bg-violet-500/15',
  },
  {
    value: 'both',
    title: 'Both',
    eyebrow: 'One world, two ways to create',
    description: 'Keep both spaces close. We will ask where you would like to begin today.',
    icon: Sparkles,
    className: 'border-amber-400/35 bg-amber-500/10 hover:border-amber-300 hover:bg-amber-500/15',
  },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { updateChimeraPreferences } = useAuth();
  const [selected, setSelected] = useState<CreativePreference | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const continueIntoChimera = async () => {
    if (!selected) return;
    setSaving(true);
    setError('');
    try {
      const mode = selected === 'storytelling' ? 'storytelling' : 'roleplay';
      await updateChimeraPreferences({
        creative_preference: selected,
        default_creative_mode: mode,
        last_creative_mode: mode,
        chimera_onboarding_complete: true,
        both_mode_welcome_seen: selected !== 'both',
      });
      navigate(selected === 'both' ? '/choose-your-space' : mode === 'storytelling' ? '/workspace' : '/discover', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We could not save your creative preference. Please try again.');
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#090b18] px-4 py-10 text-white sm:px-6 lg:py-16">
      <div aria-hidden className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(239,68,68,.16),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(139,92,246,.18),transparent_35%),radial-gradient(circle_at_50%_100%,rgba(245,158,11,.10),transparent_40%)]" />
      <section className="relative mx-auto max-w-4xl">
        <div className="mb-10 text-center">
          <img src="/chimera_logo.png" alt="CHIMERA" className="mx-auto mb-5 h-14 w-14 object-contain" />
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-300">CHIMERA creative home</p>
          <h1 className="mt-3 font-serif text-4xl font-extrabold sm:text-5xl">What brings you to CHIMERA?</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">Choose the creative space you would like to begin with. This changes your welcome, never what you are allowed to create.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {choices.map((choice) => {
            const Icon = choice.icon;
            const active = choice.value === selected;
            return (
              <button key={choice.value} type="button" onClick={() => setSelected(choice.value)} className={`min-h-64 rounded-3xl border p-6 text-left transition-all ${choice.className} ${active ? 'scale-[1.02] ring-2 ring-white/70' : ''}`}>
                <Icon className="mb-8 h-7 w-7 text-white" />
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/65">{choice.eyebrow}</p>
                <h2 className="mt-2 font-serif text-3xl font-extrabold">{choice.title}</h2>
                <p className="mt-4 text-sm leading-relaxed text-slate-200">{choice.description}</p>
              </button>
            );
          })}
        </div>

        {error && <p className="mt-5 text-center text-sm font-medium text-rose-300">{error}</p>}
        <div className="mt-8 flex justify-center">
          <button type="button" disabled={!selected || saving} onClick={continueIntoChimera} className="rounded-2xl bg-gradient-to-r from-rose-500 via-red-500 to-amber-500 px-8 py-4 text-sm font-extrabold shadow-[0_12px_36px_rgba(239,68,68,.28)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40">
            {saving ? 'Preparing your space…' : selected === 'both' ? 'Choose where to begin' : 'Enter CHIMERA'}
          </button>
        </div>
        <p className="mt-5 text-center text-xs text-slate-400">A WHISPRR Account connects the ecosystem. CHIMERA remains your private creative home by default.</p>
      </section>
    </main>
  );
}
