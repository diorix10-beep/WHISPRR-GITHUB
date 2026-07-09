import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { MOODS, INTERESTS } from '../types';
import type { Mood, Interest } from '../types';
import { Avatar } from '../components/common/Avatar';
import { PhotoUpload } from '../components/common/PhotoUpload';

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7;

interface OnboardingData {
  displayName: string;
  username: string;
  photoUrl: string | null;
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
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [detectingCountry, setDetectingCountry] = useState(false);

  const handleDetectCountry = useCallback(async () => {
    setDetectingCountry(true);
    try {
      const res = await fetch('https://ipapi.co/json/');
      const json = await res.json();
      if (json && json.country_name) {
        setData(d => ({ ...d, country: json.country_name }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDetectingCountry(false);
    }
  }, []);

  const [data, setData] = useState<OnboardingData>({
    displayName: profile?.display_name || '',
    username: profile?.username || '',
    photoUrl: profile?.photo_url || null,
    mood: (profile?.mood as Mood) || null,
    interests: (profile?.interests as Interest[]) || [],
    bio: profile?.bio || '',
    country: (profile as any)?.home_country || 'Senegal',
  });

  // Check username uniqueness
  const checkUsernameUniqueness = useCallback(async (username: string) => {
    if (!username.trim()) {
      setUsernameError('Username is required');
      return false;
    }

    if (username.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      return false;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setUsernameError('Username can only contain letters, numbers, and underscores');
      return false;
    }

    setCheckingUsername(true);
    try {
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .maybeSingle();

      if (existingUser) {
        setUsernameError('Username is already taken');
        setCheckingUsername(false);
        return false;
      }

      setUsernameError(null);
      setCheckingUsername(false);
      return true;
    } catch (err) {
      setUsernameError('Error checking username availability');
      setCheckingUsername(false);
      return false;
    }
  }, []);

  const handleNext = useCallback(async () => {
    setError(null);

    if (currentStep === 1) {
      if (!data.displayName.trim()) {
        setError('Display name is required');
        return;
      }

      const isUsernameValid = await checkUsernameUniqueness(data.username);
      if (!isUsernameValid) return;

      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Photo upload is optional, just proceed
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (!data.mood) {
        setError('Please select a mood');
        return;
      }
      setCurrentStep(4);
    } else if (currentStep === 4) {
      if (data.interests.length < 2 || data.interests.length > 7) {
        setError('Please select between 2 and 7 interests');
        return;
      }
      setCurrentStep(5);
    } else if (currentStep === 5) {
      if (data.bio.length > 200) {
        setError('Bio must be 200 characters or less');
        return;
      }
      setCurrentStep(6);
    } else if (currentStep === 6) {
      if (!data.country.trim()) {
        setError('Country is required');
        return;
      }
      setCurrentStep(7);
    }
  }, [currentStep, data, checkUsernameUniqueness]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
      setError(null);
    }
  }, [currentStep]);

  const handleComplete = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      let referredBy: string | null = null;
      const cachedReferrer = localStorage.getItem('whisprr_referrer');
      if (cachedReferrer && cachedReferrer.trim() && cachedReferrer !== data.username) {
        // Resolve username to user_id
        const { data: referrerProfile } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('username', cachedReferrer.trim())
          .maybeSingle();
        if (referrerProfile) {
          referredBy = referrerProfile.user_id;
        }
      }

      await updateProfile({
        display_name: data.displayName,
        username: data.username,
        photo_url: data.photoUrl,
        mood: data.mood,
        interests: data.interests,
        bio: data.bio || null,
        home_country: data.country,
        onboarding_complete: true,
        referred_by: referredBy,
      } as any);

      // Clear cached referrer after successful consumption
      localStorage.removeItem('whisprr_referrer');

      navigate('/feed');
    } catch (err) {
      console.error('Onboarding submission failed:', err);
      setError(err instanceof Error ? `Failed to complete onboarding: ${err.message}` : 'Failed to complete onboarding. Please try again.');
      setLoading(false);
    }
  }, [user, data, updateProfile, navigate]);

  if (!user) {
    return (
      <div className="min-h-screen bg-warm-50 dark:bg-warm-950 flex items-center justify-center">
        <p className="text-warm-600 dark:text-warm-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-50 dark:bg-warm-950 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            {[1, 2, 3, 4, 5, 6, 7].map((step) => (
              <div
                key={step}
                className={`h-2 flex-1 rounded-full mx-1 transition-colors ${
                  step <= currentStep ? 'bg-primary-500' : 'bg-gray-300 dark:bg-warm-700'
                }`}
              />
            ))}
          </div>
          <p className="text-center text-sm text-warm-600 dark:text-warm-400 font-sans">
            Step {currentStep} of 7
          </p>
        </div>

        {/* Main Wrapper */}
        <div className={currentStep === 2 ? "mb-8" : "card bg-white dark:bg-warm-800 rounded-3xl shadow-warm p-8 mb-8"}>
          {/* Step 1: Display Name & Username */}
          {currentStep === 1 && (
            <div>
              <h1 className="text-3xl sm:text-4xl font-serif font-bold text-warm-900 dark:text-warm-50 mb-2 tracking-tight leading-tight">
                Welcome to WHISPRR
              </h1>
              <p className="text-warm-600 dark:text-warm-300 mb-8 font-sans">
                Let's set up your profile. Start with your name and username.
              </p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-sans font-semibold text-warm-700 dark:text-warm-200 mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    className="input-field w-full px-4 py-3 border-2 border-warm-200 dark:border-warm-700 rounded-lg font-sans focus:outline-none focus:border-primary-500 transition-colors bg-white dark:bg-warm-900 text-warm-900 dark:text-warm-100"
                    placeholder="Your display name"
                    value={data.displayName}
                    onChange={(e) =>
                      setData({ ...data, displayName: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-sans font-semibold text-warm-700 dark:text-warm-200 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    className="input-field w-full px-4 py-3 border-2 border-warm-200 dark:border-warm-700 rounded-lg font-sans focus:outline-none focus:border-primary-500 transition-colors bg-white dark:bg-warm-900 text-warm-900 dark:text-warm-100"
                    placeholder="username"
                    value={data.username}
                    onChange={(e) => {
                      setData({ ...data, username: e.target.value });
                      setUsernameError(null);
                    }}
                    disabled={checkingUsername}
                  />
                  <p className="text-xs text-warm-500 dark:text-warm-400 mt-2 font-sans">
                    3+ characters, letters, numbers, and underscores only
                  </p>
                  {usernameError && (
                    <p className="text-xs text-error-500 mt-2 font-sans">
                      {usernameError}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Avatar Selection */}
          {currentStep === 2 && (
            <div className="flex flex-col items-center justify-center py-12 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h1 className="text-4xl sm:text-5xl font-serif font-bold text-warm-900 dark:text-warm-50 mb-4 tracking-tight leading-tight text-center">
                Add a Profile Photo
              </h1>
              <p className="text-lg text-warm-600 dark:text-warm-300 mb-12 font-sans text-center max-w-md">
                A profile photo helps people recognize you. You can always change it later.
              </p>

              <div className="relative group mb-12">
                <div className="rounded-full shadow-2xl ring-8 ring-white dark:ring-warm-800 transition-transform duration-300 hover:scale-105">
                  <Avatar 
                    src={data.photoUrl} 
                    fallback={data.displayName?.charAt(0) || '?'} 
                    size={180} 
                  />
                </div>
              </div>

              <button
                onClick={() => setShowPhotoUpload(true)}
                className="btn-primary w-full max-w-xs py-4 text-lg font-semibold rounded-2xl mb-6 shadow-xl hover:-translate-y-1 transition-all"
              >
                Upload Photo
              </button>

              <button
                onClick={() => setCurrentStep(3)}
                className="text-warm-500 hover:text-warm-700 dark:hover:text-warm-300 font-semibold transition-colors"
              >
                Skip for now
              </button>

              <PhotoUpload
                isOpen={showPhotoUpload}
                onClose={() => setShowPhotoUpload(false)}
                currentPhotoUrl={data.photoUrl}
                onPhotoUpdated={(url) => setData({ ...data, photoUrl: url })}
              />
            </div>
          )}

          {/* Step 3: Mood Selection */}
          {currentStep === 3 && (
            <div>
              <h1 className="text-3xl sm:text-4xl font-serif font-bold text-warm-900 dark:text-warm-50 mb-2 tracking-tight leading-tight">
                What's Your Current Mood?
              </h1>
              <p className="text-warm-600 dark:text-warm-300 mb-8 font-sans">
                This helps others understand your energy
              </p>

              <div className="grid grid-cols-2 gap-3">
                {MOODS.map((mood) => (
                  <button
                    key={mood}
                    className={`btn-primary py-3 px-4 rounded-lg font-sans font-semibold transition-all ${
                      data.mood === mood
                        ? 'bg-primary-500 text-white'
                        : 'bg-warm-100 text-warm-700 hover:bg-warm-200 dark:bg-warm-700 dark:text-warm-200 dark:hover:bg-warm-600'
                    }`}
                    onClick={() => setData({ ...data, mood: mood as Mood })}
                  >
                    {mood}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Interests Selection */}
          {currentStep === 4 && (
            <div>
              <h1 className="text-3xl sm:text-4xl font-serif font-bold text-warm-900 dark:text-warm-50 mb-2 tracking-tight leading-tight">
                Pick Your Interests
              </h1>
              <p className="text-warm-600 dark:text-warm-300 mb-4 font-sans">
                Select 2-7 interests that match your passions
              </p>
              <p className="text-sm text-warm-500 dark:text-warm-400 mb-8 font-sans">
                Selected: {data.interests.length}
              </p>

              <div className="grid grid-cols-3 gap-3">
                {INTERESTS.map((interest) => (
                  <button
                    key={interest}
                    className={`btn-primary py-3 px-4 rounded-lg font-sans font-semibold transition-all ${
                      data.interests.includes(interest as Interest)
                        ? 'bg-primary-500 text-white'
                        : 'bg-warm-100 text-warm-700 hover:bg-warm-200 dark:bg-warm-700 dark:text-warm-200 dark:hover:bg-warm-600'
                    }`}
                    onClick={() => {
                      const interestTyped = interest as Interest;
                      if (data.interests.includes(interestTyped)) {
                        setData({
                          ...data,
                          interests: data.interests.filter(
                            (i) => i !== interestTyped
                          ),
                        });
                      } else if (data.interests.length < 7) {
                        setData({
                          ...data,
                          interests: [...data.interests, interestTyped],
                        });
                      }
                    }}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Bio */}
          {currentStep === 5 && (
            <div>
              <h1 className="text-3xl sm:text-4xl font-serif font-bold text-warm-900 dark:text-warm-50 mb-2 tracking-tight leading-tight">
                Write Your Bio
              </h1>
              <p className="text-warm-600 dark:text-warm-300 mb-8 font-sans">
                Tell others a bit about yourself (optional)
              </p>

              <div>
                <textarea
                  className="w-full px-4 py-3 border-2 border-warm-200 dark:border-warm-700 rounded-lg font-sans focus:outline-none focus:border-primary-500 transition-colors resize-none bg-white dark:bg-warm-900 text-warm-900 dark:text-warm-100 placeholder:text-warm-400"
                  placeholder="Write something about yourself..."
                  rows={6}
                  maxLength={200}
                  value={data.bio}
                  onChange={(e) => setData({ ...data, bio: e.target.value })}
                />
                <p className="text-xs text-warm-500 dark:text-warm-400 mt-2 font-sans">
                  {data.bio.length}/200 characters
                </p>
              </div>
            </div>
          )}

          {/* Step 6: Country Selection */}
          {currentStep === 6 && (
            <div>
              <h1 className="text-3xl sm:text-4xl font-serif font-bold text-warm-900 dark:text-warm-50 mb-2 tracking-tight leading-tight">
                🌍 Where Are You From?
              </h1>
              <p className="text-warm-600 dark:text-warm-300 mb-8 font-sans">
                Your home country personalizes your feed and local communities. You can always explore other countries later.
              </p>

              <div className="space-y-4">
                <button
                  type="button"
                  onClick={handleDetectCountry}
                  disabled={detectingCountry}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 border-2 border-primary-300 rounded-xl font-sans font-semibold text-primary-700 hover:bg-primary-50 dark:hover:bg-primary-950/20 transition-colors disabled:opacity-50"
                >
                  {detectingCountry ? '🔍 Detecting...' : '📍 Detect My Country Automatically'}
                </button>

                <p className="text-center text-xs text-warm-400 dark:text-warm-500 font-sans">— or type your country —</p>

                <input
                  type="text"
                  className="w-full px-4 py-3 border-2 border-warm-200 dark:border-warm-700 rounded-xl font-sans focus:outline-none focus:border-primary-500 transition-colors bg-white dark:bg-warm-900 text-warm-900 dark:text-warm-100"
                  placeholder="e.g. Senegal, Canada, Japan..."
                  value={data.country}
                  onChange={(e) => setData({ ...data, country: e.target.value })}
                />

                {data.country && (
                  <div className="p-4 bg-primary-50 dark:bg-primary-950/20 border border-primary-200 dark:border-primary-800 rounded-xl flex items-center gap-3">
                    <span className="text-2xl">🏠</span>
                    <div>
                      <p className="text-xs text-primary-600 font-semibold font-sans uppercase tracking-wide">Your Home Country</p>
                      <p className="text-lg font-serif font-bold text-primary-700">{data.country}</p>
                    </div>
                  </div>
                )}

                <p className="text-xs text-warm-400 dark:text-warm-500 text-center font-sans">
                  This helps surface local creators, communities, and trends. You can always explore any country's WHISPRR space freely.
                </p>
              </div>
            </div>
          )}

          {/* Step 7: Review */}
          {currentStep === 7 && (
            <div>
              <h1 className="text-3xl sm:text-4xl font-serif font-bold text-warm-900 dark:text-warm-50 mb-2 tracking-tight leading-tight">
                Review Your Profile
              </h1>
              <p className="text-warm-600 dark:text-warm-300 mb-8 font-sans">
                Everything looks good? Let's go!
              </p>

              <div className="space-y-6">
                {/* Avatar Preview */}
                <div className="text-center py-8 bg-warm-50 dark:bg-warm-900 rounded-2xl">
                  <div className="text-7xl mb-4">{data.avatarEmoji}</div>
                  <h2 className="text-2xl font-serif text-primary-500 mb-2">
                    {data.displayName}
                  </h2>
                  <p className="text-warm-600 dark:text-warm-400 font-sans">@{data.username}</p>
                </div>

                {/* Mood */}
                <div>
                  <h3 className="text-sm font-sans font-semibold text-warm-700 dark:text-warm-200 mb-2">
                    Current Mood
                  </h3>
                  <p className="text-warm-600 dark:text-warm-300 font-sans">{data.mood}</p>
                </div>

                {/* Interests */}
                <div>
                  <h3 className="text-sm font-sans font-semibold text-warm-700 dark:text-warm-200 mb-2">
                    Interests
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {data.interests.map((interest) => (
                      <span
                        key={interest}
                        className="inline-block bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 px-3 py-1 rounded-full text-sm font-sans"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Home Country */}
                <div>
                  <h3 className="text-sm font-sans font-semibold text-warm-700 dark:text-warm-200 mb-2">
                    Home Country
                  </h3>
                  <p className="text-warm-600 dark:text-warm-300 font-sans">🌍 {data.country}</p>
                </div>

                {/* Bio */}
                {data.bio && (
                  <div>
                    <h3 className="text-sm font-sans font-semibold text-warm-700 dark:text-warm-200 mb-2">
                      Bio
                    </h3>
                    <p className="text-warm-600 dark:text-warm-300 font-sans">{data.bio}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 bg-error-50 border-2 border-error-200 rounded-lg">
              <p className="text-error-700 font-sans text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4">
          {currentStep > 1 && (
            <button
              onClick={handleBack}
              className="btn-secondary flex-1 py-3 px-6 border-2 border-warm-300 dark:border-warm-700 rounded-lg font-sans font-semibold text-warm-700 dark:text-warm-200 hover:bg-warm-100 dark:hover:bg-warm-800 transition-colors"
            >
              Back
            </button>
          )}

          {currentStep < 7 ? (
            <button
              onClick={handleNext}
              disabled={checkingUsername && currentStep === 1}
              className="btn-primary flex-1 py-3 px-6 bg-primary-500 rounded-lg font-sans font-semibold text-white hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {checkingUsername && currentStep === 1 ? 'Checking...' : 'Next'}
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={loading}
              className="btn-primary flex-1 py-3 px-6 bg-primary-500 rounded-lg font-sans font-semibold text-white hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Completing...' : 'Continue'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
