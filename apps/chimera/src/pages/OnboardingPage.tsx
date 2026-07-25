import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { MOODS, INTERESTS } from '../types';
import type { Mood, Interest } from '../types';
import {
  ChevronRight, ChevronLeft, Check, MapPin, Loader2, Sparkles, User, Globe, Heart, FileText, BookOpen
} from 'lucide-react';

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7;

const AVATAR_EMOJIS = ['💫', '🌙', '🦋', '🌸', '🎨', '🎵', '🌊', '✨', '🌿', '🔥', '💜', '🌻', '🌈', '🎭', '📖', '🌍', '🎪', '🍀', '🦊', '🐝', '🌺', '💭', '🪐', '⭐'];

const STEP_META = [
  { icon: User, label: 'Identity', title: 'Welcome to CHIMERA', subtitle: "Let's set up your creative identity." },
  { icon: Sparkles, label: 'Avatar', title: 'Choose Your Avatar', subtitle: 'Pick an emoji that represents you.' },
  { icon: Heart, label: 'Mood', title: "What's Your Vibe?", subtitle: 'This helps others understand your energy.' },
  { icon: BookOpen, label: 'Interests', title: 'Pick Your Passions', subtitle: 'Select 2–7 interests that match your world.' },
  { icon: FileText, label: 'Bio', title: 'Write Your Bio', subtitle: 'Tell the world a little about yourself.' },
  { icon: Globe, label: 'Origin', title: 'Where Are You From?', subtitle: 'Your home country personalises your feed.' },
  { icon: Check, label: 'Review', title: 'Ready to Create?', subtitle: "Everything looks good? Let's go!" },
];

interface OnboardingData {
  displayName: string;
  username: string;
  avatarEmoji: string;
  mood: Mood | null;
  interests: Interest[];
  bio: string;
  country: string;
}

export default function OnboardingPage() {
  const { user, profile, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [detectingCountry, setDetectingCountry] = useState(false);

  const [data, setData] = useState<OnboardingData>({
    displayName: profile?.display_name || '',
    username: profile?.username || '',
    avatarEmoji: profile?.avatar_emoji || AVATAR_EMOJIS[0],
    mood: (profile?.mood as Mood) || null,
    interests: (profile?.interests as Interest[]) || [],
    bio: profile?.bio || '',
    country: (profile as any)?.home_country || '',
  });

  const handleDetectCountry = useCallback(async () => {
    setDetectingCountry(true);
    try {
      const res = await fetch('https://ipapi.co/json/');
      const json = await res.json();
      if (json?.country_name) {
        setData(d => ({ ...d, country: json.country_name }));
      }
    } catch { /* silent */ } finally {
      setDetectingCountry(false);
    }
  }, []);

  const checkUsernameUniqueness = useCallback(async (username: string) => {
    if (!username.trim()) { setUsernameError('Username is required'); return false; }
    if (username.length < 3) { setUsernameError('Username must be at least 3 characters'); return false; }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) { setUsernameError('Letters, numbers, and underscores only'); return false; }
    setCheckingUsername(true);
    try {
      const { data: existing } = await supabase.from('profiles').select('id').eq('username', username).maybeSingle();
      if (existing) { setUsernameError('Username is already taken'); setCheckingUsername(false); return false; }
      setUsernameError(null); setCheckingUsername(false); return true;
    } catch {
      setUsernameError('Error checking username availability'); setCheckingUsername(false); return false;
    }
  }, []);

  const handleNext = useCallback(async () => {
    setError(null);
    if (currentStep === 1) {
      if (!data.displayName.trim()) { setError('Display name is required'); return; }
      const ok = await checkUsernameUniqueness(data.username);
      if (!ok) return;
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!data.avatarEmoji) { setError('Please select an avatar'); return; }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (!data.mood) { setError('Please select a vibe'); return; }
      setCurrentStep(4);
    } else if (currentStep === 4) {
      if (data.interests.length < 2 || data.interests.length > 7) { setError('Select between 2 and 7 interests'); return; }
      setCurrentStep(5);
    } else if (currentStep === 5) {
      if (data.bio.length > 200) { setError('Bio must be 200 characters or less'); return; }
      setCurrentStep(6);
    } else if (currentStep === 6) {
      if (!data.country.trim()) { setError('Country is required'); return; }
      setCurrentStep(7);
    }
  }, [currentStep, data, checkUsernameUniqueness]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) { setCurrentStep((currentStep - 1) as Step); setError(null); }
  }, [currentStep]);

  const handleComplete = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      let referredBy: string | null = null;
      const cachedReferrer = localStorage.getItem('whisprr_referrer');
      if (cachedReferrer?.trim() && cachedReferrer !== data.username) {
        const { data: ref } = await supabase.from('profiles').select('user_id').eq('username', cachedReferrer.trim()).maybeSingle();
        if (ref) referredBy = ref.user_id;
      }
      await updateProfile({
        display_name: data.displayName, username: data.username, avatar_emoji: data.avatarEmoji,
        mood: data.mood, interests: data.interests, bio: data.bio || null,
        home_country: data.country, onboarding_complete: true, referred_by: referredBy,
      } as any);
      localStorage.removeItem('whisprr_referrer');
      navigate('/discover');
    } catch (err) {
      setError(err instanceof Error ? `Failed to complete: ${err.message}` : 'Failed to complete. Please try again.');
      setLoading(false);
    }
  }, [user, data, updateProfile, navigate]);

  if (!user) {
    return (
      <div className="min-h-screen bg-warm-50 dark:bg-warm-950 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-red-500" />
      </div>
    );
  }

  const stepMeta = STEP_META[currentStep - 1];
  const StepIcon = stepMeta.icon;
  const progress = (currentStep / 7) * 100;

  return (
    <div className="min-h-screen bg-warm-50 dark:bg-warm-950 flex flex-col relative overflow-hidden">
      
      {/* Ambient blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-64 bg-gradient-to-b from-red-500/8 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-5 sm:px-8 py-4 border-b border-warm-100 dark:border-warm-800">
        <div className="flex items-center gap-2">
          <img src="/chimera_logo.png" alt="CHIMERA" className="w-7 h-7 object-contain" />
          <span className="font-serif font-extrabold text-sm bg-gradient-to-r from-red-500 via-rose-400 to-amber-400 bg-clip-text text-transparent tracking-wider">
            CHIMERA
          </span>
        </div>
        <span className="text-xs font-bold text-warm-400 dark:text-warm-500">
          Step {currentStep} of 7
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative z-10 w-full h-1 bg-warm-100 dark:bg-warm-800">
        <div
          className="h-full bg-gradient-to-r from-red-500 via-rose-400 to-amber-400 transition-all duration-500 ease-out rounded-r-full"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step dots */}
      <div className="relative z-10 flex items-center justify-center gap-2 pt-5 pb-2 px-4">
        {STEP_META.map((meta, i) => {
          const n = i + 1;
          const done = currentStep > n;
          const active = currentStep === n;
          const DotIcon = meta.icon;
          return (
            <div key={n} className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-all ${
                done
                  ? 'bg-gradient-to-br from-red-500 to-rose-400 shadow-md shadow-red-500/30'
                  : active
                  ? 'bg-white dark:bg-warm-800 border-2 border-red-500 shadow-sm'
                  : 'bg-warm-100 dark:bg-warm-800/60 border border-warm-200 dark:border-warm-750'
              }`}>
                {done
                  ? <Check size={14} className="text-white" strokeWidth={3} />
                  : <DotIcon size={13} className={active ? 'text-red-500' : 'text-warm-400 dark:text-warm-500'} />}
              </div>
              <span className={`text-[9px] font-bold uppercase tracking-wider hidden sm:block ${
                active ? 'text-red-500' : done ? 'text-warm-400' : 'text-warm-300 dark:text-warm-600'
              }`}>
                {meta.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex items-start justify-center px-4 py-6">
        <div className="w-full max-w-lg space-y-6 animate-fade-in" key={currentStep}>

          {/* Step header */}
          <div className="text-center space-y-1 px-2">
            <div className={`w-12 h-12 rounded-2xl mx-auto flex items-center justify-center shadow-inner mb-3 ${
              currentStep === 7
                ? 'bg-gradient-to-br from-red-500/15 to-amber-500/10 border border-red-200 dark:border-red-500/20'
                : 'bg-warm-100 dark:bg-warm-800 border border-warm-200 dark:border-warm-750'
            }`}>
              <StepIcon size={22} className={currentStep === 7 ? 'text-red-500' : 'text-warm-500 dark:text-warm-400'} />
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-warm-900 dark:text-white">
              {stepMeta.title}
            </h1>
            <p className="text-sm text-warm-500 dark:text-warm-400 font-medium">{stepMeta.subtitle}</p>
          </div>

          {/* Card */}
          <div className="bg-white dark:bg-warm-900 border border-warm-100 dark:border-warm-800 rounded-3xl shadow-sm p-6 sm:p-8 space-y-5">

            {/* ── Step 1: Identity ── */}
            {currentStep === 1 && (
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-widest text-warm-400 dark:text-warm-500">
                    Display Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-warm-50 dark:bg-warm-800 border border-warm-200 dark:border-warm-700 rounded-2xl text-sm font-semibold text-warm-900 dark:text-white placeholder:text-warm-400 focus:outline-none focus:border-red-400 dark:focus:border-red-500 transition-colors"
                    placeholder="Your display name"
                    value={data.displayName}
                    onChange={(e) => setData({ ...data, displayName: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-widest text-warm-400 dark:text-warm-500">
                    Username
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-warm-400">@</span>
                    <input
                      type="text"
                      className="w-full pl-8 pr-4 py-3 bg-warm-50 dark:bg-warm-800 border border-warm-200 dark:border-warm-700 rounded-2xl text-sm font-semibold text-warm-900 dark:text-white placeholder:text-warm-400 focus:outline-none focus:border-red-400 dark:focus:border-red-500 transition-colors"
                      placeholder="username"
                      value={data.username}
                      onChange={(e) => { setData({ ...data, username: e.target.value }); setUsernameError(null); }}
                      disabled={checkingUsername}
                    />
                  </div>
                  <p className="text-xs text-warm-400 dark:text-warm-500 font-medium">
                    3+ characters · letters, numbers, and underscores only
                  </p>
                  {usernameError && <p className="text-xs text-red-500 font-semibold">{usernameError}</p>}
                </div>
              </div>
            )}

            {/* ── Step 2: Avatar ── */}
            {currentStep === 2 && (
              <div className="grid grid-cols-6 gap-2.5 sm:gap-3">
                {AVATAR_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setData({ ...data, avatarEmoji: emoji })}
                    className={`aspect-square text-2xl sm:text-3xl rounded-2xl transition-all flex items-center justify-center ${
                      data.avatarEmoji === emoji
                        ? 'ring-2 ring-red-500 bg-red-50 dark:bg-red-500/10 scale-110 shadow-md shadow-red-500/20'
                        : 'bg-warm-50 dark:bg-warm-800 hover:bg-warm-100 dark:hover:bg-warm-750 hover:scale-105'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {/* ── Step 3: Mood ── */}
            {currentStep === 3 && (
              <div className="grid grid-cols-2 gap-2.5">
                {MOODS.map((mood) => (
                  <button
                    key={mood}
                    onClick={() => setData({ ...data, mood: mood as Mood })}
                    className={`py-3 px-4 rounded-2xl text-sm font-bold transition-all text-left ${
                      data.mood === mood
                        ? 'bg-gradient-to-r from-red-500 to-rose-400 text-white shadow-md shadow-red-500/25'
                        : 'bg-warm-50 dark:bg-warm-800 text-warm-700 dark:text-warm-300 hover:bg-warm-100 dark:hover:bg-warm-750 border border-warm-100 dark:border-warm-750'
                    }`}
                  >
                    {mood}
                  </button>
                ))}
              </div>
            )}

            {/* ── Step 4: Interests ── */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-warm-400 dark:text-warm-500 font-medium">Select 2–7 interests</span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    data.interests.length >= 2
                      ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'
                      : 'bg-warm-100 dark:bg-warm-800 text-warm-400'
                  }`}>
                    {data.interests.length} / 7
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {INTERESTS.map((interest) => {
                    const selected = data.interests.includes(interest as Interest);
                    return (
                      <button
                        key={interest}
                        onClick={() => {
                          const t = interest as Interest;
                          setData({ ...data, interests: selected
                            ? data.interests.filter(i => i !== t)
                            : data.interests.length < 7 ? [...data.interests, t] : data.interests
                          });
                        }}
                        className={`py-2.5 px-2 rounded-2xl text-xs font-bold transition-all leading-tight text-center ${
                          selected
                            ? 'bg-gradient-to-br from-red-500 to-rose-400 text-white shadow-sm shadow-red-500/20'
                            : 'bg-warm-50 dark:bg-warm-800 text-warm-600 dark:text-warm-300 hover:bg-warm-100 dark:hover:bg-warm-750 border border-warm-100 dark:border-warm-750'
                        }`}
                      >
                        {interest}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Step 5: Bio ── */}
            {currentStep === 5 && (
              <div className="space-y-3">
                <textarea
                  className="w-full px-4 py-3 bg-warm-50 dark:bg-warm-800 border border-warm-200 dark:border-warm-700 rounded-2xl text-sm font-medium text-warm-900 dark:text-white placeholder:text-warm-400 focus:outline-none focus:border-red-400 dark:focus:border-red-500 transition-colors resize-none leading-relaxed"
                  placeholder="Tell the world a little about yourself... (optional)"
                  rows={6}
                  maxLength={200}
                  value={data.bio}
                  onChange={(e) => setData({ ...data, bio: e.target.value })}
                />
                <div className="flex justify-between items-center">
                  <p className="text-xs text-warm-400 font-medium">Optional — you can always update this later.</p>
                  <span className={`text-xs font-bold tabular-nums ${data.bio.length > 180 ? 'text-amber-500' : 'text-warm-400'}`}>
                    {data.bio.length}/200
                  </span>
                </div>
              </div>
            )}

            {/* ── Step 6: Country ── */}
            {currentStep === 6 && (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleDetectCountry}
                  disabled={detectingCountry}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-2xl text-sm font-bold transition-all hover:bg-red-100 dark:hover:bg-red-500/20 disabled:opacity-50"
                >
                  {detectingCountry ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />}
                  {detectingCountry ? 'Detecting your location…' : 'Detect My Country Automatically'}
                </button>

                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-warm-100 dark:bg-warm-800" />
                  <span className="text-xs text-warm-400 font-medium">or type manually</span>
                  <div className="h-px flex-1 bg-warm-100 dark:bg-warm-800" />
                </div>

                <input
                  type="text"
                  className="w-full px-4 py-3 bg-warm-50 dark:bg-warm-800 border border-warm-200 dark:border-warm-700 rounded-2xl text-sm font-semibold text-warm-900 dark:text-white placeholder:text-warm-400 focus:outline-none focus:border-red-400 dark:focus:border-red-500 transition-colors"
                  placeholder="e.g. Senegal, Canada, Japan…"
                  value={data.country}
                  onChange={(e) => setData({ ...data, country: e.target.value })}
                />

                {data.country && (
                  <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl">
                    <span className="text-2xl">🏠</span>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-red-400">Home Country</p>
                      <p className="text-base font-bold text-warm-900 dark:text-white font-serif">{data.country}</p>
                    </div>
                  </div>
                )}
                <p className="text-xs text-warm-400 dark:text-warm-500 font-medium text-center">
                  Personalises your feed and local communities.
                </p>
              </div>
            )}

            {/* ── Step 7: Review ── */}
            {currentStep === 7 && (
              <div className="space-y-4">
                {/* Profile preview */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-50 to-warm-50 dark:from-red-900/10 dark:to-warm-800/50 border border-red-100 dark:border-red-500/15 p-6 text-center">
                  <div className="text-6xl mb-3">{data.avatarEmoji}</div>
                  <h2 className="font-serif text-xl font-extrabold text-warm-900 dark:text-white">{data.displayName}</h2>
                  <p className="text-sm text-warm-400 font-medium">@{data.username}</p>
                  {data.bio && <p className="text-xs text-warm-500 dark:text-warm-400 mt-2 leading-relaxed max-w-xs mx-auto">{data.bio}</p>}
                </div>

                {/* Summary rows */}
                <div className="space-y-2">
                  {[
                    { label: 'Mood', value: data.mood },
                    { label: 'From', value: `🌍 ${data.country}` },
                  ].map(({ label, value }) => value && (
                    <div key={label} className="flex items-center justify-between px-4 py-3 bg-warm-50 dark:bg-warm-800 rounded-2xl border border-warm-100 dark:border-warm-750">
                      <span className="text-xs font-bold uppercase tracking-widest text-warm-400">{label}</span>
                      <span className="text-sm font-bold text-warm-800 dark:text-warm-200">{value}</span>
                    </div>
                  ))}
                </div>

                {/* Interests */}
                {data.interests.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-black uppercase tracking-widest text-warm-400 px-1">Interests</p>
                    <div className="flex flex-wrap gap-1.5">
                      {data.interests.map((i) => (
                        <span key={i} className="px-3 py-1.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/20 rounded-full text-xs font-bold">
                          {i}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mt-2 px-4 py-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-2xl">
                <p className="text-xs font-semibold text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex gap-3 pb-8">
            {currentStep > 1 && (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-5 py-3 bg-warm-100 dark:bg-warm-800 text-warm-700 dark:text-warm-200 font-bold text-sm rounded-2xl border border-warm-200 dark:border-warm-700 hover:bg-warm-200 dark:hover:bg-warm-750 transition-all active:scale-[0.98]"
              >
                <ChevronLeft size={16} />
                Back
              </button>
            )}
            {currentStep < 7 ? (
              <button
                onClick={handleNext}
                disabled={checkingUsername && currentStep === 1}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-rose-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-red-500/25 hover:shadow-red-500/35 hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {checkingUsername && currentStep === 1 ? (
                  <><Loader2 size={16} className="animate-spin" /> Checking…</>
                ) : (
                  <>Continue <ChevronRight size={16} /></>
                )}
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-rose-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-red-500/25 hover:shadow-red-500/35 hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <><Loader2 size={16} className="animate-spin" /> Creating your profile…</>
                ) : (
                  <><Sparkles size={16} /> Enter CHIMERA</>
                )}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
