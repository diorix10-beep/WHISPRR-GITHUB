import { supabase } from './supabase';

/** One of the player's scenes with a character, as the lists show it. */
export interface SceneListItem {
  id: string;
  /** The character's user id (the other participant). */
  characterUserId: string;
  characterName: string;
  /** The player's own title, when they set one. */
  title: string | null;
  preview: string | null;
  /** ISO time of the last message, or of the creation when there is none yet. */
  lastAt: string;
  /** The scene this one was branched from, when that scene still exists. */
  parentId: string | null;
}

interface SceneRow {
  id: string;
  name: string | null;
  last_message: string | null;
  last_message_at: string | null;
  created_at: string;
  parent_conversation_id: string | null;
  conversation_participants: Array<{ user_id: string }>;
}

export const sceneName = (scene: Pick<SceneListItem, 'title' | 'characterName'>) => scene.title ?? scene.characterName;

export function formatWhen(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** "Branch of …" for a scene made from another one in this list; null for an ordinary scene. */
export function branchNote(scene: SceneListItem, all: SceneListItem[]): string | null {
  if (!scene.parentId) return null;
  const parent = all.find((other) => other.id === scene.parentId);
  return parent ? `Branch of “${sceneName(parent)}”` : 'A branch';
}

/**
 * The player's scenes with characters, newest first. The list can also hold ordinary WHISPRR conversations between people:
 * only scenes whose other participant is a character belong here. Pass `characterUserId` for one character's scenes.
 * Reading is limited by the database to scenes the player takes part in.
 */
export async function loadScenes(userId: string, options: { characterUserId?: string } = {}): Promise<SceneListItem[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('id, name, last_message, last_message_at, created_at, parent_conversation_id, conversation_participants(user_id)')
    .eq('type', 'dm')
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .limit(200);
  if (error) throw error;
  const rows = (data ?? []) as unknown as SceneRow[];
  const otherIds = Array.from(new Set(rows.flatMap((r) => r.conversation_participants.map((p) => p.user_id)).filter((id) => id !== userId)));
  const names = new Map<string, string>();
  if (otherIds.length > 0) {
    const { data: profiles } = await supabase.from('profiles').select('user_id, display_name, role').in('user_id', otherIds);
    (profiles ?? [])
      .filter((p: { role: string | null }) => p.role === 'ai_character')
      .forEach((p: { user_id: string; display_name: string | null }) => names.set(p.user_id, p.display_name ?? 'Character'));
  }
  const scenes: SceneListItem[] = [];
  for (const row of rows) {
    const other = row.conversation_participants.find((p) => p.user_id !== userId && names.has(p.user_id))?.user_id;
    if (!other || (options.characterUserId && other !== options.characterUserId)) continue;
    scenes.push({
      id: row.id,
      characterUserId: other,
      characterName: names.get(other) ?? 'Character',
      title: row.name?.trim() || null,
      preview: row.last_message,
      lastAt: row.last_message_at ?? row.created_at,
      parentId: row.parent_conversation_id,
    });
  }
  return scenes;
}
