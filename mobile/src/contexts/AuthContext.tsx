import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

// Import type definitions directly from root src/types
import type { Profile } from '~/types';

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  systemSettings: any;
  fetchSystemSettings: () => Promise<void>;
  updateSystemSettings: (updates: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    loading: true,
  });

  const [systemSettings, setSystemSettings] = useState<any>({
    enabled: false,
    message: "We're currently improving WHISPRR to bring you a better experience. Thank you for your patience. ❤️",
    reopen_at: null,
    bypass_founder: true,
    bypass_admin: true,
    bypass_beta: false,
    allow_public: true,
    allow_auth: true
  });

  const initializedRef = useRef(false);

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
      const profile = await fetchProfile(state.user.id);
      setState(prev => ({ ...prev, profile }));
    }
  }, [state.user, fetchProfile]);

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
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('key', 'maintenance_mode')
        .maybeSingle();

      if (error) throw error;
      if (data && data.value) {
        setSystemSettings(data.value);
        await AsyncStorage.setItem('whisprr_system_settings', JSON.stringify(data.value));
      }
    } catch (err) {
      console.warn('Failed to load system settings from Supabase:', err);
    }
  }, []);

  const updateSystemSettings = useCallback(async (updates: any) => {
    const updated = { ...systemSettings, ...updates };
    setSystemSettings(updated);
    await AsyncStorage.setItem('whisprr_system_settings', JSON.stringify(updated));
    
    // Attempt saving to DB
    await supabase
      .from('system_settings')
      .upsert({ key: 'maintenance_mode', value: updated });
  }, [systemSettings]);

  // Load cached settings on startup
  useEffect(() => {
    async function loadCachedSettings() {
      try {
        const cached = await AsyncStorage.getItem('whisprr_system_settings');
        if (cached) {
          setSystemSettings(JSON.parse(cached));
        }
      } catch {}
    }
    loadCachedSettings();
  }, []);

  // Listen for Supabase session changes
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    // Load initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const user = session?.user ?? null;
      const profile = user ? await fetchProfile(user.id) : null;
      setState({
        user,
        session,
        profile,
        loading: false,
      });
      fetchSystemSettings();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user ?? null;
      const profile = user ? await fetchProfile(user.id) : null;
      setState({
        user,
        session,
        profile,
        loading: false,
      });
      if (event === 'SIGNED_IN') {
        fetchSystemSettings();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile, fetchSystemSettings]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signIn,
        signUp,
        signOut,
        refreshProfile,
        updateProfile,
        systemSettings,
        fetchSystemSettings,
        updateSystemSettings,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
