import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, Clock3, Compass, Feather, Globe2, PenLine, Plus, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

type StoryPreview = {
  id: string;
  title: string;
  summary: string | null;
  genre: string | null;
  cover_url: string | null;
  updated_at: string;
  status: string | null;
};

type WorldPreview = {
  id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  updated_at: string;
};

function timeAgo(value: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60_000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days < 7 ? `${days}d ago` : new Date(value).toLocaleDateString();
}

export default function CreatorStudioPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [stories, setStories] = useState<StoryPreview[]>([]);
  const [worlds, setWorlds] = useState<WorldPreview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.user_id) {
      setLoading(false);
      return;
    }

    const loadWorkspace = async () => {
      setLoading(true);
      const [storyResult, worldResult] = await Promise.all([
        supabase
          .from('stories')
          .select('id, title, summary, genre, cover_url, updated_at, status')
          .eq('user_id', profile.user_id)
          .order('updated_at', { ascending: false })
          .limit(4),
        supabase
          .from('worlds')
          .select('id, name, description, cover_url, updated_at')
          .eq('user_id', profile.user_id)
          .order('updated_at', { ascending: false })
          .limit(3),
      ]);

      if (!storyResult.error) setStories((storyResult.data || []) as StoryPreview[]);
      if (!worldResult.error) setWorlds((worldResult.data || []) as WorldPreview[]);
      setLoading(false);
    };

    void loadWorkspace();
  }, [profile?.user_id]);

  const name = useMemo(() => profile?.display_name?.split(' ')[0] || profile?.username || 'there', [profile]);
  const latestStory = stories[0];
  const hasWork = stories.length > 0 || worlds.length > 0;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#100f1b] pb-24 text-warm-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(ellipse_at_top,_rgba(115,83,165,0.33),transparent_65%)]" />
      <div className="pointer-events-none absolute right-[8%] top-56 h-72 w-72 rounded-full bg-amber-400/10 blur-[110px]" />

      <main className="relative mx-auto max-w-6xl px-4 pt-10 sm:px-6 lg:px-8 lg:pt-14">
        <section className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/25 bg-amber-100/5 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-amber-200">
            <Feather size={13} /> Storytelling workspace
          </div>
          <h1 className="mt-5 font-serif text-4xl font-bold tracking-tight text-white sm:text-5xl">Good evening, {name}.</h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-warm-300">
            Your stories begin with you. Write freely, build worlds slowly, and use creative tools only when you choose.
          </p>
        </section>

        <section className="mt-10 grid gap-4 sm:grid-cols-3">
          <button
            onClick={() => navigate('/stories')}
            className="group rounded-3xl border border-amber-300/35 bg-gradient-to-br from-amber-100/10 to-transparent p-6 text-left shadow-xl transition hover:-translate-y-0.5 hover:border-amber-200/60"
          >
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-200 text-[#2a1c12]"><PenLine size={21} /></span>
            <h2 className="mt-5 font-serif text-xl font-bold text-white">Start a story</h2>
            <p className="mt-1 text-sm leading-relaxed text-warm-300">A blank page, entirely yours.</p>
            <span className="mt-5 flex items-center gap-1.5 text-xs font-bold text-amber-200">Open Stories <ArrowRight size={14} className="transition group-hover:translate-x-1" /></span>
          </button>

          <button
            onClick={() => navigate('/worlds')}
            className="group rounded-3xl border border-indigo-300/25 bg-gradient-to-br from-indigo-400/10 to-transparent p-6 text-left shadow-xl transition hover:-translate-y-0.5 hover:border-indigo-200/45"
          >
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-indigo-300/20 text-indigo-100"><Globe2 size={21} /></span>
            <h2 className="mt-5 font-serif text-xl font-bold text-white">Open a world</h2>
            <p className="mt-1 text-sm leading-relaxed text-warm-300">Places, people, history, and possibility.</p>
            <span className="mt-5 flex items-center gap-1.5 text-xs font-bold text-indigo-100">Explore Worlds <ArrowRight size={14} className="transition group-hover:translate-x-1" /></span>
          </button>

          <button
            onClick={() => navigate('/stories')}
            className="group rounded-3xl border border-purple-300/25 bg-gradient-to-br from-purple-400/10 to-transparent p-6 text-left shadow-xl transition hover:-translate-y-0.5 hover:border-purple-200/45"
          >
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-purple-300/20 text-purple-100"><BookOpen size={21} /></span>
            <h2 className="mt-5 font-serif text-xl font-bold text-white">Your library</h2>
            <p className="mt-1 text-sm leading-relaxed text-warm-300">Find your drafts and published stories.</p>
            <span className="mt-5 flex items-center gap-1.5 text-xs font-bold text-purple-100">View stories <ArrowRight size={14} className="transition group-hover:translate-x-1" /></span>
          </button>
        </section>

        {loading ? (
          <section className="mt-8 h-72 animate-pulse rounded-3xl border border-white/10 bg-white/5" />
        ) : latestStory ? (
          <section className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-[#1a1828]/90 shadow-2xl">
            <div className="grid min-h-[16rem] md:grid-cols-[0.9fr_1.4fr]">
              <div className="relative min-h-48 overflow-hidden bg-gradient-to-br from-[#392d57] via-[#1a1932] to-[#c08f4b]/30">
                {latestStory.cover_url ? <img src={latestStory.cover_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80" /> : <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_30%,rgba(245,215,160,0.35),transparent_22%),radial-gradient(circle_at_70%_70%,rgba(128,89,180,0.5),transparent_30%)]" />}
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1828]/75 to-transparent" />
                <span className="absolute bottom-5 left-6 rounded-full border border-white/15 bg-black/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-warm-100">{latestStory.status || 'draft'}</span>
              </div>
              <div className="flex flex-col justify-center p-7 sm:p-9">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-amber-200">Continue your story</p>
                <h2 className="mt-2 font-serif text-3xl font-bold text-white">{latestStory.title || 'Untitled story'}</h2>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-warm-300">{latestStory.summary || 'Your next page is waiting for you.'}</p>
                <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-warm-400"><span>{latestStory.genre || 'Uncategorized'}</span><span aria-hidden>•</span><span>Last opened {timeAgo(latestStory.updated_at)}</span></div>
                <button onClick={() => navigate(`/stories/${latestStory.id}`)} className="mt-7 inline-flex w-fit items-center gap-2 rounded-xl bg-amber-200 px-4 py-2.5 text-xs font-extrabold text-[#2a1c12] shadow-lg transition hover:bg-amber-100"><PenLine size={15} /> Continue writing</button>
              </div>
            </div>
          </section>
        ) : (
          <section className="mt-8 rounded-3xl border border-dashed border-amber-200/30 bg-white/[0.035] px-6 py-14 text-center sm:px-10">
            <Sparkles size={27} className="mx-auto text-amber-200" />
            <h2 className="mt-4 font-serif text-2xl font-bold text-white">Your desk is waiting for its first story.</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-warm-300">There is nothing to catch up on yet. Begin with a title, a world, or simply the first line.</p>
            <div className="mt-7 flex flex-wrap justify-center gap-3"><button onClick={() => navigate('/stories')} className="inline-flex items-center gap-2 rounded-xl bg-amber-200 px-4 py-2.5 text-xs font-extrabold text-[#2a1c12]"><Plus size={15} /> Start a story</button><button onClick={() => navigate('/worlds')} className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-bold text-warm-100 hover:bg-white/10"><Compass size={15} /> Build a world</button></div>
          </section>
        )}

        {hasWork && !loading && (
          <section className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 sm:p-7">
              <div className="flex items-center justify-between"><h2 className="font-serif text-xl font-bold text-white">Recent stories</h2><button onClick={() => navigate('/stories')} className="text-xs font-bold text-amber-200">See all</button></div>
              <div className="mt-4 divide-y divide-white/10">{stories.map((story) => <button key={story.id} onClick={() => navigate(`/stories/${story.id}`)} className="flex w-full items-center justify-between gap-4 py-4 text-left hover:text-amber-100"><span className="min-w-0"><span className="block truncate text-sm font-bold text-warm-100">{story.title || 'Untitled story'}</span><span className="mt-1 block text-xs text-warm-400">{story.genre || 'Story'} · {timeAgo(story.updated_at)}</span></span><ArrowRight size={16} className="shrink-0 text-warm-500" /></button>)}</div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 sm:p-7">
              <div className="flex items-center justify-between"><h2 className="font-serif text-xl font-bold text-white">Your worlds</h2><button onClick={() => navigate('/worlds')} className="text-xs font-bold text-indigo-100">See all</button></div>
              {worlds.length ? <div className="mt-4 divide-y divide-white/10">{worlds.map((world) => <button key={world.id} onClick={() => navigate(`/worlds/${world.id}`)} className="flex w-full items-center justify-between gap-4 py-4 text-left hover:text-indigo-100"><span className="min-w-0"><span className="block truncate text-sm font-bold text-warm-100">{world.name || 'Untitled world'}</span><span className="mt-1 block truncate text-xs text-warm-400">{world.description || 'A world in progress'} · {timeAgo(world.updated_at)}</span></span><ArrowRight size={16} className="shrink-0 text-warm-500" /></button>)}</div> : <div className="mt-5 rounded-2xl border border-dashed border-white/15 p-5 text-sm text-warm-400">Your next story can begin with a world. <button onClick={() => navigate('/worlds')} className="font-bold text-indigo-100">Create one</button>.</div>}
            </div>
          </section>
        )}

        <p className="mt-10 flex items-center justify-center gap-2 text-center text-xs text-warm-500"><Clock3 size={14} /> Your writing stays yours. Optional creative tools never replace your voice.</p>
      </main>
    </div>
  );
}
