import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Globe, Lock, Eye, Map, Users, Clock, MoreHorizontal, Copy, Trash2, Compass, BookOpen, Layers, Sparkles, Flame } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useTranslation } from '../hooks/useTranslation';
import { supabase } from '../lib/supabase';
import type { World } from '../types';
import { WorldRelationshipModal } from '../components/world/WorldRelationshipModal';
import { RichEmptyState } from '../components/common/RichEmptyState';

export default function WorldsPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { showToast } = useToast();
  const { t } = useTranslation();

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

  const featuredWorld = worlds[0];

  return (
    <div className="min-h-screen bg-transparent text-warm-900 dark:text-warm-50 font-sans pb-24 relative overflow-hidden transition-colors duration-300">
      
      {/* Ambient Purple Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-purple-600/15 via-indigo-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 relative z-10 pt-6">

        {/* ── 1. HERO SECTION ── */}
        <section className="flex flex-col items-center text-center pt-6 sm:pt-8 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-600 dark:text-purple-400 text-xs font-bold uppercase tracking-wider">
            <Globe size={14} />
            <span>{t('world.worlds_universes')}</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl font-extrabold tracking-tight text-warm-900 dark:text-white">
            {t('world.worlds_universes')}
          </h1>

          <p className="text-sm sm:text-base text-warm-600 dark:text-warm-300 max-w-xl mx-auto leading-relaxed">
            {t('world.world_description')}
          </p>

          <button
            onClick={handleCreate}
            className="px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-extrabold text-xs shadow-lg shadow-purple-600/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            <Plus size={16} strokeWidth={3} />
            <span>{t('world.create_world')}</span>
          </button>
        </section>


        {/* ── 2. SEARCH & CONTROLS ── */}
        <section className="p-4 rounded-3xl bg-white/70 dark:bg-warm-850/80 backdrop-blur-xl border border-warm-200/80 dark:border-warm-750/80 shadow-lg flex items-center justify-between gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[240px]">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-warm-400" />
            <input
              type="text"
              placeholder="Search worldbuilding universes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-warm-100 dark:bg-warm-800 border border-warm-200 dark:border-warm-750 text-xs sm:text-sm font-medium text-warm-900 dark:text-warm-50 placeholder:text-warm-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
            />
          </div>

          <div className="flex items-center gap-4 text-xs font-medium text-warm-500 dark:text-warm-400">
            <span className="flex items-center gap-1.5"><Map size={14} className="text-purple-500" /> Interactive Maps</span>
            <span className="flex items-center gap-1.5"><Layers size={14} className="text-purple-500" /> Factions &amp; Magic</span>
            <span className="flex items-center gap-1.5"><BookOpen size={14} className="text-purple-500" /> Timelines</span>
          </div>
        </section>


        {/* ── 3. FEATURED WORLD SHOWCASE ── */}
        {featuredWorld && (
          <section className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-purple-950 via-warm-900 to-warm-950 text-white border border-purple-500/30 shadow-2xl relative overflow-hidden space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
              
              <div className="space-y-4 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-extrabold uppercase tracking-wider">
                  <Flame size={14} />
                  <span>Featured Universe of the Week</span>
                </div>

                <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white leading-tight">
                  {featuredWorld.name}
                </h2>

                <p className="text-xs sm:text-sm text-purple-200 leading-relaxed line-clamp-3">
                  {featuredWorld.description || "An expansive fantasy universe filled with rich history, magic, and interconnected characters."}
                </p>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => navigate(`/worlds/${featuredWorld.id}`)}
                    className="px-6 py-3 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-lg shadow-purple-600/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <Globe size={16} />
                    <span>Explore Universe</span>
                  </button>
                </div>
              </div>

              {/* Cover Artwork Showcase */}
              <div className="w-full md:w-80 h-48 sm:h-56 rounded-2xl bg-warm-900 border border-white/20 overflow-hidden relative shadow-2xl shrink-0">
                {featuredWorld.cover_url ? (
                  <img src={featuredWorld.cover_url} alt={featuredWorld.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-purple-900/40 text-purple-400">
                    <Globe size={48} />
                  </div>
                )}
              </div>

            </div>
          </section>
        )}


        {/* ── 4. WORLD GRID ── */}
        <section className="space-y-6">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-56 rounded-3xl bg-warm-200 dark:bg-warm-800 animate-pulse" />
              ))}
            </div>
          ) : worlds.length === 0 ? (
            <RichEmptyState
              icon={Globe}
              title="Every story begins with a world"
              description="Create your first worldbuilding universe with locations, cultures, factions, and magic systems!"
              actionLabel="Build New World"
              onAction={handleCreate}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {worlds.map((w) => (
                <div
                  key={w.id}
                  className="group relative rounded-3xl bg-white dark:bg-warm-850 border border-warm-200 dark:border-warm-750 overflow-hidden hover:border-purple-400 dark:hover:border-purple-600 hover:shadow-xl hover:shadow-purple-500/10 transition-all cursor-pointer flex flex-col justify-between"
                  onClick={() => navigate(`/worlds/${w.id}`)}
                >
                  <div className="h-36 bg-gradient-to-br from-purple-900/60 via-indigo-950/40 to-warm-900 flex items-center justify-center relative overflow-hidden">
                    {w.cover_url ? (
                      <img src={w.cover_url} alt={w.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <Globe size={36} className="text-purple-300/40 group-hover:scale-110 transition-transform duration-500" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                    <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold border border-white/10">
                      {visibilityIcon(w.visibility)}
                      <span className="capitalize">{w.visibility}</span>
                    </div>

                    <div className="absolute bottom-3 left-4 right-4 text-white">
                      <h3 className="font-serif font-bold text-lg truncate drop-shadow">{w.name}</h3>
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    <p className="text-xs text-warm-600 dark:text-warm-400 line-clamp-2 leading-relaxed">
                      {w.description || "No summary provided yet for this universe."}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-warm-100 dark:border-warm-800 text-xs text-warm-400 font-medium">
                      <span>Updated {new Date(w.updated_at).toLocaleDateString()}</span>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedWorldForNetwork(w);
                        }}
                        className="text-purple-600 dark:text-purple-400 hover:underline font-bold"
                      >
                        Lore Network
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>

      {selectedWorldForNetwork && (
        <WorldRelationshipModal
          isOpen={!!selectedWorldForNetwork}
          onClose={() => setSelectedWorldForNetwork(null)}
          worldId={selectedWorldForNetwork.id}
          worldName={selectedWorldForNetwork.name}
        />
      )}
    </div>
  );
}
