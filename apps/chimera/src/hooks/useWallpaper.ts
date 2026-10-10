import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DEFAULT_WALLPAPER,
  MAX_DIM,
  WALLPAPER_STORAGE_KEY,
  normalizeWallpaper,
  readWallpaper,
  writeWallpaper,
  type WallpaperChoice,
  type WallpaperSetting,
} from '../lib/wallpaper';
import { WallpaperImageError, processWallpaperFile } from '../lib/wallpaperImage';
import { loadWallpaperBlob, removeWallpaperBlob, saveWallpaperBlob } from '../lib/wallpaperStore';

/**
 * The chat background: read once, changed from the panel, kept in this browser as it changes (the picture in its own browser
 * database), and followed live when another tab changes it. `problem` is the last thing that went wrong, in words for the
 * player; `saved` is false when the browser would not keep the choice.
 */
export function useWallpaper() {
  const [setting, setSetting] = useState<WallpaperSetting>(() => readWallpaper());
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [saved, setSaved] = useState(true);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const urlRef = useRef<string | null>(null);
  // Bumped by every other choice, so a picture that finishes preparing late cannot replace what was chosen meanwhile.
  const generation = useRef(0);

  const showBlob = useCallback((blob: Blob | null) => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = blob ? URL.createObjectURL(blob) : null;
    setImageUrl(urlRef.current);
  }, []);

  // A picture chosen on an earlier visit: read it back. If it is gone (cleared browser data, another profile), there is no picture to show.
  const restore = useCallback(
    async (current: WallpaperSetting) => {
      if (current.choice.kind !== 'image') {
        showBlob(null);
        return;
      }
      const blob = await loadWallpaperBlob();
      if (blob) showBlob(blob);
      else {
        showBlob(null);
        setSetting({ ...DEFAULT_WALLPAPER });
        writeWallpaper({ ...DEFAULT_WALLPAPER });
      }
    },
    [showBlob],
  );

  useEffect(() => {
    void restore(setting);
    // Only on the first visit to the page: later changes come from the functions below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== WALLPAPER_STORAGE_KEY && event.key !== null) return;
      const next = readWallpaper();
      setSetting(next);
      void restore(next);
    };
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, [restore]);

  const commit = useCallback((next: WallpaperSetting) => {
    const clean = normalizeWallpaper({ c: next.choice, dim: next.dim });
    setSetting(clean);
    setSaved(writeWallpaper(clean));
  }, []);

  const choose = useCallback(
    (choice: WallpaperChoice) => {
      generation.current += 1;
      setProblem(null);
      // Moving away from a picture frees the stored one.
      if (setting.choice.kind === 'image' && choice.kind !== 'image') {
        void removeWallpaperBlob();
        showBlob(null);
      }
      commit({ choice, dim: choice.kind === 'none' ? 0 : setting.dim });
    },
    [commit, setting, showBlob],
  );

  const setPreset = useCallback((id: string) => choose({ kind: 'preset', id }), [choose]);
  const setColor = useCallback((color: string) => choose({ kind: 'color', color }), [choose]);
  const clear = useCallback(() => choose({ kind: 'none' }), [choose]);
  // Dimming is not a different background, so it does not cancel a picture still being prepared.
  const setDim = useCallback((dim: number) => commit({ choice: setting.choice, dim: Math.min(MAX_DIM, Math.max(0, dim)) }), [commit, setting.choice]);

  /** Prepares and keeps a picture. Resolves true when it is now the background; otherwise `problem` says why not. */
  const setImage = useCallback(
    async (file: File): Promise<boolean> => {
      const mine = ++generation.current;
      setBusy(true);
      setProblem(null);
      try {
        const processed = await processWallpaperFile(file);
        if (mine !== generation.current) return false;
        if (!(await saveWallpaperBlob(processed.blob))) {
          setProblem('This browser would not keep the picture (a private window, or no room left). Try a ready-made background instead.');
          return false;
        }
        if (mine !== generation.current) {
          // Something else was chosen while the picture was being kept: let the picture go.
          void removeWallpaperBlob();
          return false;
        }
        showBlob(processed.blob);
        commit({ choice: { kind: 'image', luminance: processed.luminance }, dim: 0 });
        return true;
      } catch (error) {
        setProblem(error instanceof WallpaperImageError ? error.message : 'This picture could not be used. Please try another one.');
        return false;
      } finally {
        setBusy(false);
      }
    },
    [commit, showBlob],
  );

  return { setting, imageUrl, saved, busy, problem, setPreset, setColor, setImage, setDim, clear };
}

export type WallpaperState = ReturnType<typeof useWallpaper>;
