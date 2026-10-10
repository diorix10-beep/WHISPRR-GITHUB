import { supabase } from './supabase';

export type Rating = 1 | -1;

/** The member's own likes and dislikes among these messages. */
export async function loadMyFeedback(messageIds: string[]): Promise<Record<string, Rating>> {
  const found: Record<string, Rating> = {};
  for (let from = 0; from < messageIds.length; from += 100) {
    const { data, error } = await supabase.from('chimera_message_feedback').select('message_id, rating').in('message_id', messageIds.slice(from, from + 100));
    if (error) throw error;
    for (const row of (data ?? []) as Array<{ message_id: string; rating: number }>) {
      if (row.rating === 1 || row.rating === -1) found[row.message_id] = row.rating;
    }
  }
  return found;
}

/** Likes or dislikes a character's message; `null` takes the feedback back. Returns what is stored now. */
export async function setMessageFeedback(messageId: string, rating: Rating | null): Promise<Rating | null> {
  const { data, error } = await supabase.rpc('set_chimera_message_feedback', { p_message_id: messageId, p_rating: rating ?? 0 });
  if (error) throw error;
  return data === 1 || data === -1 ? data : null;
}
