import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, MapPin, Upload, X, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Avatar } from '../components/common/Avatar';
import { PhotoUpload } from '../components/common/PhotoUpload';

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7;

const CREATION_TYPES = [
  'Stories',
  'AI Characters',
  'Worlds',
  'Lorebooks',
  'Human-written fiction',
  'AI-assisted writing',
  'Roleplay',
  'Worldbuilding'
] as const;

const JOIN_REASONS = [
  'Share my creations',
  'Discover creators',
  'Join communities',
  'Find collaborators',
  'Build friendships',
  'Follow creative projects'
] as const;

const COLLAB_ROLES = [
  'Writer',
  'Editor',
  'Worldbuilder',
  'Character Designer',
  'Prompt Engineer',
  'Lore Writer'
] as const;

interface OnboardingData {
  displayName: string;
  username: string;
  photoUrl: string | null;
  creationTypes: string[];
  joinReasons: string[];
  collabRoles: string[];
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

  const [data, setData] = useState<OnboardingData>({
    displayName: profile?.display_name || '',
    username: profile?.username || '',
    photoUrl: profile?.photo_url || null,
    creationTypes: [],
    joinReasons: [],
    collabRoles: [],
    bio: profile?.bio || '',
    country: (profile as any)?.home_country || 'Senegal',
  });

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

      if (existingUser && existingUser.id !== profile?.id) {
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
  }, [profile]);

  const handleNext = useCallback(async () => {
    setError(null);

    if (currentStep === 1) {
      if (!data.displayName.trim() || !data.username.trim()) {
        setError('Display Name and Username are required');
        return;
      }
      const isUsernameValid = await checkUsernameUniqueness(data.username);
      if (!isUsernameValid) return;
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (data.creationTypes.length === 0) {
        setError('Please select at least one item you create');
        return;
      }
      setCurrentStep(4);
    } else if (currentStep === 4) {
      if (data.joinReasons.length === 0) {
        setError('Please select at least one reason for joining');
        return;
      }
      setCurrentStep(5);
    } else if (currentStep === 5) {
      if (data.collabRoles.length === 0) {
        setError('Please select at least one collaboration role');
        return;
      }
      setCurrentStep(6);
    } else if (currentStep === 6) {
      if (data.bio.length > 200) {
        setError('Bio must be 200 characters or less');
        return;
      }
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
        const { data: referrerProfile } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('username', cachedReferrer.trim())
          .maybeSingle();
        if (referrerProfile) {
          referredBy = referrerProfile.user_id;
        }
      }

      // Map collaboration roles to database role columns if selected
      const creator_role_1 = data.collabRoles[0] || '';
      const creator_role_2 = data.collabRoles[1] || '';

      // Combine all selected creator tags into the profiles.interests array
      const combinedInterests = [
        ...data.creationTypes,
        ...data.joinReasons,
        ...data.collabRoles
      ];

      await updateProfile({
        display_name: data.displayName,
        username: data.username,
        photo_url: data.photoUrl,
        interests: combinedInterests,
        bio: data.bio || null,
        home_country: data.country,
        creator_role_1,
        creator_role_2,
        onboarding_complete: true,
        referred_by: referredBy,
      } as any);

      localStorage.removeItem('whisprr_referrer');
      navigate('/feed');
    } catch (err: any) {
      console.error('Onboarding submission failed:', err);
      setError(err?.message || 'Failed to complete onboarding. Please try again.');
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
    <div className="min-h-screen bg-warm-50 dark:bg-warm-950 py-12 px-4 transition-colors duration-200">
      <div className="max-w-2xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            {[1, 2, 3, 4, 5, 6, 7].map((step) => (
              <div
                key={step}
                className={`h-2 flex-1 rounded-full mx-1 transition-colors duration-300 ${
                  step <= currentStep ? 'bg-primary-500 shadow-sm' : 'bg-gray-300 dark:bg-warm-700'
                }`}
              />
            ))}
          </div>
          <p className="text-center text-sm text-warm-600 dark:text-warm-400 font-sans font-medium">
            Step {currentStep} of 7
          </p>
        </div>

        {/* Main Card */}
        <div className={currentStep === 2 ? "mb-8" : "card bg-white dark:bg-warm-900 rounded-3xl shadow-card p-8 mb-8 border border-warm-100 dark:border-warm-850"}>
          {/* Step 1: Basics */}
          {currentStep === 1 && (
            <div className="animate-fade-in">
              <h1 className="text-3xl sm:text-4xl font-serif font-bold text-warm-900 dark:text-warm-50 mb-2 tracking-tight">
                Welcome to WHISPRR
              </h1>
              <p className="text-warm-600 dark:text-warm-400 mb-8 font-sans">
                The Home of Creators. Let's set up your creative identity.
              </p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-warm-700 dark:text-warm-200 mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Your display name or pen name"
                    value={data.displayName}
                    onChange={(e) => setData({ ...data, displayName: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-warm-700 dark:text-warm-200 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="username"
                    value={data.username}
                    onChange={(e) => {
                      setData({ ...data, username: e.target.value.toLowerCase() });
                      setUsernameError(null);
                    }}
                    disabled={checkingUsername}
                  />
                  <p className="text-xs text-warm-500 mt-2">
                    3+ characters, letters, numbers, and underscores only
                  </p>
                  {usernameError && (
                    <p className="text-xs text-error-500 mt-2 font-medium">
                      {usernameError}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Avatar Upload */}
          {currentStep === 2 && (
            <div className="flex flex-col items-center justify-center py-10 animate-fade-in">
              <h1 className="text-3xl sm:text-4xl font-serif font-bold text-warm-900 dark:text-warm-50 mb-4 tracking-tight text-center">
                Add a Profile Photo
              </h1>
              <p className="text-warm-600 dark:text-warm-400 mb-10 text-center max-w-md">
                A profile photo helps other creators recognize you. You can always change it later.
              </p>

              <div className="relative group mb-10">
                <div className="w-40 h-40 rounded-full shadow-lg ring-4 ring-primary-100 dark:ring-primary-950 flex items-center justify-center overflow-hidden bg-warm-100 dark:bg-warm-800">
                  <Avatar 
                    photoUrl={data.photoUrl} 
                    size="xl" 
                  />
                </div>
              </div>

              <button
                onClick={() => setShowPhotoUpload(true)}
                className="btn-primary w-full max-w-xs py-3.5 font-bold rounded-2xl mb-4 shadow-sm"
              >
                Upload Photo
              </button>

              <button
                onClick={() => setCurrentStep(3)}
                className="text-warm-500 hover:text-warm-700 dark:hover:text-warm-300 font-semibold text-sm transition-colors"
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

          {/* Step 3: What do you create? */}
          {currentStep === 3 && (
            <div className="animate-fade-in">
              <h1 className="text-3xl sm:text-4xl font-serif font-bold text-warm-900 dark:text-warm-50 mb-2 tracking-tight">
                What do you create?
              </h1>
              <p className="text-warm-600 dark:text-warm-400 mb-6">
                Select everything that applies to your creative work
              </p>

              <div className="grid grid-cols-2 gap-3">
                {CREATION_TYPES.map((type) => {
                  const isSelected = data.creationTypes.includes(type);
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setData(prev => ({
                          ...prev,
                          creationTypes: isSelected 
                            ? prev.creationTypes.filter(t => t !== type)
                            : [...prev.creationTypes, type]
                        }));
                      }}
                      className={`flex items-center justify-between p-4 rounded-2xl border text-sm font-semibold transition-all duration-200 ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/20 text-primary-700 dark:text-primary-300'
                          : 'border-warm-200 dark:border-warm-800 bg-white dark:bg-warm-950 hover:bg-warm-50 dark:hover:bg-warm-850 text-warm-800 dark:text-warm-200'
                      }`}
                    >
                      <span>{type}</span>
                      {isSelected && <Check size={16} className="text-primary-500" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 4: Why WHISPRR */}
          {currentStep === 4 && (
            <div className="animate-fade-in">
              <h1 className="text-3xl sm:text-4xl font-serif font-bold text-warm-900 dark:text-warm-50 mb-2 tracking-tight">
                Why are you joining WHISPRR?
              </h1>
              <p className="text-warm-600 dark:text-warm-400 mb-6">
                Tell us what you hope to do on the platform
              </p>

              <div className="grid grid-cols-2 gap-3">
                {JOIN_REASONS.map((reason) => {
                  const isSelected = data.joinReasons.includes(reason);
                  return (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => {
                        setData(prev => ({
                          ...prev,
                          joinReasons: isSelected
                            ? prev.joinReasons.filter(r => r !== reason)
                            : [...prev.joinReasons, reason]
                        }));
                      }}
                      className={`flex items-center justify-between p-4 rounded-2xl border text-sm font-semibold transition-all duration-200 ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/20 text-primary-700 dark:text-primary-300'
                          : 'border-warm-200 dark:border-warm-800 bg-white dark:bg-warm-950 hover:bg-warm-50 dark:hover:bg-warm-850 text-warm-800 dark:text-warm-200'
                      }`}
                    >
                      <span>{reason}</span>
                      {isSelected && <Check size={16} className="text-primary-500" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 5: Collaboration Interests */}
          {currentStep === 5 && (
            <div className="animate-fade-in">
              <h1 className="text-3xl sm:text-4xl font-serif font-bold text-warm-900 dark:text-warm-50 mb-2 tracking-tight">
                Collaboration Interests
              </h1>
              <p className="text-warm-600 dark:text-warm-400 mb-6">
                Select your creative roles and interests for finding project partners
              </p>

              <div className="grid grid-cols-2 gap-3">
                {COLLAB_ROLES.map((role) => {
                  const isSelected = data.collabRoles.includes(role);
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => {
                        setData(prev => ({
                          ...prev,
                          collabRoles: isSelected
                            ? prev.collabRoles.filter(r => r !== role)
                            : [...prev.collabRoles, role]
                        }));
                      }}
                      className={`flex items-center justify-between p-4 rounded-2xl border text-sm font-semibold transition-all duration-200 ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/20 text-primary-700 dark:text-primary-300'
                          : 'border-warm-200 dark:border-warm-800 bg-white dark:bg-warm-950 hover:bg-warm-50 dark:hover:bg-warm-850 text-warm-800 dark:text-warm-200'
                      }`}
                    >
                      <span>{role}</span>
                      {isSelected && <Check size={16} className="text-primary-500" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 6: Bio & Location */}
          {currentStep === 6 && (
            <div className="animate-fade-in space-y-6">
              <div>
                <h1 className="text-3xl sm:text-4xl font-serif font-bold text-warm-900 dark:text-warm-50 mb-2 tracking-tight">
                  Write Your Bio
                </h1>
                <p className="text-warm-600 dark:text-warm-400 mb-4">
                  Tell other creators a bit about yourself, your projects, or your inspiration.
                </p>
                <textarea
                  className="w-full px-4 py-3 border border-warm-200 dark:border-warm-800 rounded-2xl font-sans focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all resize-none bg-white dark:bg-warm-950 text-warm-900 dark:text-warm-100 placeholder:text-warm-400"
                  placeholder="e.g. Fantasy novelist and worldbuilder. Currently creating character prompts in CHIMERA for a cyberpunk tabletop RPG."
                  rows={4}
                  maxLength={200}
                  value={data.bio}
                  onChange={(e) => setData({ ...data, bio: e.target.value })}
                />
                <p className="text-xs text-warm-500 mt-2 text-right">
                  {data.bio.length}/200 characters
                </p>
              </div>

              <div>
                <h2 className="text-lg font-serif font-bold text-warm-900 dark:text-warm-50 mb-2">
                  🌍 Home Country
                </h2>
                <p className="text-sm text-warm-500 mb-4">
                  This helps customize local communities and creator feeds.
                </p>

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleDetectCountry}
                    disabled={detectingCountry}
                    className="w-full flex items-center justify-center gap-2 py-2.5 border border-primary-200 rounded-xl font-semibold text-sm text-primary-600 hover:bg-primary-50/50 dark:hover:bg-primary-950/20 transition-colors disabled:opacity-50"
                  >
                    📍 {detectingCountry ? 'Detecting...' : 'Detect Automatically'}
                  </button>

                  <input
                    type="text"
                    className="input-field text-sm"
                    placeholder="Type your country (e.g. Canada, Senegal, Japan)"
                    value={data.country}
                    onChange={(e) => setData({ ...data, country: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 7: Review */}
          {currentStep === 7 && (
            <div className="animate-fade-in space-y-6">
              <div>
                <h1 className="text-3xl sm:text-4xl font-serif font-bold text-warm-900 dark:text-warm-50 mb-2 tracking-tight">
                  Verify Your Creative Identity
                </h1>
                <p className="text-warm-600 dark:text-warm-400 mb-6">
                  Verify your profile details before continuing to the platform.
                </p>
              </div>

              <div className="space-y-5">
                {/* Profile Card Preview */}
                <div className="p-6 bg-warm-50 dark:bg-warm-950 rounded-3xl border border-warm-150 dark:border-warm-850 flex items-center gap-4">
                  <div className="w-18 h-18 rounded-full overflow-hidden flex-shrink-0 bg-warm-200 dark:bg-warm-800">
                    <Avatar 
                      photoUrl={data.photoUrl} 
                      size="lg" 
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xl font-serif font-bold text-primary-500 truncate">{data.displayName}</h3>
                    <p className="text-xs text-warm-500 font-semibold">@{data.username}</p>
                    <p className="text-xs text-warm-400 mt-1">🌍 {data.country}</p>
                  </div>
                </div>

                {/* Creative Identity tag display */}
                <div className="space-y-3">
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-warm-500">I Create</h4>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {data.creationTypes.map(t => (
                        <span key={t} className="px-3 py-1 rounded-full text-xs font-semibold bg-primary-100/60 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-warm-500">My Intentions</h4>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {data.joinReasons.map(r => (
                        <span key={r} className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/50">
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-warm-500">Collaboration Roles</h4>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {data.collabRoles.map(role => (
                        <span key={role} className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-350 border border-emerald-100 dark:border-emerald-900/50">
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {data.bio && (
                  <div className="pt-3 border-t border-warm-150 dark:border-warm-850">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-warm-500 mb-2">Bio</h4>
                    <p className="text-sm text-warm-700 dark:text-warm-300 leading-relaxed italic">"{data.bio}"</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 bg-error-50 dark:bg-error-900/10 border border-error-200 dark:border-error-800 rounded-2xl">
              <p className="text-error-700 dark:text-error-450 text-sm font-semibold">{error}</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          {currentStep > 1 && (
            <button
              onClick={handleBack}
              className="btn-secondary flex-1 py-3 px-6 rounded-2xl font-bold transition-all"
            >
              Back
            </button>
          )}

          {currentStep < 7 ? (
            <button
              onClick={handleNext}
              disabled={checkingUsername && currentStep === 1}
              className="btn-primary flex-1 py-3 px-6 bg-primary-500 rounded-2xl font-bold text-white hover:bg-primary-600 transition-all disabled:opacity-50"
            >
              {checkingUsername && currentStep === 1 ? 'Checking...' : 'Next'}
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={loading}
              className="btn-primary flex-1 py-3 px-6 bg-primary-500 rounded-2xl font-bold text-white hover:bg-primary-600 transition-all disabled:opacity-50"
            >
              {loading ? 'Entering WHISPRR...' : 'Continue'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
