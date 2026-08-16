import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronRight,
  Eye,
  Feather,
  LifeBuoy,
  LockKeyhole,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UsersRound,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

type LibrarySection = 'guardian' | 'control' | 'adult' | 'creators' | 'boundaries' | 'help';

interface LibraryCard {
  id: LibrarySection;
  label: string;
  summary: string;
  icon: typeof ShieldCheck;
}

const libraryCards: LibraryCard[] = [
  { id: 'guardian', label: 'The Guardian', summary: 'A quiet system of care behind the story.', icon: ShieldCheck },
  { id: 'control', label: 'Your story, your control', summary: 'Clear choices around your space and your voice.', icon: Eye },
  { id: 'adult', label: 'Adult storytelling', summary: 'Mature fiction is opt-in and clearly signposted.', icon: LockKeyhole },
  { id: 'creators', label: 'Creator promises', summary: 'Honest labels help readers find the right story.', icon: Feather },
  { id: 'boundaries', label: 'Community boundaries', summary: 'A creative home with room for consent and care.', icon: UsersRound },
  { id: 'help', label: 'Help & report', summary: 'A clear way to ask for support when something is wrong.', icon: LifeBuoy },
];

const sectionCopy: Record<LibrarySection, { eyebrow: string; title: string; intro: string; points: string[] }> = {
  guardian: {
    eyebrow: "THE GUARDIAN'S LIBRARY",
    title: 'The Guardian',
    intro: 'A quiet layer of care behind CHIMERA — built to protect choice without interrupting the voices inside your story.',
    points: [
      'The Guardian is CHIMERA’s system-level care layer, not a roleplay character.',
      'When a safety boundary matters, CHIMERA should protect the space without making a character sound like a moderator.',
      'You can always leave a story, change your preferences, or ask for help from this library.',
    ],
  },
  control: {
    eyebrow: "THE GUARDIAN'S LIBRARY",
    title: 'Your story, your control',
    intro: 'Your CHIMERA space should feel like yours: choose what you discover, decide what you share, and keep your creative boundaries visible.',
    points: [
      'Discover controls decide which kinds of public creations you want surfaced to you.',
      'Character ratings, warnings, and privacy choices should be readable before a story begins.',
      'You can revisit these choices whenever your comfort or curiosity changes.',
    ],
  },
  adult: {
    eyebrow: "THE GUARDIAN'S LIBRARY",
    title: 'Adult Storytelling',
    intro: 'Imagination has room to breathe. Your boundaries lead the way.',
    points: [
      'Mature content is off until you choose otherwise.',
      'Adult spaces are for members who confirm that they are 18 or older.',
      'Creators label characters and stories clearly so you can choose before you enter.',
    ],
  },
  creators: {
    eyebrow: "THE GUARDIAN'S LIBRARY",
    title: 'Creator promises',
    intro: 'A good doorway tells people what kind of story waits on the other side.',
    points: [
      'Creators should choose an accurate content rating and give meaningful warnings where they are needed.',
      'Fictionalized portrayals must not pretend to be real people or fabricate authentic statements from them.',
      'Public creations should describe their tone, boundaries, and intended audience with care.',
    ],
  },
  boundaries: {
    eyebrow: "THE GUARDIAN'S LIBRARY",
    title: 'Community boundaries',
    intro: 'CHIMERA can hold romance, drama, darkness, and tenderness — without making harm, fraud, or coercion part of the creative bargain.',
    points: [
      'Sexual content involving anyone under 18 is never allowed.',
      'Harassment, deception, scams, and pretending an AI is a real person do not belong here.',
      'Consent, clear ratings, and respectful boundaries make a wider range of fiction possible for adults who want it.',
    ],
  },
  help: {
    eyebrow: "THE GUARDIAN'S LIBRARY",
    title: 'Help & report',
    intro: 'If a creation, person, or experience feels wrong, you should not have to guess where to go next.',
    points: [
      'Use the report option attached to a public creation whenever it is available.',
      'For account, safety, or payment help, contact the CHIMERA support team with as much context as you can safely share.',
      'You can also return here to adjust your content preferences before discovering more stories.',
    ],
  },
};

export default function TrustPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const preferencesRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState<LibrarySection>('adult');
  const [matureEnabled, setMatureEnabled] = useState(false);
  const [adultConfirmed, setAdultConfirmed] = useState(false);
  const [loadingPreferences, setLoadingPreferences] = useState(Boolean(user));
  const [savingPreferences, setSavingPreferences] = useState(false);

  useEffect(() => {
    let isCurrent = true;

    const loadPreferences = async () => {
      if (!user) {
        if (isCurrent) setLoadingPreferences(false);
        return;
      }

      setLoadingPreferences(true);
      const { data, error } = await supabase
        .from('chimera_user_preferences')
        .select('adult_content_enabled, adult_eligibility_confirmed_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!isCurrent) return;
      if (error) {
        showToast('CHIMERA could not load your content preferences yet.', 'error');
      } else if (data) {
        setMatureEnabled(Boolean(data.adult_content_enabled));
        setAdultConfirmed(Boolean(data.adult_eligibility_confirmed_at));
      }
      setLoadingPreferences(false);
    };

    void loadPreferences();
    return () => { isCurrent = false; };
  }, [showToast, user]);

  const openSection = (section: LibrarySection) => {
    setActiveSection(section);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showPreferences = () => {
    preferencesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const savePreferences = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (matureEnabled && !adultConfirmed) {
      showToast('Please confirm that you are 18+ before enabling mature content.', 'error');
      return;
    }

    setSavingPreferences(true);
    const { error } = await supabase
      .from('chimera_user_preferences')
      .upsert({
        user_id: user.id,
        adult_content_enabled: matureEnabled,
        adult_eligibility_confirmed_at: matureEnabled ? new Date().toISOString() : null,
      }, { onConflict: 'user_id' });

    setSavingPreferences(false);
    if (error) {
      showToast('CHIMERA could not save your content preferences yet.', 'error');
      return;
    }

    setAdultConfirmed(matureEnabled);
    showToast(matureEnabled ? 'Mature content is now enabled for your Discover.' : 'Mature content is now hidden from your Discover.', 'success');
  };

  const current = sectionCopy[activeSection];

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[#060813] text-[#f7ecd4]"
      style={{
        backgroundImage: "linear-gradient(180deg, rgba(5, 7, 17, 0.7) 0%, rgba(5, 7, 17, 0.9) 46%, #060813 100%), url('/guardian-library-night-v1.png')",
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(47,39,84,0.14),transparent_37%)]" />

      <header className="relative z-10 border-b border-[#b78a42]/60 bg-[#060813]/70 backdrop-blur-xl">
        <div className="mx-auto flex h-[88px] max-w-6xl items-center justify-between px-5 sm:px-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-[#e7bc69] transition hover:bg-[#e7bc69]/10 focus:outline-none focus:ring-2 focus:ring-[#e7bc69]"
            aria-label="Go back"
          >
            <ArrowLeft size={30} strokeWidth={1.8} />
          </button>
          <div className="text-center leading-none">
            <Sparkles className="mx-auto mb-0.5 text-[#e7bc69]" size={21} strokeWidth={1.4} />
            <p className="font-serif text-3xl tracking-[0.16em] text-[#f0c56f] sm:text-4xl">CHIMERA</p>
          </div>
          <div className="h-11 w-11" aria-hidden="true" />
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-6xl px-5 pb-20 pt-10 sm:px-8 sm:pt-16">
        <section className="mx-auto max-w-3xl text-center">
          <p className="mb-5 flex items-center justify-center gap-3 text-xs font-semibold tracking-[0.3em] text-[#d4a85d] sm:text-sm">
            <span className="h-px w-8 bg-[#a97b36] sm:w-14" />
            {current.eyebrow}
            <span className="h-px w-8 bg-[#a97b36] sm:w-14" />
          </p>
          <h1 className="font-serif text-5xl leading-none text-[#f6e8ca] sm:text-7xl">{current.title}</h1>
          {activeSection === 'adult' && (
            <div className="mx-auto mt-6 flex h-20 w-20 items-center justify-center rounded-full border border-[#d8ac5b] bg-[#1e162c]/80 text-3xl font-serif text-[#f1ce8b] shadow-[0_0_30px_rgba(214,168,86,0.16)]">
              18+
            </div>
          )}
          <p className="mx-auto mt-7 max-w-2xl font-serif text-2xl leading-snug text-[#c9b0d6] sm:text-3xl">{current.intro}</p>
          <div className="mx-auto mt-7 h-px w-48 bg-gradient-to-r from-transparent via-[#d7ad62] to-transparent" />
        </section>

        <section className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-2">
          {libraryCards.map(({ id, label, summary, icon: Icon }) => {
            const isActive = activeSection === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => openSection(id)}
                className={`group rounded-2xl border p-5 text-left backdrop-blur-md transition focus:outline-none focus:ring-2 focus:ring-[#e7bc69] ${
                  isActive
                    ? 'border-[#e4ba68] bg-[#291b39]/90 shadow-[0_0_32px_rgba(203,150,65,0.17)]'
                    : 'border-[#927240]/65 bg-[#160f21]/80 hover:border-[#d4a75c] hover:bg-[#21162f]/90'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[#c69a52]/80 bg-[#100d1a] text-[#dfb567]">
                    <Icon size={27} strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-serif text-2xl text-[#f5e5c4]">{label}</h2>
                    <p className="mt-1 text-sm leading-relaxed text-[#c6afd2]">{summary}</p>
                  </div>
                  <ChevronRight className="shrink-0 text-[#d9ac5d] transition group-hover:translate-x-0.5" size={24} />
                </div>
              </button>
            );
          })}
        </section>

        <section className="mx-auto mt-9 max-w-4xl rounded-[26px] border border-[#a98248] bg-[#110d1a]/90 p-6 shadow-2xl backdrop-blur-xl sm:p-9" aria-live="polite">
          <div className="flex items-start gap-4">
            <div className="mt-1 rounded-full border border-[#c99d54] bg-[#261b33] p-3 text-[#e1b568]">
              <BookOpen size={24} strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-xs font-semibold tracking-[0.22em] text-[#d9aa60]">READ WITH CARE</p>
              <h2 className="mt-2 font-serif text-3xl text-[#f6e8ca]">{current.title}</h2>
            </div>
          </div>
          <ul className="mt-6 space-y-4 border-t border-[#806239]/60 pt-6 text-base leading-relaxed text-[#d1c0d4] sm:text-lg">
            {current.points.map((point) => (
              <li key={point} className="flex gap-3">
                <Check className="mt-1 shrink-0 text-[#e3b869]" size={19} />
                <span>{point}</span>
              </li>
            ))}
          </ul>

          {activeSection === 'adult' && (
            <div className="mt-8 flex flex-wrap gap-3">
              <button type="button" onClick={showPreferences} className="rounded-xl border border-[#dfb365] bg-[#2b1d38] px-4 py-2.5 text-sm font-semibold text-[#f4d79c] transition hover:bg-[#392748] focus:outline-none focus:ring-2 focus:ring-[#e7bc69]">
                Open content preferences
              </button>
              <button type="button" onClick={() => navigate('/terms')} className="rounded-xl border border-[#8c6c3d] px-4 py-2.5 text-sm font-semibold text-[#dfc89c] transition hover:border-[#d9af64] hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-[#e7bc69]">
                Read the Adult Storytelling Promise
              </button>
            </div>
          )}

          {activeSection === 'control' && (
            <div className="mt-8 flex flex-wrap gap-3">
              <button type="button" onClick={showPreferences} className="rounded-xl border border-[#dfb365] bg-[#2b1d38] px-4 py-2.5 text-sm font-semibold text-[#f4d79c] transition hover:bg-[#392748] focus:outline-none focus:ring-2 focus:ring-[#e7bc69]">
                Choose my Discover
              </button>
              <button type="button" onClick={() => navigate('/privacy')} className="rounded-xl border border-[#8c6c3d] px-4 py-2.5 text-sm font-semibold text-[#dfc89c] transition hover:border-[#d9af64] hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-[#e7bc69]">
                Privacy policy
              </button>
            </div>
          )}

          {activeSection === 'help' && (
            <a href="mailto:help@whisprr.xyz?subject=CHIMERA%20support%20request" className="mt-8 inline-flex rounded-xl border border-[#dfb365] bg-[#2b1d38] px-4 py-2.5 text-sm font-semibold text-[#f4d79c] transition hover:bg-[#392748] focus:outline-none focus:ring-2 focus:ring-[#e7bc69]">
              Contact CHIMERA support
            </a>
          )}
        </section>

        <section ref={preferencesRef} className="mx-auto mt-8 max-w-4xl rounded-[26px] border border-[#e0b764] bg-[#0d0d18]/90 p-6 shadow-[0_0_35px_rgba(213,165,73,0.13)] backdrop-blur-xl sm:p-9">
          <div className="flex items-center gap-4">
            <div className="rounded-full border border-[#c99d54] bg-[#1c1725] p-3 text-[#e1b568]"><SlidersHorizontal size={24} strokeWidth={1.5} /></div>
            <div>
              <h2 className="font-serif text-3xl text-[#f6e8ca]">Content Preferences</h2>
              <p className="mt-1 text-[#c7afd3]">Choose what belongs in your Discover.</p>
            </div>
          </div>

          {!user ? (
            <div className="mt-7 rounded-2xl border border-[#82643b] bg-[#1b1523] p-5">
              <p className="text-[#e0ccdd]">Sign in to save your content preferences to your CHIMERA account.</p>
              <button type="button" onClick={() => navigate('/auth')} className="mt-4 rounded-xl bg-gradient-to-r from-[#c99642] to-[#f0ce88] px-5 py-3 font-semibold text-[#1c1208] transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[#f3d38c]">Sign in</button>
            </div>
          ) : loadingPreferences ? (
            <p className="mt-7 text-[#c7afd3]">Opening your preferences…</p>
          ) : (
            <div className="mt-7 space-y-5">
              <label className="flex cursor-pointer items-start gap-4 rounded-2xl border border-[#725a3c] bg-[#181421] p-5 transition hover:border-[#b98e4d]">
                <input type="checkbox" checked={matureEnabled} onChange={(event) => setMatureEnabled(event.target.checked)} className="mt-1 h-5 w-5 accent-[#d5aa5c]" />
                <span>
                  <span className="block font-serif text-2xl text-[#f3e4c5]">Show mature stories in my Discover</span>
                  <span className="mt-1 block leading-relaxed text-[#c5b1cf]">This is off by default. Enabling it can surface clearly labelled mature fictional content.</span>
                </span>
              </label>

              {matureEnabled && (
                <label className="flex cursor-pointer items-start gap-4 rounded-2xl border border-[#9a7440] bg-[#23182d] p-5">
                  <input type="checkbox" checked={adultConfirmed} onChange={(event) => setAdultConfirmed(event.target.checked)} className="mt-1 h-5 w-5 accent-[#d5aa5c]" />
                  <span>
                    <span className="block font-semibold text-[#f3e4c5]">I confirm that I am 18+ and choose to see mature content.</span>
                    <span className="mt-1 block text-sm leading-relaxed text-[#c5b1cf]">This is an account confirmation, not third-party identity verification. You can turn this preference off at any time.</span>
                  </span>
                </label>
              )}

              <button type="button" disabled={savingPreferences} onClick={savePreferences} className="w-full rounded-xl border border-[#f0cf8e] bg-[linear-gradient(105deg,#aa7532,#efcf8c,#b88642)] px-6 py-4 font-serif text-2xl text-[#1c1107] shadow-[0_0_24px_rgba(229,185,99,0.2)] transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#f5d898]">
                {savingPreferences ? 'Saving your preferences…' : 'Save my preferences'}
              </button>
            </div>
          )}
        </section>

        <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm text-[#c4a6d1]">
          <button type="button" onClick={() => navigate('/terms')} className="underline decoration-dotted underline-offset-4 transition hover:text-[#f0d28e]">Terms of Service</button>
          <button type="button" onClick={() => navigate('/privacy')} className="underline decoration-dotted underline-offset-4 transition hover:text-[#f0d28e]">Privacy Policy</button>
          <a href="mailto:help@whisprr.xyz?subject=CHIMERA%20support%20request" className="underline decoration-dotted underline-offset-4 transition hover:text-[#f0d28e]">Contact support</a>
        </div>
      </div>
    </main>
  );
}
