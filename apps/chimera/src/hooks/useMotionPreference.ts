import { useEffect } from 'react';
import { LOOK_STORAGE_KEY, readLook } from '../lib/chatLook';
import { applyMotion } from '../lib/motion';

/** Applies the saved Movement choice on every page of the app, and follows a change made in another tab. */
export function useMotionPreference(): void {
  useEffect(() => {
    applyMotion(readLook().motion);
    const onStorage = (event: StorageEvent) => {
      if (event.key === LOOK_STORAGE_KEY || event.key === null) applyMotion(readLook().motion);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
}
