import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

/** A missing rating means SFW; anything else that is not SFW is adult (matches the API gate). */
export function isAdultRating(rating: unknown): boolean {
  return String(rating || 'SFW').trim().toUpperCase() !== 'SFW';
}

/**
 * May this member see Mature / NSFW characters? True only for a verified adult
 * who has switched adult content on. Any error, or being signed out, means no.
 * This only shapes the interface; the API and the database enforce the rule.
 */
export function useAdultContentAccess() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [result, setResult] = useState<{ forUser: string; allowed: boolean } | null>(null);

  useEffect(() => {
    if (!userId) return;
    let current = true;
    supabase
      .rpc('get_my_adult_content_access')
      .then(
        ({ data, error }) => { if (current) setResult({ forUser: userId, allowed: !error && data === true }); },
        () => { if (current) setResult({ forUser: userId, allowed: false }); },
      );
    return () => { current = false; };
  }, [userId]);

  const resolved = result?.forUser === userId;
  return {
    allowed: Boolean(userId) && resolved && Boolean(result?.allowed),
    loading: Boolean(userId) && !resolved,
  };
}
