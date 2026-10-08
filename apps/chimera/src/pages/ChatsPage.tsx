import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface SceneRow {
  id: string;
  name: string | null;
  last_message: string | null;
  last_message_at: string | null;
  created_at: string;
  conversation_participants: Array<{ user_id: string }>;
}

interface Scene {
  id: string;
  characterName: string;
  /** The player's own title, when they set one. */
  title: string | null;
  preview: string | null;
  when: string;
}

function formatWhen(iso: string) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function ChatsPage() {
  const { user } = useAuth();
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select('id, name, last_message, last_message_at, created_at, conversation_participants(user_id)')
        .eq('type', 'dm')
        .order('last_message_at', { ascending: false, nullsFirst: false })
        .limit(100);
      if (!active) return;
      if (error) {
        setFailed(true);
        setLoading(false);
        return;
      }
      const rows = (data ?? []) as unknown as SceneRow[];
      const botIds = Array.from(new Set(rows.flatMap((r) => r.conversation_participants.map((p) => p.user_id)).filter((id) => id !== user.id)));
      const names = new Map<string, string>();
      if (botIds.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('user_id, display_name, role').in('user_id', botIds);
        // This list can also contain ordinary WHISPRR conversations between people. Only scenes with a character belong here.
        (profiles ?? [])
          .filter((p: { role: string | null }) => p.role === 'ai_character')
          .forEach((p: { user_id: string; display_name: string | null }) => names.set(p.user_id, p.display_name ?? 'Character'));
      }
      if (!active) return;
      setScenes(
        rows.filter((r) => r.conversation_participants.some((p) => p.user_id !== user.id && names.has(p.user_id))).map((r) => {
          const other = r.conversation_participants.find((p) => p.user_id !== user.id)?.user_id;
          return {
            id: r.id,
            characterName: (other && names.get(other)) || 'Character',
            title: r.name?.trim() || null,
            preview: r.last_message,
            when: formatWhen(r.last_message_at ?? r.created_at),
          };
        }),
      );
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [user]);

  return (
    <div className="mx-auto max-w-3xl px-5 pb-10 pt-8 sm:px-8">
      <p className="mb-3 text-sm font-bold tracking-[0.26em] text-chimera-gold">YOUR SCENES</p>
      <h1 className="font-serif text-4xl font-semibold sm:text-5xl">Pick up where you left off.</h1>

      <section className="mt-8" aria-live="polite">
        {loading ? (
          <p className="py-12 text-center text-chimera-mute">Loading your scenes…</p>
        ) : failed ? (
          <p className="py-12 text-center text-chimera-mute">We could not load your scenes right now. Please try again in a moment.</p>
        ) : scenes.length === 0 ? (
          <div className="rounded-[22px] border border-chimera-gold/20 bg-chimera-panel p-8 text-center">
            <MessageCircle className="mx-auto text-chimera-gold" size={32} aria-hidden="true" />
            <p className="mt-4 text-lg text-violet-100/85">You have no scenes yet. Choose a character to begin one.</p>
            <Link to="/discover" className="mt-6 inline-flex min-h-[48px] items-center rounded-full bg-chimera-gold px-6 font-bold text-[#1a1208] hover:brightness-110">Find a character</Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {scenes.map((scene) => (
              <li key={scene.id}>
                <Link to={`/chats/${scene.id}`} className="flex items-center gap-4 rounded-2xl border border-chimera-gold/20 bg-chimera-panel p-4 transition hover:border-chimera-gold/60">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-700 to-chimera-rose font-serif text-xl text-white" aria-hidden="true">{scene.characterName.slice(0, 1).toUpperCase()}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-serif text-xl font-semibold">{scene.title ?? scene.characterName}</span>
                    {scene.title && <span className="block truncate text-xs text-chimera-gold/80">with {scene.characterName}</span>}
                    <span className="block truncate text-sm text-chimera-mute">{scene.preview || 'No messages yet'}</span>
                  </span>
                  <span className="shrink-0 text-xs text-chimera-mute">{scene.when}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
