import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import type { ChimeraProfile } from '../types';

interface UserViolation {
  id: string;
  user_id: string;
  rule_violated: string;
  violated_section_link: string;
  violation_level: number;
  description: string;
  acknowledged: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}
import { supabase } from '../lib/supabase';
import { CHIMERA_ORIGIN } from '../lib/supabase';

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: ChimeraProfile | null;
  chimeraPreferences: ChimeraCreativePreferences | null;
  violations: UserViolation[];
  loading: boolean;
}

export type CreativePreference = 'roleplay' | 'storytelling' | 'both';
export type CreativeMode = 'roleplay' | 'storytelling';

export interface ChimeraCreativePreferences {
  user_id: string;
  default_ai_model: string;
  creative_preference: CreativePreference | null;
  default_creative_mode: CreativeMode;
  last_creative_mode: CreativeMode;
  chimera_onboarding_complete: boolean;
  both_mode_welcome_seen: boolean;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  requestEmailOtp: (email: string) => Promise<void>;
  verifyEmailOtp: (email: string, token: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithDiscord: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<ChimeraProfile>) => Promise<void>;
  updateChimeraPreferences: (updates: Partial<Omit<ChimeraCreativePreferences, 'user_id'>>) => Promise<void>;
  shardsBalance: number | null;
  vellumBalance: number | null;
  spendShards: (amount: number, reason: string) => boolean;
  earnShards: (amount: number, reason: string) => void;
  adFreePassActive: boolean;
  roleplayVipActive: boolean;
  storytellingVipActive: boolean;
  multiverseVipActive: boolean;
  activateAdFreePass: () => boolean;
  activateRoleplayVipPass: () => boolean;
  activateStorytellingVipPass: () => boolean;
  activateMultiverseVipPass: () => boolean;
  systemSettings: any;
  fetchSystemSettings: () => Promise<void>;
  updateSystemSettings: (updates: any) => Promise<void>;
  acceptLegalTerms: (version: string) => Promise<void>;
  acknowledgeViolation: (violationId: string) => Promise<void>;
}

const AUTH_TIMEOUT_MS = 10000;
export const CURRENT_LEGAL_VERSION = '2026-07-09-v1';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    chimeraPreferences: null,
    violations: [],
    loading: true,
  });

  const [systemSettings, setSystemSettings] = useState<any>(() => {
    try {
      const local = localStorage.getItem('chimera_system_settings');
      if (local) return JSON.parse(local);
    } catch {}
    return {
      enabled: false,
      message: "We're currently improving CHIMERA to bring you a better experience. Thank you for your patience. ❤️",
      reopen_at: null,
      bypass_founder: true,
      bypass_admin: true,
      bypass_beta: false,
      allow_public: true,
      allow_auth: true
    };
  });

  const initializedRef = useRef(false);
  const latestSessionRef = useRef<Session | null | undefined>(undefined);

  const fetchViolations = useCallback(async (userId: string): Promise<UserViolation[]> => {
    try {
      const { data } = await supabase
        .from('user_violations')
        .select('*')
        .eq('user_id', userId)
        .or('acknowledged.eq.false,and(violation_level.gte.3,expires_at.gt.now())');
      return (data as UserViolation[]) || [];
    } catch {
      return [];
    }
  }, []);

  const fetchProfile = useCallback(async (userId: string): Promise<ChimeraProfile | null> => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      return data as ChimeraProfile | null;
    } catch {
      return null;
    }
  }, []);

  const fetchChimeraPreferences = useCallback(async (userId: string): Promise<ChimeraCreativePreferences | null> => {
    const { data, error } = await supabase
      .from('chimera_user_preferences')
      .select('user_id, default_ai_model, creative_preference, default_creative_mode, last_creative_mode, chimera_onboarding_complete, both_mode_welcome_seen')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) return null;
    return data as ChimeraCreativePreferences | null;
  }, []);

  const refreshProfile = useCallback(async () => {
    if (state.user) {
      const [profile, violations, chimeraPreferences] = await Promise.all([
        fetchProfile(state.user.id),
        fetchViolations(state.user.id),
        fetchChimeraPreferences(state.user.id)
      ]);
      setState(prev => ({ ...prev, profile, violations, chimeraPreferences }));
    }
  }, [state.user, fetchProfile, fetchViolations, fetchChimeraPreferences]);

  const updateChimeraPreferences = useCallback(async (updates: Partial<Omit<ChimeraCreativePreferences, 'user_id'>>) => {
    if (!state.user) return;
    const { error } = await supabase
      .from('chimera_user_preferences')
      .update(updates)
      .eq('user_id', state.user.id);
    if (error) throw error;
    setState(prev => ({
      ...prev,
      chimeraPreferences: prev.chimeraPreferences ? { ...prev.chimeraPreferences, ...updates } : prev.chimeraPreferences,
    }));
  }, [state.user]);

  const updateProfile = useCallback(async (updates: Partial<ChimeraProfile>) => {
    if (!state.user) return;
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', state.user.id);
    if (error) {
      throw error;
    }
    setState(prev => ({
      ...prev,
      profile: prev.profile ? { ...prev.profile, ...updates } : { user_id: state.user!.id, ...updates } as ChimeraProfile,
    }));
  }, [state.user]);

  const fetchSystemSettings = useCallback(async () => {
    try {
      // Fetch static JSON first as it propagates instantly
      const res = await fetch('/maintenance_mode.json').catch(() => null);
      if (res && res.ok) {
        const value = await res.json();
        setSystemSettings(value);
        localStorage.setItem('chimera_system_settings', JSON.stringify(value));
        return;
      }

      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('key', 'maintenance_mode')
        .maybeSingle();
      if (!error && data) {
        setSystemSettings(data.value);
        localStorage.setItem('chimera_system_settings', JSON.stringify(data.value));
      }
    } catch (err) {
      console.warn("Could not fetch system settings, relying on local cache:", err);
    }
  }, []);

  const updateSystemSettings = useCallback(async (updates: any) => {
    try {
      // Sync local cache first for instant feedback
      setSystemSettings(updates);
      localStorage.setItem('chimera_system_settings', JSON.stringify(updates));

      const { error } = await supabase
        .from('system_settings')
        .upsert({
          key: 'maintenance_mode',
          value: updates,
          updated_at: new Date().toISOString(),
          updated_by: state.user?.id || null
        });
      
      // Ignore schema cache errors and treat the update as successful locally
      if (error && !error.message.includes('public.system_settings')) {
        throw error;
      }
    } catch (err) {
      console.warn("Error updating system settings in database, saved locally:", err);
    }
  }, [state.user]);

  useEffect(() => {
    let mounted = true;

    const hydrateSession = async (session: Session | null) => {
      if (!mounted) return;

      if (session?.user) {
        setState(prev => ({ ...prev, user: session.user, session, loading: true }));
        const [profile, violations, chimeraPreferences] = await Promise.all([
          fetchProfile(session.user.id),
          fetchViolations(session.user.id),
          fetchChimeraPreferences(session.user.id)
        ]);
        if (mounted) {
          setState({ user: session.user, session, profile, chimeraPreferences, violations, loading: false });
        }
      } else if (mounted) {
        setState({ user: null, session: null, profile: null, chimeraPreferences: null, violations: [], loading: false });
      }
    };

    const timeoutId = setTimeout(() => {
      if (mounted && state.loading) {
        setState(prev => ({ ...prev, loading: false }));
      }
    }, AUTH_TIMEOUT_MS);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;

        latestSessionRef.current = session;

        if (_event === 'SIGNED_OUT') {
          setState({ user: null, session: null, profile: null, chimeraPreferences: null, violations: [], loading: false });
          return;
        }

        if (session?.user) {
          await hydrateSession(session);
        } else {
          setState({ user: null, session: null, profile: null, chimeraPreferences: null, violations: [], loading: false });
        }
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;

      // INITIAL_SESSION/SIGNED_IN can arrive while getSession is resolving.
      // Never let an older null result overwrite a session already delivered
      // by the auth event listener.
      if (latestSessionRef.current !== undefined) return;
      latestSessionRef.current = session;
      await hydrateSession(session);
      initializedRef.current = true;
    });

    fetchSystemSettings();

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [fetchProfile, fetchChimeraPreferences]);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: { 
          access_level: 'ecosystem',
          legal_accepted_version: CURRENT_LEGAL_VERSION
        },
        emailRedirectTo: CHIMERA_ORIGIN
      }
    });
    if (error) throw error;
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const requestEmailOtp = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) throw error;
  };

  const verifyEmailOtp = async (email: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    if (error) throw error;
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${CHIMERA_ORIGIN}/auth` },
    });
    if (error) throw error;
  };

  const signInWithApple = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: `${CHIMERA_ORIGIN}/auth` },
    });
    if (error) throw error;
  };

  const signInWithDiscord = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: { redirectTo: `${CHIMERA_ORIGIN}/auth` },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setState({ user: null, session: null, profile: null, chimeraPreferences: null, violations: [], loading: false });
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${CHIMERA_ORIGIN}/reset-password`,
    });
    if (error) throw error;
  };

  const [shardsBalance, setShardsBalance] = useState<number | null>(null);

  const [vellumBalance, setVellumBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!state.user?.id) {
      setShardsBalance(null);
      return;
    }

    let active = true;
    const loadShards = () => {
      supabase.rpc('get_my_shards_wallet').then(({ data, error }) => {
        if (!active || error) return;
        setShardsBalance(data?.[0]?.available_balance ?? null);
      });
    };
    loadShards();
    window.addEventListener('chimera-shards-changed', loadShards);
    return () => {
      active = false;
      window.removeEventListener('chimera-shards-changed', loadShards);
    };
  }, [state.user?.id]);

  useEffect(() => {
    if (!state.user?.id) {
      setVellumBalance(null);
      return;
    }

    let active = true;
    const loadVellum = () => {
      supabase.rpc('get_my_vellum_wallet').then(({ data, error }) => {
        if (!active || error) return;
        setVellumBalance(data?.[0]?.available_balance ?? null);
      });
    };
    loadVellum();
    window.addEventListener('chimera-vellum-changed', loadVellum);
    return () => {
      active = false;
      window.removeEventListener('chimera-vellum-changed', loadVellum);
    };
  }, [state.user?.id]);

  const [adFreePassActive, setAdFreePassActive] = useState<boolean>(() => {
    try {
      return localStorage.getItem('chimera_ad_free_pass') === 'true';
    } catch {}
    return false;
  });

  const [roleplayVipActive, setRoleplayVipActive] = useState<boolean>(() => {
    try {
      return localStorage.getItem('chimera_roleplay_vip') === 'true' || localStorage.getItem('chimera_multiverse_vip') === 'true';
    } catch {}
    return false;
  });

  const [storytellingVipActive, setStorytellingVipActive] = useState<boolean>(() => {
    try {
      return localStorage.getItem('chimera_storytelling_vip') === 'true' || localStorage.getItem('chimera_multiverse_vip') === 'true';
    } catch {}
    return false;
  });

  const [multiverseVipActive, setMultiverseVipActive] = useState<boolean>(() => {
    try {
      return localStorage.getItem('chimera_multiverse_vip') === 'true';
    } catch {}
    return false;
  });

  const spendShards = useCallback((amount: number, reason: string): boolean => {
    // SHARDS changes must be performed through a server-side ledger RPC.
    // Keeping a local-only deduction here would make the UI lie about money-like value.
    console.warn('SHARDS spending is not connected yet.', { amount, reason });
    return false;
  }, []);

  const earnShards = useCallback((amount: number, reason: string) => {
    // Rewards are issued only by verified server-side flows (for example, Guided Story Paths).
    console.warn('SHARDS earning is not connected for this action.', { amount, reason });
  }, []);

  const activateAdFreePass = useCallback((): boolean => {
    if (shardsBalance === null || shardsBalance < 20) return false;
    if (spendShards(20, 'Ad-Free Pass Activation')) {
      setAdFreePassActive(true);
      try {
        localStorage.setItem('chimera_ad_free_pass', 'true');
      } catch {}
      return true;
    }
    return false;
  }, [shardsBalance, spendShards]);

  const activateRoleplayVipPass = useCallback((): boolean => {
    if (shardsBalance === null || shardsBalance < 15) return false;
    if (spendShards(15, 'Roleplay VIP Pass Activation')) {
      setRoleplayVipActive(true);
      try {
        localStorage.setItem('chimera_roleplay_vip', 'true');
      } catch {}
      return true;
    }
    return false;
  }, [shardsBalance, spendShards]);

  const activateStorytellingVipPass = useCallback((): boolean => {
    if (shardsBalance === null || shardsBalance < 15) return false;
    if (spendShards(15, 'Storytelling VIP Pass Activation')) {
      setStorytellingVipActive(true);
      try {
        localStorage.setItem('chimera_storytelling_vip', 'true');
      } catch {}
      return true;
    }
    return false;
  }, [shardsBalance, spendShards]);

  const activateMultiverseVipPass = useCallback((): boolean => {
    if (shardsBalance === null || shardsBalance < 25) return false;
    if (spendShards(25, 'Multiverse All-Access VIP Pass Activation')) {
      setMultiverseVipActive(true);
      setRoleplayVipActive(true);
      setStorytellingVipActive(true);
      setAdFreePassActive(true);
      try {
        localStorage.setItem('chimera_multiverse_vip', 'true');
        localStorage.setItem('chimera_roleplay_vip', 'true');
        localStorage.setItem('chimera_storytelling_vip', 'true');
        localStorage.setItem('chimera_ad_free_pass', 'true');
      } catch {}
      return true;
    }
    return false;
  }, [shardsBalance, spendShards]);

  const acceptLegalTerms = async (version: string) => {
    if (!state.user) return;
    const now = new Date().toISOString();

    // 1. Update user_metadata in Supabase Auth so trigger & auth session have the legal version
    await supabase.auth.updateUser({
      data: { legal_accepted_version: version }
    }).catch(err => console.warn("Failed to update user_metadata:", err));

    // 2. Update profiles table
    const { data: updatedRows, error: updateErr } = await supabase
      .from('profiles')
      .update({
        legal_accepted_version: version,
        legal_accepted_at: now
      })
      .eq('user_id', state.user.id)
      .select();

    if (updateErr) {
      console.error("Database error updating legal terms acceptance:", updateErr);
    }

    // 3. Fallback: if no profile row existed, create/upsert it so user is never trapped
    let activeProfile = state.profile;
    if (!updatedRows || updatedRows.length === 0) {
      const fallbackProfile = {
        user_id: state.user.id,
        username: state.user.email ? state.user.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') : `user_${state.user.id.substring(0, 8)}`,
        display_name: state.user.user_metadata?.full_name || state.user.email?.split('@')[0] || 'Creator',
        legal_accepted_version: version,
        legal_accepted_at: now,
        onboarding_complete: false,
        created_at: now
      };

      const { data: upsertData, error: upsertErr } = await supabase
        .from('profiles')
        .upsert(fallbackProfile, { onConflict: 'user_id' })
        .select()
        .maybeSingle();

      if (!upsertErr && upsertData) {
        activeProfile = upsertData as ChimeraProfile;
      }
    } else if (updatedRows && updatedRows.length > 0) {
      activeProfile = updatedRows[0] as ChimeraProfile;
    }

    // 4. Update React state immediately and synchronously with non-null profile
    const updatedProfile: ChimeraProfile = activeProfile
      ? { ...activeProfile, legal_accepted_version: version, legal_accepted_at: now }
      : {
          user_id: state.user.id,
          username: state.user.email ? state.user.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') : `user_${state.user.id.substring(0, 8)}`,
          display_name: state.user.email?.split('@')[0] || 'Creator',
          legal_accepted_version: version,
          legal_accepted_at: now,
          onboarding_complete: false,
          created_at: now
        } as ChimeraProfile;

    setState(prev => ({
      ...prev,
      user: prev.user ? {
        ...prev.user,
        user_metadata: { ...prev.user.user_metadata, legal_accepted_version: version }
      } : prev.user,
      profile: updatedProfile
    }));

    // 5. Refetch profile to be 100% in sync
    await refreshProfile();
  };

  const acknowledgeViolation = async (violationId: string) => {
    if (!state.user) return;
    const { error } = await supabase
      .from('user_violations')
      .update({ acknowledged: true })
      .eq('id', violationId)
      .eq('user_id', state.user.id);
      
    if (error) throw error;
    await refreshProfile();
  };

  return (
    <AuthContext.Provider value={{
      ...state,
      signIn,
      requestEmailOtp,
      verifyEmailOtp,
      signUp,
      signInWithGoogle,
      signInWithApple,
      signInWithDiscord,
      signOut,
      resetPassword,
      refreshProfile,
      updateProfile,
      updateChimeraPreferences,
      shardsBalance,
      vellumBalance,
      spendShards,
      earnShards,
      adFreePassActive,
      roleplayVipActive,
      storytellingVipActive,
      multiverseVipActive,
      activateAdFreePass,
      activateRoleplayVipPass,
      activateStorytellingVipPass,
      activateMultiverseVipPass,
      systemSettings,
      fetchSystemSettings,
      updateSystemSettings,
      acceptLegalTerms,
      acknowledgeViolation
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
