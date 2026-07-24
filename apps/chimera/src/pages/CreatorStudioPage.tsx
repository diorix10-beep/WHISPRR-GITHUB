import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Map, BookOpen, PenTool, MessageSquare,
  Plus, ArrowRight, Clock, Sparkles, Wand2, PenLine, Globe, Layers, Award
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import { RichEmptyState } from '../components/common/RichEmptyState';

interface StudioStats {
  characters: number;
  worlds: number;
  stories: number;
  lorebooks: number;
  conversations: number;
}

interface RecentItem {
  id: string;
  type: 'character' | 'world' | 'story' | 'lorebook';
  name: string;
  updated_at: string;
}

const MODULE_CARDS = [
  {
    id: 'characters',
    title: 'AI Characters',
    description: 'Build persistent AI identities, OCs, and roleplay companions.',
    icon: Users,
    color: 'red',
    href: '/characters',
    createHref: '/characters/new',
  },
  {
    id: 'worlds',
    title: 'Universes & Worlds',
    description: 'Construct locations, cultures, factions, and story timelines.',
    icon: Globe,
    color: 'blue',
    href: '/worlds',
    createHref: '/worlds',
  },
  {
    id: 'stories',
    title: 'Stories & Novels',
    description: 'Write fiction, original sagas, and multi-chapter books.',
    icon: PenTool,
    color: 'purple',
    href: '/stories',
    createHref: '/write/desk',
  },
  {
    id: 'lorebooks',
    title: 'Lorebooks & Reference',
    description: 'Knowledge bases for world lore, magic systems, and canon.',
    icon: BookOpen,
    color: 'amber',
    href: '/lorebooks',
    createHref: '/lorebooks',
  },
];

export default function CreatorStudioPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { showToast } = useToast();

  const [stats, setStats] = useState<StudioStats>({ characters: 0, worlds: 0, stories: 0, lorebooks: 0, conversations: 0 });
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [writingMode, setWritingMode] = useState<'manual' | 'assisted'>(() => {
    return (localStorage.getItem('chimera_writing_mode') as 'manual' | 'assisted') || 'manual';
  });

  useEffect(() => {
    if (!profile?.user_id) return;
    fetchStudioData();
  }, [profile]);

  const fetchStudioData = async () => {
    if (!profile?.user_id) return;
    try {
      setLoading(true);

      const [charRes, worldRes, storyRes, loreRes, convRes] = await Promise.all([
        supabase.from('ai_characters').select('id', { count: 'exact', head: true }).eq('creator_id', profile.user_id),
        supabase.from('worlds').select('id', { count: 'exact', head: true }).eq('user_id', profile.user_id),
        supabase.from('stories').select('id', { count: 'exact', head: true }).eq('user_id', profile.user_id),
        supabase.from('lorebooks').select('id', { count: 'exact', head: true }).eq('user_id', profile.user_id),
        supabase.from('conversations').select('id', { count: 'exact', head: true }).eq('user_id', profile.user_id),
      ]);

      setStats({
        characters: charRes.count || 0,
        worlds: worldRes.count || 0,
        stories: storyRes.count || 0,
        lorebooks: loreRes.count || 0,
        conversations: convRes.count || 0,
      });

      const recent: RecentItem[] = [];

      const { data: recentChars } = await supabase
        .from('ai_characters')
        .select('id, updated_at, bot_profile:profiles!ai_characters_user_id_fkey(display_name)')
        .eq('creator_id', profile.user_id)
        .order('updated_at', { ascending: false })
        .limit(3);
      recentChars?.forEach(c => recent.push({ id: c.id, type: 'character', name: (c.bot_profile as any)?.display_name || 'Unnamed', updated_at: c.updated_at }));

      const { data: recentWorlds } = await supabase
        .from('worlds')
        .select('id, name, updated_at')
        .eq('user_id', profile.user_id)
        .order('updated_at', { ascending: false })
        .limit(3);
      recentWorlds?.forEach(w => recent.push({ id: w.id, type: 'world', name: w.name, updated_at: w.updated_at }));

      const { data: recentStories } = await supabase
        .from('stories')
        .select('id, title, updated_at')
        .eq('user_id', profile.user_id)
        .order('updated_at', { ascending: false })
        .limit(3);
      recentStories?.forEach(s => recent.push({ id: s.id, type: 'story', name: s.title, updated_at: s.updated_at }));

      recent.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      setRecentItems(recent.slice(0, 8));
    } catch (err: any) {
      console.error('Studio data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleWritingMode = () => {
    const next = writingMode === 'manual' ? 'assisted' : 'manual';
    setWritingMode(next);
    localStorage.setItem('chimera_writing_mode', next);
    showToast(`Writing mode: ${next === 'manual' ? 'Manual — AI disabled' : 'AI-Assisted — AI tools available'}`, 'info');
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case 'character': return <Users size={14} className="text-red-500" />;
      case 'world': return <Globe size={14} className="text-blue-500" />;
      case 'story': return <PenTool size={14} className="text-purple-500" />;
      case 'lorebook': return <BookOpen size={14} className="text-amber-500" />;
      default: return null;
    }
  };

  const typeHref = (type: string, id: string) => {
    switch (type) {
      case 'character': return `/characters/${id}/edit`;
      case 'world': return `/worlds/${id}`;
      case 'story': return `/stories/${id}`;
      case 'lorebook': return `/lorebooks/${id}`;
      default: return '/';
    }
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-warm-50 dark:bg-warm-900 text-warm-900 dark:text-warm-50 font-sans pb-24 relative overflow-hidden transition-colors duration-300">
      
      {/* Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-amber-600/15 via-purple-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 relative z-10 pt-6">

        {/* ── 1. HERO SECTION ── */}
        <section className="flex flex-col items-center text-center pt-6 sm:pt-8 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles size={14} />
            <span>Professional Creator Workspace</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl font-extrabold tracking-tight text-warm-900 dark:text-white">
            Creator Studio
          </h1>

          <p className="text-sm sm:text-base text-warm-600 dark:text-warm-300 max-w-xl mx-auto leading-relaxed">
            The heart of creation inside CHIMERA. Build characters, worlds, stories, and lorebooks in one unified creative engine.
          </p>

          {/* Mode Switch Pill */}
          <div className="pt-2">
            <button
              onClick={toggleWritingMode}
              className="px-4 py-2 rounded-full bg-white dark:bg-warm-850 border border-warm-200 dark:border-warm-750 text-xs font-bold shadow-md hover:scale-105 transition-all flex items-center gap-2"
            >
              {writingMode === 'manual' ? (
                <>
                  <PenLine size={15} className="text-amber-500" />
                  <span>Manual Writing Mode</span>
                </>
              ) : (
                <>
                  <Wand2 size={15} className="text-purple-500" />
                  <span>AI-Assisted Co-Authoring Mode</span>
                </>
              )}
            </button>
          </div>
        </section>


        {/* ── 2. MODULE CARDS (CREATION ENGINE) ── */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {MODULE_CARDS.map((module) => {
            const Icon = module.icon;
            const count = (stats as any)[module.id] || 0;

            return (
              <div
                key={module.id}
                className="p-6 rounded-3xl bg-white dark:bg-warm-850 border border-warm-200 dark:border-warm-750 hover:border-amber-500/40 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between space-y-6 group cursor-pointer"
                onClick={() => navigate(module.href)}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                      <Icon size={24} />
                    </div>
                    <span className="font-serif text-2xl font-extrabold text-warm-900 dark:text-white">
                      {count}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-bold text-lg text-warm-900 dark:text-white group-hover:text-amber-500 transition-colors">
                      {module.title}
                    </h3>
                    <p className="text-xs text-warm-500 dark:text-warm-400 leading-relaxed">
                      {module.description}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-warm-100 dark:border-warm-800 flex items-center justify-between">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(module.createHref);
                    }}
                    className="px-3.5 py-1.5 rounded-full bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shadow-md transition-all flex items-center gap-1"
                  >
                    <Plus size={14} />
                    <span>Create</span>
                  </button>

                  <span className="text-xs text-warm-400 group-hover:translate-x-1 transition-transform flex items-center gap-1 font-bold">
                    <span>Manage</span>
                    <ArrowRight size={12} />
                  </span>
                </div>
              </div>
            );
          })}
        </section>


        {/* ── 3. RECENT ACTIVITY & DRAFTS ── */}
        <section className="p-8 rounded-3xl bg-white dark:bg-warm-850 border border-warm-200 dark:border-warm-750 shadow-lg space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-bold text-warm-900 dark:text-white flex items-center gap-2">
              <Clock size={20} className="text-amber-500" />
              <span>Recent Workspace Activity</span>
            </h2>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 rounded-xl bg-warm-100 dark:bg-warm-800 animate-pulse" />
              ))}
            </div>
          ) : recentItems.length === 0 ? (
            <RichEmptyState
              icon={Sparkles}
              title="Your workspace is ready"
              description="Start by creating a character, world, or writing your first chapter!"
              actionLabel="Create Character"
              onAction={() => navigate('/characters/new')}
            />
          ) : (
            <div className="divide-y divide-warm-100 dark:divide-warm-800">
              {recentItems.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  onClick={() => navigate(typeHref(item.type, item.id))}
                  className="py-3 px-2 flex items-center justify-between hover:bg-warm-100/50 dark:hover:bg-warm-800/50 rounded-xl transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-warm-100 dark:bg-warm-800 flex items-center justify-center">
                      {typeIcon(item.type)}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-warm-900 dark:text-white">{item.name}</h4>
                      <span className="text-[11px] text-warm-400 capitalize">{item.type}</span>
                    </div>
                  </div>

                  <span className="text-xs text-warm-400">{formatDate(item.updated_at)}</span>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
