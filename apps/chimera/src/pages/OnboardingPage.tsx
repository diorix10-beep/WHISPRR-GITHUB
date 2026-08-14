import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, MessageCircle, Sparkles } from 'lucide-react';
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
    description: 'Write freely, shape worlds, and receive a permanent 10,000 VELLUM welcome reserve for optional creative support.',
    icon: BookOpen,
    className: 'border-violet-400/35 bg-violet-500/10 hover:border-violet-300 hover:bg-violet-500/15',
  },
  {
    value: 'both',
    title: 'Both',
    eyebrow: 'One world, two ways to create',
    description: 'Keep both spaces close. Enter Storytelling whenever you are ready and receive its permanent 10,000 VELLUM welcome reserve.',
    icon: Sparkles,
    className: 'border-amber-400/35 bg-amber-500/10 hover:border-amber-300 hover:bg-amber-500/15',
  },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { updateChimeraPreferences } = useAuth();
  const [step, setStep] = useState(0);
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

  const enterChoice = () => setStep(4);

  const nextStep = () => setStep((current) => Math.min(current + 1, 4));
  const previousStep = () => setStep((current) => Math.max(current - 1, 0));

  return (
    <main className="min-h-screen overflow-hidden bg-[#090b18] px-4 py-10 text-white sm:px-6 lg:py-16">
      <div aria-hidden className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(239,68,68,.16),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(139,92,246,.18),transparent_35%),radial-gradient(circle_at_50%_100%,rgba(245,158,11,.10),transparent_40%)]" />
      <section className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-4xl flex-col justify-center">
        <div className="absolute right-0 top-0 flex items-center gap-3 text-xs text-slate-400">
          <span>{step < 4 ? `${step + 1} / 4` : 'Ready'}</span>
          {step < 4 && <button type="button" onClick={enterChoice} className="font-bold text-slate-300 transition hover:text-white">Skip introduction</button>}
        </div>

        {step === 0 && (
          <div className="mx-auto max-w-2xl text-center">
            <img src="/chimera_logo.png" alt="CHIMERA" className="mx-auto mb-7 h-20 w-20 object-contain drop-shadow-[0_0_36px_rgba(244,63,94,.36)]" />
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-amber-300">Welcome to CHIMERA</p>
            <h1 className="mt-5 font-serif text-5xl font-extrabold leading-tight sm:text-6xl">A creative home for characters, worlds, and stories.</h1>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">Take a moment. There is more than one way to create here.</p>
            <button type="button" onClick={nextStep} className="mt-10 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 via-red-500 to-amber-500 px-7 py-4 text-sm font-extrabold shadow-[0_12px_36px_rgba(239,68,68,.28)] transition hover:brightness-110">Step inside <ArrowRight size={17} /></button>
          </div>
        )}

        {step === 1 && (
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-3xl border border-amber-400/25 bg-amber-400/10 text-amber-200"><Sparkles size={34} /></div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-amber-300">More than a conversation</p>
            <h1 className="mt-5 font-serif text-4xl font-extrabold leading-tight sm:text-5xl">CHIMERA is a studio for imagination.</h1>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">Create characters, explore roleplay, build worlds, and write stories that are truly your own. CHIMERA is not a generic chatbot — it is a place to make something personal.</p>
            <button type="button" onClick={nextStep} className="mt-10 inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-7 py-4 text-sm font-extrabold transition hover:bg-white/15">See the two creative spaces <ArrowRight size={17} /></button>
          </div>
        )}

        {step === 2 && (
          <div className="mx-auto max-w-2xl rounded-[2rem] border border-rose-400/25 bg-gradient-to-br from-rose-500/20 to-[#160c1d] p-8 text-center shadow-[0_24px_80px_rgba(239,68,68,.12)] sm:p-12">
            <MessageCircle className="mx-auto mb-8 text-rose-200" size={38} />
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-rose-200">Roleplay</p>
            <h1 className="mt-4 font-serif text-4xl font-extrabold sm:text-5xl">Characters with a pulse.</h1>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-slate-200 sm:text-lg">Create a character with a voice, history, personality, relationships, and a world to inhabit. Then let the roleplay unfold together.</p>
            <p className="mx-auto mt-5 max-w-lg text-sm leading-relaxed text-rose-100/75">CHIMERA helps your character stay grounded in the story you build together.</p>
            <button type="button" onClick={nextStep} className="mt-10 inline-flex items-center gap-2 rounded-2xl bg-rose-500 px-7 py-4 text-sm font-extrabold transition hover:bg-rose-400">Explore Storytelling <ArrowRight size={17} /></button>
          </div>
        )}

        {step === 3 && (
          <div className="mx-auto max-w-2xl rounded-[2rem] border border-violet-400/25 bg-gradient-to-br from-violet-500/20 to-[#071729] p-8 text-center shadow-[0_24px_80px_rgba(139,92,246,.14)] sm:p-12">
            <BookOpen className="mx-auto mb-8 text-violet-200" size={38} />
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-violet-200">Storytelling · VELLUM</p>
            <h1 className="mt-4 font-serif text-4xl font-extrabold sm:text-5xl">Worlds with a soul.</h1>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-slate-200 sm:text-lg">Begin with a blank page. Shape worlds, chapters, scenes, and stories in a quieter space made for writing.</p>
            <p className="mx-auto mt-5 max-w-lg text-sm leading-relaxed text-violet-100/75">Your writing is always yours. When you enter Storytelling, your one-time 10,000 VELLUM welcome reserve is there for optional creative support.</p>
            <button type="button" onClick={enterChoice} className="mt-10 inline-flex items-center gap-2 rounded-2xl bg-violet-500 px-7 py-4 text-sm font-extrabold transition hover:bg-violet-400">Choose your creative space <ArrowRight size={17} /></button>
          </div>
        )}

        {step === 4 && <>
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
        <p className="mt-5 text-center text-xs text-slate-400">Your CHIMERA account is your creative home. You can change this preference anytime.</p>
        </>}

        {step > 0 && <button type="button" onClick={previousStep} className="mx-auto mt-8 inline-flex items-center gap-2 text-xs font-bold text-slate-400 transition hover:text-white"><ArrowLeft size={15} /> Back</button>}
      </section>
    </main>
  );
}
