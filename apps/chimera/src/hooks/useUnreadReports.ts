import { useEffect, useState } from 'react';
import { MODERATION_LIVE, countUnreadReports } from '../lib/moderation';
import { useAuth } from '../contexts/AuthContext';
import { useIsFounder } from './useIsFounder';

const REFRESH_MS = 60_000;

/**
 * How many reports are waiting, for the badge on the Admin link. Only asked for moderators; the database answers 0 to
 * everyone else anyway. Refreshed every minute, and when the page comes back to the front.
 */
export function useUnreadReports(): { isModerator: boolean; unread: number; refresh: () => void } {
  const { user } = useAuth();
  const { isFounder } = useIsFounder();
  const [unread, setUnread] = useState(0);
  const [tick, setTick] = useState(0);
  const active = MODERATION_LIVE && !!user && isFounder;

  useEffect(() => {
    if (!active) return;
    let current = true;
    const load = () => {
      countUnreadReports().then(
        (n) => { if (current) setUnread(n); },
        () => { /* A failed count keeps the last one. */ },
      );
    };
    load();
    const timer = window.setInterval(load, REFRESH_MS);
    const visible = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', visible);
    return () => {
      current = false;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', visible);
    };
  }, [active, tick]);

  return { isModerator: active, unread: active ? unread : 0, refresh: () => setTick((n) => n + 1) };
}
