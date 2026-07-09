import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import type { Profile, UserViolation } from '../types';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  violations: UserViolation[];
  loading: boolean;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  systemSettings: any;
  fetchSystemSettings: () => Promise<void>;
  updateSystemSettings: (updates: any) => Promise<void>;
  upgradeToEcosystem: () => Promise<void>;
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
    violations: [],
    loading: true,
  });

  const [systemSettings, setSystemSettings] = useState<any>(() => {
    try {
      const local = localStorage.getItem('whisprr_system_settings');
      if (local) return JSON.parse(local);
    } catch {}
    return {
      enabled: false,
      message: "We're currently improving WHISPRR to bring you a better experience. Thank you for your patience. ❤️",
      reopen_at: null,
      bypass_founder: true,
      bypass_admin: true,
      bypass_beta: false,
      allow_public: true,
      allow_auth: true
    };
  });

  const initializedRef = useRef(false);

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

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      return data as Profile | null;
    } catch {
      return null;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (state.user) {
      const [profile, violations] = await Promise.all([
        fetchProfile(state.user.id),
        fetchViolations(state.user.id)
      ]);
      setState(prev => ({ ...prev, profile, violations }));
    }
  }, [state.user, fetchProfile, fetchViolations]);

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
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
      profile: prev.profile ? { ...prev.profile, ...updates } : { user_id: state.user!.id, ...updates } as Profile,
    }));
  }, [state.user]);

  const fetchSystemSettings = useCallback(async () => {
    try {
      // Fetch static JSON first as it propagates instantly
      const res = await fetch('/maintenance_mode.json').catch(() => null);
      if (res && res.ok) {
        const value = await res.json();
        setSystemSettings(value);
        localStorage.setItem('whisprr_system_settings', JSON.stringify(value));
        return;
      }

      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('key', 'maintenance_mode')
        .maybeSingle();
      if (!error && data) {
        setSystemSettings(data.value);
        localStorage.setItem('whisprr_system_settings', JSON.stringify(data.value));
      }
    } catch (err) {
      console.warn("Could not fetch system settings, relying on local cache:", err);
    }
  }, []);

  const updateSystemSettings = useCallback(async (updates: any) => {
    try {
      // Sync local cache first for instant feedback
      setSystemSettings(updates);
      localStorage.setItem('whisprr_system_settings', JSON.stringify(updates));

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

    const timeoutId = setTimeout(() => {
      if (mounted && state.loading) {
        setState(prev => ({ ...prev, loading: false }));
      }
    }, AUTH_TIMEOUT_MS);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;

        if (_event === 'SIGNED_OUT') {
          setState({ user: null, session: null, profile: null, violations: [], loading: false });
          return;
        }

        if (session?.user) {
          setState(prev => ({ ...prev, user: session.user, session, loading: true }));
          const [profile, violations] = await Promise.all([
            fetchProfile(session.user.id),
            fetchViolations(session.user.id)
          ]);
          if (mounted) {
            setState({ user: session.user, session, profile, violations, loading: false });
          }
        } else {
          setState({ user: null, session: null, profile: null, violations: [], loading: false });
        }
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;

      if (session?.user) {
        const [profile, violations] = await Promise.all([
          fetchProfile(session.user.id),
          fetchViolations(session.user.id)
        ]);
        if (mounted) {
          setState({ user: session.user, session, profile, violations, loading: false });
        }
      } else {
        if (mounted) {
          setState({ user: null, session: null, profile: null, violations: [], loading: false });
        }
      }
      initializedRef.current = true;
    });

    fetchSystemSettings();

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          legal_accepted_version: CURRENT_LEGAL_VERSION
        }
      }
    });
    if (error) throw error;
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth` },
    });
    if (error) throw error;
  };

  const signInWithApple = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: `${window.location.origin}/auth` },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setState({ user: null, session: null, profile: null, loading: false, violations: [] });
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  };

  const upgradeToEcosystem = async () => {
    // Legacy support to bypass old errors, currently a no-op since everyone is ecosystem now
    return Promise.resolve();
  };

  const acceptLegalTerms = async (version: string) => {
    if (!state.user) return;
    const { error } = await supabase
      .from('profiles')
      .update({
        legal_accepted_version: version,
        legal_accepted_at: new Date().toISOString()
      })
      .eq('user_id', state.user.id);
      
    if (error) throw error;
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
      signUp,
      signInWithGoogle,
      signInWithApple,
      signOut,
      resetPassword,
      refreshProfile,
      updateProfile,
      systemSettings,
      fetchSystemSettings,
      updateSystemSettings,
      upgradeToEcosystem,
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
