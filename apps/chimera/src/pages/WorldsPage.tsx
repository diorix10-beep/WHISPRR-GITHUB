import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Globe, Lock, Eye, Map, Users, Clock, MoreHorizontal, Copy, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import type { World } from '../types';

export default function WorldsPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { showToast } = useToast();

  const [worlds, setWorlds] = useState<World[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-warm-900 dark:text-warm-50">Worlds</h1>
          <p className="text-sm text-warm-500 dark:text-warm-400 mt-1">
            Build rich fictional universes with locations, factions, timelines, and lore.
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 shadow-sm shadow-red-500/20 hover:shadow-md active:scale-[0.98] transition-all"
        >
          <Plus size={16} strokeWidth={2.5} />
          New World
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400" />
        <input
          type="text"
          placeholder="Search worlds..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-warm-100 dark:bg-warm-800 border border-warm-200 dark:border-warm-700 text-sm text-warm-900 dark:text-warm-50 placeholder:text-warm-400 focus:outline-none focus:ring-2 focus:ring-red-500/30"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-warm-100 dark:bg-warm-800 animate-pulse h-52" />
          ))}
        </div>
      ) : worlds.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-900/10 flex items-center justify-center">
            <Map size={32} className="text-blue-400" />
          </div>
          <h2 className="text-lg font-serif font-bold text-warm-900 dark:text-warm-100 mb-2">No worlds yet</h2>
          <p className="text-sm text-warm-500 dark:text-warm-400 max-w-md mx-auto mb-6">
            Build a world from your imagination. Add locations, factions, and history — no AI required.
          </p>
          <button
            onClick={handleCreate}
            className="px-6 py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 shadow-md active:scale-[0.98] transition-all"
          >
            <Plus size={16} className="inline mr-2" />
            Create Your First World
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {worlds.map(w => (
            <div
              key={w.id}
              className="group relative rounded-2xl bg-white dark:bg-warm-800 border border-warm-200 dark:border-warm-750 overflow-hidden hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-lg hover:shadow-blue-500/5 transition-all cursor-pointer"
              onClick={() => navigate(`/worlds/${w.id}`)}
            >
              {/* Cover */}
              <div className="h-28 bg-gradient-to-br from-blue-100 via-purple-50 to-warm-100 dark:from-blue-900/30 dark:via-purple-900/20 dark:to-warm-800 flex items-center justify-center relative">
                {w.cover_url ? (
                  <img src={w.cover_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Map size={28} className="text-blue-400/60" />
                )}
                <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-lg bg-black/40 backdrop-blur-sm text-white text-[10px]">
                  {visibilityIcon(w.visibility)}
                  <span className="capitalize">{w.visibility}</span>
                </div>
              </div>

              {/* Details */}
              <div className="p-4 space-y-2">
                <h3 className="font-semibold text-sm text-warm-900 dark:text-warm-50 truncate">{w.name}</h3>
                <p className="text-xs text-warm-500 dark:text-warm-400 line-clamp-2 leading-relaxed">
                  {w.description || 'No description yet'}
                </p>
                <div className="flex items-center gap-3 text-[10px] text-warm-400 pt-1">
                  {w.tags && w.tags.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-warm-100 dark:bg-warm-750">{w.tags[0]}</span>
                  )}
                  <span className="flex items-center gap-1"><Clock size={10} />{new Date(w.updated_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Action menu */}
              <button
                onClick={e => { e.stopPropagation(); setActionMenuId(actionMenuId === w.id ? null : w.id); }}
                className="absolute top-2 left-2 p-1.5 rounded-lg bg-black/40 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal size={14} />
              </button>
              {actionMenuId === w.id && (
                <div className="absolute top-10 left-2 z-10 bg-white dark:bg-warm-800 rounded-xl shadow-xl border border-warm-200 dark:border-warm-700 py-1 min-w-[140px]" onClick={e => e.stopPropagation()}>
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
    </div>
  );
}
