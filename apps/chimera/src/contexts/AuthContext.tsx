import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { CHIMERA_ORIGIN, supabase } from '../lib/supabase';

/** Same value as before, so existing accounts and database rules keep working. */
export const CURRENT_LEGAL_VERSION = '2026-07-09-v1';

export interface Profile {
  user_id: string;
  display_name: string;
  username: string;
  avatar_emoji: string | null;
  photo_url: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  // SHARDS and VELLUM: unchanged from the previous CHIMERA.
  shardsBalance: number | null;
  vellumBalance: number | null;
  spendShards: (amount: number, reason: string) => boolean;
  earnShards: (amount: number, reason: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const user = session?.user ?? null;

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setProfile(null);
      return;
    }
    let active = true;
    supabase
      .from('profiles')
      .select('user_id, display_name, username, avatar_emoji, photo_url')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setProfile((data as Profile | null) ?? null);
      });
    return () => {
      active = false;
    };
  }, [user?.id]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: CHIMERA_ORIGIN,
        data: { legal_accepted_version: CURRENT_LEGAL_VERSION },
      },
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  // ── SHARDS and VELLUM wallets (as in the previous CHIMERA) ──────────────
  const [shardsBalance, setShardsBalance] = useState<number | null>(null);
  const [vellumBalance, setVellumBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!user?.id) {
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
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
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
  }, [user?.id]);

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

  const value = useMemo<AuthContextType>(
    () => ({ user, session, profile, loading, signIn, signUp, signOut, shardsBalance, vellumBalance, spendShards, earnShards }),
    [user, session, profile, loading, signIn, signUp, signOut, shardsBalance, vellumBalance, spendShards, earnShards],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
