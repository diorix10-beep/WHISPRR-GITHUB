import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Map, BookOpen, PenTool, MessageSquare,
  Plus, ArrowRight, Clock, Sparkles, Wand2, PenLine
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';

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
    title: 'Characters',
    description: 'Create characters for your stories, worlds, and conversations.',
    icon: Users,
    color: 'red',
    href: '/characters',
    createHref: '/characters/new',
  },
  {
    id: 'worlds',
    title: 'Worlds',
    description: 'Build universes with locations, factions, and timelines.',
    icon: Map,
    color: 'blue',
    href: '/worlds',
    createHref: '/worlds',
  },
  {
    id: 'stories',
    title: 'Stories',
    description: 'Write fiction or non-fiction, with chapters and scenes.',
    icon: PenTool,
    color: 'purple',
    href: '/stories',
    createHref: '/stories',
  },
  {
    id: 'lorebooks',
    title: 'Lorebooks',
    description: 'Knowledge books for world lore, magic systems, and reference.',
    icon: BookOpen,
    color: 'amber',
    href: '/lorebooks',
    createHref: '/lorebooks',
  },
];

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; gradientFrom: string; gradientTo: string }> = {
  red: { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', text: 'text-red-600 dark:text-red-400', gradientFrom: 'from-red-500', gradientTo: 'to-red-400' },
  blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-600 dark:text-blue-400', gradientFrom: 'from-blue-500', gradientTo: 'to-blue-400' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800', text: 'text-purple-600 dark:text-purple-400', gradientFrom: 'from-purple-500', gradientTo: 'to-purple-400' },
  amber: { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', text: 'text-amber-600 dark:text-amber-400', gradientFrom: 'from-amber-500', gradientTo: 'to-amber-400' },
};

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

      // Fetch counts in parallel
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

      // Fetch recent items
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

      // Sort all by updated_at desc and take top 8
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
      case 'world': return <Map size={14} className="text-blue-500" />;
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
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-warm-900 dark:text-warm-50">Creator Studio</h1>
          <p className="text-sm text-warm-500 dark:text-warm-400 mt-1">
            Your unified workspace for characters, worlds, stories, and lore.
          </p>
        </div>

        {/* Writing Mode Toggle */}
        <button
          onClick={toggleWritingMode}
          className={`flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all ${
            writingMode === 'manual'
              ? 'bg-warm-50 dark:bg-warm-850 border-warm-200 dark:border-warm-700'
              : 'bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-800'
          }`}
        >
          {writingMode === 'manual' ? (
            <PenLine size={18} className="text-warm-600 dark:text-warm-400" />
          ) : (
            <Wand2 size={18} className="text-purple-600 dark:text-purple-400" />
          )}
          <div className="text-left">
            <p className="text-xs font-semibold text-warm-900 dark:text-warm-50">
              {writingMode === 'manual' ? 'Manual Mode' : 'AI-Assisted Mode'}
            </p>
            <p className="text-[10px] text-warm-400">
              {writingMode === 'manual' ? 'Pure imagination, no AI' : 'AI tools available'}
            </p>
          </div>
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Characters', value: stats.characters, icon: Users, color: 'text-red-500' },
          { label: 'Worlds', value: stats.worlds, icon: Map, color: 'text-blue-500' },
          { label: 'Stories', value: stats.stories, icon: PenTool, color: 'text-purple-500' },
          { label: 'Lorebooks', value: stats.lorebooks, icon: BookOpen, color: 'text-amber-500' },
          { label: 'Conversations', value: stats.conversations, icon: MessageSquare, color: 'text-green-500' },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white dark:bg-warm-800 rounded-xl border border-warm-200 dark:border-warm-750 p-4 text-center">
              <Icon size={20} className={`mx-auto ${stat.color} mb-2`} />
              <p className="text-2xl font-bold text-warm-900 dark:text-warm-50">{loading ? '—' : stat.value}</p>
              <p className="text-[10px] text-warm-400 uppercase tracking-wider mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Module Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {MODULE_CARDS.map(mod => {
          const Icon = mod.icon;
          const c = COLOR_MAP[mod.color];
          return (
            <div
              key={mod.id}
              className={`rounded-2xl border ${c.border} ${c.bg} p-5 hover:shadow-lg transition-all cursor-pointer group`}
              onClick={() => navigate(mod.href)}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.gradientFrom} ${c.gradientTo} flex items-center justify-center shadow-sm`}>
                  <Icon size={22} className="text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-warm-900 dark:text-warm-50">{mod.title}</h3>
                  <p className="text-xs text-warm-500 dark:text-warm-400 mt-1">{mod.description}</p>
                </div>
                <ArrowRight size={18} className="text-warm-300 group-hover:text-warm-500 transition mt-1" />
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={e => { e.stopPropagation(); navigate(mod.href); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-warm-600 dark:text-warm-400 bg-white/60 dark:bg-warm-800/60 hover:bg-white dark:hover:bg-warm-800 transition"
                >
                  Browse
                </button>
                <button
                  onClick={e => { e.stopPropagation(); navigate(mod.createHref); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${c.text} bg-white/80 dark:bg-warm-800/80 hover:bg-white dark:hover:bg-warm-800 transition`}
                >
                  <Plus size={12} /> Create New
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-sm font-semibold text-warm-700 dark:text-warm-300 mb-3 flex items-center gap-2">
          <Clock size={14} /> Recent Activity
        </h2>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-warm-100 dark:bg-warm-800 animate-pulse" />
            ))}
          </div>
        ) : recentItems.length === 0 ? (
          <div className="text-center py-10 bg-warm-50 dark:bg-warm-850 rounded-xl border border-warm-200 dark:border-warm-700">
            <Sparkles size={24} className="mx-auto text-warm-300 mb-3" />
            <p className="text-sm text-warm-400">No activity yet. Start creating!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentItems.map(item => (
              <div
                key={`${item.type}-${item.id}`}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white dark:bg-warm-800 border border-warm-200 dark:border-warm-750 hover:border-warm-300 dark:hover:border-warm-600 cursor-pointer transition"
                onClick={() => navigate(typeHref(item.type, item.id))}
              >
                {typeIcon(item.type)}
                <span className="flex-1 text-sm text-warm-900 dark:text-warm-50 truncate">{item.name}</span>
                <span className="text-[10px] text-warm-400 capitalize">{item.type}</span>
                <span className="text-[10px] text-warm-400">{formatDate(item.updated_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
