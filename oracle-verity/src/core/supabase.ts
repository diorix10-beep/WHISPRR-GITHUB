import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { useSettingsStore } from '../store/settings.store';
import { FAMILY_ROSTER } from './family-roster';

let clientInstance: SupabaseClient | null = null;
let lastUrl = '';
let lastKey = '';

/**
 * Returns the active Supabase client instance if URL and Key are configured.
 * Automatically reinstantiates if credentials change at runtime.
 */
export function getSupabaseClient(): SupabaseClient | null {
  const { supabaseUrl, supabaseAnonKey } = useSettingsStore.getState();

  if (!supabaseUrl || !supabaseAnonKey) {
    clientInstance = null;
    lastUrl = '';
    lastKey = '';
    return null;
  }

  if (supabaseUrl !== lastUrl || supabaseAnonKey !== lastKey || !clientInstance) {
    try {
      clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
        }
      });
      lastUrl = supabaseUrl;
      lastKey = supabaseAnonKey;
      console.log('[Supabase] Client initialized successfully.');
      
      // Proactively sync profiles in the background
      dbSyncProfiles();
    } catch (e) {
      console.error('[Supabase] Failed to initialize client:', e);
      return null;
    }
  }

  return clientInstance;
}

// ── Session Helper ───────────────────────────────────────────
async function getOrCreateSession(supabase: SupabaseClient, companionId: string, chatId: string = 'web-local'): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('id')
      .eq('companion_id', companionId)
      .eq('chat_id', chatId)
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (data) return data.id;

    const { data: newSession, error: createError } = await supabase
      .from('chat_sessions')
      .insert({
        companion_id: companionId,
        chat_id: chatId,
        user_id: 'anthony'
      })
      .select('id')
      .single();

    if (createError) throw createError;
    return newSession?.id || null;
  } catch (e) {
    console.error('[Supabase] getOrCreateSession error:', e);
    return null;
  }
}

// ── Profile Seeder ───────────────────────────────────────────
export async function dbSyncProfiles() {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    for (const member of FAMILY_ROSTER) {
      await supabase
        .from('family_profiles')
        .upsert({
          id: member.id,
          name: member.name,
          title: member.title,
          role: member.role,
          emoji: member.emoji,
          avatar: member.avatar,
          color: member.color,
          traits: member.traits,
          bio: member.bio
        }, { onConflict: 'id' });
    }
    console.log('[Supabase] Profiles synchronized.');
  } catch (e) {
    console.error('[Supabase] Profiles sync failed:', e);
  }
}

// ── Message History Sync ─────────────────────────────────────
export async function dbAddMessage(companionId: string, role: string, content: string, timestamp: number, senderId?: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    const sessionId = await getOrCreateSession(supabase, companionId);
    if (!sessionId) return;

    const { error } = await supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        role,
        content,
        sender_id: senderId || (role === 'user' ? 'user' : companionId),
        created_at: new Date(timestamp).toISOString()
      });

    if (error) throw error;
  } catch (e) {
    console.error('[Supabase] dbAddMessage failed:', e);
  }
}

export async function dbLoadHistory(companionId: string): Promise<any[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  try {
    const sessionId = await getOrCreateSession(supabase, companionId);
    if (!sessionId) return [];

    const { data, error } = await supabase
      .from('chat_messages')
      .select('role, content, created_at, sender_id')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return data.map(m => ({
      role: m.role,
      content: m.content,
      timestamp: new Date(m.created_at).getTime(),
      senderId: m.sender_id
    }));
  } catch (e) {
    console.error('[Supabase] dbLoadHistory failed:', e);
    return [];
  }
}

export async function dbClearHistory(companionId: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    const sessionId = await getOrCreateSession(supabase, companionId);
    if (!sessionId) return;

    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('session_id', sessionId);

    if (error) throw error;
  } catch (e) {
    console.error('[Supabase] dbClearHistory failed:', e);
  }
}

// ── Memories Sync ───────────────────────────────────────────
export async function dbAddMemory(companionId: string, type: string, content: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    const { error } = await supabase
      .from('agent_memories')
      .insert({
        companion_id: companionId,
        type,
        content
      });

    if (error) throw error;
  } catch (e) {
    console.error('[Supabase] dbAddMemory failed:', e);
  }
}

export async function dbLoadMemories(): Promise<any[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('agent_memories')
      .select('id, type, content, created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    return data.map(m => ({
      id: m.id,
      type: m.type,
      content: m.content,
      timestamp: m.created_at
    }));
  } catch (e) {
    console.error('[Supabase] dbLoadMemories failed:', e);
    return [];
  }
}

export async function dbRemoveMemory(id: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    const { error } = await supabase
      .from('agent_memories')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (e) {
    console.error('[Supabase] dbRemoveMemory failed:', e);
  }
}

export async function dbClearMemories() {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    const { error } = await supabase
      .from('agent_memories')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) throw error;
  } catch (e) {
    console.error('[Supabase] dbClearMemories failed:', e);
  }
}
