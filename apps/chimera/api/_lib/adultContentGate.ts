import type { SupabaseClient } from '@supabase/supabase-js';
import { RequestError } from './requestProtection.js';

export const ADULT_ACCESS_MESSAGE =
  'This character is rated Mature or NSFW. Verify your age and turn on adult content in the Guardian\'s Library to continue.';

/**
 * Mirrors the prompt builder, which treats a missing rating as SFW. Any other
 * value that is not explicitly SFW counts as adult, so a typo or a new rating
 * fails closed.
 */
export function isAdultRating(rating: unknown): boolean {
  return String(rating || 'SFW').trim().toUpperCase() !== 'SFW';
}

/**
 * Server-side gate for Mature / NSFW characters. `supabase` must be the
 * member-scoped client: the database decides whether THIS member is a verified
 * adult who has opted in. Any error is treated as "no access".
 */
export async function requireAdultContentAccess(supabase: SupabaseClient, rating: unknown): Promise<void> {
  if (!isAdultRating(rating)) return;
  const { data, error } = await supabase.rpc('get_my_adult_content_access');
  if (error || data !== true) throw new RequestError(403, ADULT_ACCESS_MESSAGE);
}
