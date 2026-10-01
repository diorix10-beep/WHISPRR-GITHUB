import type { SupabaseClient } from '@supabase/supabase-js';

export interface PendingRoleplayMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  image_url: string | null;
}

// The same client-generated ID survives retries, including a lost INSERT acknowledgement.
export async function persistRoleplayMessage(client: SupabaseClient, message: PendingRoleplayMessage) {
  const find = () => client.from('messages').select('id, sender_id, conversation_id, content, image_url').eq('id', message.id).maybeSingle();
  const matches = (row: PendingRoleplayMessage | null) => row && row.id === message.id && row.sender_id === message.sender_id
    && row.conversation_id === message.conversation_id && row.content === message.content
    && (row.image_url || null) === message.image_url;
  const { data: existing, error: lookupError } = await find();
  if (lookupError) throw lookupError;
  if (existing) {
    if (!matches(existing)) throw new Error('Message retry could not be verified. Your draft is still here.');
    return;
  }
  const { error: insertError } = await client.from('messages').insert({ ...message, read: false });
  if (insertError) {
    const { data: confirmed, error: confirmationError } = await find();
    if (confirmationError || !matches(confirmed)) throw insertError;
  }
}
