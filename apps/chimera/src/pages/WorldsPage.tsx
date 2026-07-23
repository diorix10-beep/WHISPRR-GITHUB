import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Globe, Lock, Eye, Map, Users, Clock, MoreHorizontal, Copy, Trash2, Compass, BookOpen, Layers } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import type { World } from '../types';
import { WorldRelationshipModal } from '../components/world/WorldRelationshipModal';
import { STARTER_WORLDS } from '../lib/starterContent';

export default function WorldsPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { showToast } = useToast();

  const [worlds, setWorlds] = useState<World[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [selectedWorldForNetwork, setSelectedWorldForNetwork] = useState<World | null>(null);

  const fetchWorlds = useCallback(async () => {
    if (!profile?.user_id) return;
    try {
      setLoading(true);
      let query = supabase
        .from('worlds')
        .select('*')
        .eq('user_id', profile.user_id)
        .order('updated_at', { ascending: false });

      if (searchQuery.trim()) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setWorlds(data || []);
    } catch (err: any) {
      showToast(err.message || 'Error loading worlds', 'error');
    } finally {
      setLoading(false);
    }
  }, [profile, searchQuery, showToast]);

  useEffect(() => { fetchWorlds(); }, [fetchWorlds]);

  const handleCreate = async () => {
    if (!profile?.user_id) return;
    try {
      const { data, error } = await supabase
        .from('worlds')
        .insert({ user_id: profile.user_id, name: 'Untitled World' })
        .select()
        .single();
      if (error) throw error;
      navigate(`/worlds/${data.id}`);
    } catch (err: any) {
      showToast(err.message || 'Error creating world', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this world? All locations, factions, and timeline events will be lost.')) return;
    try {
      const { error } = await supabase.from('worlds').delete().eq('id', id);
      if (error) throw error;
      showToast('World deleted', 'success');
      fetchWorlds();
    } catch (err: any) {
      showToast(err.message || 'Error deleting world', 'error');
    }
    setActionMenuId(null);
  };

  const handleDuplicate = async (id: string) => {
    try {
      const { data } = await supabase.from('worlds').select('*').eq('id', id).single();
      if (!data || !profile) return;
      const { id: _id, created_at, updated_at, ...rest } = data;
      const { error } = await supabase.from('worlds').insert({ ...rest, name: `${data.name} (Copy)` });
      if (error) throw error;
      showToast('World duplicated', 'success');
      fetchWorlds();
    } catch {
      showToast('Failed to duplicate', 'error');
    }
    setActionMenuId(null);
  };

  const visibilityIcon = (v: string) => {
    switch (v) {
      case 'public': return <Globe size={12} className="text-green-500" />;
      case 'unlisted': return <Eye size={12} className="text-yellow-500" />;
      default: return <Lock size={12} className="text-warm-400" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header with Storytelling Mode Purple Identity */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20">
              Storytelling Mode 📖
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-warm-900 dark:text-warm-50 flex items-center gap-2.5">
            <Globe className="text-purple-500" size={28} />
            <span>Worldbuilding Studio & Universes</span>
          </h1>
          <p className="text-sm text-warm-500 dark:text-warm-400 mt-1">
            Design rich locations, cultures, timelines, magic systems, and lore for your books and stories.
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 shadow-md shadow-purple-600/20 hover:shadow-lg active:scale-[0.98] transition-all"
        >
          <Plus size={16} strokeWidth={2.5} />
          New World
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-warm-400" />
        <input
          type="text"
          placeholder="Search worldbuilding universes..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-warm-100 dark:bg-warm-800 border border-warm-200 dark:border-warm-750 text-sm text-warm-900 dark:text-warm-50 placeholder:text-warm-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
        />
      </div>

      {/* Content Grid / Immersive Empty State */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-warm-100 dark:bg-warm-800 animate-pulse h-52" />
          ))}
        </div>
      ) : worlds.length === 0 ? (
        <div className="bg-white dark:bg-warm-900 border border-warm-200 dark:border-warm-800 rounded-3xl p-8 sm:p-12 text-center max-w-2xl mx-auto my-8 shadow-sm space-y-6 animate-fade-in">
          <div className="w-16 h-16 rounded-3xl bg-purple-500/10 text-purple-500 flex items-center justify-center mx-auto shadow-inner border border-purple-500/20">
            <Globe size={34} />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-warm-900 dark:text-white leading-snug">
              Every unforgettable story begins with a world.
            </h3>
            <p className="text-xs sm:text-sm text-warm-600 dark:text-warm-400 leading-relaxed">
              Build your own universe. Create locations, cultures, timelines, history, factions, magic systems, and everything your stories need.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={handleCreate}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold text-xs sm:text-sm shadow-lg shadow-purple-600/20 transition-all active:scale-95 flex items-center gap-2 mx-auto"
            >
              <Plus size={18} />
              <span>Create Your First World</span>
            </button>
          </div>

          <div className="pt-6 border-t border-warm-100 dark:border-warm-800/80 flex items-center justify-center gap-6 text-xs text-warm-400 font-medium">
            <span className="flex items-center gap-1.5"><Map size={14} className="text-purple-400" /> Interactive Maps</span>
            <span className="flex items-center gap-1.5"><Layers size={14} className="text-purple-400" /> Factions & Magic</span>
            <span className="flex items-center gap-1.5"><BookOpen size={14} className="text-purple-400" /> Story Timelines</span>
          </div>

          {/* Featured Starter Templates for Inspiration */}
          <div className="pt-8 space-y-4 text-left border-t border-warm-100 dark:border-warm-800">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              <Compass size={16} />
              <span>Explore Starter World Templates</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {STARTER_WORLDS.map(sw => (
                <div key={sw.id} className="p-4 rounded-2xl bg-warm-50 dark:bg-warm-800/50 border border-warm-200 dark:border-warm-750 flex items-start gap-4">
                  <img src={sw.cover_url} alt={sw.name} className="w-16 h-16 rounded-xl object-cover shrink-0 border border-purple-500/20" />
                  <div className="space-y-1 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-warm-900 dark:text-white truncate">{sw.name}</h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-500">Template</span>
                    </div>
                    <p className="text-xs text-warm-600 dark:text-warm-400 line-clamp-2">{sw.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {worlds.map(w => (
            <div
              key={w.id}
              className="group relative rounded-2xl bg-white dark:bg-warm-850 border border-warm-200 dark:border-warm-750 overflow-hidden hover:border-purple-400 dark:hover:border-purple-600 hover:shadow-xl hover:shadow-purple-500/10 transition-all cursor-pointer flex flex-col"
              onClick={() => navigate(`/worlds/${w.id}`)}
            >
              {/* Cover Header */}
              <div className="h-32 bg-gradient-to-br from-purple-900/60 via-indigo-950/40 to-warm-900 flex items-center justify-center relative overflow-hidden">
                {w.cover_url ? (
                  <img src={w.cover_url} alt={w.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <Globe size={32} className="text-purple-300/40 group-hover:scale-110 transition-transform duration-500" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold border border-white/10">
                  {visibilityIcon(w.visibility)}
                  <span className="capitalize">{w.visibility}</span>
                </div>

                <div className="absolute bottom-3 left-4 right-4 text-white">
                  <h3 className="font-serif font-bold text-base truncate shadow-black drop-shadow">{w.name}</h3>
                </div>
              </div>

              {/* Details Body */}
              <div className="p-4 flex flex-col flex-1 justify-between space-y-3">
                <p className="text-xs text-warm-600 dark:text-warm-300 line-clamp-2 leading-relaxed">
                  {w.description || 'No universe description yet. Click to build locations and lore.'}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-warm-100 dark:border-warm-800 text-[11px] text-warm-400">
                  {w.tags && w.tags.length > 0 ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold border border-purple-500/20">
                      {w.tags[0]}
                    </span>
                  ) : (
                    <span className="text-warm-400 font-medium">Worldbuilding</span>
                  )}
                  
                  <span className="flex items-center gap-1 font-medium">
                    <Clock size={12} className="text-purple-400" />
                    {new Date(w.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Action menu */}
              <button
                onClick={e => { e.stopPropagation(); setActionMenuId(actionMenuId === w.id ? null : w.id); }}
                className="absolute top-3 left-3 p-1.5 rounded-xl bg-black/40 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal size={14} />
              </button>

              {actionMenuId === w.id && (
                <div className="absolute top-10 left-3 z-10 bg-white dark:bg-warm-800 rounded-xl shadow-xl border border-warm-200 dark:border-warm-700 py-1 min-w-[150px]" onClick={e => e.stopPropagation()}>
                  <button onClick={() => { setSelectedWorldForNetwork(w); setActionMenuId(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20">
                    <Globe size={13} /> Inspect Network 🕸️
                  </button>
                  <button onClick={() => handleDuplicate(w.id)} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-warm-700 dark:text-warm-300 hover:bg-warm-50 dark:hover:bg-warm-750">
                    <Copy size={12} /> Duplicate
                  </button>
                  <button onClick={() => handleDelete(w.id)} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* World Relationship Network Modal */}
      <WorldRelationshipModal
        isOpen={!!selectedWorldForNetwork}
        onClose={() => setSelectedWorldForNetwork(null)}
        worldId={selectedWorldForNetwork?.id}
        worldName={selectedWorldForNetwork?.name}
      />
    </div>
  );
}
