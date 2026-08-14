import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, Clock3, Compass, Feather, Globe2, PenLine, Plus, Sparkles, Star } from 'lucide-react';
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
  const [vellumBalance, setVellumBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!profile?.user_id) {
      setLoading(false);
      return;
    }

    const loadWorkspace = async () => {
      setLoading(true);
      const [storyResult, worldResult, vellumResult] = await Promise.all([
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
        supabase.rpc('get_my_vellum_wallet'),
      ]);

      if (!storyResult.error) setStories((storyResult.data || []) as StoryPreview[]);
      if (!worldResult.error) setWorlds((worldResult.data || []) as WorldPreview[]);
      if (!vellumResult.error) setVellumBalance(vellumResult.data?.[0]?.available_balance ?? null);
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

      <main className="relative mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8 lg:pt-12">
        <section className="relative min-h-[430px] overflow-hidden rounded-[2rem] border border-amber-200/15 bg-[#080d1b] px-7 py-9 shadow-2xl sm:px-12 lg:min-h-[500px] lg:py-14">
          <img src="/images/storytelling-workspace-hero-v1.png" alt="An open book becoming a night sky and distant world" className="absolute inset-0 h-full w-full object-cover object-center opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#080d1b] via-[#080d1b]/90 to-[#080d1b]/10" />
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#080d1b] to-transparent" />
          <div className="relative max-w-xl">
            <div className="flex items-center justify-between gap-4">
              <span className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-amber-200"><Feather size={14} /> Storytelling workspace</span>
              <span className="inline-flex items-center gap-2 rounded-lg border border-amber-200/30 bg-[#0b1020]/75 px-3 py-2 text-xs font-bold text-amber-100"><span className="font-serif text-base">V</span> {vellumBalance === null ? 'VELLUM' : `${vellumBalance.toLocaleString()} VELLUM`}</span>
            </div>
            <h1 className="mt-12 max-w-md font-serif text-5xl font-medium leading-[0.95] tracking-tight text-[#f4e1c3] sm:text-6xl">Where stories<br />become yours.</h1>
            <div className="mt-6 flex items-center gap-2 text-sm text-[#c7bad2]"><Star size={14} className="text-amber-200" /> Write freely. Creative tools are always optional.</div>
          </div>
        </section>

        {loading ? (
          <section className="mt-8 h-72 animate-pulse rounded-3xl border border-white/10 bg-white/5" />
        ) : latestStory ? (
          <section className="relative z-10 mx-auto -mt-24 max-w-5xl overflow-hidden rounded-2xl border border-amber-200/25 bg-[#10182a]/95 shadow-2xl backdrop-blur">
            <div className="grid min-h-[16rem] md:grid-cols-[0.72fr_1.4fr]">
              <div className="relative min-h-48 overflow-hidden bg-gradient-to-br from-[#392d57] via-[#1a1932] to-[#c08f4b]/30">
                {latestStory.cover_url ? <img src={latestStory.cover_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80" /> : <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_30%,rgba(245,215,160,0.35),transparent_22%),radial-gradient(circle_at_70%_70%,rgba(128,89,180,0.5),transparent_30%)]" />}
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1828]/75 to-transparent" />
                <span className="absolute bottom-5 left-6 rounded-full border border-white/15 bg-black/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-warm-100">{latestStory.status || 'draft'}</span>
              </div>
              <div className="flex flex-col justify-center p-7 sm:p-9">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-amber-200">Continue writing</p>
                <h2 className="mt-2 font-serif text-3xl font-bold text-white">{latestStory.title || 'Untitled story'}</h2>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-warm-300">{latestStory.summary || 'Your next page is waiting for you.'}</p>
                <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-warm-400"><span>{latestStory.genre || 'Uncategorized'}</span><span aria-hidden>•</span><span>Last opened {timeAgo(latestStory.updated_at)}</span></div>
                <button onClick={() => navigate(`/stories/${latestStory.id}`)} className="mt-7 inline-flex w-fit items-center gap-2 rounded-lg bg-[#e6c48b] px-5 py-3 text-sm font-bold text-[#2a1c12] shadow-lg transition hover:bg-[#f4dbac]"><PenLine size={16} /> Open chapter</button>
              </div>
            </div>
          </section>
        ) : (
          <section className="relative z-10 mx-auto -mt-24 max-w-5xl rounded-2xl border border-dashed border-amber-200/30 bg-[#10182a]/95 px-6 py-14 text-center shadow-2xl sm:px-10">
            <Sparkles size={27} className="mx-auto text-amber-200" />
            <h2 className="mt-4 font-serif text-2xl font-bold text-white">Your desk is waiting for its first story.</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-warm-300">There is nothing to catch up on yet. Begin with a title, a world, or simply the first line.</p>
            <div className="mt-7 flex flex-wrap justify-center gap-3"><button onClick={() => navigate('/stories')} className="inline-flex items-center gap-2 rounded-xl bg-amber-200 px-4 py-2.5 text-xs font-extrabold text-[#2a1c12]"><Plus size={15} /> Start a story</button><button onClick={() => navigate('/worlds')} className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-bold text-warm-100 hover:bg-white/10"><Compass size={15} /> Build a world</button></div>
          </section>
        )}

        <section className="mt-7 grid gap-5 lg:grid-cols-[1fr_1fr]">
          <button onClick={() => navigate('/worlds')} className="group relative min-h-60 overflow-hidden rounded-2xl border border-amber-200/20 bg-[#10182a] p-6 text-left shadow-xl">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(207,169,102,0.26),transparent_48%)]" />
            <div className="relative"><Globe2 className="text-amber-200" size={21} /><h2 className="mt-3 font-serif text-2xl text-[#f4e1c3]">Your worlds</h2><p className="mt-2 max-w-sm text-sm text-warm-300">Places, people, histories, and all the things that make a story breathe.</p><span className="mt-8 inline-flex items-center gap-2 text-xs font-bold text-amber-200">Open worlds <ArrowRight size={14} className="transition group-hover:translate-x-1" /></span></div>
          </button>
          <div className="rounded-2xl border border-amber-200/20 bg-[#10182a] p-6 shadow-xl"><Sparkles className="text-amber-200" size={21} /><h2 className="mt-3 font-serif text-2xl text-[#f4e1c3]">Start something new</h2><div className="mt-5 grid grid-cols-2 gap-3"><button onClick={() => navigate('/stories')} className="rounded-xl border border-amber-200/25 bg-white/[0.03] p-5 text-center transition hover:bg-white/[0.07]"><BookOpen className="mx-auto text-amber-200" size={27} /><span className="mt-3 block font-serif text-lg text-warm-100">Story</span></button><button onClick={() => navigate('/worlds')} className="rounded-xl border border-amber-200/25 bg-white/[0.03] p-5 text-center transition hover:bg-white/[0.07]"><Globe2 className="mx-auto text-amber-200" size={27} /><span className="mt-3 block font-serif text-lg text-warm-100">World</span></button></div></div>
        </section>

        {hasWork && !loading && (
          <section className="mt-7 grid gap-6 lg:grid-cols-2">
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
