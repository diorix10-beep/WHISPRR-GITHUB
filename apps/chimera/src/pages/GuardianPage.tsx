import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { AGE_VERIFICATION_LIVE } from '../lib/ageVerification';

interface Preferences {
  age_verification_status: string | null;
  adult_content_enabled: boolean | null;
}

export default function GuardianPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(Boolean(user) && AGE_VERIFICATION_LIVE);
  const [saving, setSaving] = useState(false);
  const [verified, setVerified] = useState(false);
  const [adultEnabled, setAdultEnabled] = useState(false);

  useEffect(() => {
    if (!user || !AGE_VERIFICATION_LIVE) {
      setLoading(false);
      return;
    }
    let active = true;
    supabase
      .from('chimera_user_preferences')
      .select('age_verification_status, adult_content_enabled')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) showToast('We could not load your content settings yet.', 'error');
        const row = data as Preferences | null;
        setVerified(row?.age_verification_status === 'verified_adult');
        setAdultEnabled(Boolean(row?.adult_content_enabled));
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user, showToast]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    // The database refuses to switch adult content on for an unverified account.
    const { error } = await supabase.from('chimera_user_preferences').upsert(
      {
        user_id: user.id,
        adult_content_enabled: adultEnabled,
        adult_eligibility_confirmed_at: adultEnabled ? new Date().toISOString() : null,
      },
      { onConflict: 'user_id' },
    );
    setSaving(false);
    if (error) {
      showToast('We could not save your settings.', 'error');
      return;
    }
    showToast(adultEnabled ? 'Mature and Adult stories are now shown to you.' : 'Mature and Adult stories are hidden.', 'success');
  };

  if (!AGE_VERIFICATION_LIVE) {
    return (
      <div className="mx-auto max-w-3xl px-5 pb-10 pt-10 sm:px-8">
        <p className="mb-3 text-center text-sm font-bold tracking-[0.26em] text-chimera-gold">THE GUARDIAN&apos;S LIBRARY</p>
        <h1 className="text-center font-serif text-5xl font-semibold leading-[1.05] sm:text-6xl">Coming soon.</h1>
        <section className="mt-9 rounded-[22px] border border-chimera-gold/20 bg-chimera-panel px-7 py-8 text-center">
          <ShieldCheck className="mx-auto text-chimera-gold" size={34} aria-hidden="true" />
          <p className="mx-auto mt-4 max-w-xl text-lg text-violet-100/90">
            This is where you will verify your age and choose whether Mature and Adult stories are shown to you.
          </p>
          <p className="mx-auto mt-3 max-w-xl text-[15px] text-chimera-mute">
            Until it opens, CHIMERA shows General content only. Nothing about your account needs to change.
          </p>
          <Link to="/discover" className="mt-6 inline-flex min-h-[48px] items-center rounded-full bg-chimera-gold px-7 font-bold text-[#1a1208] hover:brightness-110">Back to Discover</Link>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-5 pb-10 pt-10 sm:px-8">
      <p className="mb-3 text-center text-sm font-bold tracking-[0.26em] text-chimera-gold">THE GUARDIAN&apos;S LIBRARY</p>
      <h1 className="text-center font-serif text-5xl font-semibold leading-[1.05] sm:text-6xl">Your boundaries lead the way.</h1>

      <section className="mt-9 rounded-[22px] border border-chimera-gold/20 bg-chimera-panel px-7 py-3">
        <div className="flex flex-wrap items-center gap-4 border-b border-chimera-gold/15 py-5">
          <div className="min-w-[240px] flex-1">
            <h2 className="font-serif text-2xl font-semibold">Age</h2>
            <p className="text-[15px] text-chimera-mute">Mature and Adult stories need a verified age.</p>
          </div>
          {verified ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-chimera-mint/55 px-4 py-2 text-[15px] font-bold text-green-100"><ShieldCheck size={18} aria-hidden="true" /> Verified adult</span>
          ) : (
            <span className="rounded-full border border-white/20 px-4 py-2 text-[15px] font-bold text-violet-100/80">Not verified</span>
          )}
        </div>

        {!user ? (
          <p className="py-6 text-violet-100/85">
            <Link to="/auth" state={{ from: '/guardian' }} className="font-bold text-chimera-gold underline">Sign in</Link> to see and change your content settings.
          </p>
        ) : loading ? (
          <p className="py-6 text-chimera-mute">Opening your settings…</p>
        ) : (
          <>
            {!verified && (
              <p role="note" className="my-5 rounded-xl border border-chimera-gold/30 bg-chimera-gold/10 px-4 py-3 text-[15px] leading-relaxed text-amber-100">
                Your age is not verified yet, so CHIMERA shows General content only. Your account is not affected in any other way.
              </p>
            )}
            <label className={`flex items-center gap-5 py-5 ${verified ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}>
              <span className="min-w-0 flex-1">
                <span className="block font-serif text-2xl font-semibold">Show Mature and Adult stories</span>
                <span className="text-[15px] text-chimera-mute">Intense themes and explicit content, clearly labelled. Off by default.</span>
              </span>
              <input type="checkbox" role="switch" checked={adultEnabled} disabled={!verified} onChange={(e) => setAdultEnabled(e.target.checked)} className="h-6 w-6 accent-[#e8c27a]" />
            </label>
            <div className="pb-5">
              <button type="button" disabled={!verified || saving} onClick={() => void save()} className="inline-flex min-h-[48px] items-center rounded-full bg-chimera-gold px-7 font-bold text-[#1a1208] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">
                {saving ? 'Saving…' : 'Save my settings'}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
