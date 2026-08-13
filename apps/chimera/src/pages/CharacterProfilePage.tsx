import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Heart, Layers, MessageSquare, Sparkles, Tag, UserRound } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { RichEmptyState } from '../components/common/RichEmptyState';

type Character = Record<string, any>;

export default function CharacterProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const loadCharacter = async () => {
      if (!id) return;
      setLoading(true);
      const { data, error } = await supabase.from('ai_characters').select('*').eq('id', id).single();
      if (error) {
        console.error('Unable to load character profile', error);
        setCharacter(null);
      } else {
        setCharacter(data);
      }
      setLoading(false);
    };
    loadCharacter();
  }, [id]);

  const details = useMemo(() => {
    const bot = character?.bot_profile || {};
    return {
      name: character?.name || bot.display_name || 'Unnamed character',
      image: character?.photo_url || character?.avatar_url || bot.photo_url,
      emoji: bot.avatar_emoji || '✦',
      description: character?.short_description || character?.long_description || 'A character waiting for a story to begin.',
      personality: character?.personality || 'Their personality will reveal itself in the scene.',
      scenario: character?.scenario || 'Start wherever your story needs to begin.',
      greeting: character?.greeting || 'The scene is waiting for you.',
      tags: Array.isArray(character?.tags) ? character.tags : [],
      creator: character?.creator_username || bot.username || 'creator',
    };
  }, [character]);

  const beginScene = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (!character) return;
    setStarting(true);
    try {
      const { data: conversation, error } = await supabase
        .from('conversations')
        .insert({
          type: 'dm',
          created_by: user.id,
          character_id: character.id,
          last_message: details.greeting,
          last_message_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;

      const { error: participantError } = await supabase
        .from('conversation_participants')
        .insert({ conversation_id: conversation.id, user_id: user.id });
      if (participantError) throw participantError;

      navigate(`/conversations/${conversation.id}`);
    } catch (error) {
      console.error('Unable to begin scene', error);
      showToast('We could not begin this scene. Please try again.', 'error');
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return <div className="min-h-[60vh] grid place-items-center text-warm-400">Opening character…</div>;
  }
  if (!character) {
    return <RichEmptyState icon={UserRound} title="Character not found" description="This character may have been removed or is no longer available to you." actionLabel="Return to discovery" onAction={() => navigate('/discover')} />;
  }

  const canEdit = character.creator_id === profile?.user_id || character.user_id === profile?.user_id;

  return (
    <main className="min-h-screen pb-24 text-warm-900 dark:text-warm-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 space-y-6">
        <button onClick={() => navigate('/discover')} className="inline-flex items-center gap-2 text-xs font-bold text-warm-500 hover:text-red-500 transition-colors">
          <ArrowLeft size={15} /> Back to discovery
        </button>

        <section className="overflow-hidden rounded-[2rem] border border-warm-200 dark:border-warm-750 bg-white/70 dark:bg-warm-900/75 backdrop-blur-xl shadow-xl">
          <div className="grid lg:grid-cols-[minmax(280px,0.8fr)_1.2fr]">
            <div className="relative min-h-[340px] bg-gradient-to-br from-red-950 via-warm-900 to-purple-950">
              {details.image ? <img src={details.image} alt={details.name} className="absolute inset-0 w-full h-full object-cover opacity-80" /> : <div className="absolute inset-0 grid place-items-center text-8xl">{details.emoji}</div>}
              <div className="absolute inset-0 bg-gradient-to-t from-warm-950 via-warm-950/25 to-transparent" />
              <div className="absolute left-6 bottom-6 flex flex-wrap gap-2">
                {details.tags.slice(0, 4).map((tag: string) => <span key={tag} className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/35 px-3 py-1 text-[11px] font-bold text-white"><Tag size={11} /> {tag}</span>)}
              </div>
            </div>

            <div className="p-6 sm:p-10 space-y-7">
              <div className="space-y-3">
                <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-red-500"><Sparkles size={14} /> Character profile</p>
                <h1 className="font-serif text-4xl sm:text-6xl font-bold text-warm-900 dark:text-white leading-none">{details.name}</h1>
                <p className="text-sm text-warm-500 dark:text-warm-300 leading-relaxed max-w-2xl">{details.description}</p>
                <p className="text-xs text-warm-400">Created by @{details.creator}</p>
              </div>

              <section className="rounded-2xl border border-red-500/20 bg-red-500/5 dark:bg-red-950/20 p-5 space-y-3">
                <p className="text-xs uppercase tracking-wider font-bold text-red-500 flex items-center gap-2"><Layers size={14} /> The opening scene</p>
                <p className="font-serif text-xl text-warm-900 dark:text-white">{details.scenario}</p>
                <p className="text-sm text-warm-600 dark:text-warm-300 italic leading-relaxed">{details.greeting}</p>
                <button onClick={beginScene} disabled={starting} className="w-full sm:w-auto mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-500 px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-red-600/25 transition hover:from-red-500 hover:to-red-400 disabled:opacity-60">
                  <MessageSquare size={16} /> {starting ? 'Opening scene…' : 'Begin a scene'}
                </button>
              </section>
            </div>
          </div>
        </section>

        <section className="grid md:grid-cols-2 gap-5">
          <article className="rounded-2xl border border-warm-200 dark:border-warm-750 bg-white/65 dark:bg-warm-900/70 backdrop-blur p-6 space-y-3">
            <h2 className="font-serif text-xl font-bold flex items-center gap-2"><Heart size={18} className="text-red-500" /> Personality</h2>
            <p className="text-sm leading-relaxed text-warm-600 dark:text-warm-300 whitespace-pre-wrap">{details.personality}</p>
          </article>
          <article className="rounded-2xl border border-warm-200 dark:border-warm-750 bg-white/65 dark:bg-warm-900/70 backdrop-blur p-6 space-y-3">
            <h2 className="font-serif text-xl font-bold flex items-center gap-2"><BookOpen size={18} className="text-purple-500" /> Before you enter</h2>
            <p className="text-sm leading-relaxed text-warm-600 dark:text-warm-300">CHIMERA uses this character's definition, scene context, and relevant memory to keep the roleplay coherent. You can continue the scene later from your Chats.</p>
            {canEdit && <button onClick={() => navigate(`/characters/${character.id}/edit`)} className="text-xs font-bold text-red-500 hover:text-red-400">Edit this character →</button>}
          </article>
        </section>
      </div>
    </main>
  );
}
