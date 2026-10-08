import type { SupabaseClient } from '@supabase/supabase-js';
import type { GuidedTurningPoint } from '../components/GuidedTurningPointCard';
import { supabase } from './supabase';

export interface ChatMessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  response_versions?: Array<{ content: string }> | null;
}

export type ComposerMode = 'say' | 'act' | 'ooc';

/** How a line typed in each composer mode is stored and sent to the character. */
export function formatPlayerLine(mode: ComposerMode, text: string): string {
  const line = text.trim();
  if (mode === 'act') return line.startsWith('*') && line.endsWith('*') ? line : `*${line}*`;
  if (mode === 'ooc') return /^\(\s*ooc\s*:/i.test(line) ? line : `(OOC: ${line})`;
  return line;
}

/**
 * Stores a message with a client-generated id, so a retry after a lost
 * acknowledgement never creates a duplicate.
 */
export async function persistPlayerMessage(
  client: SupabaseClient,
  message: { id: string; conversation_id: string; sender_id: string; content: string },
) {
  const find = () =>
    client.from('messages').select('id, sender_id, conversation_id, content').eq('id', message.id).maybeSingle();
  const matches = (row: typeof message | null) =>
    !!row && row.id === message.id && row.sender_id === message.sender_id && row.conversation_id === message.conversation_id && row.content === message.content;

  const { data: existing, error: lookupError } = await find();
  if (lookupError) throw lookupError;
  if (existing) {
    if (!matches(existing)) throw new Error('This message could not be verified. Your draft is still here.');
    return;
  }
  const { error: insertError } = await client.from('messages').insert({ ...message, read: false });
  if (insertError) {
    const { data: confirmed, error: confirmError } = await find();
    if (confirmError || !matches(confirmed)) throw insertError;
  }
}

async function authHeaders(extra: Record<string, string> = {}) {
  const { data } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${data.session?.access_token ?? ''}`,
    ...extra,
  };
}

interface ReplyOptions {
  conversationId: string;
  botUserId: string;
  isInitiation?: boolean;
  swipe?: { messageId: string; expectedContent: string; retryId: string };
}

/** Asks the server for the character's next reply. Throws a readable Error on failure. */
export async function requestCharacterReply(options: ReplyOptions): Promise<string> {
  const response = await fetch('/api/ai-chat', {
    method: 'POST',
    headers: await authHeaders(options.swipe ? { 'Idempotency-Key': options.swipe.retryId } : {}),
    body: JSON.stringify({
      conversation_id: options.conversationId,
      bot_user_id: options.botUserId,
      is_initiation: options.isInitiation === true,
      is_swipe: !!options.swipe,
      target_message_id: options.swipe?.messageId,
      expected_content: options.swipe?.expectedContent,
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || typeof payload?.reply !== 'string') {
    throw new Error(typeof payload?.error === 'string' ? payload.error : 'The character could not answer right now. Please try again.');
  }
  return payload.reply;
}

export async function requestTurningPoint(conversationId: string, botUserId: string): Promise<GuidedTurningPoint> {
  const response = await fetch('/api/roleplay-turning-point', {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ conversation_id: conversationId, bot_user_id: botUserId }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.turning_point) throw new Error(payload?.error || 'Could not open a turning point.');
  return payload.turning_point as GuidedTurningPoint;
}
