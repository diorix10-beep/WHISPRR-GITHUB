import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

/** Interface hint only: the database decides who may publish publicly. */
export function useIsFounder() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [result, setResult] = useState<{ forUser: string; founder: boolean } | null>(null);

  useEffect(() => {
    if (!userId) return;
    let current = true;
    supabase
      .from('profiles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle()
      .then(
        ({ data }) => { if (current) setResult({ forUser: userId, founder: data?.role === 'founder' }); },
        () => { if (current) setResult({ forUser: userId, founder: false }); },
      );
    return () => { current = false; };
  }, [userId]);

  const ready = !userId || result?.forUser === userId;
  return { isFounder: !!userId && result?.forUser === userId && result.founder, loading: !ready };
}
