import { useCallback, useEffect, useState } from 'react';
import { applyMotion } from '../lib/motion';
import { DEFAULT_LOOK, LOOK_STORAGE_KEY, normalizeLook, readLook, writeLook, type ChatLook } from '../lib/chatLook';

/**
 * The player's chat look: read once, changed from the panel, saved in this browser as it changes, and followed live when
 * another tab of the same browser changes it. `saved` is false when the browser would not keep it (the look then lasts until the page is closed).
 */
export function useChatLook() {
  const [look, setLook] = useState<ChatLook>(() => readLook());
  const [saved, setSaved] = useState(true);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === LOOK_STORAGE_KEY || event.key === null) setLook(readLook());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // The page root carries the choice so that the whole app follows it (the app also applies it on every page, see useMotionPreference).
  useEffect(() => {
    applyMotion(look.motion);
  }, [look.motion]);

  const change = useCallback((patch: Partial<ChatLook>) => {
    setLook((current) => {
      const next = normalizeLook({ ...current, ...patch });
      setSaved(writeLook(next));
      return next;
    });
  }, []);
  const reset = useCallback(() => {
    setLook({ ...DEFAULT_LOOK });
    setSaved(writeLook({ ...DEFAULT_LOOK }));
  }, []);
  return { look, change, reset, saved };
}
