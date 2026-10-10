import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { GitBranch, MessageCircle } from 'lucide-react';
import { branchNote, formatWhen, loadScenes, sceneName, type SceneListItem } from '../lib/sceneList';
import { useAuth } from '../contexts/AuthContext';

export default function ChatsPage() {
  const { user } = useAuth();
  const [scenes, setScenes] = useState<SceneListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!user) return;
    let active = true;
    loadScenes(user.id).then(
      (list) => {
        if (!active) return;
        setScenes(list);
        setLoading(false);
      },
      () => {
        if (!active) return;
        setFailed(true);
        setLoading(false);
      },
    );
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
                    <span className="block truncate font-serif text-xl font-semibold">{sceneName(scene)}</span>
                    {scene.title && <span className="block truncate text-xs text-chimera-gold/80">with {scene.characterName}</span>}
                    {branchNote(scene, scenes) && <span className="flex items-center gap-1 text-xs text-chimera-gold/90"><GitBranch size={12} aria-hidden="true" />{branchNote(scene, scenes)}</span>}
                    <span className="block truncate text-sm text-chimera-mute">{scene.preview || 'No messages yet'}</span>
                  </span>
                  <span className="shrink-0 text-xs text-chimera-mute">{formatWhen(scene.lastAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
