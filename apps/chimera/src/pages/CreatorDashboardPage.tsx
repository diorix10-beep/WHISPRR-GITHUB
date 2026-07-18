import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Users, Globe, PenTool, Cpu, MessageSquare,
  Sparkles, ArrowRight, Clock, Flame, TrendingUp,
  BookOpen, Brain, Mic, Image, FolderOpen, ChevronRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';

interface QuickStat {
  label: string;
  value: number;
  icon: typeof Users;
  color: string;
  path: string;
}

interface RecentItem {
  id: string;
  name: string;
  type: 'character' | 'world' | 'story';
  updated_at: string;
}

export default function CreatorDashboardPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [recentCharacters, setRecentCharacters] = useState<any[]>([]);
  const [recentStories, setRecentStories] = useState<any[]>([]);
  const [recentWorlds, setRecentWorlds] = useState<any[]>([]);
  const [stats, setStats] = useState({ characters: 0, worlds: 0, stories: 0, conversations: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.user_id) fetchDashboardData();
  }, [profile]);

  const fetchDashboardData = async () => {
    if (!profile?.user_id) return;
    try {
      setLoading(true);

      // Fetch counts in parallel
      const [charRes, storyRes, worldRes, convRes, recentChars, recentSt, recentW] = await Promise.all([
        supabase.from('ai_characters').select('id', { count: 'exact', head: true }).eq('creator_id', profile.user_id),
        supabase.from('stories').select('id', { count: 'exact', head: true }).eq('user_id', profile.user_id),
        supabase.from('worlds').select('id', { count: 'exact', head: true }).eq('user_id', profile.user_id),
        supabase.from('conversations').select('id', { count: 'exact', head: true }),
        supabase.from('ai_characters').select('id, user_id, created_at, updated_at, short_description, profiles!ai_characters_user_id_fkey(display_name, avatar_emoji, photo_url)').eq('creator_id', profile.user_id).order('updated_at', { ascending: false }).limit(4),
        supabase.from('stories').select('id, title, status, updated_at, cover_url').eq('user_id', profile.user_id).order('updated_at', { ascending: false }).limit(4),
        supabase.from('worlds').select('id, name, description, updated_at').eq('user_id', profile.user_id).order('updated_at', { ascending: false }).limit(4),
      ]);

      setStats({
        characters: charRes.count || 0,
        worlds: worldRes.count || 0,
        stories: storyRes.count || 0,
        conversations: convRes.count || 0,
      });

      setRecentCharacters(recentChars.data || []);
      setRecentStories(recentSt.data || []);
      setRecentWorlds(recentW.data || []);
    } catch (err) {
      console.error('Dashboard data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const quickStats: QuickStat[] = [
    { label: 'Characters', value: stats.characters, icon: Users, color: 'text-violet-500 bg-violet-500/10 border-violet-500/20', path: '/characters' },
    { label: 'Worlds', value: stats.worlds, icon: Globe, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', path: '/worlds' },
    { label: 'Stories', value: stats.stories, icon: PenTool, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20', path: '/stories' },
    { label: 'Conversations', value: stats.conversations, icon: MessageSquare, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20', path: '/conversations' },
  ];

  const quickActions = [
    { label: 'New Character', icon: Users, path: '/characters/new', desc: 'Build an AI character', gradient: 'from-violet-600 to-purple-600' },
    { label: 'New World', icon: Globe, path: '/worlds/new', desc: 'Design a world', gradient: 'from-emerald-600 to-teal-600' },
    { label: 'New Story', icon: PenTool, path: '/stories/new', desc: 'Start writing', gradient: 'from-blue-600 to-indigo-600' },
    { label: 'AI Models', icon: Cpu, path: '/models', desc: 'Configure AI', gradient: 'from-amber-600 to-orange-600' },
  ];

  const platformModules = [
    { label: 'Characters', desc: 'Create and manage AI characters', icon: Users, path: '/characters', color: 'text-violet-500' },
    { label: 'Worlds', desc: 'Build rich fictional universes', icon: Globe, path: '/worlds', color: 'text-emerald-500' },
    { label: 'Stories', desc: 'Write interactive narratives', icon: PenTool, path: '/stories', color: 'text-blue-500' },
    { label: 'AI Models', desc: 'Choose and configure AI providers', icon: Cpu, path: '/models', color: 'text-amber-500' },
    { label: 'Lorebooks', desc: 'Manage world knowledge and lore', icon: BookOpen, path: '/lorebooks', color: 'text-orange-500' },
    { label: 'Conversations', desc: 'Chat with your characters', icon: MessageSquare, path: '/conversations', color: 'text-pink-500' },
    { label: 'Memory', desc: 'Persistent memory management', icon: Brain, path: '/memory', color: 'text-cyan-500', comingSoon: true },
    { label: 'Voices', desc: 'Voice library and configuration', icon: Mic, path: '/voices', color: 'text-rose-500', comingSoon: true },
    { label: 'Image Studio', desc: 'Generate character art and scenes', icon: Image, path: '/media', color: 'text-indigo-500', comingSoon: true },
  ];

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-warm-900 dark:text-warm-50">
          {profile?.display_name ? `Welcome back, ${profile.display_name}` : 'Welcome to CHIMERA'}
        </h1>
        <p className="text-warm-500 dark:text-warm-400 mt-1 text-sm sm:text-base">
          Your AI creation workspace. Build characters, design worlds, tell stories.
        </p>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8"
      >
        {quickStats.map(stat => (
          <button
            key={stat.label}
            onClick={() => navigate(stat.path)}
            className={`p-4 rounded-2xl border ${stat.color} hover:scale-[1.02] active:scale-[0.98] transition-all text-left`}
          >
            <div className="flex items-center gap-2 mb-2">
              <stat.icon size={16} />
              <span className="text-xs font-semibold uppercase tracking-wider opacity-80">{stat.label}</span>
            </div>
            <p className="text-2xl font-bold">
              {loading ? '—' : stat.value}
            </p>
          </button>
        ))}
      </motion.div>

      {/* Quick Create Actions */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mb-10"
      >
        <h2 className="text-sm font-bold uppercase tracking-wider text-warm-400 dark:text-warm-500 mb-3 px-1">
          Quick Create
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map(action => (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              className={`group p-4 rounded-2xl bg-gradient-to-br ${action.gradient} text-white hover:shadow-lg hover:shadow-black/10 dark:hover:shadow-black/30 hover:scale-[1.02] active:scale-[0.98] transition-all text-left`}
            >
              <action.icon size={20} className="mb-3 opacity-80 group-hover:opacity-100 transition-opacity" />
              <p className="font-semibold text-sm">{action.label}</p>
              <p className="text-[11px] opacity-70 mt-0.5">{action.desc}</p>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        {/* Recent Characters */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="bg-white dark:bg-warm-850 rounded-2xl border border-warm-200 dark:border-warm-800 overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-warm-100 dark:border-warm-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-warm-900 dark:text-warm-100 flex items-center gap-2">
              <Users size={14} className="text-violet-500" />
              Recent Characters
            </h3>
            <button
              onClick={() => navigate('/characters')}
              className="text-[11px] font-semibold text-warm-400 hover:text-warm-600 dark:hover:text-warm-300 flex items-center gap-1 transition-colors"
            >
              View All <ChevronRight size={12} />
            </button>
          </div>
          <div className="divide-y divide-warm-50 dark:divide-warm-800">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="px-4 py-3 animate-pulse">
                  <div className="h-4 bg-warm-100 dark:bg-warm-800 rounded w-3/4 mb-1" />
                  <div className="h-3 bg-warm-50 dark:bg-warm-850 rounded w-1/2" />
                </div>
              ))
            ) : recentCharacters.length > 0 ? (
              recentCharacters.map(char => (
                <button
                  key={char.id}
                  onClick={() => navigate(`/characters/${char.id || char.user_id}`)}
                  className="w-full px-4 py-3 text-left hover:bg-warm-50 dark:hover:bg-warm-800 transition-colors"
                >
                  <p className="text-sm font-medium text-warm-900 dark:text-warm-100 truncate">
                    {char.profiles?.display_name || 'Unnamed Character'}
                  </p>
                  <p className="text-[11px] text-warm-400 mt-0.5 flex items-center gap-1">
                    <Clock size={10} />
                    {formatTimeAgo(char.updated_at)}
                  </p>
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center">
                <Users size={24} className="mx-auto mb-2 text-warm-300 dark:text-warm-600" />
                <p className="text-xs text-warm-400">No characters yet</p>
                <button
                  onClick={() => navigate('/characters/new')}
                  className="mt-2 text-xs font-semibold text-red-500 hover:text-red-600 transition-colors"
                >
                  Create your first character →
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Stories */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-white dark:bg-warm-850 rounded-2xl border border-warm-200 dark:border-warm-800 overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-warm-100 dark:border-warm-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-warm-900 dark:text-warm-100 flex items-center gap-2">
              <PenTool size={14} className="text-blue-500" />
              Recent Stories
            </h3>
            <button
              onClick={() => navigate('/stories')}
              className="text-[11px] font-semibold text-warm-400 hover:text-warm-600 dark:hover:text-warm-300 flex items-center gap-1 transition-colors"
            >
              View All <ChevronRight size={12} />
            </button>
          </div>
          <div className="divide-y divide-warm-50 dark:divide-warm-800">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="px-4 py-3 animate-pulse">
                  <div className="h-4 bg-warm-100 dark:bg-warm-800 rounded w-3/4 mb-1" />
                  <div className="h-3 bg-warm-50 dark:bg-warm-850 rounded w-1/2" />
                </div>
              ))
            ) : recentStories.length > 0 ? (
              recentStories.map(story => (
                <button
                  key={story.id}
                  onClick={() => navigate(`/stories/${story.id}`)}
                  className="w-full px-4 py-3 text-left hover:bg-warm-50 dark:hover:bg-warm-800 transition-colors"
                >
                  <p className="text-sm font-medium text-warm-900 dark:text-warm-100 truncate">{story.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                      story.status === 'completed' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400' :
                      story.status === 'ongoing' ? 'bg-blue-100 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400' :
                      'bg-warm-100 text-warm-500 dark:bg-warm-800 dark:text-warm-400'
                    }`}>
                      {story.status}
                    </span>
                    <span className="text-[11px] text-warm-400 flex items-center gap-1">
                      <Clock size={10} />
                      {formatTimeAgo(story.updated_at)}
                    </span>
                  </div>
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center">
                <PenTool size={24} className="mx-auto mb-2 text-warm-300 dark:text-warm-600" />
                <p className="text-xs text-warm-400">No stories yet</p>
                <button
                  onClick={() => navigate('/stories/new')}
                  className="mt-2 text-xs font-semibold text-red-500 hover:text-red-600 transition-colors"
                >
                  Start writing →
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Worlds */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="bg-white dark:bg-warm-850 rounded-2xl border border-warm-200 dark:border-warm-800 overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-warm-100 dark:border-warm-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-warm-900 dark:text-warm-100 flex items-center gap-2">
              <Globe size={14} className="text-emerald-500" />
              Recent Worlds
            </h3>
            <button
              onClick={() => navigate('/worlds')}
              className="text-[11px] font-semibold text-warm-400 hover:text-warm-600 dark:hover:text-warm-300 flex items-center gap-1 transition-colors"
            >
              View All <ChevronRight size={12} />
            </button>
          </div>
          <div className="divide-y divide-warm-50 dark:divide-warm-800">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="px-4 py-3 animate-pulse">
                  <div className="h-4 bg-warm-100 dark:bg-warm-800 rounded w-3/4 mb-1" />
                  <div className="h-3 bg-warm-50 dark:bg-warm-850 rounded w-1/2" />
                </div>
              ))
            ) : recentWorlds.length > 0 ? (
              recentWorlds.map(world => (
                <button
                  key={world.id}
                  onClick={() => navigate(`/worlds/${world.id}`)}
                  className="w-full px-4 py-3 text-left hover:bg-warm-50 dark:hover:bg-warm-800 transition-colors"
                >
                  <p className="text-sm font-medium text-warm-900 dark:text-warm-100 truncate">{world.name}</p>
                  <p className="text-[11px] text-warm-400 mt-0.5 flex items-center gap-1">
                    <Clock size={10} />
                    {formatTimeAgo(world.updated_at)}
                  </p>
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center">
                <Globe size={24} className="mx-auto mb-2 text-warm-300 dark:text-warm-600" />
                <p className="text-xs text-warm-400">No worlds yet</p>
                <button
                  onClick={() => navigate('/worlds/new')}
                  className="mt-2 text-xs font-semibold text-red-500 hover:text-red-600 transition-colors"
                >
                  Build your first world →
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Platform Modules Overview */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <h2 className="text-sm font-bold uppercase tracking-wider text-warm-400 dark:text-warm-500 mb-3 px-1">
          Platform Modules
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {platformModules.map(mod => (
            <button
              key={mod.label}
              onClick={() => !mod.comingSoon && navigate(mod.path)}
              disabled={mod.comingSoon}
              className={`group p-4 rounded-2xl border text-left transition-all ${
                mod.comingSoon
                  ? 'border-warm-100 dark:border-warm-800 opacity-50 cursor-default'
                  : 'border-warm-200 dark:border-warm-800 bg-white dark:bg-warm-850 hover:border-warm-300 dark:hover:border-warm-700 hover:shadow-sm hover:scale-[1.01] active:scale-[0.99]'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <mod.icon size={18} className={mod.color} />
                  <div>
                    <p className="font-semibold text-sm text-warm-900 dark:text-warm-100">{mod.label}</p>
                    <p className="text-[11px] text-warm-400 dark:text-warm-500 mt-0.5">{mod.desc}</p>
                  </div>
                </div>
                {mod.comingSoon ? (
                  <span className="text-[9px] uppercase tracking-wider font-bold text-warm-400 bg-warm-100 dark:bg-warm-800 px-1.5 py-0.5 rounded-md shrink-0">
                    Soon
                  </span>
                ) : (
                  <ArrowRight size={14} className="text-warm-300 dark:text-warm-600 group-hover:text-warm-500 transition-colors shrink-0 mt-0.5" />
                )}
              </div>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
