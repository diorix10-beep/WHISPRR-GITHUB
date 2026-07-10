// Simple TTL-based in-memory cache to reduce redundant Supabase profile fetches
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class Cache<K extends string, V> {
  private store = new Map<K, CacheEntry<V>>();
  private ttlMs: number;

  constructor(ttlSeconds = 60) {
    this.ttlMs = ttlSeconds * 1000;
  }

  get(key: K): V | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: K, value: V): void {
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  delete(key: K): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  has(key: K): boolean {
    return this.get(key) !== undefined;
  }
}

// Profile cache: keyed by user_id, 2-minute TTL
import type { Profile } from '../types';
export const profileCache = new Cache<string, Profile>(120);

// Generic utility to fetch with cache
export async function withCache<T>(
  cache: Cache<string, T>,
  key: string,
  fetcher: () => Promise<T | null>
): Promise<T | null> {
  const cached = cache.get(key);
  if (cached !== undefined) return cached;
  const result = await fetcher();
  if (result !== null) cache.set(key, result);
  return result;
}

export { Cache };
