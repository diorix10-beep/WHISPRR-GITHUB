import { useEffect, useMemo, useState } from 'react';

// Simple client-side A/B test hook. Chooses variant using localStorage and exposes the variant id.
export function useABTest(testName: string, variants: string[]) {
  const key = `ab_${testName}`;
  const [variant, setVariant] = useState<string>(() => {
    const existing = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
    if (existing && variants.includes(existing)) return existing;
    const pick = variants[Math.floor(Math.random() * variants.length)];
    try { localStorage.setItem(key, pick); } catch (e) {}
    return pick;
  });

  // Optional: expose a function to reset the test
  const reset = () => { const pick = variants[Math.floor(Math.random() * variants.length)]; localStorage.setItem(key, pick); setVariant(pick); };

  return useMemo(() => ({ variant, reset }), [variant]);
}
