import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { MOODS, INTERESTS } from '../types';
import type { Mood, Interest } from '../types';

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7;

const AVATAR_EMOJIS = ['💫', '🌙', '🦋', '🌸', '🎨', '🎵', '🌊', '✨', '🌿', '🔥', '💜', '🌻', '🌈', '🎭', '📖', '🌍', '🎪', '🍀', '🦊', '🐝', '🌺', '💭', '🪐', '⭐'];

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
    avatarEmoji: profile?.avatar_emoji || AVATAR_EMOJIS[0],
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
      if (!data.avatarEmoji) {
        setError('Please select an avatar');
        return;
      }
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
      await updateProfile({
        display_name: data.displayName,
        username: data.username,
        avatar_emoji: data.avatarEmoji,
        mood: data.mood,
        interests: data.interests,
        bio: data.bio || null,
        home_country: data.country,
        onboarding_complete: true,
      });

      navigate('/feed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete onboarding');
      setLoading(false);
    }
  }, [user, data, updateProfile, navigate]);

  if (!user) {
    return (
      <div className="min-h-screen bg-warm-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            {[1, 2, 3, 4, 5, 6, 7].map((step) => (
              <div
                key={step}
                className={`h-2 flex-1 rounded-full mx-1 transition-colors ${
                  step <= currentStep ? 'bg-primary-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          <p className="text-center text-sm text-gray-600 font-sans">
            Step {currentStep} of 7
          </p>
        </div>

        {/* Main Card */}
        <div className="card bg-white rounded-3xl shadow-warm p-8 mb-8">
          {/* Step 1: Display Name & Username */}
          {currentStep === 1 && (
            <div>
              <h1 className="text-4xl font-serif text-primary-500 mb-2">
                Welcome to WHISPRR
              </h1>
              <p className="text-gray-600 mb-8 font-sans">
                Let's set up your profile. Start with your name and username.
              </p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-sans font-semibold text-gray-700 mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    className="input-field w-full px-4 py-3 border-2 border-gray-200 rounded-lg font-sans focus:outline-none focus:border-primary-500 transition-colors"
                    placeholder="Your display name"
                    value={data.displayName}
                    onChange={(e) =>
                      setData({ ...data, displayName: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-sans font-semibold text-gray-700 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    className="input-field w-full px-4 py-3 border-2 border-gray-200 rounded-lg font-sans focus:outline-none focus:border-primary-500 transition-colors"
                    placeholder="username"
                    value={data.username}
                    onChange={(e) => {
                      setData({ ...data, username: e.target.value });
                      setUsernameError(null);
                    }}
                    disabled={checkingUsername}
                  />
                  <p className="text-xs text-gray-500 mt-2 font-sans">
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
            <div>
              <h1 className="text-4xl font-serif text-primary-500 mb-2">
                Choose Your Avatar
              </h1>
              <p className="text-gray-600 mb-8 font-sans">
                Pick an emoji that represents you
              </p>

              <div className="grid grid-cols-6 gap-4">
                {AVATAR_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    className={`btn-primary aspect-square text-4xl rounded-2xl transition-all ${
                      data.avatarEmoji === emoji
                        ? 'ring-4 ring-primary-500 scale-110'
                        : 'hover:scale-105 bg-warm-50'
                    }`}
                    onClick={() => setData({ ...data, avatarEmoji: emoji })}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Mood Selection */}
          {currentStep === 3 && (
            <div>
              <h1 className="text-4xl font-serif text-primary-500 mb-2">
                What's Your Current Mood?
              </h1>
              <p className="text-gray-600 mb-8 font-sans">
                This helps others understand your energy
              </p>

              <div className="grid grid-cols-2 gap-3">
                {MOODS.map((mood) => (
                  <button
                    key={mood}
                    className={`btn-primary py-3 px-4 rounded-lg font-sans font-semibold transition-all ${
                      data.mood === mood
                        ? 'bg-primary-500 text-white'
                        : 'bg-warm-100 text-gray-700 hover:bg-warm-200'
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
              <h1 className="text-4xl font-serif text-primary-500 mb-2">
                Pick Your Interests
              </h1>
              <p className="text-gray-600 mb-4 font-sans">
                Select 2-7 interests that match your passions
              </p>
              <p className="text-sm text-gray-500 mb-8 font-sans">
                Selected: {data.interests.length}
              </p>

              <div className="grid grid-cols-3 gap-3">
                {INTERESTS.map((interest) => (
                  <button
                    key={interest}
                    className={`btn-primary py-3 px-4 rounded-lg font-sans font-semibold transition-all ${
                      data.interests.includes(interest as Interest)
                        ? 'bg-primary-500 text-white'
                        : 'bg-warm-100 text-gray-700 hover:bg-warm-200'
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
              <h1 className="text-4xl font-serif text-primary-500 mb-2">
                Write Your Bio
              </h1>
              <p className="text-gray-600 mb-8 font-sans">
                Tell others a bit about yourself (optional)
              </p>

              <div>
                <textarea
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg font-sans focus:outline-none focus:border-primary-500 transition-colors resize-none"
                  placeholder="Write something about yourself..."
                  rows={6}
                  maxLength={200}
                  value={data.bio}
                  onChange={(e) => setData({ ...data, bio: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-2 font-sans">
                  {data.bio.length}/200 characters
                </p>
              </div>
            </div>
          )}

          {/* Step 6: Country Selection */}
          {currentStep === 6 && (
            <div>
              <h1 className="text-4xl font-serif text-primary-500 mb-2">
                🌍 Where Are You From?
              </h1>
              <p className="text-gray-600 mb-8 font-sans">
                Your home country personalizes your feed and local communities. You can always explore other countries later.
              </p>

              <div className="space-y-4">
                <button
                  type="button"
                  onClick={handleDetectCountry}
                  disabled={detectingCountry}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 border-2 border-primary-300 rounded-xl font-sans font-semibold text-primary-700 hover:bg-primary-50 transition-colors disabled:opacity-50"
                >
                  {detectingCountry ? '🔍 Detecting...' : '📍 Detect My Country Automatically'}
                </button>

                <p className="text-center text-xs text-gray-400 font-sans">— or type your country —</p>

                <input
                  type="text"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl font-sans focus:outline-none focus:border-primary-500 transition-colors"
                  placeholder="e.g. Senegal, Canada, Japan..."
                  value={data.country}
                  onChange={(e) => setData({ ...data, country: e.target.value })}
                />

                {data.country && (
                  <div className="p-4 bg-primary-50 border border-primary-200 rounded-xl flex items-center gap-3">
                    <span className="text-2xl">🏠</span>
                    <div>
                      <p className="text-xs text-primary-600 font-semibold font-sans uppercase tracking-wide">Your Home Country</p>
                      <p className="text-lg font-serif font-bold text-primary-700">{data.country}</p>
                    </div>
                  </div>
                )}

                <p className="text-xs text-gray-400 text-center font-sans">
                  This helps surface local creators, communities, and trends. You can always explore any country's WHISPRR space freely.
                </p>
              </div>
            </div>
          )}

          {/* Step 7: Review */}
          {currentStep === 7 && (
            <div>
              <h1 className="text-4xl font-serif text-primary-500 mb-2">
                Review Your Profile
              </h1>
              <p className="text-gray-600 mb-8 font-sans">
                Everything looks good? Let's go!
              </p>

              <div className="space-y-6">
                {/* Avatar Preview */}
                <div className="text-center py-8 bg-warm-50 rounded-2xl">
                  <div className="text-7xl mb-4">{data.avatarEmoji}</div>
                  <h2 className="text-2xl font-serif text-primary-500 mb-2">
                    {data.displayName}
                  </h2>
                  <p className="text-gray-600 font-sans">@{data.username}</p>
                </div>

                {/* Mood */}
                <div>
                  <h3 className="text-sm font-sans font-semibold text-gray-700 mb-2">
                    Current Mood
                  </h3>
                  <p className="text-gray-600 font-sans">{data.mood}</p>
                </div>

                {/* Interests */}
                <div>
                  <h3 className="text-sm font-sans font-semibold text-gray-700 mb-2">
                    Interests
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {data.interests.map((interest) => (
                      <span
                        key={interest}
                        className="inline-block bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-sans"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Home Country */}
                <div>
                  <h3 className="text-sm font-sans font-semibold text-gray-700 mb-2">
                    Home Country
                  </h3>
                  <p className="text-gray-600 font-sans">🌍 {data.country}</p>
                </div>

                {/* Bio */}
                {data.bio && (
                  <div>
                    <h3 className="text-sm font-sans font-semibold text-gray-700 mb-2">
                      Bio
                    </h3>
                    <p className="text-gray-600 font-sans">{data.bio}</p>
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
              className="btn-secondary flex-1 py-3 px-6 border-2 border-gray-300 rounded-lg font-sans font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
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
              {loading ? 'Completing...' : 'Complete Onboarding'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
