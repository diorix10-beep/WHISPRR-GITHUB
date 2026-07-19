import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, BookOpen, Trash2, Copy, MoreHorizontal, Lock, Globe, Eye } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import type { Lorebook } from '../types';

export default function LorebooksPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { showToast } = useToast();

  const [lorebooks, setLorebooks] = useState<Lorebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  const fetchLorebooks = useCallback(async () => {
    if (!profile?.user_id) return;
    try {
      setLoading(true);
      let query = supabase
        .from('lorebooks')
        .select('*')
        .eq('user_id', profile.user_id)
        .order('updated_at', { ascending: false });

      if (searchQuery.trim()) {
        query = query.ilike('title', `%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setLorebooks(data || []);
    } catch (err: any) {
      showToast(err.message || 'Error loading lorebooks', 'error');
    } finally {
      setLoading(false);
    }
  }, [profile, searchQuery, showToast]);

  useEffect(() => { fetchLorebooks(); }, [fetchLorebooks]);

  const handleCreate = async () => {
    if (!profile?.user_id) return;
    try {
      const { data, error } = await supabase
        .from('lorebooks')
        .insert({ user_id: profile.user_id, title: 'Untitled Lorebook' })
        .select()
        .single();
      if (error) throw error;
      navigate(`/lorebooks/${data.id}`);
    } catch (err: any) {
      showToast(err.message || 'Error creating lorebook', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this lorebook? All entries will be lost.')) return;
    try {
      const { error } = await supabase.from('lorebooks').delete().eq('id', id);
      if (error) throw error;
      showToast('Lorebook deleted', 'success');
      fetchLorebooks();
    } catch (err: any) {
      showToast(err.message || 'Error', 'error');
    }
    setActionMenuId(null);
  };

  const handleDuplicate = async (id: string) => {
    try {
      const { data } = await supabase.from('lorebooks').select('*').eq('id', id).single();
      if (!data || !profile) return;
      const { id: _id, created_at, updated_at, entry_count, ...rest } = data;
      const { data: newLorebook, error } = await supabase.from('lorebooks').insert({ ...rest, title: `${data.title} (Copy)`, entry_count: 0 }).select().single();
      if (error) throw error;
      // Also duplicate entries
      const { data: entries } = await supabase.from('lorebook_entries').select('*').eq('lorebook_id', id);
      if (entries && entries.length > 0 && newLorebook) {
        const newEntries = entries.map(({ id: _eid, lorebook_id, created_at: _c, updated_at: _u, ...rest }) => ({
          ...rest,
          lorebook_id: newLorebook.id,
        }));
        await supabase.from('lorebook_entries').insert(newEntries);
      }
      showToast('Lorebook duplicated!', 'success');
      fetchLorebooks();
    } catch {
      showToast('Failed to duplicate', 'error');
    }
    setActionMenuId(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-warm-900 dark:text-warm-50">Lorebooks</h1>
          <p className="text-sm text-warm-500 dark:text-warm-400 mt-1">
            Knowledge books with keyword-triggered entries for AI context or personal reference.
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 shadow-sm shadow-red-500/20 hover:shadow-md active:scale-[0.98] transition-all"
        >
          <Plus size={16} strokeWidth={2.5} />
          New Lorebook
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400" />
        <input
          type="text"
          placeholder="Search lorebooks..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-warm-100 dark:bg-warm-800 border border-warm-200 dark:border-warm-700 text-sm text-warm-900 dark:text-warm-50 placeholder:text-warm-400 focus:outline-none focus:ring-2 focus:ring-red-500/30"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-warm-100 dark:bg-warm-800 animate-pulse h-40" />
          ))}
        </div>
      ) : lorebooks.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-900/10 flex items-center justify-center">
            <BookOpen size={32} className="text-amber-400" />
          </div>
          <h2 className="text-lg font-serif font-bold text-warm-900 dark:text-warm-100 mb-2">No lorebooks yet</h2>
          <p className="text-sm text-warm-500 dark:text-warm-400 max-w-md mx-auto mb-6">
            Create a lorebook to store world knowledge, character backstories, magic systems, or any reference material.
          </p>
          <button
            onClick={handleCreate}
            className="px-6 py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 shadow-md active:scale-[0.98] transition-all"
          >
            <Plus size={16} className="inline mr-2" />
            Create Your First Lorebook
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {lorebooks.map(lb => (
            <div
              key={lb.id}
              className="group relative rounded-2xl bg-white dark:bg-warm-800 border border-warm-200 dark:border-warm-750 p-5 hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-lg hover:shadow-amber-500/5 transition-all cursor-pointer"
              onClick={() => navigate(`/lorebooks/${lb.id}`)}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-900/10 flex items-center justify-center flex-shrink-0">
                  <BookOpen size={18} className="text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-warm-900 dark:text-warm-50 truncate">{lb.title}</h3>
                  <p className="text-xs text-warm-500 dark:text-warm-400 mt-1 line-clamp-2">{lb.description || 'No description'}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-warm-100 dark:border-warm-750">
                <span className="text-xs text-warm-400">{lb.entry_count} entries</span>
                <div className="flex items-center gap-1 text-[10px] text-warm-400">
                  {lb.visibility === 'public' ? <Globe size={10} /> : lb.visibility === 'unlisted' ? <Eye size={10} /> : <Lock size={10} />}
                  <span className="capitalize">{lb.visibility}</span>
                </div>
              </div>

              {/* Action menu */}
              <button
                onClick={e => { e.stopPropagation(); setActionMenuId(actionMenuId === lb.id ? null : lb.id); }}
                className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-warm-100 dark:hover:bg-warm-750 text-warm-400 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal size={14} />
              </button>
              {actionMenuId === lb.id && (
                <div className="absolute top-10 right-3 z-10 bg-white dark:bg-warm-800 rounded-xl shadow-xl border border-warm-200 dark:border-warm-700 py-1 min-w-[140px]" onClick={e => e.stopPropagation()}>
                  <button onClick={() => handleDuplicate(lb.id)} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-warm-700 dark:text-warm-300 hover:bg-warm-50 dark:hover:bg-warm-750">
                    <Copy size={12} /> Duplicate
                  </button>
                  <button onClick={() => handleDelete(lb.id)} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
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
