import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { ADULT_CONFIRMATION_LIVE, ADULT_CONFIRMATION_VERSION, AGE_VERIFICATION_LIVE, ADULT_SETTINGS_OPEN } from '../lib/ageVerification';

type AgeStatus = 'unverified' | 'self_attested_adult' | 'verified_adult';

interface Preferences {
  age_verification_status: string | null;
  adult_content_enabled: boolean | null;
}

export default function AdultContentSettingsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(Boolean(user) && ADULT_SETTINGS_OPEN);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<AgeStatus>('unverified');
  const [adultEnabled, setAdultEnabled] = useState(false);
  const [declared, setDeclared] = useState(false);
  const [confirming, setConfirming] = useState(false);
  // What the database allows: a real verification, or the member's own confirmation (the temporary stand-in).
  const verified = status === 'verified_adult';
  const confirmed = status === 'self_attested_adult';
  const eligible = verified || confirmed;

  useEffect(() => {
    if (!user || !ADULT_SETTINGS_OPEN) {
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
        const stored = row?.age_verification_status;
        setStatus(stored === 'verified_adult' || stored === 'self_attested_adult' ? stored : 'unverified');
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

  const confirmAdult = async () => {
    if (!user || !declared) return;
    setConfirming(true);
    const { data, error } = await supabase.rpc('attest_my_adult_status', { p_version: ADULT_CONFIRMATION_VERSION });
    setConfirming(false);
    if (error) {
      showToast('We could not save your confirmation. Please try again.', 'error');
      return;
    }
    setStatus(data === 'verified_adult' ? 'verified_adult' : 'self_attested_adult');
    setDeclared(false);
    showToast('Thank you. You can now choose to show Mature and Adult stories.', 'success');
  };

  const withdrawConfirmation = async () => {
    if (!user) return;
    setConfirming(true);
    const { error } = await supabase.rpc('withdraw_my_adult_attestation');
    setConfirming(false);
    if (error) {
      showToast('We could not withdraw your confirmation. Please try again.', 'error');
      return;
    }
    setStatus('unverified');
    setAdultEnabled(false);
    showToast('Your confirmation is withdrawn. Mature and Adult stories are hidden.', 'success');
  };

  if (!ADULT_SETTINGS_OPEN) {
    return (
      <div className="mx-auto max-w-3xl px-5 pb-10 pt-10 sm:px-8">
        <p className="mb-3 text-center text-sm font-bold tracking-[0.26em] text-chimera-gold">ADULT CONTENT SETTINGS</p>
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
      <p className="mb-3 text-center text-sm font-bold tracking-[0.26em] text-chimera-gold">ADULT CONTENT SETTINGS</p>
      <h1 className="text-center font-serif text-5xl font-semibold leading-[1.05] sm:text-6xl">Your boundaries lead the way.</h1>

      <section className="mt-9 rounded-[22px] border border-chimera-gold/20 bg-chimera-panel px-7 py-3">
        <div className="flex flex-wrap items-center gap-4 border-b border-chimera-gold/15 py-5">
          <div className="min-w-[240px] flex-1">
            <h2 className="font-serif text-2xl font-semibold">Age</h2>
            <p className="text-[15px] text-chimera-mute">
              {AGE_VERIFICATION_LIVE ? 'Mature and Adult stories need a verified age.' : 'Mature and Adult stories are for adults. For now you confirm your age yourself.'}
            </p>
          </div>
          {verified ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-chimera-mint/55 px-4 py-2 text-[15px] font-bold text-green-100"><ShieldCheck size={18} aria-hidden="true" /> Verified adult</span>
          ) : confirmed ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-chimera-gold/55 px-4 py-2 text-[15px] font-bold text-amber-100"><ShieldCheck size={18} aria-hidden="true" /> 18+ confirmed by you</span>
          ) : (
            <span className="rounded-full border border-white/20 px-4 py-2 text-[15px] font-bold text-violet-100/80">Not confirmed</span>
          )}
        </div>

        {!user ? (
          <p className="py-6 text-violet-100/85">
            <Link to="/auth" state={{ from: '/adult-content-settings' }} className="font-bold text-chimera-gold underline">Sign in</Link> to see and change your content settings.
          </p>
        ) : loading ? (
          <p className="py-6 text-chimera-mute">Opening your settings…</p>
        ) : (
          <>
            {!eligible && (
              ADULT_CONFIRMATION_LIVE ? (
                <div className="my-5 rounded-xl border border-chimera-gold/30 bg-chimera-gold/10 px-4 py-4 text-[15px] leading-relaxed text-amber-100">
                  <p>Until you confirm your age, CHIMERA shows General content only. Your account is not affected in any other way.</p>
                  <label className="mt-4 flex cursor-pointer items-start gap-3 text-base font-bold text-violet-50">
                    <input type="checkbox" checked={declared} onChange={(e) => setDeclared(e.target.checked)} className="mt-1 h-5 w-5 accent-[#e8c27a]" />
                    <span>I am 18 years old or older.</span>
                  </label>
                  <p className="mt-2 text-sm text-amber-100/85">
                    Mature and Adult stories can contain intense themes and explicit content. This is your own declaration: CHIMERA does not check it yet, so please confirm only if it is true. When CHIMERA adds a real age check, you may be asked to verify.
                  </p>
                  <button type="button" disabled={!declared || confirming} onClick={() => void confirmAdult()} className="mt-4 inline-flex min-h-[48px] items-center rounded-full bg-chimera-gold px-7 font-bold text-[#1a1208] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">
                    {confirming ? 'Saving…' : 'Confirm'}
                  </button>
                </div>
              ) : (
                <p role="note" className="my-5 rounded-xl border border-chimera-gold/30 bg-chimera-gold/10 px-4 py-3 text-[15px] leading-relaxed text-amber-100">
                  Your age is not verified yet, so CHIMERA shows General content only. Your account is not affected in any other way.
                </p>
              )
            )}
            <label className={`flex items-center gap-5 py-5 ${eligible ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}>
              <span className="min-w-0 flex-1">
                <span className="block font-serif text-2xl font-semibold">Show Mature and Adult stories</span>
                <span className="text-[15px] text-chimera-mute">Intense themes and explicit content, clearly labelled. Off by default.</span>
              </span>
              <input type="checkbox" role="switch" checked={adultEnabled} disabled={!eligible} onChange={(e) => setAdultEnabled(e.target.checked)} className="h-6 w-6 accent-[#e8c27a]" />
            </label>
            <div className="pb-5">
              <button type="button" disabled={!eligible || saving} onClick={() => void save()} className="inline-flex min-h-[48px] items-center rounded-full bg-chimera-gold px-7 font-bold text-[#1a1208] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">
                {saving ? 'Saving…' : 'Save my settings'}
              </button>
            </div>
            {confirmed && (
              <div className="border-t border-chimera-gold/15 py-5">
                <p className="text-[15px] text-chimera-mute">You confirmed that you are 18 or older. You can take that back at any time: Mature and Adult stories are hidden again straight away.</p>
                <button type="button" disabled={confirming} onClick={() => void withdrawConfirmation()} className="mt-3 inline-flex min-h-[44px] items-center rounded-full border border-chimera-gold/50 px-5 font-bold hover:bg-chimera-gold/10 disabled:opacity-50">
                  {confirming ? 'Working…' : 'Withdraw my confirmation'}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
