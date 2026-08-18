import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Loader2, Lock, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PublicScene {
  id: string;
  title: string;
  summary: string;
  visibility: 'public' | 'unlisted';
  content_rating: 'limited' | 'mature';
  published_at: string;
}

interface PublicSceneMessage {
  id: string;
  author_label: string;
  author_kind: 'member' | 'character';
  content: string;
  position: number;
}

export default function PublicRoleplayScenePage() {
  const navigate = useNavigate();
  const { sceneId } = useParams<{ sceneId: string }>();
  const [scene, setScene] = useState<PublicScene | null>(null);
  const [messages, setMessages] = useState<PublicSceneMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sceneId) return;
    const loadScene = async () => {
      try {
        const { data: sceneData, error: sceneError } = await supabase
          .from('roleplay_public_scenes')
          .select('id, title, summary, visibility, content_rating, published_at')
          .eq('id', sceneId)
          .maybeSingle();
        if (sceneError) throw sceneError;
        if (!sceneData) return;

        const { data: messageData, error: messageError } = await supabase
          .from('roleplay_public_scene_messages')
          .select('id, author_label, author_kind, content, position')
          .eq('scene_id', sceneId)
          .order('position', { ascending: true });
        if (messageError) throw messageError;
        setScene(sceneData as PublicScene);
        setMessages((messageData || []) as PublicSceneMessage[]);
      } catch (error) {
        console.error('Could not load public roleplay scene:', error);
      } finally {
        setLoading(false);
      }
    };
    loadScene();
  }, [sceneId]);

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="animate-spin text-red-500" size={30} /></div>;
  }

  if (!scene) {
    return <section className="mx-auto max-w-2xl px-4 py-20 text-center"><BookOpen className="mx-auto text-warm-400" size={36} /><h1 className="mt-5 font-serif text-3xl font-bold text-warm-900 dark:text-white">This scene is not available</h1><p className="mt-3 text-sm text-warm-500">It may be private, unlisted, or no longer published.</p><button onClick={() => navigate('/conversations')} className="mt-6 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white">Back to Chats</button></section>;
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <button onClick={() => navigate('/conversations')} className="inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-bold text-warm-500 transition hover:bg-warm-100 dark:hover:bg-warm-800"><ArrowLeft size={18} /> Chats</button>
      <header className="mt-5 rounded-3xl border border-warm-200 bg-white/75 p-6 shadow-sm dark:border-warm-800 dark:bg-warm-900/80 sm:p-8">
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-300"><BookOpen size={14} /> Shared roleplay scene <span className="rounded-full border border-warm-200 px-2 py-1 text-warm-500 dark:border-warm-700 dark:text-warm-300">{scene.content_rating}</span></div>
        <h1 className="mt-4 font-serif text-3xl font-bold text-warm-900 dark:text-white sm:text-4xl">{scene.title}</h1>
        {scene.summary && <p className="mt-3 max-w-2xl text-sm leading-relaxed text-warm-600 dark:text-warm-300">{scene.summary}</p>}
        <p className="mt-5 flex items-center gap-2 text-xs text-warm-500"><ShieldCheck size={14} /> This is a shared snapshot. It is not the live private chat.</p>
      </header>

      <section className="mt-6 space-y-4">
        {messages.map((message) => (
          <article key={message.id} className={`max-w-[88%] rounded-3xl border p-4 shadow-sm ${message.author_kind === 'member' ? 'ml-auto border-red-500/15 bg-red-500/[0.08]' : 'border-warm-200 bg-white/75 dark:border-warm-800 dark:bg-warm-900/80'}`}>
            <p className="text-xs font-bold text-warm-500">{message.author_label}</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-warm-800 dark:text-warm-100">{message.content}</p>
          </article>
        ))}
        {messages.length === 0 && <p className="rounded-2xl border border-warm-200 p-6 text-center text-sm text-warm-500 dark:border-warm-800">This shared scene does not have any readable messages.</p>}
      </section>
      <p className="mt-8 flex items-center justify-center gap-2 text-center text-xs text-warm-500"><Lock size={13} /> To continue a story, start your own private roleplay with the character.</p>
    </main>
  );
}
